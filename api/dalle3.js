// Vercel serverless function to proxy DALL·E 3 requests securely
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  
  // Debug logging (will appear in Vercel logs)
  console.log('[dalle3] Environment check:', {
    hasKey: !!apiKey,
    keyPrefix: apiKey ? apiKey.substring(0, 7) : 'none',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('API') || k.includes('OPENAI'))
  });
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'DALL·E 3 API key missing or invalid on backend proxy.',
      hint: 'Add OPENAI_API_KEY to Vercel Environment Variables'
    });
  }

  const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid' } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const payload = {
    model: 'dall-e-3',
    prompt,
    size,
    quality,
    style,
    response_format: 'b64_json',
  };

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[dalle3] OpenAI error', data);
      return res.status(response.status).json({ error: data?.error?.message || 'OpenAI error', details: data });
    }

    // Pass through the OpenAI shape (data[0].b64_json or url)
    return res.status(200).json(data);
  } catch (err) {
    console.error('[dalle3] Proxy error', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
