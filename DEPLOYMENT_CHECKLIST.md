# 🚀 DEPLOYMENT CHECKLIST

## Pre-Deployment

### 1. Environment Setup
- [ ] Firebase project created
- [ ] Environment variables configured in `.env`
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Logged in to Firebase (`firebase login`)
- [ ] Firebase project initialized (`firebase init`)

### 2. Firestore Setup
- [ ] Firestore database created in Firebase Console
- [ ] Initial credit configuration added:
```javascript
// Run in Firebase Console or via script
db.collection('system_config').doc('credit_config').set({
  imageCost: 1,
  videoCostPerSecond: 5,
  voiceCostPerMinute: 2,
  chatCostPerToken: 0.001,
  imageHDCost: 2,
  video4KCost: 10,
  freeSignupCredits: 10,
  basicPlanCredits: 100,
  premiumPlanCredits: 500,
  updatedAt: Date.now()
});
```

### 3. Security Rules
- [ ] Copy rules from `FIRESTORE_RULES.md`
- [ ] Navigate to Firebase Console → Firestore → Rules
- [ ] Paste and publish rules
- [ ] Test rules in Rules Playground

### 4. Admin User Setup
- [ ] Create admin user account
- [ ] Grant admin role:
```bash
node scripts/grant-admin.js admin@yourdomain.com
```
Or manually in Firestore:
```javascript
db.collection('users').doc(userId).update({
  role: 'admin'
});
```

## Cloud Functions Deployment

### 1. Install Dependencies
```bash
cd functions
npm install
```

### 2. Build TypeScript
```bash
npm run build
```

### 3. Test Locally (Optional)
```bash
firebase emulators:start --only functions,firestore
```

### 4. Deploy Functions
```bash
firebase deploy --only functions
```

### 5. Verify Deployment
- [ ] Check Firebase Console → Functions
- [ ] All functions show "Deployed" status
- [ ] Test functions with sample data

## Application Deployment

### 1. Build Application
```bash
npm run build
```

### 2. Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

### 3. Deploy Everything at Once
```bash
firebase deploy
```

## Post-Deployment Testing

### 1. Test Credit System
- [ ] Login as regular user
- [ ] Check initial credit balance
- [ ] Generate an image/video/voice
- [ ] Verify credits deducted
- [ ] Check credit logs created

### 2. Test Rate Limiting
- [ ] Make rapid requests (50+ for images)
- [ ] Verify rate limit error appears
- [ ] Wait for window to reset
- [ ] Verify generation works again

### 3. Test Prompt Moderation
- [ ] Try generating with inappropriate prompt
- [ ] Verify moderation blocks it
- [ ] Check abuse detection log

### 4. Test Admin Dashboard
- [ ] Login as admin
- [ ] Navigate to Credits tab
- [ ] Edit credit configuration
- [ ] Save and verify changes
- [ ] Grant credits to test user
- [ ] Verify transaction logged

### 5. Test Live AI Activity
- [ ] Login as admin
- [ ] Open Live AI tab
- [ ] Generate something as regular user
- [ ] Verify activity appears in real-time
- [ ] Check status updates (pending → processing → completed)

### 6. Test Account Suspension
- [ ] Suspend test user from admin panel
- [ ] Try to generate as suspended user
- [ ] Verify generation blocked
- [ ] Unsuspend user
- [ ] Verify generation works again

## Monitoring Setup

### 1. Firebase Console
- [ ] Set up email alerts for errors
- [ ] Configure budget alerts
- [ ] Enable crash reporting

### 2. Analytics
- [ ] Verify Firebase Analytics tracking
- [ ] Set up custom events
- [ ] Configure conversion tracking

### 3. Performance
- [ ] Enable Performance Monitoring
- [ ] Set up custom traces
- [ ] Monitor function execution times

## Security Hardening

### 1. API Keys
- [ ] Restrict Firebase API key to your domain
- [ ] Add App Check for additional security
- [ ] Enable reCAPTCHA v3

### 2. Firestore Rules
- [ ] Verify all collections have proper access controls
- [ ] Test rules with different user roles
- [ ] Ensure admin-only collections are protected

### 3. Cloud Functions
- [ ] Enable function authentication
- [ ] Set up CORS properly
- [ ] Add rate limiting at function level

## Documentation

- [ ] Update README with deployment instructions
- [ ] Document credit costs for users
- [ ] Create user guide for credit system
- [ ] Add FAQ section
- [ ] Document admin features

## Backup & Recovery

### 1. Database Backups
- [ ] Enable automatic Firestore backups
- [ ] Set up backup schedule (daily recommended)
- [ ] Test restore procedure

### 2. Code Repository
- [ ] Push all code to Git
- [ ] Tag release version
- [ ] Document breaking changes

## Production Checklist

### Critical Items
- [x] ✅ Credit system implemented
- [x] ✅ Live AI activity monitoring
- [x] ✅ Rate limiting configured
- [x] ✅ Prompt moderation active
- [x] ✅ Abuse detection enabled
- [x] ✅ Admin audit logging
- [x] ✅ Security rules deployed
- [x] ✅ Cloud Functions deployed

### Nice to Have
- [ ] Email notifications for low credits
- [ ] SMS alerts for critical abuse
- [ ] Advanced analytics dashboard
- [ ] Credit purchase integration
- [ ] Subscription management
- [ ] Automated credit refills
- [ ] Multi-language support
- [ ] Mobile app support

## Rollback Plan

### If Issues Occur

1. **Firestore Rules Issue**
   ```bash
   # Revert to previous rules
   firebase deploy --only firestore:rules
   ```

2. **Function Issue**
   ```bash
   # Roll back to previous version in Firebase Console
   # Or redeploy previous version:
   git checkout <previous-tag>
   cd functions && npm run build
   firebase deploy --only functions
   ```

3. **Application Issue**
   ```bash
   # Revert hosting
   git checkout <previous-tag>
   npm run build
   firebase deploy --only hosting
   ```

## Maintenance Schedule

### Daily
- [ ] Check error logs
- [ ] Monitor credit usage
- [ ] Review abuse detection

### Weekly
- [ ] Analyze usage patterns
- [ ] Review rate limit effectiveness
- [ ] Update banned keywords if needed
- [ ] Check system performance

### Monthly
- [ ] Review and adjust credit costs
- [ ] Analyze user feedback
- [ ] Update documentation
- [ ] Plan new features

## Support Contacts

- Firebase Support: https://firebase.google.com/support
- Documentation: See `CREDIT_SYSTEM_GUIDE.md`
- Integration Examples: See `INTEGRATION_EXAMPLES.ts`
- Security Rules: See `FIRESTORE_RULES.md`

---

## Quick Deploy Commands

```bash
# Full deployment
firebase deploy

# Functions only
firebase deploy --only functions

# Hosting only
firebase deploy --only hosting

# Firestore rules only
firebase deploy --only firestore:rules

# View logs
firebase functions:log

# Test locally
firebase emulators:start
```

---

## Success Indicators

✅ **Working System**
- Users can generate AI content
- Credits deduct automatically
- Rate limits prevent abuse
- Admin can manage system
- Real-time monitoring works
- Security rules enforced
- Audit logs created

❌ **Issues to Address**
- Credits not deducting → Check Cloud Functions logs
- Rate limits not working → Verify Firestore rules
- Admin access denied → Check user role in Firestore
- Real-time not updating → Check onSnapshot listener

---

## Emergency Contacts

**Technical Issues:**
- Admin Email: admin@yourdomain.com
- Dev Team: dev@yourdomain.com

**Security Incidents:**
- Security Team: security@yourdomain.com
- Report Abuse: abuse@yourdomain.com

---

**Deployment Date:** _________________

**Deployed By:** _________________

**Version:** v1.0.0

**Status:** 🚀 Production Ready
