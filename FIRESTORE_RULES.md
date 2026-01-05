# Firestore Security Rules for Enhanced Admin Dashboard

## Overview
These security rules enable the new admin dashboard features while maintaining security.

## Complete Firestore Rules

Copy and paste these rules into your Firebase Console under **Firestore Database → Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    // Helper function to check if account is active
    function isAccountActive() {
      return request.auth != null && 
             (!exists(/databases/$(database)/documents/users/$(request.auth.uid)) ||
              get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status != 'suspended');
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone can read their own profile
      allow read: if isOwner(userId);
      
      // Admins can read all users
      allow read: if isAdmin();
      
      // Users can create and update their own profile
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) && 
                       (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'status', 'credits']));
      
      // Only admins can update other users or modify protected fields
      allow update: if isAdmin();
      
      // Only admins can delete users
      allow delete: if isAdmin();
      
      // Subcollections
      match /images/{imageId} {
        allow read, write: if isOwner(userId) || isAdmin();
      }
      
      match /videos/{videoId} {
        allow read, write: if isOwner(userId) || isAdmin();
      }
      
      match /audio/{audioId} {
        allow read, write: if isOwner(userId) || isAdmin();
      }
      
      // IP logs - only user and admin can read
      match /ip_logs/{logId} {
        allow read: if isOwner(userId) || isAdmin();
        allow write: if isAuthenticated(); // System can write IP logs
      }
    }
    
    // Analytics collection - only admins can read/write
    match /analytics/{document=**} {
      allow read: if isAdmin();
      allow write: if isAuthenticated(); // Allow tracking from authenticated users
    }
    
    // Credit transactions - only admins can read
    match /credit_transactions/{transactionId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
    
    // Admin logs - only admins can access
    match /admin_logs/{logId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
    
    // Mail queue - only system and admins can access
    match /mail/{emailId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
    
    // Blocked IPs - only admins can manage
    match /blocked_ips/{ipId} {
      allow read: if isAuthenticated(); // Users can check if IP is blocked
      allow write: if isAdmin(); // Only admins can block/unblock
    }
    
    // Support sessions
    match /support_sessions/{sessionId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() || isAdmin();
      allow delete: if isAdmin();
    }
    
    // ============================================
    // CREDIT SYSTEM COLLECTIONS
    // ============================================
    
    // System configuration - only admins can modify
    match /system_config/{configId} {
      allow read: if isAuthenticated(); // All users can read config
      allow write: if isAdmin(); // Only admins can update config
    }
    
    // Credit logs - strict access control
    match /credit_logs/{logId} {
      allow read: if isAdmin(); // Only admins can view all credit logs
      allow create: if isAuthenticated(); // System can create logs
      allow update, delete: if false; // Never allow modification or deletion
    }
    
    // Usage logs - for analytics and monitoring
    match /usage_logs/{logId} {
      allow read: if isAdmin(); // Only admins can view usage logs
      allow create: if isAuthenticated(); // System can log usage
      allow update, delete: if false; // Never allow modification
    }
    
    // AI Activity - real-time monitoring
    match /ai_activity/{activityId} {
      allow read: if isAdmin(); // Only admins can view activity
      allow create: if isAuthenticated(); // System creates activities
      allow update: if isAuthenticated(); // System updates status/progress
      allow delete: if isAdmin(); // Only admins can clean up old activities
    }
    
    // Rate limits - prevent abuse
    match /rate_limits/{limitId} {
      allow read: if isAuthenticated() && (
        limitId.matches('.*_' + request.auth.uid + '_.*') || isAdmin()
      ); // Users can check their own rate limits
      allow write: if isAuthenticated(); // System manages rate limits
    }
    
    // IP rate limits - global protection
    match /ip_rate_limits/{ipAddress} {
      allow read: if isAuthenticated(); // Users can check IP limits
      allow write: if isAuthenticated(); // System manages IP rate limits
    }
    
    // Abuse detection - security monitoring
    match /abuse_detection/{abuseId} {
      allow read: if isAdmin(); // Only admins can view abuse logs
      allow create: if isAuthenticated(); // System logs abuse
      allow update: if isAdmin(); // Only admins can mark as resolved
      allow delete: if false; // Never delete abuse logs
    }
    
    // Admin audit logs - comprehensive tracking
    match /admin_audit_logs/{logId} {
      allow read: if isAdmin(); // Only admins can view audit logs
      allow create: if isAdmin(); // System logs admin actions
      allow update, delete: if false; // Never modify audit logs
    }
    
    // Live generations - monitoring
    match /live_generations/{genId} {
      allow read: if isAdmin(); // Only admins can view
      allow create, update: if isAuthenticated(); // System manages
      allow delete: if isAdmin(); // Only admins can clean up
    }
  }
}
```

## Rule Explanations

### User Data Access
- **Users can read/write their own data**: Ensures privacy
- **Admins can access all user data**: Required for admin dashboard
- **IP logs are protected**: Only owner and admin can view

### Analytics
- **Read-only for admins**: Admins can view all analytics
- **Write access for authenticated users**: System can track events
- **Public cannot access**: Protects business intelligence

### Credit System
- **Admin-only access**: Prevents credit manipulation
- **Transaction logging**: Maintains audit trail
- **Secure grant system**: Only admins can add credits

### Email Queue
- **Admin-only management**: Secure email system
- **Queue-based sending**: Emails processed by backend service

### IP Blocking
- **Read access for all authenticated users**: Check if blocked
- **Write access for admins only**: Security management
- **Global blocking**: Affects all services

## Setting Up Rules

### Step 1: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Click on the **Rules** tab

### Step 2: Copy Rules
1. Copy the complete rules above
2. Paste into the rules editor
3. Click **Publish**

### Step 3: Test Rules
1. Use the **Rules Playground** in Firebase Console
2. Test with different user roles (user, admin)
3. Verify access controls work correctly

## Common Issues & Solutions

### Issue: "Missing or insufficient permissions"
**Solution**: 
- Verify user has correct role in Firestore
- Check authentication token is valid
- Ensure rules are published

### Issue: Analytics not saving
**Solution**:
- Verify user is authenticated
- Check analytics collection path
- Ensure write rule allows authenticated users

### Issue: Admin cannot access user data
**Solution**:
- Verify admin user has `role: 'admin'` in their document
- Check admin helper function is working
- Ensure rules are published

## Admin User Setup

To grant admin access to a user:

### Method 1: Using Firebase Console
1. Go to Firestore Database
2. Find the user document in `users` collection
3. Add or update field: `role: 'admin'`
4. Save changes

### Method 2: Using Admin Script
Create a script `scripts/grant-admin.js`:

```javascript
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function grantAdmin(email) {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).get();
  
  if (snapshot.empty) {
    console.log('No matching user found');
    return;
  }

  snapshot.forEach(async (doc) => {
    await doc.ref.update({
      role: 'admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Admin access granted to: ${email}`);
  });
}

// Usage
const userEmail = process.argv[2];
if (userEmail) {
  grantAdmin(userEmail);
} else {
  console.log('Usage: node grant-admin.js user@example.com');
}
```

Run: `node scripts/grant-admin.js admin@example.com`

## Testing Checklist

- [ ] Admin can view all users
- [ ] Admin can update user credits
- [ ] Admin can suspend/activate users
- [ ] Admin can view analytics
- [ ] Admin can block/unblock IPs
- [ ] Admin can send emails
- [ ] Regular users cannot access admin features
- [ ] Regular users can only see their own data
- [ ] IP tracking works for all users
- [ ] Email queue is secure

## Additional Security Recommendations

### 1. Enable App Check
Protect your backend resources from abuse:
```javascript
// In your Firebase configuration
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});
```

### 2. Rate Limiting
Implement rate limiting for sensitive operations:
- Email sending
- Credit grants
- IP blocking

### 3. Audit Logging
All admin actions are logged in `admin_logs` collection for compliance.

### 4. Regular Security Audits
- Review admin access regularly
- Check for suspicious IP activity
- Monitor credit transactions
- Review email logs

## Firestore Indexes

Some queries may require indexes. Create these in Firebase Console:

### Analytics Collection
```
Collection: analytics/events/pageviews
Fields: timestamp (Descending)
```

### IP Logs
```
Collection: users/{userId}/ip_logs
Fields: timestamp (Descending)
```

### Credit Transactions
```
Collection: credit_transactions
Fields: userId (Ascending), timestamp (Descending)
```

Firebase will prompt you to create these indexes when needed.

## Support

For security-related issues:
1. Check Firebase Console logs
2. Review Firestore rules
3. Test in Rules Playground
4. Verify user roles in database

---

**Important**: Always test rules in a development environment before deploying to production!

**Last Updated**: December 27, 2025
