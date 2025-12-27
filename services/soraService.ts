// Sora video generation client (HTTP fetch based)
// Expects environment variable SORA_API_KEY (preferred) and optional SORA_API_BASE
// Example payload shape provided by user docs.

type SoraRequest = {
  model: string;
  prompt: string;
  seconds?: number;
  size?: string;
  input_reference?: string; // URL or base64 data URL
};

export async function generateVideoWithSora(body: SoraRequest): Promise<string> {
  // Always call local proxy in browser to avoid CORS and hide keys
  const base = '/api/sora';

  const res = await fetch(base, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Sora request failed with status ${res.status}`);
  }

  const data = await res.json();
  // Expect either a direct video URL or an operation ID. Prefer url if present.
  const videoUrl = data.url || data.video_url || data.video || data.downloadUrl;
  if (videoUrl) return videoUrl as string;

  // If operation-based, backend should manage polling; front just returns initial data

  throw new Error('Sora response missing video URL.');
}
