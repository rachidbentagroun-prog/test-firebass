# ⚡ QUICK START GUIDE

## 🚀 Get Up and Running in 10 Minutes

### Prerequisites
- ✅ Node.js 18+ installed
- ✅ Firebase account created
- ✅ Firebase CLI installed: `npm install -g firebase-tools`

---

## Step 1: Firebase Setup (2 minutes)

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select:
# ✅ Firestore
# ✅ Functions
# ✅ Hosting
```

---

## Step 2: Configure Environment (1 minute)

Create or update `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

---

## Step 3: Initialize Firestore (2 minutes)

### Option A: Firebase Console (Recommended)
1. Go to Firebase Console → Firestore Database
2. Create database (start in production mode)
3. Go to Firestore → Data tab
4. Create collection: `system_config`
5. Add document with ID: `credit_config`
6. Add fields:
```json
{
  "imageCost": 1,
  "videoCostPerSecond": 5,
  "voiceCostPerMinute": 2,
  "chatCostPerToken": 0.001,
  "freeSignupCredits": 10,
  "basicPlanCredits": 100,
  "premiumPlanCredits": 500,
  "updatedAt": 1704412800000
}
```

### Option B: Run Script
```javascript
// init-credit-config.js
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function init() {
  await db.collection('system_config').doc('credit_config').set({
    imageCost: 1,
    videoCostPerSecond: 5,
    voiceCostPerMinute: 2,
    chatCostPerToken: 0.001,
    freeSignupCredits: 10,
    basicPlanCredits: 100,
    premiumPlanCredits: 500,
    updatedAt: Date.now()
  });
  console.log('✅ Credit config initialized');
}

init();
```

Run: `node init-credit-config.js`

---

## Step 4: Deploy Security Rules (1 minute)

```bash
# Copy rules from FIRESTORE_RULES.md
# Paste into: firestore.rules

# Deploy
firebase deploy --only firestore:rules
```

---

## Step 5: Deploy Cloud Functions (2 minutes)

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

---

## Step 6: Create Admin User (1 minute)

### Option A: Firebase Console
1. Go to Firestore → users collection
2. Find your user document
3. Add field: `role: "admin"`

### Option B: Run Script
```bash
# Create: scripts/grant-admin.js
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function grantAdmin(email) {
  const snapshot = await db.collection('users')
    .where('email', '==', email).get();
  
  if (!snapshot.empty) {
    await snapshot.docs[0].ref.update({ role: 'admin' });
    console.log(`✅ Admin access granted to: ${email}`);
  } else {
    console.log('❌ User not found');
  }
}

const email = process.argv[2];
if (email) {
  grantAdmin(email);
} else {
  console.log('Usage: node grant-admin.js user@example.com');
}
```

Run:
```bash
node scripts/grant-admin.js your@email.com
```

---

## Step 7: Deploy Application (1 minute)

```bash
npm install
npm run build
firebase deploy --only hosting
```

---

## ✅ Verify Installation

### Test Credit System:
1. Login to your app
2. Navigate to Admin Dashboard
3. Click **Credits** tab
4. You should see credit configuration
5. Try editing costs and saving

### Test Live AI Activity:
1. In Admin Dashboard, click **Live AI** tab
2. Open another browser window
3. Login as regular user
4. Generate something (image/video)
5. Watch it appear in real-time in admin dashboard

### Test Rate Limiting:
1. Make 50+ rapid image generation requests
2. Should get rate limit error
3. Wait an hour or clear rate limit from Firestore
4. Verify it works again

---

## 🎯 First Integration

### Wrap an existing AI call:

**Before:**
```typescript
const image = await generateImage(prompt);
```

**After:**
```typescript
import { withImageCredits } from './services/creditWrapper';
import { auth } from './services/firebase';

const user = auth.currentUser;
const result = await withImageCredits(
  user.uid,
  prompt,
  'dalle3',
  async () => await generateImage(prompt)
);

if (result.success) {
  const image = result.data;
  alert(`✅ Generated! ${result.remainingCredits} credits left`);
} else {
  alert(`❌ Error: ${result.error}`);
}
```

---

## 🐛 Troubleshooting

### "Missing or insufficient permissions"
→ Deploy Firestore rules: `firebase deploy --only firestore:rules`

### "Function not found"
→ Deploy functions: `firebase deploy --only functions`

### "Cannot read property 'uid' of null"
→ User not authenticated. Check auth.currentUser

### Credits not deducting
→ Check Cloud Functions logs: `firebase functions:log`

### Real-time not updating
→ Check Firestore rules allow read for admin
→ Verify onSnapshot listener is active

---

## 📚 Next Steps

1. ✅ **Read Full Documentation**
   - `CREDIT_SYSTEM_GUIDE.md` - Complete guide
   - `INTEGRATION_EXAMPLES.ts` - Code examples
   - `DEPLOYMENT_CHECKLIST.md` - Production deployment

2. ✅ **Integrate with Your AI Services**
   - Wrap all AI API calls with creditWrapper
   - Test credit deduction
   - Handle errors gracefully

3. ✅ **Customize**
   - Adjust credit costs
   - Add/remove banned keywords
   - Customize rate limits
   - Style admin dashboard

4. ✅ **Monitor**
   - Check Live AI activity regularly
   - Review abuse detection logs
   - Monitor credit usage trends
   - Adjust costs based on data

---

## 🆘 Need Help?

- 📖 Read: `CREDIT_SYSTEM_GUIDE.md`
- 💻 See: `INTEGRATION_EXAMPLES.ts`
- ✅ Check: `DEPLOYMENT_CHECKLIST.md`
- 🔒 Security: `FIRESTORE_RULES.md`

---

## ⚡ Quick Commands

```bash
# Deploy everything
firebase deploy

# Deploy functions only
firebase deploy --only functions

# Deploy hosting only  
firebase deploy --only hosting

# Deploy rules only
firebase deploy --only firestore:rules

# View logs
firebase functions:log

# Test locally
firebase emulators:start
```

---

## 🎉 You're Ready!

Your credit system is now:
- ✅ Production-ready
- ✅ Fully secured
- ✅ Real-time monitored
- ✅ Abuse-protected
- ✅ Enterprise-grade

**Go build something amazing!** 🚀
