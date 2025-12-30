// ByteDance Seedream 4.5 image generation client
// Expects environment variable SEEDREAM_API_KEY and optional SEEDREAM_API_BASE

type SeedreamImageRequest = {
  model?: string; // provided via UI or env; optional
  prompt: string;
  negative_prompt?: string;
  aspect_ratio?: string; // "1:1" | "16:9" | "9:16" | "4:3" | "3:4"
  image_count?: number;
  image_url?: string; // For image-to-image mode
  resolution?: string; // e.g., "512x512", "768x768", "1024x1024"
  quality?: 'standard' | 'high' | 'ultra';
  guidance?: number; // cfg scale 1-20
  seed?: number; // optional deterministic seed
};

function extractImageUrl(data: any): string | undefined {
  return (
    data?.image_url ||
    data?.url ||
    data?.result?.image_url ||
    (Array.isArray(data?.images) && (data.images[0]?.url || data.images[0])) ||
    data?.downloadUrl ||
    data?.data?.image_url ||
    data?.data?.url
  );
}

/**
 * Generate an image using ByteDance Seedream 4.5 via local proxy
 * Returns a data URL string
 */
export async function generateImageWithSeedream(body: SeedreamImageRequest): Promise<string> {
  const apiKey = (process as any)?.env?.SEEDREAM_API_KEY;
  if (!apiKey || apiKey === '""' || apiKey === 'undefined') {
    throw new Error('SEEDREAM_API_KEY is missing. Set it in your environment.');
  }

  const modelEnv = (process as any)?.env?.SEEDREAM_MODEL;
  // Default model if not specified
  const defaultModel = 'sd-4.5';
  
  const requestBody: Record<string, any> = {
    model: body.model || modelEnv || defaultModel,
    prompt: body.prompt,
    negative_prompt: body.negative_prompt,
    aspect_ratio: body.aspect_ratio,
    image_count: body.image_count || 1,
    image_url: body.image_url,
    resolution: body.resolution,
    quality: body.quality,
    cfg_scale: body.guidance,
    seed: body.seed,
  }

  // Call local proxy to avoid CORS and hide keys
  const res = await fetch('/api/seedream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Seedream image request failed with status ${res.status}`);
  }

  const rawText = await res.text();
  let data: any = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch (e) {
    // Some upstreams return plain URL strings; treat raw text as URL
    if (rawText && rawText.startsWith('http')) {
      data = { url: rawText };
    } else {
      throw new Error('Failed to parse Seedream response');
    }
  }

  // If an image URL is returned, fetch and convert to Data URL
  const imageUrl = extractImageUrl(data);
  const base64Data: string | undefined = data?.imageBase64 || data?.image_base64 || data?.base64 || data?.b64_json;

  if (imageUrl) {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error(`Failed to fetch generated image: ${imageResponse.status}`);
    const imageBlob = await imageResponse.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert image to data URL'));
      reader.readAsDataURL(imageBlob);
    });
  }

  if (base64Data) {
    return `data:image/png;base64,${base64Data}`;
  }

  // If task-based response with id is returned, attempt a single status poll
  const taskId = data?.task_id || data?.id || data?.data?.id;
  const base = '/api/seedream';
  if (taskId) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const statusRes = await fetch(`${base}/${taskId}`, { method: 'GET' });
    const statusText = await statusRes.text().catch(() => '');
    let statusData: any = {};
    try { statusData = statusText ? JSON.parse(statusText) : {}; } catch {}
    const readyUrl = extractImageUrl(statusData);
    const readyBase64 = statusData?.imageBase64 || statusData?.base64 || statusData?.b64_json;
    if (readyUrl) {
      const imageResponse = await fetch(readyUrl);
      if (!imageResponse.ok) throw new Error(`Failed to fetch generated image: ${imageResponse.status}`);
      const imageBlob = await imageResponse.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to convert image to data URL'));
        reader.readAsDataURL(imageBlob);
      });
    }
    if (readyBase64) return `data:image/png;base64,${readyBase64}`;
    return `Task ID: ${taskId} - Image is being generated. Please check back in a moment.`;
  }

  throw new Error('Seedream response missing image URL or base64 data');
}
