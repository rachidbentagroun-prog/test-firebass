# Grant Super Admin Access - Quick Guide

## Method 1: Firebase Console (Easiest - 30 seconds)

### Step 1: Sign Up First
1. Go to your app (http://localhost:3003)
2. Click "Sign Up" or "Register"
3. Enter:
   - **Email**: `isambk92@gmail.com`
   - **Password**: `Lwalida2020`
4. Complete the signup process

### Step 2: Update Role in Firestore Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database**
4. Navigate to `users` collection
5. Find the document for `isambk92@gmail.com`
6. Click on the document
7. Find the `role` field
8. Change the value from `user` to `super_admin`
9. Click **Update**

### Step 3: Log In
1. Go to your app
2. Log in with:
   - Email: `isambk92@gmail.com`
   - Password: `Lwalida2020`
3. Navigate to `/admin`
4. You should now see the full admin dashboard!

---

## Method 2: Using Firebase Admin SDK (If you have service account)

### Step 1: Get Service Account Key
1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `serviceAccountKey.json` in the root of your project

### Step 2: Run Script
```bash
node scripts/grant-super-admin.js
```

---

## Method 3: Manual Firestore Update (Using Firebase CLI)

```bash
# Install Firebase tools if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Open Firestore in browser
firebase firestore:open

# Then follow Method 1 steps above
```

---

## Method 4: Direct Database Update (If user already exists)

If the user already exists in your Firestore, you can update directly using this query:

**Firebase Console > Firestore Database:**
1. Click on `users` collection
2. Use the filter: `email == isambk92@gmail.com`
3. Open the document
4. Edit the `role` field to `super_admin`
5. Save

---

## Verification

After granting super admin access:

1. **Log in** with the credentials
2. **Navigate** to `/admin`
3. **Verify** you see:
   - Dashboard tab
   - Analytics tab
   - Users tab
   - Credits tab
   - Inbox tab
   - All admin controls

If you see "Permission Denied", double-check:
- The `role` field is exactly `'super_admin'` (not 'admin' or 'super-admin')
- You've logged out and logged back in
- Clear browser cache

---

## Quick Check

To verify the user has super admin access, you can check in the browser console:

```javascript
// After logging in, run in browser console:
import { auth, db } from './services/firebase';
import { doc, getDoc } from 'firebase/firestore';

const userId = auth.currentUser.uid;
const userDoc = await getDoc(doc(db, 'users', userId));
console.log('Role:', userDoc.data().role); // Should show: super_admin
```

---

## Troubleshooting

### Issue: User doesn't exist in Firestore
**Solution**: Sign up first using the app's registration form

### Issue: "Permission Denied" even after update
**Solution**: 
- Clear browser cache
- Log out and log back in
- Verify the role field is exactly `'super_admin'`

### Issue: Can't find user in Firestore
**Solution**: The user needs to complete signup first. After signup, the user document is automatically created.

---

## Security Note

This email/password is now a super admin account with full access to:
- View all users
- Suspend/unsuspend users
- Grant credits
- View analytics
- Access admin inbox
- Modify system configuration

**Keep these credentials secure!**

---

**Status**: Ready to grant access  
**Target Email**: isambk92@gmail.com  
**Target Role**: super_admin  
**Recommended Method**: Method 1 (Firebase Console)
