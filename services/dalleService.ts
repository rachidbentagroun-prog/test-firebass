interface Dalle3Request {
  prompt: string;
  size?: '1024x1024';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  negativePrompt?: string;
}

/**
 * Generate an image with DALL·E 3 through a backend proxy endpoint `/api/dalle3`.
 * The proxy should inject the OPENAI_API_KEY securely server-side.
 * Returns a data URL string (base64 PNG by default).
 */
export async function generateImageWithDalle3(request: Dalle3Request): Promise<string> {
  const body: Record<string, any> = {
    model: 'dall-e-3',
    prompt: request.prompt,
    size: request.size || '1024x1024',
    quality: request.quality || 'standard',
    style: request.style || 'vivid',
  };

  // Softly handle negative prompts by appending guidance text
  if (request.negativePrompt) {
    body.prompt = `${request.prompt}\nAvoid: ${request.negativePrompt}`;
  }

  const resp = await fetch('/api/dalle3', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    if (resp.status === 401) {
      throw new Error('DALL·E 3 API key missing or invalid on backend proxy.');
    }
    throw new Error(`DALL·E 3 request failed: ${resp.status} ${errorText}`);
  }

  const data = await resp.json();
  const base64 = data?.data?.[0]?.b64_json || data?.b64_json;
  const url = data?.data?.[0]?.url || data?.url;

  if (base64) return `data:image/png;base64,${base64}`;
  if (url) {
    const imageResponse = await fetch(url);
    if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    const blob = await imageResponse.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert image to data URL'));
      reader.readAsDataURL(blob);
    });
  }

  throw new Error('DALL·E 3 response missing image payload.');
}
