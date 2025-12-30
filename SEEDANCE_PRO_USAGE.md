# Seedance Pro 1.0 - Image-to-Video Usage Guide

## Overview
The Bytedance Seedance Pro 1.0 API has been successfully integrated with full async task support. It supports:
- Text-to-video generation
- Image-to-video generation  
- Async task polling
- Task status querying

## API Configuration

### Environment Variables
```env
SEEDANCE_API_KEY=ad95579a-132a-4e8e-8215-07b645a27796
SEEDANCE_API_BASE=https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks
```

### Model
- **Model Name**: `seedance-1-0-pro-250528`

## Usage Examples

### 1. Text-to-Video (Backward Compatible)
```typescript
import { generateVideoWithSeedance } from './services/seedanceService';

const videoUrl = await generateVideoWithSeedance({
  model: 'seedance-1-0-pro-250528',
  prompt: 'At breakneck speed, drones thread through intricate obstacles',
  resolution: '1080p',
  duration: 5,
  fps: 30
});
```

### 2. Image-to-Video (Legacy Format)
```typescript
const videoUrl = await generateVideoWithSeedance({
  model: 'seedance-1-0-pro-250528',
  prompt: 'At breakneck speed, drones thread through intricate obstacles --resolution 1080p --duration 5',
  image_url: 'https://ark-doc.tos-ap-southeast-1.bytepluses.com/seepro_i2v%20.png',
  resolution: '1080p',
  duration: 5
});
```

### 3. Image-to-Video (New Content Array Format)
```typescript
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
```

## API Parameters

### Text Content Parameters (embedded in prompt)
- `--resolution`: Video resolution (720p, 1080p, 4k)
- `--duration`: Video duration in seconds (5, 10, 15, 60)
- `--fps`: Frames per second (24, 30, 60)
- `--camerafixed`: Whether camera is fixed (true/false)

### Legacy Parameters (auto-converted to content array)
- `prompt`: Text description of the video
- `image_url`: Source image URL for image-to-video
- `resolution`: Video resolution
- `duration`: Video duration
- `fps`: Frame rate
- `aspect_ratio`: Aspect ratio (16:9, 9:16, 1:1)
- `quality`: Quality level (standard, high, ultra)
- `negative_prompt`: What to avoid
- `seed`: Random seed for reproducibility
- `cfg_scale`: Creativity vs prompt adherence (1-20)
- `motion_strength`: Motion intensity (0-1)

## How It Works

1. **Client Side**: `VideoGenerator.tsx` collects user input and calls `generateVideoWithSeedance()`
2. **Service Layer**: `seedanceService.ts` transforms the request to the new API format and sends to `/api/seedance`
3. **Task Creation**: The API returns a task ID for async processing
4. **Polling**: The service automatically polls `/api/seedance/{taskId}` every 5 seconds
5. **Proxy**: `vite.config.ts` proxies both POST (create) and GET (query) requests to Bytedance's ARK API
6. **Response**: Returns the video URL once generation is complete

## Async Task Flow

```
User Request → generateVideoWithSeedance()
    ↓
POST /api/seedance (create task)
    ↓
Receive task ID
    ↓
pollSeedanceTask(taskId) [Auto-polling]
    ↓ (every 5 seconds)
GET /api/seedance/{taskId} (query status)
    ↓
Status: pending → processing → completed
    ↓
Return video URL
```

## API Format Transformation

The service automatically transforms legacy format to the new content array format:

**Legacy Input:**
```typescript
{
  model: 'seedance-1-0-pro-250528',
  prompt: 'A flying drone',
  resolution: '1080p',
  duration: 5,
  image_url: 'https://example.com/image.png'
}
```

**Transformed to:**
```typescript
{
  model: 'seedance-1-0-pro-250528',
  content: [
    {
      type: 'text',
      text: 'A flying drone --resolution 1080p --duration 5'
    },
    {
      type: 'image_url',
      image_url: {
        url: 'https://example.com/image.png'
      }
    }
  ]
}
```

## Testing

To test the integration:

1. Start the development server:
```bash
npm run dev
```

2. Navigate to the Video Generator page
3. Select "Seedance 1.0 Pro" as the engine
4. Enter a prompt and optionally upload an image
5. Click "Generate Video"

## Curl Example (Direct API Call)

### Create Task
```bash
curl -X POST https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ad95579a-132a-4e8e-8215-07b645a27796" \
  -d '{
    "model": "seedance-1-0-pro-250528",
    "content": [
        {
            "type": "text",
            "text": "At breakneck speed, drones thread through intricate obstacles or stunning natural wonders, delivering an immersive, heart-pounding flying experience. --resolution 1080p --duration 5 --camerafixed false"
        },
        {
            "type": "image_url",
            "image_url": {
                "url": "https://ark-doc.tos-ap-southeast-1.bytepluses.com/seepro_i2v%20.png"
            }
        }
    ]
}'
```

### Query Task Status
```bash
# Replace {id} with the task ID from the create response
curl -X GET https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks/{id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ad95579a-132a-4e8e-8215-07b645a27796"
```

## Notes

- The API key is stored in `.env` and proxied through the Vite server for security
- Both old and new formats are supported for backward compatibility
- Image-to-video requires both a text prompt and an image URL
- The service handles format transformation automatically
- **Async Processing**: Video generation uses async tasks with automatic polling
- **Polling Interval**: Checks task status every 5 seconds (configurable)
- **Timeout**: Polls for up to 5 minutes (60 attempts × 5 seconds)
- Video URLs are returned directly upon successful generation

## Advanced Usage

### Manual Task Polling (Optional)

If you need more control over the polling process:

```typescript
import { querySeedanceTask, pollSeedanceTask } from '../services/seedanceService';

// Create task and get task ID manually
const response = await fetch('/api/seedance', {
  method: 'POST',
  body: JSON.stringify({ model: 'seedance-1-0-pro-250528', content: [...] })
});
const { id: taskId } = await response.json();

// Query task status once
const status = await querySeedanceTask(taskId);
console.log('Task status:', status.status);

// Or poll with custom settings (120 attempts × 3 seconds = 6 minutes)
const videoUrl = await pollSeedanceTask(taskId, 120, 3000);
```
