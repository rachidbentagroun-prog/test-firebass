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
  const apiKey = process.env.SORA_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === '""' || apiKey === 'undefined') {
    throw new Error('SORA_API_KEY is missing. Set it in your environment.');
  }

  const base = process.env.SORA_API_BASE || 'https://api.sora.com/v1/videos';

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
    throw new Error(text || `Sora request failed with status ${res.status}`);
  }

  const data = await res.json();
  // Expect either a direct video URL or an operation ID. Prefer url if present.
  const videoUrl = data.url || data.video_url || data.video || data.downloadUrl;
  if (videoUrl) return videoUrl as string;

  // If operation-based, attempt a single follow-up poll if provided
  if (data.operation_id || data.id) {
    const opId = data.operation_id || data.id;
    const statusUrl = `${base}/${opId}`;
    const statusRes = await fetch(statusUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    if (!statusRes.ok) {
      const t = await statusRes.text().catch(() => '');
      throw new Error(t || `Sora status check failed with ${statusRes.status}`);
    }
    const statusData = await statusRes.json();
    const readyUrl = statusData.url || statusData.video_url || statusData.video || statusData.downloadUrl;
    if (readyUrl) return readyUrl as string;
    throw new Error('Sora video not ready yet. Please retry later.');
  }

  throw new Error('Sora response missing video URL.');
}
