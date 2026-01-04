// Quick test script to verify OpenAI DALL·E 3 API connectivity
import 'dotenv/config';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('❌ OPENAI_API_KEY not found in environment');
  process.exit(1);
}

console.log('🔑 API Key found:', apiKey.substring(0, 20) + '...');
console.log('🧪 Testing OpenAI DALL·E 3 API...\n');

const testPayload = {
  model: 'dall-e-3',
  prompt: 'A cute cat sitting on a chair',
  size: '1024x1024',
  quality: 'standard',
  style: 'vivid',
  n: 1
};

try {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(testPayload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ API Error:', response.status);
    console.error('Details:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.error('\n💡 Your API key is invalid or expired. Please:');
      console.error('   1. Go to https://platform.openai.com/api-keys');
      console.error('   2. Create a new API key');
      console.error('   3. Update OPENAI_API_KEY in .env file');
    } else if (response.status === 429) {
      console.error('\n💡 Rate limit or quota exceeded. Check your OpenAI account billing.');
    }
    process.exit(1);
  }

  console.log('✅ API connection successful!');
  console.log('✅ DALL·E 3 is working correctly');
  console.log('\n📝 Response structure:', {
    created: data.created,
    hasData: !!data.data,
    dataCount: data.data?.length,
  });

} catch (error) {
  console.error('❌ Network or connection error:', error.message);
  process.exit(1);
}
