// KlingAI video generation client (HTTP fetch based)
// Expects environment variable KLINGAI_API_KEY and optional KLINGAI_API_BASE

type KlingAIRequest = {
  model?: string;
  prompt: string;
  aspect_ratio?: string; // "16:9" | "9:16" | "1:1"
  duration?: number; // 5 or 10 seconds
  image_url?: string; // For image-to-video mode
  mode?: 'standard' | 'pro';
};

export async function generateVideoWithKlingAI(body: KlingAIRequest): Promise<string> {
  // Always call local proxy in browser to avoid CORS and hide keys
  const base = '/api/klingai';

  const res = await fetch(base, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `KlingAI request failed with status ${res.status}`);
  }

  const data = await res.json();
  
  // KlingAI may return task_id for async processing or direct video URL
  const videoUrl = data.video_url || data.url || data.result?.video_url;
  
  if (videoUrl) return videoUrl as string;

  // If task-based, backend should manage polling; front just returns initial data

  throw new Error('KlingAI response missing video URL.');
}
