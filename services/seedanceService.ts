// ByteDance Seedance 1.0 Pro video generation client
// Expects environment variable SEEDANCE_API_KEY and optional SEEDANCE_API_BASE
// API Documentation: https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks

type SeedanceContentItem = {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
};

type SeedanceRequest = {
  model: string; // 'seedance-1-0-pro-250528'
  content?: SeedanceContentItem[]; // New format: array of content items
  prompt?: string; // Deprecated: use content array instead
  aspect_ratio?: string; // "16:9" | "9:16" | "1:1"
  resolution?: string; // "720p" | "1080p" | "4k"
  duration?: number; // Duration in seconds (5, 10, 15, 60)
  quality?: string; // "standard" | "high" | "ultra"
  fps?: number; // Frames per second (24, 30, 60)
  image_url?: string; // Deprecated: use content array instead
  negative_prompt?: string; // What to avoid in the video
  seed?: number; // For reproducible results
  cfg_scale?: number; // Creativity vs prompt adherence (1-20)
  motion_strength?: number; // Motion intensity (0-1)
};

type SeedanceTaskStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'success'
  | 'succeeded'
  | 'finished'
  | 'failed'
  | 'error';

type SeedanceTaskResponse = {
  id: string;
  status: SeedanceTaskStatus;
  video_url?: string;
  url?: string;
  task_result?: {
    video_url?: string;
    url?: string;
  };
  result?: {
    video_url?: string;
    url?: string;
  };
  data?: {
    video_url?: string;
    url?: string;
    task_result?: {
      video_url?: string;
      url?: string;
    };
  };
  error?: string;
  message?: string;
  code?: string;
};

function normalizeMessage(value: any): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch (e) {
    return String(value);
  }
}

/**
 * Query the status of a Seedance task
 * @param taskId The task ID returned from generateVideoWithSeedance
 * @returns Task status and video URL if completed
 */
export async function querySeedanceTask(taskId: string): Promise<SeedanceTaskResponse> {
  const base = `/api/seedance/${taskId}`;

  try {
    const res = await fetch(base, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const text = await res.text().catch(() => '');

    if (!res.ok) {
      console.error(`[Seedance Query] Failed to query task ${taskId}: ${res.status}`, text);
      throw new Error(text || `Failed to query Seedance task with status ${res.status}`);
    }

    try {
      const data = text ? JSON.parse(text) : {};
      return data as SeedanceTaskResponse;
    } catch (parseErr) {
      console.error('[Seedance Query] Failed to parse JSON:', parseErr, 'raw:', text);
      throw parseErr;
    }
  } catch (error) {
    console.error(`[Seedance Query] Error querying task ${taskId}:`, error);
    throw error;
  }
}

/**
 * Poll a Seedance task until completion or timeout
 * @param taskId The task ID to poll
 * @param maxAttempts Maximum number of polling attempts (default: 120 for 10 minutes)
 * @param intervalMs Polling interval in milliseconds (default: 5000)
 * @returns Video URL when task completes
 */
export async function pollSeedanceTask(
  taskId: string,
  maxAttempts: number = 120,
  intervalMs: number = 5000
): Promise<string> {
  console.log(`[Seedance Polling] Starting to poll task ${taskId}. Max attempts: ${maxAttempts}, interval: ${intervalMs}ms`);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const taskStatus = await querySeedanceTask(taskId);
      
      console.log(`[Seedance Polling] Attempt ${attempt + 1}/${maxAttempts}: Status = ${taskStatus.status}`, taskStatus);

      if (
        taskStatus.status === 'completed' ||
        taskStatus.status === 'success' ||
        taskStatus.status === 'succeeded' ||
        taskStatus.status === 'finished'
      ) {
        // Log the full response structure to help debug
        console.log(`[Seedance Polling] Task completed! Full response:`, JSON.stringify(taskStatus, null, 2));
        
        // Try all possible locations for the video URL
        const videoUrl = 
          taskStatus.video_url || 
          taskStatus.url || 
          taskStatus.task_result?.video_url ||
          taskStatus.task_result?.url ||
          taskStatus.result?.video_url || 
          taskStatus.result?.url ||
          taskStatus.data?.task_result?.video_url ||
          taskStatus.data?.task_result?.url ||
          taskStatus.data?.video_url ||
          taskStatus.data?.url ||
          // Additional possible locations
          taskStatus.output?.video_url ||
          taskStatus.output?.url ||
          taskStatus.outputs?.[0]?.video_url ||
          taskStatus.outputs?.[0]?.url ||
          taskStatus.content?.video_url ||
          taskStatus.content?.url ||
          taskStatus.contents?.[0]?.video_url ||
          taskStatus.contents?.[0]?.url ||
          taskStatus.generation_result?.video_url ||
          taskStatus.generation_result?.url ||
          taskStatus.data?.output?.video_url ||
          taskStatus.data?.output?.url ||
          taskStatus.data?.outputs?.[0]?.video_url ||
          taskStatus.data?.outputs?.[0]?.url ||
          taskStatus.data?.content?.video_url ||
          taskStatus.data?.content?.url ||
          taskStatus.data?.contents?.[0]?.video_url ||
          taskStatus.data?.contents?.[0]?.url;

        if (videoUrl) {
          console.log(`[Seedance Polling] Task completed successfully! Video URL: ${videoUrl}`);
          return videoUrl;
        }
        
        // Log what we actually received to help debug
        console.error('[Seedance Polling] Task completed but no video URL found. Response structure:', {
          hasVideoUrl: !!taskStatus.video_url,
          hasUrl: !!taskStatus.url,
          hasTaskResult: !!taskStatus.task_result,
          hasResult: !!taskStatus.result,
          hasData: !!taskStatus.data,
          hasOutput: !!taskStatus.output,
          hasOutputs: !!taskStatus.outputs,
          hasContent: !!taskStatus.content,
          hasContents: !!taskStatus.contents,
          allKeys: Object.keys(taskStatus),
          fullResponse: taskStatus
        });
        throw new Error('Task completed but no video URL found in response');
      }

      if (taskStatus.status === 'failed' || taskStatus.status === 'error') {
        const errorMsg =
          normalizeMessage(taskStatus.error) ||
          normalizeMessage(taskStatus.message) ||
          normalizeMessage(taskStatus.code) ||
          'Task failed for unknown reason';
        console.error(`[Seedance Polling] Task failed: ${errorMsg}`);
        throw new Error(`Seedance task failed: ${errorMsg}`);
      }

      // Task is still processing, wait before next poll
      if (attempt < maxAttempts - 1) {
        console.log(`[Seedance Polling] Task still processing, waiting ${intervalMs}ms before next poll...`);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    } catch (error) {
      console.error(`[Seedance Polling] Error on attempt ${attempt + 1}:`, error);
      
      // If it's a network/fetch error, retry. If it's a task error, fail immediately
      if (error instanceof Error && error.message.includes('Task')) {
        throw error;
      }
      
      // Wait before retrying on network errors
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      } else {
        throw error;
      }
    }
  }

  throw new Error(`Task polling timeout after ${maxAttempts * intervalMs / 1000}s - video generation took too long. This may be normal for longer videos. Please check task status manually.`);
}

export async function generateVideoWithSeedance(body: SeedanceRequest): Promise<string> {
  // Always call local proxy in browser to avoid CORS and hide keys
  const base = '/api/seedance';

  // ByteDance Seedance API requires the content array format
  let requestBody: any = {
    model: body.model || 'seedance-1-0-pro-250528',
  };
  
  // Build content array (required by ByteDance API)
  const content: SeedanceContentItem[] = [];
  
  // If content array is provided directly, use it
  if (body.content && Array.isArray(body.content)) {
    content.push(...body.content);
  } else {
    // Otherwise, convert legacy format to content array
    let textContent = body.prompt || '';
    
    // Embed parameters in the text content as per ByteDance format
    if (body.resolution) textContent += ` --resolution ${body.resolution}`;
    if (body.duration) textContent += ` --duration ${body.duration}`;
    if (body.fps) textContent += ` --fps ${body.fps}`;
    if (body.aspect_ratio) textContent += ` --aspect_ratio ${body.aspect_ratio}`;
    if (body.quality) textContent += ` --quality ${body.quality}`;
    if (body.negative_prompt) textContent += ` --negative_prompt ${body.negative_prompt}`;
    if (body.seed !== undefined) textContent += ` --seed ${body.seed}`;
    if (body.cfg_scale !== undefined) textContent += ` --cfg_scale ${body.cfg_scale}`;
    if (body.motion_strength !== undefined) textContent += ` --motion_strength ${body.motion_strength}`;
    
    if (textContent.trim()) {
      content.push({
        type: 'text',
        text: textContent.trim()
      });
    }
    
    // Add image_url if provided
    if (body.image_url) {
      content.push({
        type: 'image_url',
        image_url: {
          url: body.image_url
        }
      });
    }
  }
  
  // Content array is required
  if (content.length === 0) {
    throw new Error('At least one content item (text or image_url) is required');
  }
  
  requestBody.content = content;

  console.log('[Seedance] Creating task with request:', requestBody);

  const res = await fetch(base, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[Seedance] Task creation failed:', res.status, text);
    throw new Error(text || `ByteDance Seedance request failed with status ${res.status}`);
  }

  const rawText = await res.text();
  let data: any = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch (e) {
    console.error('[Seedance] Failed to parse creation response JSON:', e, 'raw:', rawText);
    throw new Error('Failed to parse Seedance response');
  }
  console.log('[Seedance] Task creation response:', data);
  
  // Check if response contains a task ID (async processing)
  const taskId = data.id || data.task_id || data.taskId || data.data?.id;
  if (taskId) {
    console.log(`[Seedance] Task created successfully! ID: ${taskId}`);
    console.log('[Seedance] Starting polling for video generation...');
    // Poll the task until completion with increased timeout (10 minutes)
    return await pollSeedanceTask(taskId, 120, 5000);
  }
  
  // Check if video URL is directly available (sync processing)
  const videoUrl =
    data.video_url ||
    data.url ||
    data.task_result?.video_url ||
    data.result?.video_url ||
    data.downloadUrl ||
    data.data?.task_result?.video_url ||
    data.data?.video_url;
  if (videoUrl) {
    console.log('[Seedance] Video URL received directly:', videoUrl);
    return videoUrl as string;
  }

  // Neither task ID nor video URL found
  console.error('[Seedance] Response missing task ID and video URL:', data);
  throw new Error('ByteDance Seedance response missing both task ID and video URL. Response: ' + JSON.stringify(data));
}
