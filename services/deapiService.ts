/**
 * DeAPI.ai Image Generation Service
 * Documentation: https://deapi.ai/docs
 */

interface DeAPIImageRequest {
  prompt: string;
  negative_prompt?: string;
  negativePrompt?: string;
  aspect_ratio?: string;
  mode?: 'standard' | 'pro';
  image_count?: number;
  image_url?: string;
}

/**
 * Generate an image using DeAPI.ai
 * @param request - Image generation request parameters
 * @returns Data URL of the generated image
 */
export async function generateImageWithDeAPI(request: DeAPIImageRequest): Promise<string> {
  try {
    console.log('[DeAPI Service] Starting image generation:', request);

    // Prepare the request body for DEAPI.ai
    // DEAPI expects: prompt, and optionally width, height, num_images, etc
    const requestBody: Record<string, any> = {
      prompt: request.prompt,
      // Some providers use 'text' instead of 'prompt'
      text: request.prompt,
    };

    // Add optional fields
    const negative = request.negative_prompt || request.negativePrompt;
    if (negative) {
      requestBody.negative_prompt = negative;
      requestBody.negativePrompt = negative;
    }

    if (request.aspect_ratio && request.aspect_ratio !== '1:1') {
      // Convert aspect_ratio to width/height if needed
      const [w, h] = request.aspect_ratio.split(':').map(Number);
      if (!isNaN(w) && !isNaN(h)) {
        requestBody.width = 512 * w;  // Base size 512
        requestBody.height = 512 * h;
      }
    } else {
      requestBody.width = 512;
      requestBody.height = 512;
    }
    // Also provide size as a single string when required
    requestBody.size = `${requestBody.width}x${requestBody.height}`;
    
    if (request.image_count) {
      requestBody.num_images = request.image_count;
      // Alternate common naming
      requestBody.n = request.image_count;
    }
    if (request.mode) requestBody.model = request.mode;
    
    // For image-to-image if provided
    if (request.image_url) {
      requestBody.image_url = request.image_url;
    }

    console.log('[DeAPI Service] Making API request via proxy...');
    console.log('[DeAPI Service] Request body:', requestBody);

    // Always use the local proxy endpoint - auth is handled server-side
    const endpoint = '/api/deapi';

    console.log('[DeAPI Service] Using endpoint:', endpoint);

    // Make the API request to DeAPI.ai
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DeAPI Service] API error:', response.status, errorText);
      
      // Provide more helpful error messages
      if (response.status === 401) {
        throw new Error('Invalid DeAPI.ai API key. Please check your VITE_DEAPI_API_KEY configuration.');
      } else if (response.status === 404) {
        throw new Error('DeAPI endpoint path not found. Set VITE_DEAPI_IMAGE_PATH (e.g., /v1/images/generate) from https://docs.deapi.ai/api/overview and restart the dev server.');
      } else if (response.status === 429) {
        throw new Error('DeAPI.ai rate limit exceeded. Please try again later.');
      } else if (response.status === 400) {
        throw new Error(`DeAPI.ai API error: Invalid request - ${errorText}`);
      } else if (response.status >= 500) {
        throw new Error('DeAPI.ai service is currently unavailable. Please try again later.');
      } else {
        throw new Error(`DeAPI.ai API error: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('[DeAPI Service] API response received:', data);

    // Extract the image URL from the response
    // Handle multiple possible response shapes safely
    const imageUrl: string | undefined =
      (Array.isArray(data?.output) && data.output[0]) ||
      (Array.isArray(data?.images) && (data.images[0]?.url || data.images[0])) ||
      data?.url ||
      (Array.isArray(data?.data) && (data.data[0]?.url || data.data[0])) ||
      data?.result?.url ||
      data?.image_url ||
      data?.image;

    const base64Data: string | undefined =
      data?.image_base64 ||
      data?.base64 ||
      (Array.isArray(data?.data) && data.data[0]?.b64_json) ||
      data?.b64_json;

    if (imageUrl) {
      // Fetch the image and convert to base64
      console.log('[DeAPI Service] Fetching generated image from:', imageUrl);
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch generated image: ${imageResponse.status}`);
      }
      const imageBlob = await imageResponse.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          console.log('[DeAPI Service] Image converted to data URL successfully');
          resolve(dataUrl);
        };
        reader.onerror = () => {
          reject(new Error('Failed to convert image to data URL'));
        };
        reader.readAsDataURL(imageBlob);
      });
    }

    if (base64Data) {
      console.log('[DeAPI Service] Using base64 image from response');
      return `data:image/png;base64,${base64Data}`;
    }

    throw new Error('DeAPI.ai did not return any image URL or base64 data');

  } catch (error: any) {
    console.error('[DeAPI Service] Error generating image:', error);
    throw new Error(error.message || 'Failed to generate image with DeAPI.ai');
  }
}
