// Vercel serverless function to proxy OpenAI Chat Completions securely
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.OPENAI_CHAT_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing OPENAI_CHAT_API_KEY or OPENAI_API_KEY on server' });
  }

  const body = req.body || {};
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const model = body.model || 'gpt-4o-mini';
  const temperature = typeof body.temperature === 'number' ? body.temperature : 0.3;
  const max_tokens = typeof body.max_tokens === 'number' ? body.max_tokens : 512;

  if (!messages.length) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error('[chatgpt] OpenAI error', data);
      return res.status(upstream.status).json({ error: data?.error?.message || 'OpenAI error', details: data });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('[chatgpt] Proxy error', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
