/**
 * Credit Wrapper for AI Services
 * 
 * This module provides a wrapper around AI API calls to:
 * - Check credits before generation
 * - Deduct credits automatically
 * - Log usage for analytics
 * - Track real-time activity
 * - Handle rate limiting
 * 
 * Usage Example:
 * ```typescript
 * import { withCredits } from './services/creditWrapper';
 * 
 * // Wrap your AI service call
 * const result = await withCredits({
 *   userId: 'user123',
 *   aiType: 'image',
 *   service: 'dalle3',
 *   prompt: 'A beautiful sunset',
 *   estimatedCost: 1,
 *   callback: async () => {
 *     return await generateImageWithDalle(prompt);
 *   }
 * });
 * ```
 */

import { 
  checkUserCredits, 
  deductUserCredits, 
  logAIUsage,
  createAIActivity,
  updateAIActivity,
  checkRateLimit,
  moderatePrompt
} from './firebase';

export interface CreditWrapperOptions {
  userId: string;
  aiType: 'image' | 'video' | 'voice' | 'chat';
  service: string;
  prompt?: string;
  estimatedCost?: number;
  duration?: number; // For video/voice in seconds
  tokens?: number; // For chat
  callback: () => Promise<any>;
  onProgress?: (progress: number) => void;
}

export interface CreditWrapperResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  creditsUsed: number;
  remainingCredits: number;
  activityId?: string;
}

/**
 * Wrap an AI service call with credit management
 */
export async function withCredits<T = any>(
  options: CreditWrapperOptions
): Promise<CreditWrapperResult<T>> {
  const {
    userId,
    aiType,
    service,
    prompt = '',
    estimatedCost,
    duration,
    tokens,
    callback,
    onProgress
  } = options;

  let activityId: string | undefined;
  let creditsUsed = 0;

  try {
    // 1. Check rate limit
    const rateLimitCheck = await checkRateLimit(userId, aiType);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: `Rate limit exceeded. Please try again in ${Math.ceil((rateLimitCheck.resetAt - Date.now()) / 60000)} minutes.`,
        creditsUsed: 0,
        remainingCredits: 0
      };
    }

    // 2. Moderate prompt if provided
    if (prompt) {
      const moderation = await moderatePrompt(prompt);
      if (!moderation.allowed) {
        return {
          success: false,
          error: moderation.reason || 'Prompt contains inappropriate content',
          creditsUsed: 0,
          remainingCredits: 0
        };
      }
    }

    // 3. Calculate credit cost (if not provided)
    if (!estimatedCost) {
      // Get credit config and calculate
      const { getCreditConfig } = await import('./firebase');
      const config = await getCreditConfig();
      
      switch (aiType) {
        case 'image':
          creditsUsed = config.imageCost || 1;
          break;
        case 'video':
          creditsUsed = (config.videoCostPerSecond || 5) * (duration || 5);
          break;
        case 'voice':
          creditsUsed = (config.voiceCostPerMinute || 2) * ((duration || 60) / 60);
          break;
        case 'chat':
          creditsUsed = (config.chatCostPerToken || 0.001) * (tokens || 100);
          break;
      }
      creditsUsed = Math.ceil(creditsUsed);
    } else {
      creditsUsed = estimatedCost;
    }

    // 4. Check if user has enough credits
    const creditCheck = await checkUserCredits(userId, creditsUsed);
    if (!creditCheck.hasEnough) {
      return {
        success: false,
        error: creditCheck.status,
        creditsUsed: 0,
        remainingCredits: creditCheck.currentBalance
      };
    }

    // 5. Deduct credits
    const deductResult = await deductUserCredits(
      userId,
      creditsUsed,
      aiType,
      `${aiType} generation via ${service}`,
      { prompt: prompt?.substring(0, 100), duration, tokens }
    );

    // 6. Create AI activity for real-time monitoring
    activityId = await createAIActivity(
      userId,
      aiType,
      service,
      prompt,
      creditsUsed
    );

    // 7. Execute the AI generation
    if (onProgress) {
      updateAIActivity(activityId, { status: 'processing', progress: 0 });
    }

    const result = await callback();

    // 8. Update activity as completed
    await updateAIActivity(activityId, {
      status: 'completed',
      progress: 100,
      resultUrl: typeof result === 'object' && result?.url ? result.url : undefined
    });

    // 9. Log usage
    await logAIUsage(userId, aiType, service, creditsUsed, 'success', {
      prompt,
      duration,
      tokens,
      outputUrl: typeof result === 'object' && result?.url ? result.url : undefined
    });

    return {
      success: true,
      data: result,
      creditsUsed,
      remainingCredits: deductResult.newBalance,
      activityId
    };

  } catch (error: any) {
    console.error('Credit wrapper error:', error);

    // Update activity as failed
    if (activityId) {
      await updateAIActivity(activityId, {
        status: 'failed',
        errorMessage: error.message || 'Unknown error'
      });
    }

    // Log failed usage
    await logAIUsage(userId, aiType, service, creditsUsed, 'failed', {
      prompt,
      duration,
      tokens,
      errorMessage: error.message || 'Unknown error'
    });

    return {
      success: false,
      error: error.message || 'Generation failed',
      creditsUsed,
      remainingCredits: 0,
      activityId
    };
  }
}

/**
 * Quick helper for image generation
 */
export async function withImageCredits(
  userId: string,
  prompt: string,
  service: string,
  callback: () => Promise<any>
) {
  return withCredits({
    userId,
    aiType: 'image',
    service,
    prompt,
    callback
  });
}

/**
 * Quick helper for video generation
 */
export async function withVideoCredits(
  userId: string,
  prompt: string,
  service: string,
  durationSeconds: number,
  callback: () => Promise<any>
) {
  return withCredits({
    userId,
    aiType: 'video',
    service,
    prompt,
    duration: durationSeconds,
    callback
  });
}

/**
 * Quick helper for voice generation
 */
export async function withVoiceCredits(
  userId: string,
  text: string,
  service: string,
  durationSeconds: number,
  callback: () => Promise<any>
) {
  return withCredits({
    userId,
    aiType: 'voice',
    service,
    prompt: text,
    duration: durationSeconds,
    callback
  });
}

/**
 * Quick helper for chat
 */
export async function withChatCredits(
  userId: string,
  prompt: string,
  service: string,
  estimatedTokens: number,
  callback: () => Promise<any>
) {
  return withCredits({
    userId,
    aiType: 'chat',
    service,
    prompt,
    tokens: estimatedTokens,
    callback
  });
}

/**
 * Example usage in existing services:
 * 
 * Before:
 * ```typescript
 * const image = await generateImageWithDalle(prompt);
 * ```
 * 
 * After:
 * ```typescript
 * import { withImageCredits } from './creditWrapper';
 * 
 * const result = await withImageCredits(
 *   userId,
 *   prompt,
 *   'dalle3',
 *   async () => await generateImageWithDalle(prompt)
 * );
 * 
 * if (result.success) {
 *   const image = result.data;
 *   console.log('Remaining credits:', result.remainingCredits);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
// ============================================
// ENGINE-BASED CREDIT SYSTEM (NEW)
// ============================================

import { getFunctions, httpsCallable } from 'firebase/functions';

export interface EngineCreditOptions {
  userId: string;
  aiType: 'image' | 'video' | 'voice' | 'chat';
  engineId: string;
  inputSize: number; // Tokens, seconds, images, etc.
  prompt?: string;
  metadata?: Record<string, any>;
  callback: () => Promise<any>;
  onProgress?: (progress: number) => void;
}

export interface EngineCreditResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  creditsUsed: number;
  remainingCredits: number;
  activityId?: string;
  engineName?: string;
}

/**
 * Wrap an AI service call with engine-based credit management
 * This uses the new dynamic pricing system with per-engine costs
 * 
 * @example
 * ```typescript
 * const result = await withEngineCredits({
 *   userId: user.uid,
 *   aiType: 'image',
 *   engineId: 'dalle',
 *   inputSize: 1,
 *   prompt: 'A beautiful sunset',
 *   callback: async () => await generateImage(prompt)
 * });
 * ```
 */
export async function withEngineCredits<T = any>(
  options: EngineCreditOptions
): Promise<EngineCreditResult<T>> {
  const {
    userId,
    aiType,
    engineId,
    inputSize,
    prompt = '',
    metadata = {},
    callback,
    onProgress
  } = options;

  let activityId: string | undefined;
  let creditsUsed = 0;

  try {
    // 1. Call Cloud Function to validate and deduct credits
    const functions = getFunctions();
    const deductCredits = httpsCallable(functions, 'validateAndDeductEngineCredits');

    const creditResult: any = await deductCredits({
      userId,
      ai_type: aiType,
      engine_id: engineId,
      input_size: inputSize,
      prompt,
      metadata
    });

    if (!creditResult.data.success) {
      return {
        success: false,
        error: creditResult.data.message || 'Credit deduction failed',
        creditsUsed: 0,
        remainingCredits: 0
      };
    }

    activityId = creditResult.data.activityId;
    creditsUsed = creditResult.data.cost;
    const remainingCredits = creditResult.data.newBalance;

    // 2. Execute the AI generation
    if (onProgress) onProgress(10);

    const result = await callback();

    if (onProgress) onProgress(90);

    // 3. Update activity status as completed
    if (activityId) {
      const { updateAIActivity } = await import('./firebase');
      await updateAIActivity(activityId, {
        status: 'completed',
        resultUrl: result?.url || result
      });
    }

    if (onProgress) onProgress(100);

    return {
      success: true,
      data: result,
      creditsUsed,
      remainingCredits,
      activityId
    };

  } catch (error: any) {
    console.error('Engine credit wrapper error:', error);

    // Update activity as failed
    if (activityId) {
      const { updateAIActivity } = await import('./firebase');
      await updateAIActivity(activityId, {
        status: 'failed',
        errorMessage: error.message
      });
    }

    return {
      success: false,
      error: error.message || 'Generation failed',
      creditsUsed,
      remainingCredits: 0,
      activityId
    };
  }
}

/**
 * Generate image with specific engine
 * 
 * @example
 * ```typescript
 * const result = await withEngineImageCredits(
 *   userId,
 *   'dalle',
 *   prompt,
 *   async () => await dalleService.generate(prompt)
 * );
 * ```
 */
export async function withEngineImageCredits(
  userId: string,
  engineId: string,
  prompt: string,
  callback: () => Promise<any>,
  metadata?: Record<string, any>
) {
  return withEngineCredits({
    userId,
    aiType: 'image',
    engineId,
    inputSize: 1, // 1 image
    prompt,
    metadata,
    callback
  });
}

/**
 * Generate video with specific engine
 * 
 * @example
 * ```typescript
 * const result = await withEngineVideoCredits(
 *   userId,
 *   'klingai',
 *   prompt,
 *   5, // 5 seconds
 *   async () => await klingaiService.generate(prompt, 5)
 * );
 * ```
 */
export async function withEngineVideoCredits(
  userId: string,
  engineId: string,
  prompt: string,
  durationSeconds: number,
  callback: () => Promise<any>,
  metadata?: Record<string, any>
) {
  return withEngineCredits({
    userId,
    aiType: 'video',
    engineId,
    inputSize: durationSeconds,
    prompt,
    metadata,
    callback
  });
}

/**
 * Generate voice with specific engine
 * 
 * @example
 * ```typescript
 * const result = await withEngineVoiceCredits(
 *   userId,
 *   'elevenlabs',
 *   text,
 *   2.5, // 2.5 minutes
 *   async () => await elevenlabsService.synthesize(text)
 * );
 * ```
 */
export async function withEngineVoiceCredits(
  userId: string,
  engineId: string,
  text: string,
  durationMinutes: number,
  callback: () => Promise<any>,
  metadata?: Record<string, any>
) {
  return withEngineCredits({
    userId,
    aiType: 'voice',
    engineId,
    inputSize: durationMinutes,
    prompt: text,
    metadata,
    callback
  });
}

/**
 * Chat with specific engine
 * 
 * @example
 * ```typescript
 * const result = await withEngineChatCredits(
 *   userId,
 *   'gemini',
 *   message,
 *   150, // estimated tokens
 *   async () => await geminiService.chat(message)
 * );
 * ```
 */
export async function withEngineChatCredits(
  userId: string,
  engineId: string,
  message: string,
  estimatedTokens: number,
  callback: () => Promise<any>,
  metadata?: Record<string, any>
) {
  return withEngineCredits({
    userId,
    aiType: 'chat',
    engineId,
    inputSize: estimatedTokens,
    prompt: message,
    metadata,
    callback
  });
}

/**
 * Get available engines for a specific AI type
 * 
 * @example
 * ```typescript
 * const engines = await getAvailableEngines('image');
 * // Returns: [{ id: 'dalle', name: 'DALL-E 3', cost: 5 }, ...]
 * ```
 */
export async function getAvailableEngines(aiType: 'image' | 'video' | 'voice' | 'chat') {
  try {
    const functions = getFunctions();
    const getEnginePricing = httpsCallable(functions, 'getEnginePricing');
    
    const result: any = await getEnginePricing({
      ai_type: aiType,
      include_inactive: false
    });

    if (result.data.success) {
      return result.data.engines.map((engine: any) => ({
        id: engine.id,
        name: engine.engine_name,
        cost: engine.base_cost,
        costUnit: engine.cost_unit,
        description: engine.description
      }));
    }

    return [];
  } catch (error) {
    console.error('Failed to get available engines:', error);
    return [];
  }
}

/**
 * Calculate cost before generation
 * 
 * @example
 * ```typescript
 * const cost = await calculateCost('dalle', 1);
 * // Returns: { engineId: 'dalle', cost: 5, unit: 'image' }
 * ```
 */
export async function calculateCost(engineId: string, inputSize: number) {
  try {
    const { calculateEngineCost } = await import('./firebase');
    return await calculateEngineCost(engineId, inputSize);
  } catch (error) {
    console.error('Failed to calculate cost:', error);
    return null;
  }
}