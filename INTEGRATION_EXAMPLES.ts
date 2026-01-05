/**
 * ============================================
 * INTEGRATION EXAMPLES
 * How to integrate credit system with existing AI services
 * ============================================
 */

import { withImageCredits, withVideoCredits, withVoiceCredits, withChatCredits } from './creditWrapper';
import { auth } from './firebase';

// ============================================
// EXAMPLE 1: IMAGE GENERATION WITH DALLE-3
// ============================================

/**
 * Before: Direct API call without credit management
 */
async function generateImageOld(prompt: string) {
  const response = await fetch('/api/dalle3', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  
  const data = await response.json();
  return data.url;
}

/**
 * After: Wrapped with credit management
 */
async function generateImageNew(prompt: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  
  const result = await withImageCredits(
    user.uid,
    prompt,
    'dalle3',
    async () => {
      const response = await fetch('/api/dalle3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      const data = await response.json();
      return { url: data.url };
    }
  );
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  console.log(`✅ Image generated! Credits used: ${result.creditsUsed}, Remaining: ${result.remainingCredits}`);
  return result.data.url;
}

// ============================================
// EXAMPLE 2: VIDEO GENERATION WITH KLING AI
// ============================================

/**
 * Before: Direct service call
 */
async function generateVideoOld(prompt: string, duration: number) {
  const { generateVideo } = await import('./klingaiService');
  const video = await generateVideo(prompt, duration);
  return video;
}

/**
 * After: With credit management and progress tracking
 */
async function generateVideoNew(
  prompt: string, 
  duration: number,
  onProgress?: (progress: number) => void
) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  
  const result = await withVideoCredits(
    user.uid,
    prompt,
    'klingai',
    duration,
    async () => {
      const { generateVideo } = await import('./klingaiService');
      
      // Optional: Update progress during generation
      if (onProgress) {
        const interval = setInterval(() => {
          onProgress(Math.random() * 100); // Update with real progress
        }, 1000);
        
        try {
          const video = await generateVideo(prompt, duration);
          clearInterval(interval);
          return video;
        } catch (err) {
          clearInterval(interval);
          throw err;
        }
      } else {
        return await generateVideo(prompt, duration);
      }
    }
  );
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  console.log(`✅ Video generated! Credits: ${result.creditsUsed}, Remaining: ${result.remainingCredits}`);
  return result.data;
}

// ============================================
// EXAMPLE 3: VOICE/TTS GENERATION
// ============================================

/**
 * Before: Direct ElevenLabs call
 */
async function generateVoiceOld(text: string, voiceId: string) {
  const { generateSpeech } = await import('./elevenlabsService');
  const audio = await generateSpeech(text, voiceId);
  return audio;
}

/**
 * After: With credit calculation based on duration
 */
async function generateVoiceNew(text: string, voiceId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  
  // Estimate duration (rough calculation: ~150 words per minute)
  const words = text.split(' ').length;
  const estimatedDurationSeconds = (words / 150) * 60;
  
  const result = await withVoiceCredits(
    user.uid,
    text,
    'elevenlabs',
    estimatedDurationSeconds,
    async () => {
      const { generateSpeech } = await import('./elevenlabsService');
      return await generateSpeech(text, voiceId);
    }
  );
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  console.log(`✅ Voice generated! Duration: ${estimatedDurationSeconds}s, Credits: ${result.creditsUsed}`);
  return result.data;
}

// ============================================
// EXAMPLE 4: CHAT/GEMINI INTEGRATION
// ============================================

/**
 * Before: Direct Gemini chat
 */
async function chatWithGeminiOld(messages: any[]) {
  const { chat } = await import('./geminiService');
  const response = await chat(messages);
  return response;
}

/**
 * After: With token-based credit calculation
 */
async function chatWithGeminiNew(messages: any[]) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  
  // Estimate tokens (rough: 1 token ≈ 4 characters)
  const totalChars = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
  const estimatedTokens = Math.ceil(totalChars / 4);
  
  const lastMessage = messages[messages.length - 1]?.content || '';
  
  const result = await withChatCredits(
    user.uid,
    lastMessage,
    'gemini',
    estimatedTokens,
    async () => {
      const { chat } = await import('./geminiService');
      return await chat(messages);
    }
  );
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  console.log(`✅ Chat completed! Tokens: ~${estimatedTokens}, Credits: ${result.creditsUsed}`);
  return result.data;
}

// ============================================
// EXAMPLE 5: REACT COMPONENT INTEGRATION
// ============================================

/**
 * Example: Image Generator Component with Credit Management
 */
import React, { useState } from 'react';

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in to generate images');
        return;
      }
      
      const result = await withImageCredits(
        user.uid,
        prompt,
        'dalle3',
        async () => {
          const response = await fetch('/api/dalle3', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
          });
          
          if (!response.ok) {
            throw new Error('Generation failed');
          }
          
          const data = await response.json();
          return { url: data.url };
        }
      );
      
      if (result.success) {
        setImageUrl(result.data.url);
        setRemainingCredits(result.remainingCredits);
        alert(`✅ Image generated! ${result.remainingCredits} credits remaining`);
      } else {
        setError(result.error || 'Generation failed');
      }
      
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Generate Image</h2>
      
      {remainingCredits !== null && (
        <div className="mb-4 p-3 bg-blue-100 rounded">
          💳 Credits remaining: {remainingCredits}
        </div>
      )}
      
      <input 
        type="text"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Enter your prompt..."
        className="w-full p-3 border rounded mb-4"
      />
      
      <button 
        onClick={handleGenerate}
        disabled={loading || !prompt}
        className="px-6 py-3 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate (1 credit)'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          ❌ {error}
        </div>
      )}
      
      {imageUrl && (
        <div className="mt-6">
          <img src={imageUrl} alt="Generated" className="w-full rounded" />
        </div>
      )}
    </div>
  );
}

// ============================================
// EXAMPLE 6: BATCH PROCESSING WITH CREDITS
// ============================================

/**
 * Generate multiple images while managing credits
 */
async function generateMultipleImages(prompts: string[]) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  
  const results = [];
  let totalCreditsUsed = 0;
  
  for (const prompt of prompts) {
    try {
      const result = await withImageCredits(
        user.uid,
        prompt,
        'dalle3',
        async () => {
          const response = await fetch('/api/dalle3', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
          });
          const data = await response.json();
          return { url: data.url };
        }
      );
      
      if (result.success) {
        results.push({ prompt, url: result.data.url, success: true });
        totalCreditsUsed += result.creditsUsed;
        console.log(`✅ Generated: "${prompt}" - ${result.remainingCredits} credits left`);
      } else {
        results.push({ prompt, error: result.error, success: false });
        console.log(`❌ Failed: "${prompt}" - ${result.error}`);
        break; // Stop if credits run out or error occurs
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (err: any) {
      results.push({ prompt, error: err.message, success: false });
      break;
    }
  }
  
  return {
    results,
    totalCreditsUsed,
    successCount: results.filter(r => r.success).length,
    failedCount: results.filter(r => !r.success).length
  };
}

// ============================================
// EXAMPLE 7: PREFLIGHT CREDIT CHECK
// ============================================

/**
 * Check credits before showing generation UI
 */
import { checkUserCredits, getCreditConfig } from './firebase';

async function preflightCheck(userId: string, aiType: 'image' | 'video' | 'voice' | 'chat') {
  // Get credit configuration
  const config = await getCreditConfig();
  
  // Calculate required credits
  let requiredCredits = 0;
  switch (aiType) {
    case 'image':
      requiredCredits = config.imageCost;
      break;
    case 'video':
      requiredCredits = config.videoCostPerSecond * 5; // Assume 5 second video
      break;
    case 'voice':
      requiredCredits = config.voiceCostPerMinute * 0.5; // Assume 30 seconds
      break;
    case 'chat':
      requiredCredits = Math.ceil(config.chatCostPerToken * 500); // Assume 500 tokens
      break;
  }
  
  // Check if user has enough
  const check = await checkUserCredits(userId, requiredCredits);
  
  return {
    canGenerate: check.hasEnough,
    currentBalance: check.currentBalance,
    requiredCredits,
    shortfall: check.hasEnough ? 0 : requiredCredits - check.currentBalance,
    message: check.status
  };
}

// Usage in component
export function GenerateButton({ aiType }: { aiType: 'image' | 'video' | 'voice' | 'chat' }) {
  const [canGenerate, setCanGenerate] = useState(false);
  const [creditInfo, setCreditInfo] = useState<any>(null);
  
  React.useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      preflightCheck(user.uid, aiType).then(info => {
        setCanGenerate(info.canGenerate);
        setCreditInfo(info);
      });
    }
  }, [aiType]);
  
  if (!canGenerate && creditInfo) {
    return (
      <div className="p-4 bg-yellow-100 rounded">
        ⚠️ Insufficient credits. Need {creditInfo.requiredCredits}, have {creditInfo.currentBalance}.
        <button className="ml-4 px-4 py-2 bg-blue-600 text-white rounded">
          Buy Credits
        </button>
      </div>
    );
  }
  
  return (
    <button className="px-6 py-3 bg-green-600 text-white rounded">
      Generate ({creditInfo?.requiredCredits} credits)
    </button>
  );
}

// ============================================
// EXAMPLE 8: ERROR HANDLING BEST PRACTICES
// ============================================

async function generateWithProperErrorHandling(prompt: string) {
  const user = auth.currentUser;
  if (!user) {
    return {
      success: false,
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Please sign in to continue',
      action: 'REDIRECT_TO_LOGIN'
    };
  }
  
  try {
    const result = await withImageCredits(
      user.uid,
      prompt,
      'dalle3',
      async () => {
        const response = await fetch('/api/dalle3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'API error');
        }
        
        const data = await response.json();
        return { url: data.url };
      }
    );
    
    if (!result.success) {
      // Parse different error types
      if (result.error?.includes('Insufficient credits')) {
        return {
          success: false,
          error: 'INSUFFICIENT_CREDITS',
          message: 'You need more credits to generate this image',
          action: 'SHOW_UPGRADE_MODAL',
          remainingCredits: result.remainingCredits
        };
      }
      
      if (result.error?.includes('Rate limit')) {
        return {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'You\'ve made too many requests. Please wait a moment.',
          action: 'SHOW_RATE_LIMIT_MESSAGE'
        };
      }
      
      if (result.error?.includes('inappropriate')) {
        return {
          success: false,
          error: 'INAPPROPRIATE_CONTENT',
          message: 'Your prompt contains inappropriate content',
          action: 'SHOW_MODERATION_WARNING'
        };
      }
      
      if (result.error?.includes('suspended')) {
        return {
          success: false,
          error: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended',
          action: 'SHOW_SUPPORT_CONTACT'
        };
      }
      
      return {
        success: false,
        error: 'GENERATION_FAILED',
        message: result.error,
        action: 'SHOW_GENERIC_ERROR'
      };
    }
    
    return {
      success: true,
      data: result.data,
      creditsUsed: result.creditsUsed,
      remainingCredits: result.remainingCredits
    };
    
  } catch (err: any) {
    console.error('Unexpected error:', err);
    return {
      success: false,
      error: 'UNEXPECTED_ERROR',
      message: 'An unexpected error occurred. Please try again.',
      action: 'SHOW_RETRY_BUTTON',
      details: err.message
    };
  }
}

/**
 * ============================================
 * INTEGRATION CHECKLIST
 * ============================================
 * 
 * ✅ Replace direct AI service calls with credit wrappers
 * ✅ Show credit cost before generation
 * ✅ Display remaining credits after generation
 * ✅ Handle insufficient credits gracefully
 * ✅ Handle rate limit errors
 * ✅ Show appropriate error messages
 * ✅ Implement preflight checks
 * ✅ Add progress tracking for long operations
 * ✅ Log all errors for debugging
 * ✅ Test with various user states (no credits, suspended, etc.)
 * 
 * ============================================
 */
