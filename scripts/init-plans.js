/**
 * ============================================
 * SUBSCRIPTION PLANS INITIALIZATION SCRIPT
 * ============================================
 * 
 * This script creates default subscription plans and pricing overrides
 * for the Firebass AI SaaS platform.
 * 
 * Usage:
 *   node scripts/init-plans.js
 * 
 * What it does:
 * 1. Creates 4 subscription plans: Free, Basic, Pro, Enterprise
 * 2. Sets up default pricing overrides (optional)
 * 3. Validates plan structure
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ============================================
// SUBSCRIPTION PLAN DEFINITIONS
// ============================================

const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out Firebass AI',
    monthly_price: 0,
    yearly_price: 0,
    monthly_credits: 10,
    yearly_credits: 0, // No yearly option for free
    features: {
      image: true,
      video: false,
      voice: false,
      chat: true,
      multimodal: false,
      priority_queue: false,
      api_access: false,
      custom_models: false,
      team_collaboration: false,
      advanced_analytics: false
    },
    limits: {
      daily_generations: 5,
      max_image_resolution: '512x512',
      max_video_duration: 0,
      max_voice_duration: 0,
      concurrent_generations: 1,
      max_storage_gb: 0.1
    },
    billing_interval: null, // No billing for free plan
    is_popular: false,
    sort_order: 1,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  
  basic: {
    id: 'basic',
    name: 'Basic',
    description: 'Great for individuals and hobbyists',
    monthly_price: 9.99,
    yearly_price: 99.00, // ~17% discount
    monthly_credits: 100,
    yearly_credits: 1200,
    features: {
      image: true,
      video: true,
      voice: true,
      chat: true,
      multimodal: true,
      priority_queue: false,
      api_access: false,
      custom_models: false,
      team_collaboration: false,
      advanced_analytics: false
    },
    limits: {
      daily_generations: 50,
      max_image_resolution: '1024x1024',
      max_video_duration: 5,
      max_voice_duration: 60,
      concurrent_generations: 2,
      max_storage_gb: 5
    },
    billing_interval: 'monthly',
    is_popular: false,
    sort_order: 2,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Best for professionals and creators',
    monthly_price: 29.99,
    yearly_price: 299.00, // ~17% discount
    monthly_credits: 500,
    yearly_credits: 6000,
    features: {
      image: true,
      video: true,
      voice: true,
      chat: true,
      multimodal: true,
      priority_queue: true,
      api_access: true,
      custom_models: true,
      team_collaboration: false,
      advanced_analytics: true
    },
    limits: {
      daily_generations: 200,
      max_image_resolution: '1920x1080',
      max_video_duration: 30,
      max_voice_duration: 300,
      concurrent_generations: 5,
      max_storage_gb: 50
    },
    billing_interval: 'monthly',
    is_popular: true, // Most popular plan
    sort_order: 3,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Unlimited power for teams and businesses',
    monthly_price: 99.99,
    yearly_price: 999.00, // ~17% discount
    monthly_credits: 2000,
    yearly_credits: 24000,
    features: {
      image: true,
      video: true,
      voice: true,
      chat: true,
      multimodal: true,
      priority_queue: true,
      api_access: true,
      custom_models: true,
      team_collaboration: true,
      advanced_analytics: true
    },
    limits: {
      daily_generations: 1000,
      max_image_resolution: '3840x2160',
      max_video_duration: 120,
      max_voice_duration: 1800,
      concurrent_generations: 10,
      max_storage_gb: 500
    },
    billing_interval: 'monthly',
    is_popular: false,
    sort_order: 4,
    created_at: Date.now(),
    updated_at: Date.now()
  }
};

// ============================================
// DEFAULT PRICING OVERRIDES (OPTIONAL)
// ============================================

/**
 * Example pricing overrides for Pro plan
 * Give Pro users discounted rates on premium engines
 */
const DEFAULT_OVERRIDES = {
  pro: {
    plan_id: 'pro',
    ai_types: {
      image: {
        'dall-e-3': { cost: 4, enabled: true }, // 20% discount
        'midjourney-v6': { cost: 8, enabled: true } // 20% discount
      },
      video: {
        'runway-gen3': { cost: 12, enabled: true }, // 20% discount
        'kling-ai-pro': { cost: 16, enabled: true } // 20% discount
      },
      voice: {
        'elevenlabs-turbo': { cost: 0.8, enabled: true } // 20% discount
      }
    },
    updated_at: Date.now()
  },
  
  enterprise: {
    plan_id: 'enterprise',
    ai_types: {
      image: {
        'dall-e-3': { cost: 3, enabled: true }, // 40% discount
        'midjourney-v6': { cost: 6, enabled: true } // 40% discount
      },
      video: {
        'runway-gen3': { cost: 9, enabled: true }, // 40% discount
        'kling-ai-pro': { cost: 12, enabled: true }, // 40% discount
        'sora': { cost: 60, enabled: true } // 40% discount
      },
      voice: {
        'elevenlabs-turbo': { cost: 0.6, enabled: true }, // 40% discount
        'elevenlabs-multilingual': { cost: 1.8, enabled: true } // 40% discount
      },
      chat: {
        'gpt-4': { cost: 0.006, enabled: true }, // 40% discount
        'claude-3-opus': { cost: 0.012, enabled: true } // 40% discount
      }
    },
    updated_at: Date.now()
  }
};

// ============================================
// INITIALIZATION FUNCTIONS
// ============================================

/**
 * Create subscription plans
 */
async function createSubscriptionPlans() {
  console.log('\n🔥 Creating subscription plans...\n');
  
  const batch = db.batch();
  let count = 0;
  
  for (const [planId, planData] of Object.entries(SUBSCRIPTION_PLANS)) {
    const planRef = db.collection('subscription_plans').doc(planId);
    batch.set(planRef, planData);
    count++;
    
    console.log(`✅ ${planData.name} - $${planData.monthly_price}/mo - ${planData.monthly_credits} credits`);
  }
  
  await batch.commit();
  console.log(`\n✅ ${count} subscription plans created successfully!\n`);
}

/**
 * Create pricing overrides (optional)
 */
async function createPricingOverrides(skip = false) {
  if (skip) {
    console.log('\n⏭️  Skipping pricing overrides (use --with-overrides to enable)\n');
    return;
  }
  
  console.log('\n🔥 Creating default pricing overrides...\n');
  
  const batch = db.batch();
  let count = 0;
  
  for (const [planId, overrideData] of Object.entries(DEFAULT_OVERRIDES)) {
    const overrideRef = db.collection('plan_pricing_overrides').doc(planId);
    batch.set(overrideRef, overrideData);
    count++;
    
    console.log(`✅ ${planId.toUpperCase()} - Discounted pricing on premium engines`);
  }
  
  await batch.commit();
  console.log(`\n✅ ${count} pricing overrides created successfully!\n`);
}

/**
 * Validate plan structure
 */
function validatePlans() {
  console.log('\n🔍 Validating plan structure...\n');
  
  for (const [planId, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    const errors = [];
    
    // Required fields
    if (!plan.id) errors.push('Missing id');
    if (!plan.name) errors.push('Missing name');
    if (typeof plan.monthly_price !== 'number') errors.push('Invalid monthly_price');
    if (typeof plan.monthly_credits !== 'number') errors.push('Invalid monthly_credits');
    if (!plan.features) errors.push('Missing features');
    if (!plan.limits) errors.push('Missing limits');
    
    if (errors.length > 0) {
      console.error(`❌ ${planId}: ${errors.join(', ')}`);
    } else {
      console.log(`✅ ${planId}: Valid structure`);
    }
  }
  
  console.log('\n✅ Plan validation complete!\n');
}

/**
 * Display plan summary
 */
function displaySummary() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         SUBSCRIPTION PLANS SUMMARY                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.table(
    Object.values(SUBSCRIPTION_PLANS).map(plan => ({
      Plan: plan.name,
      'Monthly Price': `$${plan.monthly_price}`,
      'Yearly Price': `$${plan.yearly_price}`,
      Credits: plan.monthly_credits,
      'Daily Limit': plan.limits.daily_generations,
      Popular: plan.is_popular ? '⭐' : ''
    }))
  );
  
  console.log('\n📊 Feature Comparison:\n');
  
  const features = [
    'image', 'video', 'voice', 'chat', 'multimodal',
    'priority_queue', 'api_access', 'custom_models'
  ];
  
  const featureTable = Object.values(SUBSCRIPTION_PLANS).map(plan => {
    const row: any = { Plan: plan.name };
    features.forEach(feature => {
      row[feature] = plan.features[feature] ? '✅' : '❌';
    });
    return row;
  });
  
  console.table(featureTable);
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const withOverrides = args.includes('--with-overrides');
  const skipValidation = args.includes('--skip-validation');
  
  try {
    console.log('\n🚀 SUBSCRIPTION PLANS INITIALIZATION\n');
    console.log('====================================\n');
    
    // Validate
    if (!skipValidation) {
      validatePlans();
    }
    
    // Display summary
    displaySummary();
    
    // Confirm before proceeding
    console.log('\n⚠️  This will create/update subscription plans in Firestore.\n');
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create plans
    await createSubscriptionPlans();
    
    // Create overrides (if enabled)
    await createPricingOverrides(!withOverrides);
    
    console.log('\n✅ INITIALIZATION COMPLETE!\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  Next Steps:                                               ║');
    console.log('║  1. Update Firestore security rules                        ║');
    console.log('║  2. Test plan-based pricing in Admin Dashboard             ║');
    console.log('║  3. Integrate with Stripe/payment provider                 ║');
    console.log('║  4. Update user profiles with subscription_plan field      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ INITIALIZATION FAILED:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { SUBSCRIPTION_PLANS, DEFAULT_OVERRIDES };
