
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Load local env variables for development
  const env = loadEnv(mode, process.cwd(), '');
  
  function createBodyReader() {
    return async function readJson(req: any): Promise<any> {
      return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        req.on('data', (c: Uint8Array) => chunks.push(c));
        req.on('end', () => {
          try {
            const raw = Buffer.concat(chunks).toString('utf8');
            resolve(raw ? JSON.parse(raw) : {});
          } catch (e) {
            reject(e);
          }
        });
        req.on('error', reject);
      });
    };
  }
  
  // Prioritize system env vars (e.g., Vercel) over local .env during build
  // and fall back to empty strings to avoid undefined replacements.
  const apiKey = process.env.API_KEY || env.API_KEY || '';
  const soraKey = process.env.SORA_API_KEY || env.SORA_API_KEY || '';
  const klingaiKey = process.env.KLINGAI_API_KEY || env.KLINGAI_API_KEY || '';
  const seedanceKey = process.env.SEEDANCE_API_KEY || env.SEEDANCE_API_KEY || '';
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY || '';
  const seedreamKey = process.env.SEEDREAM_API_KEY || env.SEEDREAM_API_KEY || '';
  const deapiKey = process.env.VITE_DEAPI_API_KEY || env.VITE_DEAPI_API_KEY || '';
  const deapiBase = process.env.VITE_DEAPI_API_BASE || env.VITE_DEAPI_API_BASE || 'https://api.deapi.ai';
  const deapiModel = process.env.VITE_DEAPI_MODEL || env.VITE_DEAPI_MODEL || '';
  const deapiImagePath = process.env.VITE_DEAPI_IMAGE_PATH || env.VITE_DEAPI_IMAGE_PATH || '';
  const runwareKey = process.env.VITE_RUNWARE_API_KEY || env.VITE_RUNWARE_API_KEY || '';
  const runwareBase = process.env.VITE_RUNWARE_API_BASE || env.VITE_RUNWARE_API_BASE || 'https://api.runware.ai';
  const runwareImagePath = process.env.VITE_RUNWARE_IMAGE_PATH || env.VITE_RUNWARE_IMAGE_PATH || '';
  const runwareTaskType = process.env.VITE_RUNWARE_TASK_TYPE || env.VITE_RUNWARE_TASK_TYPE || '';
  const runwareModel = process.env.VITE_RUNWARE_MODEL || env.VITE_RUNWARE_MODEL || '';
  const openaiKey = process.env.OPENAI_API_KEY || env.OPENAI_API_KEY || '';
  const openaiChatKey = process.env.OPENAI_CHAT_API_KEY || env.OPENAI_CHAT_API_KEY || openaiKey;
  
  const soraBase = process.env.SORA_API_BASE || env.SORA_API_BASE || 'https://api.sora.com/v1/videos';
  const klingaiBase = process.env.KLINGAI_API_BASE || env.KLINGAI_API_BASE || 'https://api.klingai.com/v1/videos/text2video';
  const seedanceBase = process.env.SEEDANCE_API_BASE || env.SEEDANCE_API_BASE || 'https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks';
  const seedreamBase = process.env.SEEDREAM_API_BASE || env.SEEDREAM_API_BASE || 'https://ark.ap-southeast.bytepluses.com/api/v3/images/generations';

  return {
    base: '/',
    plugins: [
      react(),
      {
        name: 'local-api-proxy',
        configureServer(server) {
              const readJson = createBodyReader();

              server.middlewares.use('/api/sora', async (req, res) => {
                if (req.method !== 'POST') {
                  res.statusCode = 405;
                  res.end('Method Not Allowed');
                  return;
                }
                try {
                  if (!soraKey) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'SORA_API_KEY is missing on server.' }));
                    return;
                  }
                  const body = await readJson(req);
                  const upstream = await fetch(soraBase, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${soraKey}`,
                      'Accept': 'application/json',
                    },
                    body: JSON.stringify(body),
                  });
                  const text = await upstream.text();
                  res.statusCode = upstream.status;
                  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
                  res.end(text);
                } catch (e: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: e?.message || 'Proxy error' }));
                }
              });

              server.middlewares.use('/api/klingai', async (req, res) => {
                if (req.method !== 'POST') {
                  res.statusCode = 405;
                  res.end('Method Not Allowed');
                  return;
                }
                try {
                  if (!klingaiKey) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'KLINGAI_API_KEY is missing on server.' }));
                    return;
                  }
                  const body = await readJson(req);
                  const upstream = await fetch(klingaiBase, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      // Send multiple header variants to satisfy different upstream auth schemes
                      'Authorization': `Bearer ${klingaiKey}`,
                      'X-API-Key': klingaiKey,
                      'x-api-key': klingaiKey,
                      'KlingAI-Key': klingaiKey,
                      'klingai-key': klingaiKey,
                      'Accept': 'application/json',
                    },
                    body: JSON.stringify(body),
                  });
                  const text = await upstream.text();
                  res.statusCode = upstream.status;
                  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
                  res.end(text);
                } catch (e: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: e?.message || 'Proxy error' }));
                }
              });

              // OpenAI DALL·E 3 image generation proxy (dev server)
              server.middlewares.use('/api/dalle3', async (req, res) => {
                if (req.method !== 'POST') {
                  res.statusCode = 405;
                  res.end('Method Not Allowed');
                  return;
                }
                try {
                  if (!openaiKey) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'OPENAI_API_KEY is missing on server.' }));
                    return;
                  }
                  const body = await readJson(req);
                  const upstream = await fetch('https://api.openai.com/v1/images/generations', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${openaiKey}`,
                      'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                      model: 'dall-e-3',
                      prompt: body?.prompt,
                      size: body?.size || '1024x1024',
                      quality: body?.quality || 'standard',
                      style: body?.style || 'vivid',
                      response_format: 'b64_json',
                    }),
                  });
                  const text = await upstream.text();
                  res.statusCode = upstream.status;
                  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
                  res.end(text);
                } catch (e: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: e?.message || 'Proxy error' }));
                }
              });

              // OpenAI Chat Completions proxy (dev server)
              server.middlewares.use('/api/chatgpt', async (req, res) => {
                if (req.method !== 'POST') {
                  res.statusCode = 405;
                  res.end('Method Not Allowed');
                  return;
                }
                try {
                  if (!openaiChatKey) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'OPENAI_CHAT_API_KEY (or OPENAI_API_KEY) is missing on server.' }));
                    return;
                  }
                  const body = await readJson(req);
                  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${openaiChatKey}`,
                      'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                      model: body?.model || 'gpt-4o-mini',
                      messages: body?.messages || [],
                      temperature: typeof body?.temperature === 'number' ? body.temperature : 0.3,
                      max_tokens: typeof body?.max_tokens === 'number' ? body.max_tokens : 512,
                    }),
                  });
                  const text = await upstream.text();
                  res.statusCode = upstream.status;
                  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
                  res.end(text);
                } catch (e: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: e?.message || 'Proxy error' }));
                }
              });

              // ByteDance Seedream 4.5 Image generation proxy
              server.middlewares.use('/api/seedream', async (req, res) => {
                try {
                  // Handle POST create and GET status like seedance
                  const taskIdMatch = req.url?.match(/^\/([a-zA-Z0-9\-_]+)$/);
                  const taskId = taskIdMatch ? taskIdMatch[1] : null;

                  if (req.method === 'POST') {
                    if (!seedreamKey) {
                      res.statusCode = 500;
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({ error: 'SEEDREAM_API_KEY is missing on server.' }));
                      return;
                    }
                    const body = await readJson(req);
                    const upstream = await fetch(seedreamBase, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${seedreamKey}`,
                        'X-API-Key': seedreamKey,
                        'Accept': 'application/json',
                      },
                      body: JSON.stringify(body),
                    });
                    const text = await upstream.text();
                    res.statusCode = upstream.status;
                    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
                    res.end(text);
                    return;
                  }

                  if (req.method === 'GET' && taskId) {
                    if (!seedreamKey) {
                      res.statusCode = 500;
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({ error: 'SEEDREAM_API_KEY is missing on server.' }));
                      return;
                    }
                    const taskUrl = `${seedreamBase}/${taskId}`;
                    const upstream = await fetch(taskUrl, {
                      method: 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${seedreamKey}`,
                        'X-API-Key': seedreamKey,
                        'Accept': 'application/json',
                      },
                    });
                    const text = await upstream.text();
                    res.statusCode = upstream.status;
                    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
                    res.end(text);
                    return;
                  }

                  res.statusCode = 405;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST to create images or GET /api/seedream/{taskId} to query status.' }));
                } catch (e: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: e?.message || 'Proxy error' }));
                }
              });

              server.middlewares.use('/api/seedance', async (req, res, next) => {
                try {
                  // Inside this middleware, req.url is relative to /api/seedance
                  // So "/" means /api/seedance, and "/taskId" means /api/seedance/taskId
                  console.log(`[Seedance] ${req.method} ${req.url}`);
                  
                  // Extract task ID from relative URL
                  // If req.url is "/", it's a POST to create task
                  // If req.url is "/taskId", it's a GET to query task status
                  const taskIdMatch = req.url?.match(/^\/([a-zA-Z0-9\-_]+)$/);
                  const taskId = taskIdMatch ? taskIdMatch[1] : null;

                  console.log(`[Seedance] Method: ${req.method}, relative url: ${req.url}, taskId: ${taskId}`);

                  // Handle POST request for task creation
                  if (req.method === 'POST') {
                    try {
                      if (!seedanceKey) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'SEEDANCE_API_KEY is missing on server.' }));
                        return;
                      }
                      const body = await readJson(req);
                      console.log('[Seedance] Creating task with body:', JSON.stringify(body).substring(0, 100));
                      const upstream = await fetch(seedanceBase, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${seedanceKey}`,
                          'X-API-Key': seedanceKey,
                          'Accept': 'application/json',
                        },
                        body: JSON.stringify(body),
                      });
                      const text = await upstream.text();
                      console.log('[Seedance] Response status:', upstream.status);
                      res.statusCode = upstream.status;
                      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
                      res.end(text);
                    } catch (e: any) {
                      console.error('[Seedance] Error:', e);
                      res.statusCode = 500;
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({ error: e?.message || 'Proxy error' }));
                    }
                    return;
                  }

                  // Handle GET request for task status query
                  if (req.method === 'GET' && taskId) {
                    try {
                      if (!seedanceKey) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'SEEDANCE_API_KEY is missing on server.' }));
                        return;
                      }
                      
                      // Query task status
                      const taskUrl = `${seedanceBase}/${taskId}`;
                      console.log('[Seedance] Querying task:', taskUrl);
                      const upstream = await fetch(taskUrl, {
                        method: 'GET',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${seedanceKey}`,
                          'X-API-Key': seedanceKey,
                          'Accept': 'application/json',
                        },
                      });
                      const text = await upstream.text();
                      console.log('[Seedance] Task status response:', text.substring(0, 500));
                      res.statusCode = upstream.status;
                      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
                      res.end(text);
                    } catch (e: any) {
                      console.error('[Seedance] Error:', e);
                      res.statusCode = 500;
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({ error: e?.message || 'Proxy error' }));
                    }
                    return;
                  }

                  // Method not allowed for other methods/paths
                  console.log('[Seedance] Method not allowed:', req.method, req.url);
                  res.statusCode = 405;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST to create tasks or GET /api/seedance/{taskId} to query status.' }));
                } catch (e: any) {
                  console.error('[Seedance] Middleware error:', e);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });

              server.middlewares.use('/api/runware', async (req, res) => {
                if (req.method !== 'POST') {
                  res.statusCode = 405;
                  res.end('Method Not Allowed');
                  return;
                }
                try {
                  if (!runwareKey) {
                    console.error('[Runware Proxy] API key is missing!');
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'VITE_RUNWARE_API_KEY is missing on server.' }));
                    return;
                  }
                  if (!runwareImagePath || !runwareImagePath.trim()) {
                    console.error('[Runware Proxy] Route path is missing!');
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Set VITE_RUNWARE_IMAGE_PATH to the exact image route from Runware docs.' }));
                    return;
                  }
                  const body = await readJson(req);
                  const endpointPath = runwareImagePath.startsWith('/') ? runwareImagePath : `/${runwareImagePath}`;
                  const upstreamUrl = new URL(endpointPath, runwareBase).toString();
                  const authVariants: Array<Record<string, string>> = [
                    { Authorization: `Bearer ${runwareKey}` },
                    { 'X-API-Key': runwareKey },
                  ];
                  let upstream: Response | null = null;
                  for (const auth of authVariants) {
                    const headers: Record<string, string> = {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json',
                      ...auth,
                    };
                    const resp = await fetch(upstreamUrl, {
                      method: 'POST',
                      headers,
                      body: JSON.stringify(body),
                    });
                    if (resp.status !== 404) { upstream = resp; break; }
                  }
                  if (!upstream) {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ message: `The route ${endpointPath} could not be found.` }));
                    return;
                  }
                  const text = await upstream.text();
                  res.statusCode = upstream.status;
                  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
                  res.end(text);
                } catch (e: any) {
                  console.error('[Runware Proxy] Error:', e);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: e?.message || 'Proxy error' }));
                }
              });

              server.middlewares.use('/api/deapi', async (req, res) => {
                if (req.method !== 'POST') {
                  res.statusCode = 405;
                  res.end('Method Not Allowed');
                  return;
                }
                try {
                  if (!deapiKey) {
                    console.error('[DeAPI Proxy] API key is missing!');
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'VITE_DEAPI_API_KEY is missing on server.' }));
                    return;
                  }
                  if (!deapiImagePath || !deapiImagePath.trim()) {
                    console.error('[DeAPI Proxy] DEAPI route path is missing!');
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Set VITE_DEAPI_IMAGE_PATH to the exact image route from https://docs.deapi.ai/api/overview (e.g., /v1/images/generate).' }));
                    return;
                  }
                  console.log('[DeAPI Proxy] Received request');
                  const body = await readJson(req);
                  console.log('[DeAPI Proxy] Request body:', body);
                  console.log('[DeAPI Proxy] API Key (first 20 chars):', deapiKey.substring(0, 20) + '...');
                  const endpointPath = deapiImagePath.startsWith('/') ? deapiImagePath : `/${deapiImagePath}`;
                  const deapiUrl = new URL(endpointPath, deapiBase).toString();
                  console.log('[DeAPI Proxy] Using endpoint:', deapiUrl);

                  // Try Authorization header first, then X-API-Key, on the same path
                  const tryConfigs: Array<Record<string, string>> = [
                    { Authorization: `Bearer ${deapiKey}` },
                    { 'X-API-Key': deapiKey },
                  ];

                  let upstream: Response | null = null;
                  for (const authHeader of tryConfigs) {
                    const headers: Record<string, string> = {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json',
                      ...authHeader,
                    };
                    console.log('[DeAPI Proxy] Attempt with headers:', Object.keys(headers));
                    const resp = await fetch(deapiUrl, {
                      method: 'POST',
                      headers,
                      body: JSON.stringify(body),
                    });
                    console.log('[DeAPI Proxy] Response status:', resp.status);
                    if (resp.status !== 404) {
                      upstream = resp;
                      break;
                    }
                  }

                  if (!upstream) {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ message: `The route ${endpointPath} could not be found.` }));
                    return;
                  }

                  const text = await upstream.text();
                  res.statusCode = upstream.status;
                  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
                  res.end(text);
                } catch (e: any) {
                  console.error('[DeAPI Proxy] Error:', e);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: e?.message || 'Proxy error' }));
                }
              });
        },
      },
    ],
    define: {
      // Vite replaces 'process.env.API_KEY' with the actual string in the final bundle
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.SORA_API_KEY': JSON.stringify(soraKey),
      'process.env.KLINGAI_API_KEY': JSON.stringify(klingaiKey),
      'process.env.ELEVENLABS_API_KEY': JSON.stringify(elevenlabsKey),
      'process.env.SEEDREAM_API_KEY': JSON.stringify(seedreamKey),
      'process.env.SEEDREAM_MODEL': JSON.stringify(process.env.SEEDREAM_MODEL || env.SEEDREAM_MODEL || ''),
      'process.env.VITE_DEAPI_API_KEY': JSON.stringify(deapiKey),
      'process.env.VITE_DEAPI_API_BASE': JSON.stringify(deapiBase),
      'process.env.VITE_DEAPI_MODEL': JSON.stringify(deapiModel),
      'process.env.VITE_DEAPI_IMAGE_PATH': JSON.stringify(deapiImagePath),
      'process.env.VITE_RUNWARE_API_KEY': JSON.stringify(runwareKey),
      'process.env.VITE_RUNWARE_API_BASE': JSON.stringify(runwareBase),
      'process.env.VITE_RUNWARE_IMAGE_PATH': JSON.stringify(runwareImagePath),
      'process.env.VITE_RUNWARE_TASK_TYPE': JSON.stringify(runwareTaskType),
      'process.env.VITE_RUNWARE_MODEL': JSON.stringify(runwareModel)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      target: 'esnext'
    },
    server: {
      port: 3000
    }
  };
});
