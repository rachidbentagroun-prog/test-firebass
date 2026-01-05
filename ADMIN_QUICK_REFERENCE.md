# Super Admin Dashboard - Quick Reference Card

## 🚀 Quick Start Commands

```bash
# Initialize System
node scripts/init-admin-system.js

# Deploy Everything
firebase deploy

# Deploy Specific
firebase deploy --only functions
firebase deploy --only firestore:rules

# Test Locally
firebase emulators:start

# View Logs
firebase functions:log --only aggregateDailyAnalytics
```

---

## 📂 Key Files

| File | Purpose |
|------|---------|
| `/components/AdminInbox.tsx` | Unified inbox component |
| `/services/adminService.ts` | All admin API functions |
| `/functions/admin-system.ts` | Cloud Functions |
| `/scripts/init-admin-system.js` | Setup script |
| `/firestore-schema/ADMIN_SYSTEM_SCHEMA.md` | Database schema |
| `/firestore-security-rules/ADMIN_SECURITY_RULES.md` | Security rules |
| `/ADMIN_SYSTEM_SETUP_GUIDE.md` | Complete setup guide |

---

## 🗄️ Firestore Collections

| Collection | Purpose | Access |
|------------|---------|--------|
| `analytics_daily` | Daily aggregated analytics | super_admin read only |
| `analytics_monthly` | Monthly trends | super_admin read only |
| `credit_rules` | Base credit costs | Public read, admin write |
| `engine_costs` | Per-engine pricing | Public read, admin write |
| `plan_credit_overrides` | Plan-specific discounts | Public read, admin write |
| `contact_messages` | Contact form submissions | Auth create, admin read/update |
| `chat_sessions` | Chat conversations | Auth create, admin read |
| `chat_messages` | Chat messages | Auth create, admin read |
| `audit_logs` | Admin action logs | super_admin read only |
| `generation_logs` | AI generation tracking | System write, admin read |
| `abuse_detection` | Abuse flags | System write, admin read |
| `system_config` | Global settings | Public read, admin write |
| `users` | User profiles | Self read, admin full access |

---

## ⚡ Admin Service Functions

### Analytics
```typescript
getDailyAnalytics(startDate, endDate)
getMonthlyAnalytics(months)
getRealtimeAnalyticsSummary()
```

### Credit Management
```typescript
getCreditRules()
updateCreditRules(rules, adminId, reason)
getEngineCosts()
updateEngineCost(engineId, data, adminId)
getPlanCreditOverrides(planName?)
updatePlanCreditOverride(planName, engineId, data, adminId)
getGlobalCreditStatistics()
```

### User Management
```typescript
getAllUsersAdmin(pageSize, lastUserId?)
searchUsers(searchQuery)
suspendUserAdmin(userId, suspend, reason)
grantCreditsAdmin(userId, amount, reason)
updateUserProfileAdmin(userId, updates)
getUserActivityDetails(userId, days)
```

### Admin Inbox
```typescript
getContactMessages(status?, limit)
updateContactMessageStatus(messageId, status, reply?, adminId?)
getChatSessions(limit)
getChatMessages(sessionId)
sendChatReply(sessionId, message, adminId)
```

### Audit & Monitoring
```typescript
getAuditLogsAdmin(adminId?, action?, limit)
getAbuseDetectionLogsAdmin(limit)
updateAbuseDetectionStatus(logId, status)
```

### System Config
```typescript
getSystemConfig()
updateSystemConfig(config, adminId)
```

---

## 🔧 Cloud Functions

### Scheduled (Automatic)
- `aggregateDailyAnalytics` - Daily at 00:05 UTC
- `detectAbuse` - Hourly

### Triggers (Automatic)
- `onUserCreated` - When user signs up
- `onContactMessageCreated` - When contact message sent

### Callable (Manual)
- `checkUserSuspension(requiredCredits)` - Check before generation
- `logGeneration(data)` - Log AI generation
- `suspendUser(userId, suspend, reason)` - Suspend/unsuspend
- `grantCredits(userId, amount, reason)` - Grant credits
- `checkRateLimit(action)` - Check rate limit

---

## 🎯 Common Admin Tasks

### Suspend a User
```typescript
await suspendUserAdmin(userId, true, "Abuse detected");
```

### Grant Credits
```typescript
await grantCreditsAdmin(userId, 100, "Customer support bonus");
```

### Update Engine Cost
```typescript
await updateEngineCost('dalle3', {
  baseCostPerGeneration: 2,
  qualityMultipliers: { standard: 1.0, hd: 1.5 },
  isActive: true
}, adminId);
```

### Reply to Contact Message
```typescript
await updateContactMessageStatus(
  messageId, 
  'replied', 
  "Thank you for contacting us...",
  adminId
);
```

### View User Activity
```typescript
const activity = await getUserActivityDetails(userId, 30); // last 30 days
console.log('Total generations:', activity.stats.totalGenerations);
console.log('Credits spent:', activity.stats.totalCreditsSpent);
```

---

## 🔒 Security Rules Quick Check

```javascript
// Super admin check
function isSuperAdmin() {
  return request.auth != null && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
}

// Suspended check
function isNotSuspended() {
  return !get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('isSuspended', false);
}
```

---

## 📊 Analytics Dashboard Sections

1. **Overview**
   - Total users
   - Active users (24h / 7d)
   - Today's generations
   - Credits consumed

2. **Analytics**
   - Daily charts (traffic, usage)
   - Monthly trends
   - Country breakdown
   - Top referrers

3. **Users**
   - User list (paginated)
   - Search functionality
   - Suspend/unsuspend
   - Grant credits

4. **Credits**
   - Base credit rules
   - Engine costs table
   - Plan overrides
   - Global statistics

5. **Inbox**
   - Contact messages
   - Chat sessions
   - Reply functionality
   - Status management

6. **Live AI**
   - Active generations
   - Queue status
   - Real-time monitoring

7. **Support**
   - Support tickets
   - User messages

---

## 🆘 Troubleshooting

### Issue: Admin dashboard shows permission denied
**Fix**: Check user role in Firestore is exactly `'super_admin'`

### Issue: Analytics not updating
**Fix**: Manually trigger `aggregateDailyAnalytics` function

### Issue: User still generates after suspension
**Fix**: Verify Firestore rules deployed and `checkUserSuspension` called before generation

### Issue: Credits not deducting
**Fix**: Ensure `logGeneration` Cloud Function called after successful generation

---

## 📈 Monitoring Checklist

### Daily
- [ ] Check abuse detection logs
- [ ] Review new contact messages
- [ ] Monitor Cloud Functions errors

### Weekly
- [ ] Review analytics trends
- [ ] Audit high-usage users
- [ ] Check credit burn rate

### Monthly
- [ ] Archive old generation logs
- [ ] Update credit costs if needed
- [ ] Analyze user growth/churn

---

## 🎓 Integration Examples

### Add Contact Form
```typescript
const handleSubmit = async (formData) => {
  await addDoc(collection(db, 'contact_messages'), {
    userEmail: formData.email,
    subject: formData.subject,
    message: formData.message,
    source: 'contact_form',
    status: 'new',
    createdAt: serverTimestamp()
  });
};
```

### Check User Before Generation
```typescript
const checkUserFn = httpsCallable(functions, 'checkUserSuspension');
const result = await checkUserFn({ requiredCredits: 5 });

if (!result.data.allowed) {
  alert(result.data.reason);
  return;
}

// Proceed with generation...
```

### Log Generation
```typescript
const logGenFn = httpsCallable(functions, 'logGeneration');
await logGenFn({
  generationType: 'image',
  engineId: 'dalle3',
  engineName: 'DALL-E 3',
  prompt: userPrompt,
  creditsCost: 2,
  status: 'success'
});
```

---

## 💾 Database Indexes Required

```
generation_logs:
- userId (ASC) + createdAt (DESC)
- generationType (ASC) + createdAt (DESC)
- status (ASC) + createdAt (DESC)

contact_messages:
- status (ASC) + createdAt (DESC)

chat_messages:
- sessionId (ASC) + createdAt (ASC)

audit_logs:
- adminId (ASC) + timestamp (DESC)
```

Firestore will prompt you to create these when first querying.

---

## 🔐 Environment Variables

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_SUPER_ADMIN_EMAIL=...
```

---

## 📞 Support Resources

- **Full Documentation**: `/ADMIN_SYSTEM_SETUP_GUIDE.md`
- **Implementation Details**: `/ADMIN_IMPLEMENTATION_SUMMARY.md`
- **Schema Reference**: `/firestore-schema/ADMIN_SYSTEM_SCHEMA.md`
- **Security Rules**: `/firestore-security-rules/ADMIN_SECURITY_RULES.md`

---

**Status**: Production-Ready ✅  
**Last Updated**: January 5, 2026  
**Version**: 1.0.0

---

**Quick Support**: Check logs → Review schema → Test security rules → Verify Cloud Functions deployed
