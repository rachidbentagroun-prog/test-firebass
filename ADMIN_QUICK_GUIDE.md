# Admin Dashboard - Quick Reference Guide

## 🚀 Quick Start

### Accessing the Admin Dashboard
1. Log in with an admin account
2. Navigate to the Admin section
3. Click on the **Control Center**

---

## 📊 Analytics Tab

### View Traffic Data
```
Analytics Tab → Daily Traffic Volume
- Last 14 days of traffic
- Total visits, average, and peak day
- Hover over bars for details
```

### View Firebase Analytics
```
Analytics Tab → Firebase Analytics
- Page views (last 30 days)
- New user registrations
- Conversion count
- Conversion rate
- Click "Refresh" to update
```

### Geographic Data
```
Analytics Tab → Geographic Nodes
- Top 6 countries by visits
- Percentage breakdown
- Top referrers list
```

---

## 👥 User Management

### Search & Filter Users
```
Users Tab → Filter Bar
- Search: Name, email, or user ID
- Status: All / Active / Suspended
- Plan: All / Free / Basic / Premium
```

### View User Details
```
Users Tab → Hover over user → Click "Details" button
Opens modal with:
- User information
- Credit management
- Email sending
- IP address logs
- Blocked IPs list
```

---

## 💳 Credit Management

### Add Credits to User
```
1. Open user details modal
2. Find "Credit Management" section
3. Enter amount (e.g., 100)
4. Click "Grant Credits"
5. Confirmation appears
```

**Example Credits:**
- 10 credits = Basic usage
- 50 credits = Medium usage
- 100 credits = Heavy usage
- 1000+ = Unlimited (displayed as ∞)

---

## 📧 Email Management

### Send Email to User
```
1. Open user details modal
2. Find "Send Email" section
3. Enter subject (e.g., "Welcome!")
4. Enter message content
5. Click "Send Email"
```

**Email Template Examples:**

#### Welcome Email
```
Subject: Welcome to ImaginAI!
Message: Hi [User Name], welcome to our platform. We're excited to have you here!
```

#### Credit Grant Notification
```
Subject: Credits Added to Your Account
Message: Hi [User Name], we've added [X] credits to your account. Enjoy creating!
```

#### Suspension Notice
```
Subject: Account Status Update
Message: Your account has been temporarily suspended due to [reason]. Please contact support.
```

---

## 🔒 User Status Management

### Suspend a User
```
1. Find user in table
2. Hover over user row
3. Click suspend icon (UserMinus icon, red)
4. Enter suspension reason
5. User is suspended immediately
```

### Activate a User
```
1. Find suspended user (red status)
2. Hover over user row
3. Click activate icon (UserCheck icon, green)
4. User is activated immediately
```

**Status Indicators:**
- 🟢 Green dot = Active
- 🔴 Red dot = Suspended

---

## 🌍 IP Address Management

### View User IP Logs
```
User Details Modal → IP Address Logs
- All IPs used by user
- Timestamps
- Location data
- User agent information
```

### Block an IP Address
```
1. Open user details modal
2. Find IP in "IP Address Logs"
3. Click "Block IP" button
4. Enter reason for blocking
5. IP is blocked globally
```

**Blocking Reasons Examples:**
- Suspicious activity
- Multiple failed logins
- Terms of service violation
- Fraud detection

### Unblock an IP Address
```
1. Open user details modal
2. Find IP in "Blocked IP Addresses"
3. Click "Unblock" button
4. IP is unblocked immediately
```

---

## 🎯 Common Tasks

### Task 1: Reward Active User
```
1. Go to Users tab
2. Search for user by email
3. Click "Details"
4. Add 50 credits
5. Send thank you email
```

### Task 2: Handle Suspicious Activity
```
1. Go to Users tab
2. Open user details
3. View IP logs
4. Block suspicious IP
5. Suspend user if needed
6. Send notification email
```

### Task 3: Grant Premium Access
```
1. Open user details
2. Click "Edit" (pencil icon)
3. Change plan to "Premium"
4. Add 500 credits
5. Send welcome email
6. Click "Commit Sync"
```

### Task 4: Monthly Review
```
1. Check Analytics tab
2. Review traffic trends
3. Check conversion rates
4. Review new user signups
5. Check blocked IPs
6. Review suspended accounts
```

---

## ⚡ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Close modal | `Esc` |
| Search users | `/` then type |
| Refresh analytics | `Ctrl+R` |

---

## 📝 Best Practices

### User Management
✅ **Do:**
- Document suspension reasons
- Send notifications before suspending
- Review IP logs before blocking
- Add credits for loyal users
- Keep email templates professional

❌ **Don't:**
- Suspend without reason
- Block IPs without investigation
- Grant excessive credits
- Send spammy emails
- Delete users without backup

### Security
✅ **Do:**
- Review IP logs regularly
- Monitor suspicious activity
- Update blocked IPs list
- Keep audit logs
- Check user status periodically

❌ **Don't:**
- Ignore repeated failed logins
- Unblock IPs without reason
- Share admin credentials
- Bypass security measures

### Analytics
✅ **Do:**
- Check analytics daily
- Monitor conversion trends
- Track traffic sources
- Review user growth
- Set up alerts

❌ **Don't:**
- Ignore traffic drops
- Overlook referrer data
- Neglect conversion rates
- Dismiss user complaints

---

## 🔧 Troubleshooting

### User Not Receiving Emails
**Check:**
1. Email address is correct
2. Email is in `mail` collection
3. Email service is running
4. Check spam folder

### Credits Not Updating
**Check:**
1. Admin permissions
2. Firestore connection
3. Transaction logs
4. Browser console errors

### IP Blocking Not Working
**Check:**
1. IP format is correct
2. Blocked IP in Firestore
3. Application middleware
4. Security rules

### Analytics Not Loading
**Check:**
1. Firebase connection
2. Analytics collection exists
3. Security rules allow read
4. Browser network tab

---

## 📊 Metrics to Monitor

### Daily Checks
- [ ] New user signups
- [ ] Active users count
- [ ] Suspended accounts
- [ ] Blocked IPs
- [ ] Email queue

### Weekly Reviews
- [ ] Traffic trends
- [ ] Conversion rates
- [ ] Credit usage
- [ ] User complaints
- [ ] System health

### Monthly Analysis
- [ ] User growth rate
- [ ] Revenue trends
- [ ] Top features used
- [ ] Geographic distribution
- [ ] Referrer performance

---

## 🎓 Training Tips

### For New Admins
1. Start with read-only access
2. Practice in test environment
3. Learn each feature gradually
4. Document your processes
5. Ask questions

### Common Mistakes
1. Suspending without documentation
2. Blocking IPs too quickly
3. Not sending user notifications
4. Ignoring analytics data
5. Not reviewing logs

---

## 📱 Mobile Access

The admin dashboard is responsive and works on mobile devices:
- ✅ View analytics
- ✅ Search users
- ✅ View user details
- ✅ Send emails
- ⚠️ Limited IP management (better on desktop)

---

## 🔗 Quick Links

- [Full Feature Documentation](./ADMIN_DASHBOARD_FEATURES.md)
- [Firestore Security Rules](./FIRESTORE_RULES.md)
- [Firebase Console](https://console.firebase.google.com/)
- [Analytics Documentation](https://firebase.google.com/docs/analytics)

---

## ❓ FAQ

**Q: How do I become an admin?**
A: An existing admin must set your `role` field to 'admin' in Firestore.

**Q: Can I undo a user suspension?**
A: Yes, click the activate button to restore the account immediately.

**Q: Are emails sent immediately?**
A: Emails are queued in Firestore and processed by the email service.

**Q: How long are IP logs kept?**
A: IP logs are kept indefinitely for security auditing.

**Q: Can users see their own IP logs?**
A: No, only admins can view IP logs for security reasons.

**Q: What happens when I block an IP?**
A: The IP is prevented from accessing the entire application.

---

## 📞 Support

For help with the admin dashboard:
1. Check this guide first
2. Review the full documentation
3. Check Firebase Console logs
4. Contact technical support

---

**Version**: 2.0  
**Last Updated**: December 27, 2025  
**Quick Guide Author**: GitHub Copilot
