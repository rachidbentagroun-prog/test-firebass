// ByteDance Seedream 4.x image generation client
// Expects environment variable SEEDREAM_API_KEY and optional SEEDREAM_API_BASE

type SeedreamImageRequest = {
  model?: string; // provided via UI or env; optional
  prompt: string;
  negative_prompt?: string;
  aspect_ratio?: string; // "1:1" | "16:9" | "9:16" | "4:3" | "3:4"
  image_count?: number;
  image_url?: string; // For image-to-image mode
  resolution?: string; // e.g., "512x512", "768x768", "1024x1024"
  size?: string; // e.g., "2K", "4K" (ByteDance sample uses size)
  sequential_image_generation?: 'enabled' | 'disabled';
  response_format?: 'url' | 'b64_json';
  stream?: boolean;
  watermark?: boolean;
  quality?: 'standard' | 'high' | 'ultra';
  guidance?: number; // cfg scale 1-20
  seed?: number; // optional deterministic seed
};

function extractImageUrl(data: any): string | undefined {
  return (
    data?.image_url ||
    data?.url ||
    data?.result?.image_url ||
    data?.result?.url ||
    (Array.isArray(data?.images) && (data.images[0]?.url || data.images[0])) ||
    (Array.isArray(data?.data) && data.data[0]?.url) ||
    data?.downloadUrl ||
    data?.data?.image_url ||
    data?.data?.url ||
    data?.data?.result?.url ||
    data?.data?.result?.image_url
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
  const model40Env = (process as any)?.env?.SEEDREAM_MODEL_40;
  // Default model if not specified (console lists Seedream-4.5; sample shows seedream-4-5-251128)
  const defaultModel = 'seedream-4-5-251128';

  // Normalize aliases and ensure canonical IDs for 4.5 and 4.0
  const resolvedModelRaw = body.model || modelEnv || defaultModel;
  const aliasMap: Record<string, string> = {
    'sd-4.5': 'seedream-4.5',
    'sd-4-5': 'seedream-4.5',
    'seedream-4-5': 'seedream-4.5',
    'seedream-4.5': 'seedream-4.5',
    'seedream-4-5-251128': 'seedream-4-5-251128',
    'seedream-4.5-251128': 'seedream-4-5-251128',
    'sd-4.0': model40Env || 'seedream-4-0-250828',
    'sd-4-0': model40Env || 'seedream-4-0-250828',
    'seedream-4-0': model40Env || 'seedream-4-0-250828',
    'seedream-4.0': model40Env || 'seedream-4-0-250828',
    'seedream-4-0-250828': 'seedream-4-0-250828',
    'seedream-4.0-250828': 'seedream-4-0-250828',
  };
  const resolvedModel = aliasMap[resolvedModelRaw] || resolvedModelRaw;
  
  const requestBody: Record<string, any> = {
    model: resolvedModel,
    prompt: body.prompt,
    negative_prompt: body.negative_prompt,
    aspect_ratio: body.aspect_ratio,
    image_count: body.image_count || 1,
    image_url: body.image_url,
    resolution: body.resolution,
    size: body.size,
    quality: body.quality,
    cfg_scale: body.guidance,
    seed: body.seed,
    sequential_image_generation: body.sequential_image_generation,
    response_format: body.response_format || 'url',
    stream: body.stream ?? false,
    watermark: body.watermark ?? true,
  }

  // Call local proxy to avoid CORS and hide keys
  const doRequest = async (bodyToSend: Record<string, any>) => {
    return fetch('/api/seedream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(bodyToSend),
    });
  };

  let res = await doRequest(requestBody);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    // Auto-fallback: if 4.0 endpoint not found, retry with 4.5 build
    const isNotFound = res.status === 404 || (text && text.toLowerCase().includes('notfound'));
    const targets40 = String(requestBody.model || '').includes('4.0');
    if (isNotFound && targets40) {
      console.warn('[Seedream] 4.0 model not found; retrying with seedream-4-5-251128');
      const fallbackBody = { ...requestBody, model: 'seedream-4-5-251128' };
      res = await doRequest(fallbackBody);
      if (!res.ok) {
        const text2 = await res.text().catch(() => '');
        throw new Error(text2 || `Seedream fallback request failed with status ${res.status}`);
      }
    } else {
      throw new Error(text || `Seedream image request failed with status ${res.status}`);
    }
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

  // Log the full response for debugging
  console.log('[Seedream] Full API response:', JSON.stringify(data, null, 2));

  // If an image URL is returned, fetch and convert to Data URL
  const imageUrl = extractImageUrl(data);
  const base64Data: string | undefined = data?.imageBase64 || data?.image_base64 || data?.base64 || data?.b64_json || data?.data?.b64_json;

  if (imageUrl) {
    console.log('[Seedream] Found image URL:', imageUrl);
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
    console.log('[Seedream] Found base64 data');
    return `data:image/png;base64,${base64Data}`;
  }

  // If task-based response with id is returned, attempt a single status poll
  const taskId = data?.task_id || data?.id || data?.data?.id || data?.data?.task_id;
  const base = '/api/seedream';
  if (taskId) {
    console.log('[Seedream] Task-based generation detected, task ID:', taskId);
    await new Promise(resolve => setTimeout(resolve, 3000));
    const statusRes = await fetch(`${base}/${taskId}`, { method: 'GET' });
    const statusText = await statusRes.text().catch(() => '');
    let statusData: any = {};
    try { statusData = statusText ? JSON.parse(statusText) : {}; } catch {}
    console.log('[Seedream] Task status response:', JSON.stringify(statusData, null, 2));
    const readyUrl = extractImageUrl(statusData);
    const readyBase64 = statusData?.imageBase64 || statusData?.base64 || statusData?.b64_json || statusData?.data?.b64_json;
    if (readyUrl) {
      console.log('[Seedream] Task complete, found image URL:', readyUrl);
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
    if (readyBase64) {
      console.log('[Seedream] Task complete, found base64 data');
      return `data:image/png;base64,${readyBase64}`;
    }
    console.error('[Seedream] Task response missing image data. Response keys:', Object.keys(statusData));
    return `Task ID: ${taskId} - Image is being generated. Please check back in a moment.`;
  }

  console.error('[Seedream] Response missing all expected fields. Response structure:', {
    hasImageUrl: !!imageUrl,
    hasBase64: !!base64Data,
    hasTaskId: !!taskId,
    topLevelKeys: Object.keys(data),
    dataKeys: data?.data ? Object.keys(data.data) : 'no data object'
  });
  throw new Error('Seedream response missing image URL or base64 data. Response: ' + JSON.stringify(data).substring(0, 200));
}
