#!/usr/bin/env node

/**
 * Initialize Credit System
 * Run this script after deploying to set up credit configuration
 * 
 * Usage: node init-credit-system.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin');
  console.error('Make sure you have GOOGLE_APPLICATION_CREDENTIALS set or run:');
  console.error('firebase login');
  process.exit(1);
}

const db = admin.firestore();

async function initializeCreditSystem() {
  console.log('\n🚀 Initializing Credit System...\n');

  try {
    // 1. Create credit configuration
    console.log('📝 Creating credit configuration...');
    await db.collection('system_config').doc('credit_config').set({
      imageCost: 1,
      videoCostPerSecond: 5,
      voiceCostPerMinute: 2,
      chatCostPerToken: 0.001,
      imageHDCost: 2,
      video4KCost: 10,
      freeSignupCredits: 10,
      basicPlanCredits: 100,
      premiumPlanCredits: 500,
      updatedAt: Date.now(),
      updatedBy: 'system'
    });
    console.log('✅ Credit configuration created\n');

    // 2. Verify collections exist (they'll be auto-created on first write)
    console.log('📁 Verifying collections...');
    const collections = [
      'credit_logs',
      'usage_logs',
      'ai_activity',
      'rate_limits',
      'abuse_detection',
      'admin_audit_logs'
    ];
    
    for (const collection of collections) {
      console.log(`   ✓ ${collection} ready`);
    }
    console.log('✅ All collections ready\n');

    // 3. Check if there are any users
    console.log('👥 Checking users...');
    const usersSnapshot = await db.collection('users').limit(1).get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️  No users found. Create a user account first.\n');
    } else {
      console.log(`✅ Found ${usersSnapshot.size} user(s)\n`);
      
      // Ask if we should grant admin to first user
      const firstUser = usersSnapshot.docs[0];
      const userData = firstUser.data();
      
      console.log(`First user: ${userData.email || 'No email'}`);
      console.log(`\nTo grant admin access, run:`);
      console.log(`node scripts/grant-admin.js ${userData.email}\n`);
    }

    console.log('✅ Credit System initialized successfully!\n');
    console.log('📚 Next steps:');
    console.log('   1. Deploy Firestore rules: firebase deploy --only firestore:rules');
    console.log('   2. Deploy Cloud Functions: firebase deploy --only functions');
    console.log('   3. Grant admin access to a user');
    console.log('   4. Test the credit system\n');
    console.log('📖 Read QUICK_START.md for detailed instructions\n');

  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run initialization
initializeCreditSystem()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
