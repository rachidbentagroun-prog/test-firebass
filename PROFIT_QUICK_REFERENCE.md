# 💰 Profit Intelligence - Quick Reference Card

**Keep this handy for daily operations**

---

## 🔑 Key Collections

| Collection | Purpose | Who Writes | Who Reads |
|------------|---------|------------|-----------|
| `ai_engine_costs` | AI pricing config | Admin | Cloud Functions |
| `usage_logs` | Per-request financials | Cloud Functions | Admin |
| `profit_aggregates` | Daily/monthly summaries | Cloud Functions | Admin Dashboard |
| `loss_users` | Unprofitable users | Cloud Functions | Admin |
| `profit_audit_log` | Change history | Cloud Functions | Admin |

---

## 📐 Financial Formulas

```typescript
// Cost
real_cost_usd = engine_cost_per_unit × usage_units

// Revenue (proportional allocation)
revenue = (plan_price / monthly_usage) × current_usage

// Profit
profit_usd = revenue - cost
margin_% = (profit / revenue) × 100

// Loss User Detection
if (30_day_margin < -10%) → flag_as_loss_user()
```

---

## 🎯 Engine IDs

| Your Model | Engine ID | Cost |
|------------|-----------|------|
| DALL·E 3 Standard | `dalle_3_standard` | $0.04/img |
| DALL·E 3 HD | `dalle_3_hd` | $0.08/img |
| DALL·E 3 HD Large | `dalle_3_hd_large` | $0.12/img |
| Gemini Pro Vision | `gemini_pro_vision` | $0.0025/img |
| SEDDREAM Video | `seddream_video` | $0.12/sec |
| OpenAI TTS HD | `openai_tts_hd` | $0.03/1k |
| GPT-4 Turbo | `gpt_4_turbo` | $0.03/1k tok |
| GPT-3.5 Turbo | `gpt_3_5_turbo` | $0.002/1k tok |

---

## 💳 Subscription Plans

| Plan | Price | Revenue Attribution |
|------|-------|---------------------|
| Free | $0/mo | $0.00 per request |
| Pro | $29.99/mo | Proportional to usage |
| Ultra | $99.99/mo | Proportional to usage |
| Enterprise | $299.99/mo | Proportional to usage |

---

## ⚡ Quick Commands

### View Recent Logs
```bash
firebase functions:log --only onGenerationCreated --limit 50
firebase functions:log --only aggregateDailyProfit
firebase functions:log --only detectLossUsers
```

### Manual Aggregation
```typescript
const trigger = httpsCallable(functions, 'triggerManualAggregation');
await trigger({
  period_start: '2026-01-01',
  period_end: '2026-01-31',
  period_type: 'monthly'
});
```

### Update Engine Cost
```typescript
const update = httpsCallable(functions, 'updateEngineCost');
await update({
  engine_id: 'dalle_3_standard',
  cost_per_unit: 0.045,
  reason: 'OpenAI price increase'
});
```

### Grant Admin Access
```bash
firebase firestore:set users/USER_UID --data '{"role":"super_admin"}'
```

---

## 🔧 Integration Template

```typescript
// Your generation function
async function generateContent(userId: string, params: any) {
  // 1. Call AI API
  const result = await yourAIAPI.generate(params);
  
  // 2. Get user's plan
  const userDoc = await db.collection('users').doc(userId).get();
  const plan = userDoc.data()?.subscription_plan || 'free';
  
  // 3. Log with financial tracking
  await db.collection('generations').add({
    user_id: userId,
    created_at: new Date(),
    
    // REQUIRED for profit tracking:
    engine_id: 'dalle_3_standard',  // Must match ai_engine_costs
    subscription_plan: plan,
    usage_units: 1,                  // Quantity (images/seconds/tokens)
    ai_type: 'image',               // image/video/voice/chat
    
    // Your existing fields:
    prompt: params.prompt,
    result_url: result.url,
    credits_used: 10
  });
  
  // 4. Done! Cloud Function handles cost/revenue/profit automatically
  return result;
}
```

---

## 📊 Dashboard Metrics

**Metric Cards:**
- 💵 Total Revenue (with % change)
- 💰 Total Cost (with % change)
- 📈 Net Profit (positive = good!)
- 📊 Profit Margin % (>40% = healthy)

**Charts:**
- Line: Cost vs Revenue trend
- Bar: Top cost engines
- Bar: Profit by plan

**Alerts:**
- ⚠️ Loss users (negative margin)
- 🚨 Critical users (<-50% margin)

---

## 🚨 Common Issues

### Issue: Cost = $0
**Fix:** Check `engine_id` matches `ai_engine_costs` collection

### Issue: Revenue = $0
**Fix:** Verify `subscription_plan` field set correctly

### Issue: No aggregates
**Fix:** Check scheduled functions are enabled in Cloud Scheduler

### Issue: Permission denied
**Fix:** Verify user has `role: 'super_admin'` in users collection

### Issue: Stale data
**Fix:** Clear cost cache or wait 5 minutes for cache refresh

---

## 📅 Scheduled Jobs

| Function | Schedule | Purpose |
|----------|----------|---------|
| `aggregateDailyProfit` | 00:01 UTC daily | Aggregate yesterday |
| `aggregateMonthlyProfit` | 01:00 UTC 1st of month | Aggregate last month |
| `detectLossUsers` | Every hour | Scan for unprofitable users |

---

## 🔐 Security Rules Summary

| Collection | Client Read | Client Write |
|------------|-------------|--------------|
| `ai_engine_costs` | ❌ Admin only | ❌ Admin only |
| `usage_logs` | ⚠️ Own only (no financials) | ❌ Cloud Functions only |
| `profit_aggregates` | ❌ Admin only | ❌ Cloud Functions only |
| `loss_users` | ❌ Admin only | ❌ Cloud Functions only |
| `profit_audit_log` | ❌ Admin only | ❌ Cloud Functions only |

---

## 💡 Best Practices

✅ **DO:**
- Use exact engine IDs from `ai_engine_costs`
- Include `usage_units` for accurate cost calculation
- Update engine costs when provider prices change
- Monitor dashboard daily
- Review loss users weekly

❌ **DON'T:**
- Calculate costs client-side
- Hardcode engine costs
- Skip `subscription_plan` field
- Ignore loss user alerts
- Delete financial records

---

## 📈 Healthy Metrics

**Good Profit Margins:**
- 40-60%: Sustainable
- 60-70%: Excellent
- 70%+: Outstanding

**Warning Signs:**
- <20%: Review pricing
- <0%: Immediate action needed

**Loss User Tolerance:**
- <5% of users: Normal
- 5-10%: Monitor closely
- >10%: Pricing issue

---

## 🔄 Monthly Maintenance

**Week 1:**
- [ ] Review dashboard metrics
- [ ] Check loss users
- [ ] Verify aggregations running

**Week 2:**
- [ ] Update engine costs (if needed)
- [ ] Review plan pricing
- [ ] Analyze trends

**Week 3:**
- [ ] Export financial data
- [ ] Generate reports
- [ ] Review profit margins

**Week 4:**
- [ ] Plan pricing adjustments
- [ ] Update documentation
- [ ] Train new team members

---

## 📞 Quick Links

**Firebase Console:**
- Firestore: https://console.firebase.google.com/project/YOUR_PROJECT/firestore
- Functions: https://console.firebase.google.com/project/YOUR_PROJECT/functions
- Cloud Scheduler: https://console.cloud.google.com/cloudscheduler

**Documentation:**
- Complete Guide: `PROFIT_SYSTEM_GUIDE.md`
- Quick Start: `PROFIT_QUICK_START.md`
- Deployment: `PROFIT_DEPLOYMENT_CHECKLIST.md`

---

## 🎯 Success Indicators

✅ System is working correctly when:
1. Every AI generation creates `usage_logs` entry with financials
2. Daily aggregates appear in `profit_aggregates` at 00:01 UTC
3. Loss users detected and flagged within 1 hour
4. Dashboard shows real-time data
5. Cost cache reduces Firestore reads by >90%

---

## 🆘 Emergency Contacts

**If Critical Issue:**
1. Check Cloud Function logs
2. Review Firestore Console
3. Verify security rules
4. Check scheduled jobs status
5. Review this quick reference
6. Consult `PROFIT_SYSTEM_GUIDE.md`

---

**System Version:** 1.0.0  
**Dashboard URL:** `/admin/profit-intelligence`  
**Maintained by:** Super Admin Team

---

💰 **Keep making profitable decisions!**
