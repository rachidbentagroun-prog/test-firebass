#!/usr/bin/env node

/**
 * Profit Intelligence System - Initialization Script
 * 
 * Seeds initial AI engine costs and system configuration
 * Run once during deployment: node scripts/init-profit-system.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // Update path

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

// ============================================
// INITIAL AI ENGINE COSTS
// ============================================

const ENGINE_COSTS = [
  // DALL·E 3
  {
    engine_id: 'dalle_3_standard',
    provider_name: 'OpenAI',
    ai_type: 'image',
    cost_per_unit: 0.040, // $0.04 per image
    unit_type: 'image',
    quality_tier: 'standard',
    resolution: '1024x1024',
    is_active: true,
    notes: 'DALL·E 3 Standard Quality - 1024x1024'
  },
  {
    engine_id: 'dalle_3_hd',
    provider_name: 'OpenAI',
    ai_type: 'image',
    cost_per_unit: 0.080, // $0.08 per image
    unit_type: 'image',
    quality_tier: 'hd',
    resolution: '1024x1024',
    is_active: true,
    notes: 'DALL·E 3 HD Quality - 1024x1024'
  },
  {
    engine_id: 'dalle_3_hd_large',
    provider_name: 'OpenAI',
    ai_type: 'image',
    cost_per_unit: 0.120, // $0.12 per image
    unit_type: 'image',
    quality_tier: 'hd',
    resolution: '1792x1024',
    is_active: true,
    notes: 'DALL·E 3 HD Quality - 1792x1024'
  },

  // Gemini
  {
    engine_id: 'gemini_pro_vision',
    provider_name: 'Google',
    ai_type: 'image',
    cost_per_unit: 0.0025, // $0.0025 per image
    unit_type: 'image',
    quality_tier: 'standard',
    is_active: true,
    notes: 'Gemini Pro Vision - Image Generation'
  },

  // Video Generation
  {
    engine_id: 'seddream_video',
    provider_name: 'SEDDREAM',
    ai_type: 'video',
    cost_per_unit: 0.12, // $0.12 per second
    unit_type: 'second',
    resolution: '1920x1080',
    is_active: true,
    notes: 'SEDDREAM Video Generation - Per Second'
  },
  {
    engine_id: 'openai_sora',
    provider_name: 'OpenAI',
    ai_type: 'video',
    cost_per_unit: 0.24, // $0.24 per second (estimated)
    unit_type: 'second',
    resolution: '1920x1080',
    is_active: false, // Not yet available
    notes: 'OpenAI Sora - Per Second (Future)'
  },

  // Text-to-Speech
  {
    engine_id: 'openai_tts_hd',
    provider_name: 'OpenAI',
    ai_type: 'voice',
    cost_per_unit: 0.030, // $0.03 per 1k characters
    unit_type: '1k_tokens',
    quality_tier: 'hd',
    is_active: true,
    notes: 'OpenAI TTS HD - Per 1k Characters'
  },
  {
    engine_id: 'openai_tts_standard',
    provider_name: 'OpenAI',
    ai_type: 'voice',
    cost_per_unit: 0.015, // $0.015 per 1k characters
    unit_type: '1k_tokens',
    quality_tier: 'standard',
    is_active: true,
    notes: 'OpenAI TTS Standard - Per 1k Characters'
  },

  // Chat Models
  {
    engine_id: 'gpt_4_turbo',
    provider_name: 'OpenAI',
    ai_type: 'chat',
    cost_per_unit: 0.03, // $0.03 per 1k tokens (combined input+output avg)
    unit_type: '1k_tokens',
    is_active: true,
    notes: 'GPT-4 Turbo - Average Cost Per 1k Tokens'
  },
  {
    engine_id: 'gpt_3_5_turbo',
    provider_name: 'OpenAI',
    ai_type: 'chat',
    cost_per_unit: 0.002, // $0.002 per 1k tokens
    unit_type: '1k_tokens',
    is_active: true,
    notes: 'GPT-3.5 Turbo - Average Cost Per 1k Tokens'
  }
];

// ============================================
// SUBSCRIPTION PLAN PRICING
// ============================================

const SUBSCRIPTION_PLANS = [
  {
    plan_id: 'free',
    plan_name: 'Free',
    monthly_price_usd: 0,
    credits_per_month: 100,
    features: ['100 credits/month', 'Basic models', 'Standard quality'],
    is_active: true
  },
  {
    plan_id: 'pro',
    plan_name: 'Pro',
    monthly_price_usd: 29.99,
    annual_price_usd: 299.99,
    credits_per_month: 1000,
    features: ['1000 credits/month', 'All models', 'HD quality', 'Priority support'],
    is_active: true
  },
  {
    plan_id: 'ultra',
    plan_name: 'Ultra',
    monthly_price_usd: 99.99,
    annual_price_usd: 999.99,
    credits_per_month: 5000,
    features: ['5000 credits/month', 'All models', 'Ultra HD', 'Dedicated support', 'API access'],
    is_active: true
  },
  {
    plan_id: 'enterprise',
    plan_name: 'Enterprise',
    monthly_price_usd: 299.99,
    credits_per_month: 20000,
    features: ['20000 credits/month', 'Custom models', 'White-label', 'SLA', 'Dedicated account manager'],
    is_active: true
  }
];

// ============================================
// INITIALIZATION FUNCTIONS
// ============================================

async function seedEngineCosts() {
  console.log('📊 Seeding AI Engine Costs...\n');
  
  const batch = db.batch();
  
  for (const engine of ENGINE_COSTS) {
    const docRef = db.collection('ai_engine_costs').doc(engine.engine_id);
    batch.set(docRef, {
      ...engine,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_by: 'system_init'
    });
    
    console.log(`✓ ${engine.engine_id}: $${engine.cost_per_unit} per ${engine.unit_type}`);
  }
  
  await batch.commit();
  console.log(`\n✅ Successfully seeded ${ENGINE_COSTS.length} engine costs\n`);
}

async function seedSubscriptionPlans() {
  console.log('💳 Seeding Subscription Plans...\n');
  
  const batch = db.batch();
  
  for (const plan of SUBSCRIPTION_PLANS) {
    const docRef = db.collection('subscription_plans').doc(plan.plan_id);
    batch.set(docRef, {
      ...plan,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✓ ${plan.plan_name}: $${plan.monthly_price_usd}/month`);
  }
  
  await batch.commit();
  console.log(`\n✅ Successfully seeded ${SUBSCRIPTION_PLANS.length} subscription plans\n`);
}

async function createIndexes() {
  console.log('📑 Creating Firestore Indexes...\n');
  
  console.log(`
Required Firestore Indexes (create manually in Firebase Console):

1. usage_logs
   - user_id (ASC) + created_at (DESC)
   - subscription_plan (ASC) + created_at (DESC)
   - engine_id (ASC) + created_at (DESC)
   - profit_usd (ASC) + created_at (DESC)

2. ai_engine_costs
   - ai_type (ASC) + is_active (ASC)
   - provider_name (ASC) + updated_at (DESC)

3. profit_aggregates
   - period_type (ASC) + period_start (DESC)
   - profit_margin_percent (ASC)

4. loss_users
   - subscription_plan (ASC) + profit_margin_percent (ASC)
   - detected_at (DESC)

Create these indexes at:
https://console.firebase.google.com/project/${serviceAccount.project_id}/firestore/indexes
  `);
}

async function configureTTL() {
  console.log('⏰ Configuring TTL Policies...\n');
  
  console.log(`
TTL Configuration (via Firebase Console or gcloud CLI):

1. usage_logs - 90 days retention
   gcloud firestore fields ttls update created_at \\
     --collection-group=usage_logs \\
     --enable-ttl

2. profit_audit_log - 730 days (2 years) retention
   gcloud firestore fields ttls update changed_at \\
     --collection-group=profit_audit_log \\
     --enable-ttl

Note: TTL must be enabled via Firebase Console or gcloud CLI
https://console.firebase.google.com/project/${serviceAccount.project_id}/firestore/ttl
  `);
}

async function initializeSystemConfig() {
  console.log('⚙️  Initializing System Configuration...\n');
  
  const config = {
    system_version: '1.0.0',
    profit_intelligence_enabled: true,
    cost_cache_ttl_seconds: 300, // 5 minutes
    loss_detection_period_days: 30,
    loss_threshold_percent: -10,
    usage_logs_ttl_days: 90,
    audit_logs_ttl_days: 730,
    batch_size: 500,
    aggregation_schedules: {
      daily: '1 0 * * *',  // 00:01 UTC
      monthly: '0 1 1 * *', // 01:00 UTC on 1st of month
      hourly_loss_detection: '0 * * * *' // Every hour
    },
    initialized_at: admin.firestore.FieldValue.serverTimestamp(),
    initialized_by: 'system_init'
  };
  
  await db.collection('system_config').doc('profit_intelligence').set(config);
  
  console.log('✓ System configuration initialized');
  console.log(`✓ Version: ${config.system_version}`);
  console.log(`✓ Loss threshold: ${config.loss_threshold_percent}%`);
  console.log(`✓ TTL: ${config.usage_logs_ttl_days} days\n`);
}

async function verifyDeployment() {
  console.log('🔍 Verifying Deployment...\n');
  
  // Check engine costs
  const engineCostsSnapshot = await db.collection('ai_engine_costs').get();
  console.log(`✓ Engine costs: ${engineCostsSnapshot.size} documents`);
  
  // Check subscription plans
  const plansSnapshot = await db.collection('subscription_plans').get();
  console.log(`✓ Subscription plans: ${plansSnapshot.size} documents`);
  
  // Check system config
  const configDoc = await db.collection('system_config').doc('profit_intelligence').get();
  console.log(`✓ System config: ${configDoc.exists ? 'exists' : 'missing'}`);
  
  console.log('\n✅ Deployment verification complete!\n');
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('\n================================================');
  console.log('💰 PROFIT INTELLIGENCE SYSTEM - INITIALIZATION');
  console.log('================================================\n');
  
  try {
    // Step 1: Seed engine costs
    await seedEngineCosts();
    
    // Step 2: Seed subscription plans
    await seedSubscriptionPlans();
    
    // Step 3: Initialize system config
    await initializeSystemConfig();
    
    // Step 4: Verify deployment
    await verifyDeployment();
    
    // Step 5: Display manual steps
    await createIndexes();
    await configureTTL();
    
    console.log('================================================');
    console.log('✅ INITIALIZATION COMPLETE!');
    console.log('================================================\n');
    console.log('Next steps:');
    console.log('1. Create Firestore indexes (see above)');
    console.log('2. Configure TTL policies (see above)');
    console.log('3. Deploy Cloud Functions: firebase deploy --only functions');
    console.log('4. Deploy Firestore rules: firebase deploy --only firestore:rules');
    console.log('5. Grant super_admin role to admin users');
    console.log('6. Verify dashboard access: /admin/profit-intelligence\n');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run initialization
main();
