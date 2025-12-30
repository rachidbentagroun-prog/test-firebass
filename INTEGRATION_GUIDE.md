# Quick Integration Guide - Add Generation Tracking

## 📌 Overview
This guide shows how to integrate generation tracking into your existing components so that all AI generations appear in the "Generations Live" feed.

---

## 🎯 Step 1: Import the Function

Add this import to your generator components:

```typescript
import { trackGeneration } from '../services/firebase';
```

**In these files:**
- `components/Generator.tsx` (for images)
- `components/VideoGenerator.tsx` (for videos)
- `components/TTSGenerator.tsx` (for audio)

---

## 🖼️ Image Generator Integration

### File: `components/Generator.tsx`

Find the function where image generation starts (likely called `handleGenerate` or similar), and add tracking at the beginning:

```typescript
const handleGenerate = async () => {
  if (!prompt.trim()) return;
  
  // ✅ ADD THIS: Track the generation
  try {
    await trackGeneration(
      user.id,
      user.name,
      user.email,
      'image',
      prompt,
      'runware'  // or 'gemini', 'klingai' depending on your engine
    );
  } catch (e) {
    console.warn('Failed to track generation:', e);
  }
  
  // ... rest of your existing generation logic
  setIsGenerating(true);
  // etc...
};
```

**Engine names you might use:**
- `'gemini'` - for Gemini image generation
- `'runware'` - for Runware API
- `'klingai'` - for KlingAI image generation
 - `'seedream'` - for ByteDance Seedream 4.5
- `'dalle'` - for DALL-E

---

## 🎬 Video Generator Integration

### File: `components/VideoGenerator.tsx`

Find the video generation function and add tracking:

```typescript
const handleGenerateVideo = async () => {
  if (!prompt.trim()) return;
  
  // ✅ ADD THIS: Track the generation
  try {
    await trackGeneration(
      user.id,
      user.name,
      user.email,
      'video',
      prompt,
      'klingai'  // or 'sora', depending on your engine
    );
  } catch (e) {
    console.warn('Failed to track generation:', e);
  }
  
  // ... rest of your existing video generation logic
  setIsGenerating(true);
  // etc...
};
```

**Engine names you might use:**
- `'sora'` - for OpenAI Sora
- `'klingai'` - for KlingAI video generation
- `'gemini'` - for Gemini video generation

---

## 🎤 Audio Generator Integration

### File: `components/TTSGenerator.tsx`

Find the audio/TTS generation function and add tracking:

```typescript
const handleGenerateAudio = async () => {
  if (!text.trim()) return;
  
  // ✅ ADD THIS: Track the generation
  try {
    await trackGeneration(
      user.id,
      user.name,
      user.email,
      'audio',
      text,  // or prompt, depending on your variable name
      'elevenlabs'  // or 'gemini', depending on your engine
    );
  } catch (e) {
    console.warn('Failed to track generation:', e);
  }
  
  // ... rest of your existing audio generation logic
  setIsGenerating(true);
  // etc...
};
```

**Engine names you might use:**
- `'elevenlabs'` - for ElevenLabs TTS
- `'gemini'` - for Gemini audio generation
- `'openai'` - for OpenAI TTS

---

## 📋 Complete Example

Here's a complete example for an image generator:

```typescript
import { trackGeneration } from '../services/firebase';

export const Generator: React.FC<GeneratorProps> = ({ user, ...props }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    // Track the generation START
    try {
      await trackGeneration(
        user.id,
        user.name,
        user.email,
        'image',
        prompt,
        'runware'
      );
    } catch (e) {
      console.warn('Failed to track generation:', e);
      // Don't stop generation if tracking fails
    }
    
    setIsGenerating(true);
    
    try {
      // Your existing generation logic
      const result = await generateImage(prompt);
      
      // Save to database
      await saveImageToFirebase(result, user.id);
      
      // Update status (optional but recommended)
      // await updateGenerationStatus(generationId, 'completed');
      
    } catch (error) {
      console.error('Generation failed:', error);
      // await updateGenerationStatus(generationId, 'failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    // ... your JSX
  );
};
```

---

## ⚠️ Important Notes

### 1. **Error Handling**
Always wrap `trackGeneration()` in try-catch so it doesn't break your generation flow:

```typescript
try {
  await trackGeneration(...);
} catch (e) {
  console.warn('Tracking failed:', e);
  // Continue with generation anyway
}
```

### 2. **Timing**
Call `trackGeneration()` **immediately** when the user clicks generate, not after the generation completes.

### 3. **User Data**
Make sure you have access to:
- `user.id` - User's unique ID
- `user.name` - User's display name
- `user.email` - User's email

If any are missing, use defaults:
```typescript
const userName = user.name || 'Anonymous User';
const userEmail = user.email || 'no-email@example.com';
```

### 4. **Engine Names**
Use lowercase, descriptive engine names:
- ✅ Good: `'gemini'`, `'elevenlabs'`, `'klingai'`
- ❌ Bad: `'Gemini API'`, `'ELEVENLABS'`, `'engine1'`

---

## 🔍 Testing

After integration, test by:

1. **Generate content** in each modality (image, video, audio)
2. **Open User Profile** → Navigate to "Generations Live" tab
3. **Verify** your generation appears in the feed
4. **Check details**: User name, prompt, engine type should be correct
5. **Watch auto-refresh**: Feed should update every 5 seconds

---

## 🐛 Troubleshooting

### Generation not appearing in feed

**Check:**
1. `trackGeneration()` is being called
2. No errors in browser console
3. User is authenticated
4. Firestore rules allow writes to `live_generations`
5. All required parameters are provided

### Wrong user information

**Check:**
1. `user` object is passed correctly to component
2. `user.id`, `user.name`, `user.email` are not null
3. User session is active

### Firestore permission denied

**Check:**
1. User is authenticated (`request.auth != null`)
2. Security rules allow writes:
```javascript
match /live_generations/{doc} {
  allow write: if request.auth != null;
}
```

---

## 📊 Verification Checklist

After integrating, verify:

- [ ] Images tracked ✅
- [ ] Videos tracked ✅
- [ ] Audio tracked ✅
- [ ] User name appears correctly ✅
- [ ] Prompts are visible ✅
- [ ] Engine names are correct ✅
- [ ] Timestamps are accurate ✅
- [ ] Auto-refresh works ✅
- [ ] Analytics update ✅
- [ ] No console errors ✅

---

## 🚀 Advanced: Status Updates

For even better tracking, update the generation status when it completes:

```typescript
// Save the generation ID when tracking starts
let generationId: string | null = null;

const handleGenerate = async () => {
  // Track start
  const result = await trackGeneration(...);
  generationId = result?.id;  // If your function returns the ID
  
  try {
    // Generate...
    
    // On success
    if (generationId) {
      await updateGenerationStatus(generationId, 'completed');
    }
  } catch (error) {
    // On failure
    if (generationId) {
      await updateGenerationStatus(generationId, 'failed');
    }
  }
};
```

*Note: This requires modifying `trackGeneration()` to return the document ID*

---

## 💡 Pro Tips

1. **Track early**: Call as soon as user clicks, not after validations
2. **Don't block**: Use try-catch to prevent tracking from blocking generation
3. **Be specific**: Use descriptive engine names
4. **Test thoroughly**: Generate from each engine type
5. **Monitor Firestore**: Check usage in Firebase Console

---

## 📞 Need Help?

If tracking isn't working:
1. Check browser console for errors
2. Verify Firestore rules in Firebase Console
3. Check `live_generations` collection exists
4. Ensure user is authenticated
5. Review this guide again

---

**Quick Reference:**
```typescript
// Basic tracking call
await trackGeneration(
  user.id,        // User ID
  user.name,      // User name
  user.email,     // User email
  'image',        // Type: 'image' | 'video' | 'audio'
  prompt,         // User's prompt text
  'gemini'        // Engine name (optional)
);
```

---

**Integration Time:** ~5 minutes per component  
**Difficulty:** Easy  
**Impact:** High - enables real-time monitoring

Happy tracking! 🎉
