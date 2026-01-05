/**
 * Initialize AI Engines in Firestore
 * 
 * This script sets up the initial engine configuration for the dynamic pricing system.
 * 
 * Usage:
 *   node scripts/init-engines.js
 * 
 * Prerequisites:
 *   - Firebase Admin SDK initialized
 *   - Firestore database created
 *   - Admin credentials configured
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Define all AI engines
const engines = [
  // ========== IMAGE ENGINES ==========
  {
    id: 'dalle',
    engine_name: 'DALL-E 3',
    ai_type: 'image',
    is_active: true,
    base_cost: 5,
    cost_unit: 'image',
    description: 'High-quality image generation from OpenAI with excellent prompt understanding',
    provider: 'OpenAI',
    version: '3',
    capabilities: ['HD', 'Natural language', 'Detailed']
  },
  {
    id: 'seddream',
    engine_name: 'Seddream Pro',
    ai_type: 'image',
    is_active: true,
    base_cost: 2,
    cost_unit: 'image',
    description: 'Fast, cost-effective image generation with good quality',
    provider: 'Seddream',
    capabilities: ['Fast', 'Budget-friendly']
  },
  {
    id: 'midjourney',
    engine_name: 'Midjourney',
    ai_type: 'image',
    is_active: false,
    base_cost: 8,
    cost_unit: 'image',
    description: 'Artistic image generation with unique style (currently disabled)',
    provider: 'Midjourney',
    capabilities: ['Artistic', 'High-quality', 'Stylized']
  },

  // ========== VIDEO ENGINES ==========
  {
    id: 'klingai',
    engine_name: 'Kling AI',
    ai_type: 'video',
    is_active: true,
    base_cost: 10,
    cost_unit: 'second',
    description: 'Advanced video generation with smooth motion and realistic physics',
    provider: 'Kling AI',
    capabilities: ['4K', 'Smooth motion', 'Long duration']
  },
  {
    id: 'runway',
    engine_name: 'Runway Gen-2',
    ai_type: 'video',
    is_active: false,
    base_cost: 15,
    cost_unit: 'second',
    description: 'Professional-grade video generation (currently disabled)',
    provider: 'Runway',
    capabilities: ['Professional', 'High-quality', 'Cinematic']
  },
  {
    id: 'pika',
    engine_name: 'Pika Labs',
    ai_type: 'video',
    is_active: false,
    base_cost: 8,
    cost_unit: 'second',
    description: 'Creative video generation with unique effects (currently disabled)',
    provider: 'Pika',
    capabilities: ['Creative', 'Effects', 'Stylized']
  },

  // ========== VOICE ENGINES ==========
  {
    id: 'elevenlabs',
    engine_name: 'ElevenLabs',
    ai_type: 'voice',
    is_active: true,
    base_cost: 3,
    cost_unit: 'minute',
    description: 'Natural, expressive voice synthesis with emotion control',
    provider: 'ElevenLabs',
    capabilities: ['Natural', 'Multilingual', 'Voice cloning']
  },
  {
    id: 'openai-tts',
    engine_name: 'OpenAI TTS',
    ai_type: 'voice',
    is_active: false,
    base_cost: 2,
    cost_unit: 'minute',
    description: 'Text-to-speech from OpenAI (currently disabled)',
    provider: 'OpenAI',
    capabilities: ['Clear', 'Fast', 'Multiple voices']
  },

  // ========== CHAT ENGINES ==========
  {
    id: 'gemini',
    engine_name: 'Gemini Pro',
    ai_type: 'chat',
    is_active: true,
    base_cost: 0.001,
    cost_unit: 'token',
    description: "Google's multimodal AI with strong reasoning and coding abilities",
    provider: 'Google',
    capabilities: ['Multimodal', 'Reasoning', 'Code generation']
  },
  {
    id: 'gpt4',
    engine_name: 'GPT-4 Turbo',
    ai_type: 'chat',
    is_active: false,
    base_cost: 0.003,
    cost_unit: 'token',
    description: 'OpenAI\'s most advanced language model (currently disabled)',
    provider: 'OpenAI',
    capabilities: ['Advanced reasoning', 'Multimodal', 'Long context']
  },
  {
    id: 'claude',
    engine_name: 'Claude 3',
    ai_type: 'chat',
    is_active: false,
    base_cost: 0.002,
    cost_unit: 'token',
    description: 'Anthropic\'s AI assistant with strong safety (currently disabled)',
    provider: 'Anthropic',
    capabilities: ['Safety', 'Analysis', 'Long documents']
  }
];

// Define credit pricing configuration per AI type
const pricingConfigs = [
  {
    ai_type: 'image',
    default_engine: 'dalle',
    engines: {
      dalle: { cost: 5 },
      seddream: { cost: 2 },
      midjourney: { cost: 8 }
    }
  },
  {
    ai_type: 'video',
    default_engine: 'klingai',
    engines: {
      klingai: { cost: 10 },
      runway: { cost: 15 },
      pika: { cost: 8 }
    }
  },
  {
    ai_type: 'voice',
    default_engine: 'elevenlabs',
    engines: {
      elevenlabs: { cost: 3 },
      'openai-tts': { cost: 2 }
    }
  },
  {
    ai_type: 'chat',
    default_engine: 'gemini',
    engines: {
      gemini: { cost: 0.001 },
      gpt4: { cost: 0.003 },
      claude: { cost: 0.002 }
    }
  }
];

/**
 * Initialize engines in Firestore
 */
async function initEngines() {
  console.log('🚀 Initializing AI engines...\n');

  try {
    // Create engines
    console.log('📦 Creating engine documents...');
    for (const engine of engines) {
      await db.collection('ai_engines').doc(engine.id).set({
        ...engine,
        created_at: Date.now(),
        updated_at: Date.now()
      });
      console.log(`  ✅ ${engine.engine_name} (${engine.id}) - ${engine.is_active ? 'Active' : 'Disabled'}`);
    }

    console.log('\n💰 Creating pricing configurations...');
    for (const config of pricingConfigs) {
      await db.collection('credit_pricing').doc(config.ai_type).set({
        ...config,
        updated_at: Date.now(),
        updated_by: 'system'
      });
      console.log(`  ✅ ${config.ai_type} - Default: ${config.default_engine}`);
    }

    console.log('\n✨ Summary:');
    console.log(`  • Total engines: ${engines.length}`);
    console.log(`  • Active engines: ${engines.filter(e => e.is_active).length}`);
    console.log(`  • Image engines: ${engines.filter(e => e.ai_type === 'image').length}`);
    console.log(`  • Video engines: ${engines.filter(e => e.ai_type === 'video').length}`);
    console.log(`  • Voice engines: ${engines.filter(e => e.ai_type === 'voice').length}`);
    console.log(`  • Chat engines: ${engines.filter(e => e.ai_type === 'chat').length}`);

    console.log('\n🎉 Engine initialization complete!');
    console.log('\n📋 Next steps:');
    console.log('  1. Deploy Cloud Functions: firebase deploy --only functions');
    console.log('  2. Update Firestore rules: firebase deploy --only firestore:rules');
    console.log('  3. Open Admin Dashboard → Credits tab to manage engines');
    console.log('  4. Test engine-based credit deduction in your app');

  } catch (error) {
    console.error('\n❌ Error initializing engines:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run initialization
initEngines().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
