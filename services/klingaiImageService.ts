// KlingAI image generation client (HTTP fetch based)
// Expects environment variable KLINGAI_API_KEY

type KlingAIImageRequest = {
  model?: string;
  prompt: string;
  negative_prompt?: string;
  aspect_ratio?: string; // "1:1" | "16:9" | "9:16" | "4:3" | "3:4"
  image_count?: number;
  image_url?: string; // For image-to-image mode
  mode?: 'standard' | 'pro';
};

export async function generateImageWithKlingAI(body: KlingAIImageRequest): Promise<string> {
  const apiKey = process.env.KLINGAI_API_KEY;
  if (!apiKey || apiKey === '""' || apiKey === 'undefined') {
    throw new Error('KLINGAI_API_KEY is missing. Set it in your environment.');
  }

  const endpoint = body.image_url 
    ? 'https://api.klingai.com/v1/images/image2image'
    : 'https://api.klingai.com/v1/images/text2image';

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `KlingAI image request failed with status ${res.status}`);
  }

  const data = await res.json();
  
  // KlingAI may return task_id for async processing or direct image URL
  const imageUrl = data.image_url || data.url || data.result?.image_url || data.images?.[0];
  
  if (imageUrl) return imageUrl as string;

  // If task-based, attempt a single follow-up poll if provided
  if (data.task_id || data.id) {
    const taskId = data.task_id || data.id;
    const statusUrl = `${endpoint}/${taskId}`;
    
    // Wait a moment before checking status
    await new Promise(resolve => setTimeout(resolve, 3000));
    
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
    const readyUrl = statusData.image_url || statusData.url || statusData.result?.image_url || statusData.images?.[0];
    
    if (readyUrl) return readyUrl as string;
    
    // Return task ID for user to check later
    return `Task ID: ${taskId} - Image is being generated. Please check back in a moment.`;
  }

  throw new Error('KlingAI response missing image URL.');
}
