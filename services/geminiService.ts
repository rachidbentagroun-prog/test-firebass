
import { GoogleGenAI, Modality, Type } from "@google/genai";

/**
 * Returns a new AI instance using the current environment's API Key.
 * This ensures the key injected by Vite/Vercel is used.
 */
const getAI = () => {
  const key = process.env.API_KEY;
  // Check for various ways an unset key might be baked into the build
  if (!key || key === '""' || key === "undefined" || key.trim() === "") {
    throw new Error("NEURAL_LINK_FAILURE: API Key is missing. If you just added it to Vercel, you MUST 'Redeploy' your project to bake the key into the application.");
  }
  return new GoogleGenAI({ apiKey: key });
};

// Prefer SORA_API_KEY for video generation; fall back to API_KEY if not provided
const getVideoAI = () => {
  const key = process.env.SORA_API_KEY || process.env.API_KEY;
  if (!key || key === '""' || key === "undefined" || key.trim() === "") {
    throw new Error("NEURAL_LINK_FAILURE: Video API Key is missing. Set SORA_API_KEY (preferred) or API_KEY.");
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Converts a Blob to a permanent Data URL for database storage.
 */
export const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Detects the voice profile (gender and tone) from an audio file.
 */
export const detectVoiceProfile = async (base64Data: string, mimeType: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: "Analyze the audio. Is the speaker male or female? Reply with exactly one word: 'male' or 'female'." }
        ]
      }
    });
    const result = response.text?.toLowerCase().trim();
    if (result?.includes('female')) return 'Kore';
    if (result?.includes('male')) return 'Fenrir';
    return 'Kore';
  } catch (error) {
    console.error("Gender detection failed:", error);
    return 'Kore';
  }
};

/**
 * Transcribes an audio or video file using Gemini 3 Flash.
 */
export const transcribeMedia = async (base64Data: string, mimeType: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: "Extract the exact spoken script from this media. Provide only the text." }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Transcription failed:", error);
    throw new Error("Neural Transcoder failed to decode media signal.");
  }
};

/**
 * Neural Voice Synthesis using the stable TTS model.
 */
export const generateSpeechWithGemini = async (text: string, voice: string = 'Kore'): Promise<Blob> => {
  console.log('🎙️ Gemini: Starting voice generation via API route...', { voice, textLength: text.length });
  
  try {
    console.log('📡 Calling /api/tts-gemini...');
    const response = await fetch('/api/tts-gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/wav, audio/*, */*',
      },
      body: JSON.stringify({
        text,
        voice
      }),
    });

    console.log('📥 Response received:', { 
      status: response.status, 
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        console.error('❌ API route error:', { status: response.status, error: errorData });
        throw new Error(errorData.error || `API failed with status ${response.status}`);
      } else {
        const errorText = await response.text();
        console.error('❌ API route error:', { status: response.status, error: errorText });
        throw new Error(errorText || `API failed with status ${response.status}`);
      }
    }

    console.log('📥 Converting response to blob...');
    const blob = await response.blob();
    console.log('✅ Blob created:', { size: blob.size, type: blob.type });
    
    if (blob.size === 0) {
      console.error('❌ Received empty audio blob');
      throw new Error('Received empty audio blob from server');
    }
    
    if (blob.size < 100) {
      console.warn('⚠️ Audio blob suspiciously small:', blob.size, 'bytes');
    }
    
    return blob;
  } catch (error) {
    console.error("❌ Gemini speech generation failed:", error);
    throw error;
  }
};

/**
 * Cloning logic that uses detection and high-fidelity synthesis.
 */
export const generateClonedSpeechWithGemini = async (text: string, referenceAudioBase64: string, referenceMime: string): Promise<Blob> => {
  const persona = await detectVoiceProfile(referenceAudioBase64, referenceMime);
  return generateSpeechWithGemini(text, persona);
};

/**
 * Enhances a user's prompt using Gemini.
 */
export const enhancePrompt = async (originalPrompt: string, task: string = "image"): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `You are an expert AI ${task} director. Rewrite the prompt for high-quality results. Be descriptive but concise.`,
      },
      contents: originalPrompt,
    });
    return response.text || originalPrompt;
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    return originalPrompt;
  }
};

/**
 * Image Generation Logic
 */
export const generateImageWithGemini = async (
  prompt: string, 
  base64Image?: string, 
  mimeType: string = 'image/png', 
  aspectRatio: string = '1:1',
  highQuality: boolean = false,
  negativePrompt?: string
): Promise<string> => {
  const ai = getAI();
  const model = highQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  const parts: any[] = [];
  if (base64Image) {
    parts.push({ inlineData: { data: base64Image, mimeType: mimeType } });
  }
  parts.push({ text: prompt });
  const cleanNegativePrompt = negativePrompt?.trim();
  if (cleanNegativePrompt) {
    parts.push({ text: `Avoid: ${cleanNegativePrompt}` });
  }

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts: parts },
    config: { 
      imageConfig: { 
        aspectRatio: aspectRatio as any,
        imageSize: highQuality ? "1K" : undefined
      } 
    }
  });

  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("Visual engine failed to return results. The engine may be busy.");
  }

  const candidate = response.candidates[0];
  
  // Explicitly handle Safety filters
  if (candidate.finishReason === 'SAFETY') {
    throw new Error("Image synthesis blocked. The prompt contains restricted concepts or safety violations.");
  }

  // Find the image data among potentially multiple parts
  const part = candidate.content?.parts?.find(p => p.inlineData);
  if (part?.inlineData?.data) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  
  // If no image part, check for text explaining why
  const textPart = candidate.content?.parts?.find(p => p.text);
  if (textPart?.text) {
    throw new Error(textPart.text);
  }

  throw new Error("Visual data synthesis failed. No image part was returned in the response.");
};

/**
 * Video Generation Logic
 */
export const generateVideoWithVeo = async (prompt: string, options: any): Promise<any> => {
  const ai = getVideoAI();
  const model = options.resolution === '1080p' ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview';
  
  const request: any = {
    model: model,
    prompt: prompt,
    config: { 
      numberOfVideos: 1, 
      resolution: options.resolution, 
      aspectRatio: options.aspectRatio
    }
  };

  // Support for Image-to-Video (Starting Frame)
  if (options.startImage) {
    request.image = {
      imageBytes: options.startImage.data,
      mimeType: options.startImage.mimeType
    };
  }

  // Support for Frame-to-Frame / Interpolation (Ending Frame)
  if (options.lastFrame) {
    request.config.lastFrame = {
      imageBytes: options.lastFrame.data,
      mimeType: options.lastFrame.mimeType
    };
  }

  return await ai.models.generateVideos(request);
};

export const pollVideoOperation = async (operation: any): Promise<string> => {
  const ai = getVideoAI();
  let currentOp = operation;
  while (!currentOp.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    currentOp = await ai.operations.getVideosOperation({ operation: currentOp });
  }
  
  if (currentOp.error) {
    throw new Error(currentOp.error.message || "Temporal synthesis failed.");
  }

  const downloadLink = currentOp.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Synthesis completed but no video URI was returned.");
  
  const videoKey = process.env.SORA_API_KEY || process.env.API_KEY;
  const response = await fetch(`${downloadLink}&key=${videoKey}`);
  if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
  
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const convertBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!blob || blob.size === 0) {
      console.error('❌ convertBlobToBase64: Empty or null blob provided');
      reject(new Error('Cannot convert empty blob to base64'));
      return;
    }
    
    console.log('🔄 convertBlobToBase64: Starting conversion for blob:', { size: blob.size, type: blob.type });
    
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        console.log('✅ convertBlobToBase64: Conversion complete, base64 length:', base64?.length || 0);
        if (!base64 || base64.length === 0) {
          console.error('❌ convertBlobToBase64: Result is empty string');
          reject(new Error('Base64 conversion resulted in empty string'));
        } else {
          resolve(base64);
        }
      } else {
        console.error('❌ convertBlobToBase64: Reader result is not a string');
        reject(new Error("Base64 conversion failed: Result is not a string"));
      }
    };
    reader.onerror = (error) => {
      console.error('❌ convertBlobToBase64: FileReader error:', error);
      reject(error);
    };
    reader.readAsDataURL(blob);
  });
};

function decodeBase64ToBytes(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function createWavBlob(pcmData: Uint8Array, sampleRate: number, numChannels: number): Blob {
  const buffer = pcmData.buffer;
  const length = buffer.byteLength;
  const wavBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(wavBuffer);
  // RIFF identifier
  view.setUint32(0, 0x52494646, false);
  // RIFF chunk size
  view.setUint32(4, 36 + length, true);
  // WAVE identifier
  view.setUint32(8, 0x57415645, false);
  // fmt chunk identifier
  view.setUint32(12, 0x666d7420, false);
  // fmt chunk size
  view.setUint32(16, 16, true);
  // audio format (1 for PCM)
  view.setUint16(20, 1, true);
  // number of channels
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate
  view.setUint32(28, sampleRate * numChannels * 2, true);
  // block align
  view.setUint16(32, numChannels * 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  view.setUint32(36, 0x64617461, false);
  // data chunk size
  view.setUint32(40, length, true);
  const pcmView = new Uint8Array(buffer);
  for (let i = 0; i < length; i++) view.setUint8(44 + i, pcmView[i]);
  return new Blob([wavBuffer], { type: 'audio/wav' });
}
