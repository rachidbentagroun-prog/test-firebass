/**
 * Bytedance Seedance Pro 1.0 - Usage Examples
 * 
 * This file demonstrates how to use the Seedance Pro 1.0 API for:
 * - Text-to-video generation
 * - Image-to-video generation
 * - Task querying and polling
 */

import { generateVideoWithSeedance, querySeedanceTask, pollSeedanceTask } from '../services/seedanceService';

// Example 1: Simple Text-to-Video
export async function textToVideoExample() {
  try {
    const videoUrl = await generateVideoWithSeedance({
      model: 'seedance-1-0-pro-250528',
      prompt: 'A serene sunset over the ocean with gentle waves',
      resolution: '1080p',
      duration: 5,
      fps: 30
    });
    
    console.log('Generated video URL:', videoUrl);
    return videoUrl;
  } catch (error) {
    console.error('Text-to-video generation failed:', error);
    throw error;
  }
}

// Example 2: Image-to-Video with Legacy Format
export async function imageToVideoLegacy() {
  try {
    const videoUrl = await generateVideoWithSeedance({
      model: 'seedance-1-0-pro-250528',
      prompt: 'At breakneck speed, drones thread through intricate obstacles or stunning natural wonders',
      image_url: 'https://ark-doc.tos-ap-southeast-1.bytepluses.com/seepro_i2v%20.png',
      resolution: '1080p',
      duration: 5,
      fps: 30
    });
    
    console.log('Generated video URL:', videoUrl);
    return videoUrl;
  } catch (error) {
    console.error('Image-to-video generation failed:', error);
    throw error;
  }
}

// Example 3: Image-to-Video with New Content Array Format
export async function imageToVideoNew() {
  try {
    const videoUrl = await generateVideoWithSeedance({
      model: 'seedance-1-0-pro-250528',
      content: [
        {
          type: 'text',
          text: 'At breakneck speed, drones thread through intricate obstacles or stunning natural wonders, delivering an immersive, heart-pounding flying experience. --resolution 1080p --duration 5 --camerafixed false'
        },
        {
          type: 'image_url',
          image_url: {
            url: 'https://ark-doc.tos-ap-southeast-1.bytepluses.com/seepro_i2v%20.png'
          }
        }
      ]
    });
    
    console.log('Generated video URL:', videoUrl);
    return videoUrl;
  } catch (error) {
    console.error('Image-to-video generation failed:', error);
    throw error;
  }
}

// Example 4: Advanced Text-to-Video with Custom Parameters
export async function advancedTextToVideo() {
  try {
    const videoUrl = await generateVideoWithSeedance({
      model: 'seedance-1-0-pro-250528',
      prompt: 'A futuristic city at night with neon lights and flying cars',
      resolution: '4k',
      duration: 10,
      fps: 60,
      quality: 'ultra',
      aspect_ratio: '16:9',
      motion_strength: 0.8,
      cfg_scale: 7.5,
      seed: 42
    });
    
    console.log('Generated video URL:', videoUrl);
    return videoUrl;
  } catch (error) {
    console.error('Advanced video generation failed:', error);
    throw error;
  }
}

// Example 5: Image-to-Video with Negative Prompt
export async function imageToVideoWithNegativePrompt() {
  try {
    const videoUrl = await generateVideoWithSeedance({
      model: 'seedance-1-0-pro-250528',
      content: [
        {
          type: 'text',
          text: 'Smooth camera movement through a beautiful garden with blooming flowers --resolution 1080p --duration 5'
        },
        {
          type: 'image_url',
          image_url: {
            url: 'https://example.com/garden-image.jpg'
          }
        }
      ]
    });
    
    console.log('Generated video URL:', videoUrl);
    return videoUrl;
  } catch (error) {
    console.error('Image-to-video with negative prompt failed:', error);
    throw error;
  }
}

// Example 6: Quick Text-to-Video with Minimal Parameters
export async function quickVideo() {
  try {
    const videoUrl = await generateVideoWithSeedance({
      model: 'seedance-1-0-pro-250528',
      prompt: 'A bird flying across a blue sky',
      duration: 5
    });
    
    console.log('Generated video URL:', videoUrl);
    return videoUrl;
  } catch (error) {
    console.error('Quick video generation failed:', error);
    throw error;
  }
}

/**
 * Usage in React Components:
 * 
 * import { textToVideoExample, imageToVideoNew } from './examples/seedance-pro-example';
 * 
 * const handleGenerate = async () => {
 *   setLoading(true);
 *   try {
 *     const videoUrl = await imageToVideoNew();
 *     setVideoUrl(videoUrl);
 *   } catch (error) {
 *     console.error('Generation failed:', error);
 *   } finally {
 *     setLoading(false);
 *   }
 * };
 */

// Example 7: Manual Task Creation and Polling
export async function manualTaskPolling() {
  try {
    // Step 1: Create a task manually
    const response = await fetch('/api/seedance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'seedance-1-0-pro-250528',
        content: [
          {
            type: 'text',
            text: 'Beautiful sunrise over mountains --resolution 1080p --duration 5'
          }
        ]
      })
    });
    
    const data = await response.json();
    const taskId = data.id || data.task_id;
    
    console.log('Task created:', taskId);
    
    // Step 2: Query task status once
    const status = await querySeedanceTask(taskId);
    console.log('Task status:', status.status);
    
    // Step 3: Poll until completion (custom settings: 120 attempts × 3 seconds)
    const videoUrl = await pollSeedanceTask(taskId, 120, 3000);
    
    console.log('Video ready:', videoUrl);
    return videoUrl;
  } catch (error) {
    console.error('Manual task polling failed:', error);
    throw error;
  }
}

// Example 8: Check Task Status Without Polling
export async function checkTaskStatus(taskId: string) {
  try {
    const status = await querySeedanceTask(taskId);
    
    console.log('Task ID:', taskId);
    console.log('Status:', status.status);
    
    if (status.status === 'completed') {
      const videoUrl = status.video_url || status.url || status.result?.video_url;
      console.log('Video URL:', videoUrl);
      return videoUrl;
    }
    
    if (status.status === 'failed') {
      console.error('Task failed:', status.error || status.message);
      throw new Error(status.error || 'Task failed');
    }
    
    console.log('Task still processing...');
    return null;
  } catch (error) {
    console.error('Failed to check task status:', error);
    throw error;
  }
}

// Example 9: Automatic Async Generation (Recommended)
export async function automaticAsyncGeneration() {
  try {
    // The service automatically handles task creation and polling
    console.log('Starting video generation...');
    
    const videoUrl = await generateVideoWithSeedance({
      model: 'seedance-1-0-pro-250528',
      prompt: 'Cinematic shot of a sunset beach with waves',
      resolution: '1080p',
      duration: 5
    });
    
    // This will only return once the video is ready
    console.log('Video generation complete:', videoUrl);
    return videoUrl;
  } catch (error) {
    console.error('Automatic generation failed:', error);
    throw error;
  }
}
