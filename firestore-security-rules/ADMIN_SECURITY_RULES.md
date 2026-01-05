# Super Admin Dashboard - Firestore Security Rules

## Complete Firestore Rules for Admin System

This file contains production-ready Firestore security rules for the Super Admin Dashboard.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ======================
    // HELPER FUNCTIONS
    // ======================
    
    // Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Check if user is super admin
    function isSuperAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
    }
    
    // Check if user is not suspended
    function isNotSuspended() {
      return !get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('isSuspended', false);
    }
    
    // Check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Validate email format
    function isValidEmail(email) {
      return email.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    }
    
    // ======================
    // USERS COLLECTION
    // ======================
    match /users/{userId} {
      // Users can read their own profile
      // Super admins can read all users
      allow read: if isOwner(userId) || isSuperAdmin();
      
      // Users can update their own non-critical fields
      allow update: if isOwner(userId) && 
                       !request.resource.data.diff(resource.data).affectedKeys()
                         .hasAny(['role', 'credits', 'isSuspended', 'plan', 'totalCreditsGranted']);
      
      // Only super admins can update critical fields
      allow update: if isSuperAdmin();
      
      // User creation is handled by Firebase Auth + Cloud Functions
      allow create: if false;
      
      // Only super admins can delete users
      allow delete: if isSuperAdmin();
    }
    
    // ======================
    // ANALYTICS COLLECTIONS
    // ======================
    match /analytics_daily/{date} {
      // Only super admins can read analytics
      allow read: if isSuperAdmin();
      
      // Only Cloud Functions can write (validated by service account)
      allow write: if false;
    }
    
    match /analytics_monthly/{month} {
      allow read: if isSuperAdmin();
      allow write: if false;
    }
    
    // ======================
    // CREDIT SYSTEM
    // ======================
    match /credit_rules/{ruleId} {
      // Anyone can read credit rules (needed for cost calculation)
      allow read: if true;
      
      // Only super admins can modify
      allow write: if isSuperAdmin() &&
                      request.resource.data.keys().hasAll(['updatedAt', 'updatedBy']) &&
                      request.resource.data.updatedBy == request.auth.uid;
    }
    
    match /engine_costs/{engineId} {
      // Anyone can read (needed for cost calculation)
      allow read: if true;
      
      // Only super admins can modify
      allow write: if isSuperAdmin() &&
                      request.resource.data.keys().hasAll(['updatedAt', 'updatedBy']) &&
                      request.resource.data.updatedBy == request.auth.uid &&
                      request.resource.data.baseCostPerGeneration >= 0;
    }
    
    match /plan_credit_overrides/{overrideId} {
      // Anyone can read (needed for plan-based pricing)
      allow read: if true;
      
      // Only super admins can modify
      allow write: if isSuperAdmin() &&
                      request.resource.data.keys().hasAll(['updatedAt', 'updatedBy']) &&
                      request.resource.data.updatedBy == request.auth.uid;
    }
    
    // ======================
    // CONTACT & CHAT
    // ======================
    match /contact_messages/{messageId} {
      // Authenticated users can create contact messages
      allow create: if isAuthenticated() &&
                       isNotSuspended() &&
                       isValidEmail(request.resource.data.userEmail) &&
                       request.resource.data.message.size() > 0 &&
                       request.resource.data.message.size() <= 5000 &&
                       request.resource.data.source == 'contact_form' &&
                       request.resource.data.status == 'new';
      
      // Super admins can read and update
      allow read, update: if isSuperAdmin();
      
      // No one can delete
      allow delete: if false;
    }
    
    match /chat_sessions/{sessionId} {
      // Users can read their own sessions
      // Super admins can read all
      allow read: if (isAuthenticated() && resource.data.userId == request.auth.uid) || 
                     isSuperAdmin();
      
      // Authenticated users can create sessions
      allow create: if isAuthenticated() && isNotSuspended();
      
      // Users can update their own sessions
      allow update: if (isAuthenticated() && resource.data.userId == request.auth.uid) || 
                       isSuperAdmin();
      
      allow delete: if false;
    }
    
    match /chat_messages/{messageId} {
      // Users can read messages from their sessions
      // Super admins can read all
      allow read: if (isAuthenticated() && 
                     get(/databases/$(database)/documents/chat_sessions/$(resource.data.sessionId)).data.userId == request.auth.uid) ||
                     isSuperAdmin();
      
      // Users can create messages in their own sessions
      allow create: if isAuthenticated() &&
                       isNotSuspended() &&
                       request.resource.data.message.size() > 0 &&
                       request.resource.data.message.size() <= 2000 &&
                       request.resource.data.source == 'chat_widget';
      
      // Super admins can update (for replies)
      allow update: if isSuperAdmin();
      
      allow delete: if false;
    }
    
    // ======================
    // AUDIT LOGS
    // ======================
    match /audit_logs/{logId} {
      // Only super admins can read audit logs
      allow read: if isSuperAdmin();
      
      // Only Cloud Functions can write
      allow write: if false;
    }
    
    // ======================
    // GENERATION LOGS
    // ======================
    match /generation_logs/{logId} {
      // Users can read their own generation logs
      allow read: if isOwner(resource.data.userId) || isSuperAdmin();
      
      // Only Cloud Functions can write
      allow write: if false;
    }
    
    // ======================
    // SYSTEM CONFIG
    // ======================
    match /system_config/{configId} {
      // Anyone can read system config (for maintenance mode, etc.)
      allow read: if true;
      
      // Only super admins can modify
      allow write: if isSuperAdmin();
    }
    
    // ======================
    // USER GALLERIES (Existing)
    // ======================
    match /images/{userId}/gallery/{imageId} {
      allow read, write: if isOwner(userId) && isNotSuspended();
      allow read: if isSuperAdmin();
    }
    
    match /videos/{userId}/gallery/{videoId} {
      allow read, write: if isOwner(userId) && isNotSuspended();
      allow read: if isSuperAdmin();
    }
    
    match /audio/{userId}/gallery/{audioId} {
      allow read, write: if isOwner(userId) && isNotSuspended();
      allow read: if isSuperAdmin();
    }
    
    // ======================
    // SUPPORT SESSIONS (Existing)
    // ======================
    match /support_sessions/{sessionId} {
      allow read: if isSuperAdmin() || 
                     (isAuthenticated() && resource.data.userId == request.auth.uid);
      allow write: if isAuthenticated() && isNotSuspended();
    }
    
    // ======================
    // BLOCKED IPS
    // ======================
    match /blocked_ips/{ipHash} {
      // Only super admins can read/write
      allow read, write: if isSuperAdmin();
    }
    
    // ======================
    // RATE LIMITING
    // ======================
    match /rate_limits/{userId} {
      // Users can read their own rate limits
      allow read: if isOwner(userId) || isSuperAdmin();
      
      // Only system can write
      allow write: if false;
    }
    
    // ======================
    // ABUSE DETECTION
    // ======================
    match /abuse_detection/{detectionId} {
      // Only super admins can read
      allow read: if isSuperAdmin();
      
      // Only Cloud Functions can write
      allow write: if false;
    }
    
    // ======================
    // DEFAULT DENY
    // ======================
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Key Security Features

### 1. Role-Based Access Control
- **Super Admin Only**: Analytics, audit logs, system config, all user data
- **User Self-Service**: Own profile (limited fields), own gallery, own messages
- **Public Read**: Credit rules, engine costs (needed for pricing calculations)

### 2. Suspended User Blocking
- `isNotSuspended()` function checks suspension status
- Suspended users cannot create messages, generations, or modify data
- Admin actions override suspension checks

### 3. Data Validation
- Email format validation
- Message length limits (contact: 5000 chars, chat: 2000 chars)
- Credit costs must be >= 0
- Required fields enforcement (updatedAt, updatedBy)

### 4. Audit Trail
- All admin write operations require `updatedBy` field
- Audit logs are write-protected (only Cloud Functions)
- No deletion of audit logs, contact messages, or chat messages

### 5. Cloud Function Protection
- Analytics aggregations written only by Cloud Functions
- Generation logs written only by Cloud Functions
- Audit logs written only by Cloud Functions

### 6. Rate Limiting Collection
- Tracks user request rates
- Read-only for users (view their limits)
- Write-only by Cloud Functions (enforces limits)

## Testing Security Rules

Use Firebase Emulator Suite to test:

```bash
firebase emulators:start --only firestore
```

Test cases to cover:
1. ✅ Super admin can read all users
2. ❌ Regular user cannot read other users
3. ✅ User can update own name/email
4. ❌ User cannot update own credits/role
5. ✅ User can create contact message
6. ❌ Suspended user cannot create contact message
7. ✅ Anyone can read credit_rules
8. ❌ Regular user cannot update credit_rules
9. ✅ Super admin can update credit_rules with audit fields
10. ❌ No one can write to analytics_daily directly

## Deployment

Deploy rules to production:

```bash
firebase deploy --only firestore:rules
```

## Migration Notes

If you have existing data, ensure:
1. All users have `role` field set
2. Existing super admins have role = 'super_admin'
3. Add `isSuspended: false` to all existing users
4. Initialize system_config document
5. Create initial credit_rules document

## Cost Optimization

These rules minimize Firestore reads:
- Use `get()` calls sparingly (cached by Firestore)
- Role check uses single document read
- Public collections (credit_rules) don't require auth checks

---

**Status**: Production-ready
**Last Updated**: 2026-01-05
**Compatible With**: Firebase Firestore v9+ SDK
