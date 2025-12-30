# ByteDance Seedance 1.0 Pro Integration Guide

## Overview
ByteDance Seedance 1.0 Pro is now integrated into the AI Video generation feature, providing advanced video synthesis capabilities with extensive customization options.

## Features

### Engine Selection
Users can now choose between two AI video engines:
- **Sora 2** (OpenAI Engine) - Fast and reliable
- **Seedance 1.0 Pro** (ByteDance Engine) - Advanced features and controls

### Seedance-Specific Parameters

When the Seedance engine is selected, users have access to:

#### 1. **FPS Control (Frames Per Second)**
- **24 FPS** - Cinematic look
- **30 FPS** - Standard smooth video
- **60 FPS** - Ultra-smooth high-frame-rate video

#### 2. **Quality Levels**
- **Standard** - Fast generation, good quality
- **High** - Balanced quality and speed
- **Ultra** - Maximum quality, slower generation

#### 3. **Motion Strength** (0-100%)
- Controls the intensity of motion in the video
- Slider control from 0% (minimal motion) to 100% (maximum motion)
- Default: 70%

#### 4. **CFG Scale** (1-20)
- Controls creativity vs prompt adherence
- Lower values (1-7): More literal interpretation of the prompt
- Higher values (8-20): More creative interpretation
- Default: 7

### Standard Parameters (Available for Both Engines)

1. **Mode Selection**
   - Text to Video
   - Image to Video

2. **Aspect Ratio**
   - 16:9 (Landscape)
   - 9:16 (Portrait)

3. **Resolution**
   - 720P (HD)
   - 1080P (FHD)

4. **Duration**
   - 5 seconds
   - 10 seconds
   - 15 seconds
   - 60 seconds

5. **Negative Prompt**
   - Specify what to avoid in the video
   - Preset options available

## API Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# ByteDance Seedance Configuration
SEEDANCE_API_KEY=your_seedance_api_key_here
SEEDANCE_API_BASE=https://api.bytedance.com/v1/video/generate
```

### API Endpoint

The Seedance service uses a proxy endpoint at `/api/seedance` which handles:
- API key security
- Request routing
- Response processing

## Usage Example

### Text to Video with Seedance

```typescript
import { generateVideoWithSeedance } from '../services/seedanceService';

const videoUrl = await generateVideoWithSeedance({
  model: 'bytedance-seedance-1.0-pro',
  prompt: 'A cinematic shot of a sunset over the ocean',
  aspect_ratio: '16:9',
  resolution: '1080p',
  duration: 10,
  quality: 'high',
  fps: 30,
  negative_prompt: 'blurry, low quality',
  cfg_scale: 7,
  motion_strength: 0.7,
});
```

### Image to Video with Seedance

```typescript
const videoUrl = await generateVideoWithSeedance({
  model: 'bytedance-seedance-1.0-pro',
  prompt: 'Camera slowly zooms in on the subject',
  aspect_ratio: '16:9',
  resolution: '1080p',
  duration: 5,
  quality: 'ultra',
  fps: 60,
  image_url: 'data:image/png;base64,...', // Base64 or URL
  negative_prompt: 'distorted, warped',
  cfg_scale: 8,
  motion_strength: 0.5,
});
```

## UI Components

### Engine Selector
Located in the VideoGenerator component, allows users to switch between Sora and Seedance engines.

### Conditional Controls
Advanced Seedance controls (FPS, Quality Level, Motion Strength, CFG Scale) are only displayed when the Seedance engine is selected, providing a clean and contextual interface.

### Visual Feedback
The result display shows which engine was used:
- "SORA 2" for Sora engine
- "SEEDANCE 1.0 PRO" for Seedance engine

## State Management

All parameters are saved to the user's work state and restored on subsequent visits:
- Engine selection
- FPS setting
- Quality level
- Motion strength
- CFG scale

## Technical Implementation

### Service Layer
`/services/seedanceService.ts` - Handles API communication

### Component Integration
`/components/VideoGenerator.tsx` - UI and user interaction

### API Proxy
`/vite.config.ts` - Development server proxy configuration

## Best Practices

### For Cinematic Videos
- Use 24 FPS
- Set quality to "Ultra"
- CFG Scale: 7-9
- Motion Strength: 0.6-0.8

### For Smooth Action
- Use 60 FPS
- Set quality to "High" or "Ultra"
- CFG Scale: 6-8
- Motion Strength: 0.8-1.0

### For Creative Interpretations
- Use 30 FPS
- Set quality to "High"
- CFG Scale: 10-15
- Motion Strength: 0.5-0.9

## Error Handling

The service includes comprehensive error handling:
- Missing API key detection
- Network error handling
- Response validation
- User-friendly error messages

## Future Enhancements

Potential additions:
- Additional aspect ratios (1:1, 4:3, 3:4)
- 4K resolution support
- Advanced motion presets
- Style transfer options
- Multi-scene generation

## Support

For issues or questions:
1. Check the browser console for detailed error messages
2. Verify API key configuration
3. Review the request/response in Network tab
4. Consult ByteDance Seedance API documentation

---

**Last Updated:** December 28, 2025
**Version:** 1.0
