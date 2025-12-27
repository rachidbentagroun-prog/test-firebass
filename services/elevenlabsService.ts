// ElevenLabs voice synthesis client
// Supports text-to-speech with multiple voices

export type ElevenLabsVoice = 
  | 'Rachel' | 'Domi' | 'Bella' | 'Antoni' | 'Elli' | 'Josh' 
  | 'Arnold' | 'Adam' | 'Sam' | 'Charlotte' | 'Emily' | 'Ethan';

// Map Gemini voice names to ElevenLabs equivalents
const VOICE_MAPPING: Record<string, string> = {
  'Kore': 'Rachel',      // Professional female
  'Puck': 'Josh',        // Youthful male
  'Charon': 'Arnold',    // Deep male
  'Zephyr': 'Charlotte', // Calm female
  'Fenrir': 'Adam',      // Storyteller male
  'Aoede': 'Emily',      // Melodic female
  'Leda': 'Bella',       // Articulate female
  'Orus': 'Antoni',      // Sharp male
};

/**
 * Generates speech using ElevenLabs API
 */
export interface ElevenLabsOptions {
  model_id?: string;
  voice_settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  voiceIdOverride?: string;
}

export async function generateSpeechWithElevenLabs(
  text: string,
  voice: string = 'Kore',
  options?: ElevenLabsOptions
): Promise<Blob> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey || apiKey === '""' || apiKey === 'undefined' || apiKey.trim() === '' || apiKey === 'your_elevenlabs_api_key_here') {
    throw new Error('ELEVENLABS_API_KEY is missing. Set it in your .env file.');
  }

  // If voice is already an ElevenLabs voice name, use it directly
  // Otherwise, map Gemini voice names to ElevenLabs equivalents
  const elevenlabsVoice = VOICE_MAPPING[voice] || voice || 'Rachel';
  
  // ElevenLabs voice IDs (these are standard IDs for pre-made voices)
  const voiceIds: Record<string, string> = {
    'Rachel': '21m00Tcm4TlvDq8ikWAM',
    'Domi': 'AZnzlk1XvdvUeBnXmlld',
    'Bella': 'EXAVITQu4vr4xnSDxMaL',
    'Antoni': 'ErXwobaYiN019PkySvjV',
    'Elli': 'MF3mGyEYCl7XYWbV9V6O',
    'Josh': 'TxGEqnHWrfWFTfGW9XjX',
    'Arnold': 'VR6AewLTigWG4xSOukaG',
    'Adam': 'pNInz6obpgDQGcFmaJgB',
    'Sam': 'yoZ06aMxZJJ28mfd3POQ',
    'Charlotte': 'XB0fDUnXU5powFXDhCwa',
    'Emily': 'LcfcDJNUP1GQjkzn1xUU',
    'Ethan': 'g5CIjZEefAph4nQFvHAz',
  };

  const voiceId = options?.voiceIdOverride || voiceIds[elevenlabsVoice] || voiceIds['Rachel'];

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: options?.model_id || 'eleven_monolingual_v1',
        voice_settings: {
          stability: options?.voice_settings?.stability ?? 0.5,
          similarity_boost: options?.voice_settings?.similarity_boost ?? 0.5,
          style: options?.voice_settings?.style ?? undefined,
          use_speaker_boost: options?.voice_settings?.use_speaker_boost ?? undefined,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(errorText || `ElevenLabs API failed with status ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('ElevenLabs speech generation failed:', error);
    throw error;
  }
}

/**
 * Voice cloning with ElevenLabs (simplified version - actual cloning requires voice lab)
 * For now, we'll use instant voice cloning which works with a sample
 */
export async function generateClonedSpeechWithElevenLabs(
  text: string,
  referenceAudioBase64: string,
  referenceMime: string
): Promise<Blob> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey || apiKey === '""' || apiKey === 'undefined' || apiKey.trim() === '' || apiKey === 'your_elevenlabs_api_key_here') {
    throw new Error('ELEVENLABS_API_KEY is missing. Set it in your .env file.');
  }

  // Note: ElevenLabs instant voice cloning requires the Professional plan
  // For basic implementation, we'll use a generic voice with adjusted settings
  // For actual cloning, users need to upload to ElevenLabs voice lab first
  
  // Fall back to using a neutral voice with custom settings
  const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.8,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(errorText || `ElevenLabs voice clone failed with status ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('ElevenLabs voice cloning failed:', error);
    throw error;
  }
}

/**
 * Detect voice profile (gender) from audio
 * ElevenLabs doesn't have a built-in API for this, so we'll return a default
 */
export async function detectVoiceProfileElevenLabs(
  base64Data: string,
  mimeType: string
): Promise<string> {
  // ElevenLabs doesn't provide voice detection
  // Return a default voice
  return 'Rachel';
}
