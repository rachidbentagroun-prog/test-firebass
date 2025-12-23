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
  const apiKey = process.env.KLINGAI_API_KEY;
  if (!apiKey || apiKey === '""' || apiKey === 'undefined') {
    throw new Error('KLINGAI_API_KEY is missing. Set it in your environment.');
  }

  const base = process.env.KLINGAI_API_BASE || 'https://api.klingai.com/v1/videos/text2video';

  const res = await fetch(base, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
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

  // If task-based, attempt a single follow-up poll if provided
  if (data.task_id || data.id) {
    const taskId = data.task_id || data.id;
    const statusUrl = `https://api.klingai.com/v1/videos/text2video/${taskId}`;
    
    // Wait a moment before checking status
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const statusRes = await fetch(statusUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    if (!statusRes.ok) {
      const t = await statusRes.text().catch(() => '');
      throw new Error(t || `KlingAI status check failed with ${statusRes.status}`);
    }
    
    const statusData = await statusRes.json();
    const readyUrl = statusData.video_url || statusData.url || statusData.result?.video_url;
    
    if (readyUrl) return readyUrl as string;
    
    // Return task ID for user to check later
    return `Task ID: ${taskId} - Video is being generated. Please check back in a few minutes.`;
  }

  throw new Error('KlingAI response missing video URL.');
}
