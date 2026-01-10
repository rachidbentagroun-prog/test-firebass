/**
 * Vercel Serverless Function for ElevenLabs TTS
 * This securely handles ElevenLabs API calls server-side
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, voice = 'Rachel', options = {} } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey || apiKey === '""' || apiKey === 'undefined' || apiKey.trim() === '') {
    console.error('❌ ELEVENLABS_API_KEY not configured');
    return res.status(500).json({ error: 'ElevenLabs API key not configured' });
  }

  // Voice ID mapping
  const voiceIds = {
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
    // Gemini voice mappings
    'Kore': '21m00Tcm4TlvDq8ikWAM',
    'Puck': 'TxGEqnHWrfWFTfGW9XjX',
    'Charon': 'VR6AewLTigWG4xSOukaG',
    'Zephyr': 'XB0fDUnXU5powFXDhCwa',
    'Fenrir': 'pNInz6obpgDQGcFmaJgB',
    'Aoede': 'LcfcDJNUP1GQjkzn1xUU',
    'Leda': 'EXAVITQu4vr4xnSDxMaL',
    'Orus': 'ErXwobaYiN019PkySvjV',
  };

  const voiceId = options.voiceIdOverride || voiceIds[voice] || voiceIds['Rachel'];

  console.log('🎙️ ElevenLabs API request:', { voice, voiceId, textLength: text.length });

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
        model_id: options.model_id || 'eleven_monolingual_v1',
        voice_settings: {
          stability: options.voice_settings?.stability ?? 0.5,
          similarity_boost: options.voice_settings?.similarity_boost ?? 0.5,
          style: options.voice_settings?.style,
          use_speaker_boost: options.voice_settings?.use_speaker_boost,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ElevenLabs API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `ElevenLabs API failed: ${errorText || response.statusText}` 
      });
    }

    // Get the audio buffer
    const audioBuffer = await response.arrayBuffer();
    console.log('✅ Audio generated:', audioBuffer.byteLength, 'bytes');

    if (audioBuffer.byteLength === 0) {
      console.error('❌ Empty audio buffer received');
      return res.status(500).json({ error: 'Empty audio data received from API' });
    }

    // Set proper headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength.toString());
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    // Send the audio buffer as binary
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('❌ ElevenLabs TTS error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate speech' });
  }
}
