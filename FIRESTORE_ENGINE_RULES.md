# Firestore Rules Update for AI Engine Pricing System

Add these rules to your existing Firestore security rules:

```javascript
// ========== AI ENGINE & DYNAMIC PRICING COLLECTIONS ==========

// AI Engines - Read by authenticated users, write by admins only
match /ai_engines/{engineId} {
  allow read: if isAuthenticated() && isAccountActive();
  allow write: if isAdmin();
}

// Credit Pricing - Read by authenticated users, write by admins only
match /credit_pricing/{aiType} {
  allow read: if isAuthenticated() && isAccountActive();
  allow write: if isAdmin();
}

// Enhanced Usage Logs with Engine Info
// Users can only read their own logs, admins can read all
// Logs are immutable (create-only via Cloud Functions)
match /usage_logs/{logId} {
  allow read: if isAdmin() || 
                 (isAuthenticated() && resource.data.userId == request.auth.uid);
  allow create: if false; // Only Cloud Functions can create
  allow update, delete: if false; // Immutable logs
}
```

## Required Firestore Indexes

Create these composite indexes in Firebase Console:

### 1. Usage Logs by Engine
```
Collection: usage_logs
Fields: 
  - engine_id (Ascending)
  - timestamp (Descending)
Query Scope: Collection
```

### 2. Usage Logs by AI Type
```
Collection: usage_logs
Fields: 
  - aiType (Ascending)
  - timestamp (Descending)
Query Scope: Collection
```

### 3. Usage Logs by User
```
Collection: usage_logs
Fields: 
  - userId (Ascending)
  - timestamp (Descending)
Query Scope: Collection
```

### 4. Usage Logs with Multiple Filters
```
Collection: usage_logs
Fields: 
  - engine_id (Ascending)
  - status (Ascending)
  - timestamp (Descending)
Query Scope: Collection
```

## How to Apply

### Option 1: Firebase Console
1. Go to Firebase Console → Firestore Database → Rules
2. Add the engine rules to your existing rules
3. Click "Publish"

### Option 2: Firebase CLI
1. Edit `firestore.rules` file in your project
2. Add the new rules
3. Run: `firebase deploy --only firestore:rules`

### Option 3: Automated via CLI
```bash
# The indexes will be auto-created when first queried
# Firebase will give you a link to create them
```

## Security Features

✅ **Read Access**: Only authenticated, active users can read engines  
✅ **Write Access**: Only admins can modify engines and pricing  
✅ **Immutable Logs**: Usage logs cannot be modified after creation  
✅ **User Isolation**: Users can only view their own usage logs  
✅ **Admin Visibility**: Admins can view all logs for monitoring  

## Testing

After deploying rules, test in Firebase Console → Rules Playground:

```javascript
// Test 1: Regular user reading engines (should pass)
Authenticated: true
Path: /ai_engines/dalle
Operation: get

// Test 2: Regular user writing engine (should fail)
Authenticated: true
Path: /ai_engines/dalle
Operation: write

// Test 3: Admin writing engine (should pass)
Authenticated: true (with admin role)
Path: /ai_engines/dalle
Operation: write

// Test 4: User reading own usage log (should pass)
Authenticated: true
Path: /usage_logs/log123
Data: { userId: auth.uid }
Operation: get

// Test 5: Client creating usage log (should fail)
Authenticated: true
Path: /usage_logs/log456
Operation: create
```

All done! Your engine pricing system is now secured. 🔒
