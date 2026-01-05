/**
 * Grant Super Admin Access
 * 
 * This script grants super_admin role to a specific user
 * Usage: node scripts/grant-super-admin.js
 */

const admin = require('firebase-admin');

// Check if service account key exists, otherwise use default credentials
let serviceAccount;
try {
  serviceAccount = require('../serviceAccountKey.json');
} catch (e) {
  console.log('⚠️  No serviceAccountKey.json found, using default credentials');
}

// Initialize Firebase Admin
if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

// Target user email
const TARGET_EMAIL = 'isambk92@gmail.com';

async function grantSuperAdminAccess() {
  console.log('🔍 Searching for user:', TARGET_EMAIL);
  
  try {
    // Method 1: Try to find user by email in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(TARGET_EMAIL);
      console.log('✅ User found in Firebase Auth:', userRecord.uid);
    } catch (error) {
      console.log('⚠️  User not found in Firebase Auth');
      console.log('   The user needs to sign up first at your app.');
      console.log('   After signup, run this script again.');
      process.exit(1);
    }
    
    const userId = userRecord.uid;
    
    // Method 2: Check if user document exists in Firestore
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      console.log('✅ User document found in Firestore');
      const currentData = userDoc.data();
      console.log('   Current role:', currentData.role || 'not set');
      
      // Update to super_admin
      await userRef.update({
        role: 'super_admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ User role updated to super_admin');
      console.log('\n🎉 Success! User can now access the admin dashboard at /admin');
    } else {
      console.log('⚠️  User document not found in Firestore');
      console.log('   Creating user document with super_admin role...');
      
      // Create user document
      await userRef.set({
        id: userId,
        email: TARGET_EMAIL,
        name: userRecord.displayName || 'Super Admin',
        role: 'super_admin',
        plan: 'premium',
        credits: 1000,
        isRegistered: true,
        isVerified: userRecord.emailVerified,
        gallery: [],
        videoGallery: [],
        audioGallery: [],
        messages: [],
        status: 'active',
        isSuspended: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
        totalCreditsGranted: 1000,
        totalCreditsConsumed: 0,
        totalGenerations: 0,
        generationsByType: {
          image: 0,
          video: 0,
          voice: 0,
          chat: 0
        }
      });
      
      console.log('✅ User document created with super_admin role');
      console.log('✅ Granted 1000 credits');
      console.log('\n🎉 Success! User can now access the admin dashboard at /admin');
    }
    
    // Verify the update
    const updatedDoc = await userRef.get();
    const finalData = updatedDoc.data();
    
    console.log('\n📋 Final User Data:');
    console.log('   UID:', userId);
    console.log('   Email:', finalData.email);
    console.log('   Role:', finalData.role);
    console.log('   Plan:', finalData.plan);
    console.log('   Credits:', finalData.credits);
    console.log('   Status:', finalData.status);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the script
grantSuperAdminAccess();
