/**
 * Runware.ai Image Generation Service
 * Documentation: https://runware.ai/docs/en/getting-started/how-to-connect
 */

interface RunwareImageRequest {
  prompt: string;
  negative_prompt?: string;
  negativePrompt?: string;
  aspect_ratio?: string;
  image_count?: number;
  image_url?: string;
}

/**
 * Generate a UUIDv4 string
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate an image using Runware.ai via local proxy
 * Returns a data URL string
 */
export async function generateImageWithRunware(request: RunwareImageRequest): Promise<string> {
  try {
    console.log('[Runware Service] Starting image generation:', request);

    // Prepare request body with common fields
    const body: Record<string, any> = {
      prompt: request.prompt,
      text: request.prompt,
    };

    // Derive width/height from aspect ratio (default 512x512)
    // Runware requires multiples of 64, between 128 and 2048
    const roundTo64 = (val: number) => Math.round(val / 64) * 64;
    const clamp = (val: number) => Math.max(128, Math.min(2048, val));
    
    if (request.aspect_ratio && request.aspect_ratio.includes(':')) {
      const [w, h] = request.aspect_ratio.split(':').map(Number);
      if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
        body.width = clamp(roundTo64(512 * w));
        body.height = clamp(roundTo64(512 * h));
      }
    }
    if (!body.width || !body.height) {
      body.width = 512;
      body.height = 512;
    }

    console.log('[Runware Service] Calling proxy /api/runware');
    // Runware requires the payload to be an array of request objects
    const taskTypeEnv = (process as any)?.env?.VITE_RUNWARE_TASK_TYPE;
    const modelEnv = (process as any)?.env?.VITE_RUNWARE_MODEL || 'civitai:38784@44716';
    const taskPayload: Record<string, any> = {
      taskType: taskTypeEnv || 'imageInference',
      taskUUID: generateUUID(),
      model: modelEnv,
      positivePrompt: body.prompt,
      width: body.width,
      height: body.height,
    };
    
    const negative = request.negative_prompt || request.negativePrompt;
    if (negative) {
      taskPayload.negativePrompt = negative;
    }

    if (request.image_count) {
      taskPayload.numberResults = request.image_count;
    }
    if (request.image_url) {
      taskPayload.inputImage = request.image_url;
    }
    const resp = await fetch('/api/runware', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify([taskPayload]),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('[Runware Service] API error:', resp.status, errorText);
      if (resp.status === 401) {
        throw new Error('Invalid Runware.ai API key. Set VITE_RUNWARE_API_KEY and restart dev server.');
      } else if (resp.status === 404) {
        throw new Error('Runware endpoint path not found. Set VITE_RUNWARE_IMAGE_PATH from docs and restart dev server.');
      }
      throw new Error(`Runware.ai API error: ${resp.status} - ${errorText}`);
    }

    const data = await resp.json();
    console.log('[Runware Service] Proxy response:', data);

    // If the API returns an array, use the first item
    const first = Array.isArray(data) ? data[0] : data;

    // Runware returns imageURL in the response data
    const imageUrl: string | undefined =
      first?.imageURL ||
      (Array.isArray(first?.images) && (first.images[0]?.url || first.images[0])) ||
      (Array.isArray(first?.data) && first.data[0]?.imageURL) ||
      first?.url || first?.image_url || first?.image;
    const base64Data: string | undefined = first?.imageBase64 || first?.image_base64 || first?.base64 || first?.b64_json;

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

    throw new Error('Runware.ai did not return any image URL or base64 data');
  } catch (e: any) {
    console.error('[Runware Service] Error generating image:', e);
    throw new Error(e?.message || 'Failed to generate image with Runware.ai');
  }
}
