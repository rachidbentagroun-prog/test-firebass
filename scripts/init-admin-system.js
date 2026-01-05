/**
 * Admin System Initialization Script
 * 
 * Run this script to initialize Firestore collections for the Admin Dashboard
 * Usage: node scripts/init-admin-system.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // You need to add your service account key

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function initializeCollections() {
  console.log('🚀 Initializing Admin System Collections...\n');

  try {
    // 1. Initialize credit_rules
    console.log('📋 Creating credit_rules...');
    await db.collection('credit_rules').doc('default_rules').set({
      imageCost: 1,
      imageHDCost: 2,
      image4KCost: 5,
      videoCostPerSecond: 5,
      video720pMultiplier: 1.0,
      video1080pMultiplier: 1.5,
      video4KMultiplier: 3.0,
      voiceCostPerMinute: 2,
      voiceCloneCostMultiplier: 2.0,
      chatCostPerToken: 0.001,
      chatGPT4Multiplier: 5.0,
      freeSignupCredits: 10,
      basicPlanCredits: 100,
      premiumPlanCredits: 500,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'system',
      auditLog: 'Initial setup'
    });
    console.log('✅ credit_rules created\n');

    // 2. Initialize system_config
    console.log('⚙️  Creating system_config...');
    await db.collection('system_config').doc('default').set({
      maintenanceMode: false,
      maintenanceMessage: 'System is under maintenance. Please check back soon.',
      signupsEnabled: true,
      freeSignupsEnabled: true,
      maxConcurrentGenerations: 100,
      maxQueueSize: 500,
      rateLimits: {
        free: {
          maxPerHour: 5,
          maxPerDay: 20
        },
        basic: {
          maxPerHour: 20,
          maxPerDay: 100
        },
        premium: {
          maxPerHour: 100,
          maxPerDay: 500
        }
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'system'
    });
    console.log('✅ system_config created\n');

    // 3. Initialize engine_costs
    console.log('🎨 Creating engine_costs...');
    
    const engines = [
      {
        engineId: 'dalle3',
        engineName: 'DALL-E 3',
        type: 'image',
        baseCostPerGeneration: 2,
        qualityMultipliers: {
          standard: 1.0,
          hd: 1.5
        },
        isActive: true,
        averageProcessingTime: 8,
        successRate: 98.5,
        usageCount: 0,
        lastUsed: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'system'
      },
      {
        engineId: 'stable_diffusion',
        engineName: 'Stable Diffusion',
        type: 'image',
        baseCostPerGeneration: 1,
        qualityMultipliers: {
          standard: 1.0,
          hd: 1.2,
          ultra: 2.0
        },
        isActive: true,
        averageProcessingTime: 5,
        successRate: 96.0,
        usageCount: 0,
        lastUsed: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'system'
      },
      {
        engineId: 'midjourney',
        engineName: 'Midjourney',
        type: 'image',
        baseCostPerGeneration: 3,
        qualityMultipliers: {
          standard: 1.0,
          hd: 1.5,
          ultra: 2.5
        },
        isActive: false, // Disabled by default
        averageProcessingTime: 60,
        successRate: 95.0,
        usageCount: 0,
        lastUsed: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'system'
      },
      {
        engineId: 'veo',
        engineName: 'Google Veo',
        type: 'video',
        baseCostPerGeneration: 50,
        qualityMultipliers: {
          '720p': 1.0,
          '1080p': 1.5,
          '4K': 3.0
        },
        isActive: true,
        averageProcessingTime: 120,
        successRate: 92.0,
        usageCount: 0,
        lastUsed: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'system'
      },
      {
        engineId: 'kling',
        engineName: 'Kling AI',
        type: 'video',
        baseCostPerGeneration: 30,
        qualityMultipliers: {
          standard: 1.0,
          hd: 1.5
        },
        isActive: true,
        averageProcessingTime: 90,
        successRate: 94.0,
        usageCount: 0,
        lastUsed: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'system'
      },
      {
        engineId: 'elevenlabs',
        engineName: 'ElevenLabs',
        type: 'voice',
        baseCostPerGeneration: 2,
        qualityMultipliers: {
          standard: 1.0,
          cloned: 2.0
        },
        isActive: true,
        averageProcessingTime: 10,
        successRate: 99.0,
        usageCount: 0,
        lastUsed: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'system'
      },
      {
        engineId: 'gpt4',
        engineName: 'GPT-4',
        type: 'chat',
        baseCostPerGeneration: 0.1,
        qualityMultipliers: {
          standard: 1.0,
          turbo: 0.5
        },
        isActive: true,
        averageProcessingTime: 3,
        successRate: 99.5,
        usageCount: 0,
        lastUsed: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'system'
      }
    ];

    for (const engine of engines) {
      await db.collection('engine_costs').doc(engine.engineId).set(engine);
      console.log(`  ✓ ${engine.engineName}`);
    }
    console.log('✅ engine_costs created\n');

    // 4. Initialize plan_credit_overrides (Premium plan gets 20% discount)
    console.log('💎 Creating plan_credit_overrides...');
    
    const overrides = [
      {
        planName: 'premium',
        engineId: 'dalle3',
        engineName: 'DALL-E 3',
        type: 'image',
        overrideCost: 1.6, // 20% discount
        discountPercentage: 20,
        isActive: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'system'
      },
      {
        planName: 'premium',
        engineId: 'stable_diffusion',
        engineName: 'Stable Diffusion',
        type: 'image',
        overrideCost: 0.8, // 20% discount
        discountPercentage: 20,
        isActive: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'system'
      },
      {
        planName: 'premium',
        engineId: 'veo',
        engineName: 'Google Veo',
        type: 'video',
        overrideCost: 40, // 20% discount
        discountPercentage: 20,
        isActive: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'system'
      }
    ];

    for (const override of overrides) {
      const docId = `${override.planName}_${override.engineId}`;
      await db.collection('plan_credit_overrides').doc(docId).set(override);
      console.log(`  ✓ ${override.planName} - ${override.engineName}`);
    }
    console.log('✅ plan_credit_overrides created\n');

    // 5. Initialize today's analytics (placeholder)
    console.log('📊 Creating initial analytics...');
    const today = new Date().toISOString().split('T')[0];
    
    // Get total users count
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;
    
    await db.collection('analytics_daily').doc(today).set({
      date: today,
      totalUsers: totalUsers,
      activeUsers24h: 0,
      activeUsers7d: 0,
      newSignups: 0,
      totalGenerations: 0,
      imageGenerations: 0,
      videoGenerations: 0,
      voiceGenerations: 0,
      chatGenerations: 0,
      creditsConsumed: 0,
      creditsGranted: 0,
      revenue: 0,
      pageViews: 0,
      uniqueVisitors: 0,
      trafficByCountry: {},
      topReferrers: {},
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Initial analytics created\n');

    console.log('🎉 Admin System Initialized Successfully!\n');
    console.log('Next Steps:');
    console.log('1. Deploy Cloud Functions: firebase deploy --only functions');
    console.log('2. Deploy Security Rules: firebase deploy --only firestore:rules');
    console.log('3. Create composite indexes (see ADMIN_SYSTEM_SETUP_GUIDE.md)');
    console.log('4. Set up a super admin user with role="super_admin" in Firestore');
    console.log('5. Test the admin dashboard at /admin\n');

  } catch (error) {
    console.error('❌ Error initializing collections:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run initialization
initializeCollections();
