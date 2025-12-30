# Seedance Polling Timeout - Diagnosis Guide

## Changes Made

1. **Increased Polling Timeout**: Now polls for 10 minutes (120 attempts) instead of 5 minutes
2. **Added Detailed Logging**: Browser console will show exact status at each polling step
3. **Better Error Handling**: Distinguishes between task errors and network errors
4. **Support for More Statuses**: Added 'success' and 'error' status handling

## How to Diagnose the Issue

When you generate a video with Seedance 1.0 Pro, open the **Browser Developer Console** (F12) and look for logs like:

```
[Seedance] Creating task with request: {...}
[Seedance] Task creation response: {id: "xxx", status: "pending"}
[Seedance] Task created successfully! ID: xxx
[Seedance] Starting polling for video generation...
[Seedance Polling] Starting to poll task xxx. Max attempts: 120, interval: 5000ms
[Seedance Polling] Attempt 1/120: Status = pending
[Seedance Polling] Attempt 2/120: Status = processing
[Seedance Polling] Attempt 3/120: Status = processing
...
[Seedance Polling] Task completed successfully! Video URL: https://...
```

## Troubleshooting

### Scenario 1: Task Created but Never Moves from "pending"
- The API might be queued. This is normal.
- The 10-minute timeout should handle this.
- Check if the API credentials are correct in `.env`

### Scenario 2: Task Always Returns "processing"
- The video generation is taking longer than expected
- The 10-minute timeout should handle this
- Bytedance videos can take several minutes to generate

### Scenario 3: Task Returns "failed" or "error"
- Check the error message in the logs
- This could be due to:
  - Invalid prompt
  - Unsupported parameters
  - API rate limiting
  - Invalid API credentials

### Scenario 4: Still Getting Timeout After 10 Minutes
- The video generation is taking longer than 10 minutes
- Try generating a shorter video (5 seconds instead of 10)
- Check Bytedance API documentation for maximum generation times
- Consider implementing a manual task status checker

## How to Check Task Status Manually

If you get a timeout, you can manually check the task status using the browser console:

```javascript
// Get the task ID from the logs
const taskId = 'paste-task-id-from-logs';

// Check the task status
const response = await fetch(`/api/seedance/${taskId}`);
const status = await response.json();
console.log('Task status:', status);
```

## Network Request Flow

1. **POST /api/seedance** → Creates task
   - Response: `{id: "task-123", status: "pending"}`

2. **GET /api/seedance/task-123** → Queries status (repeats every 5 seconds)
   - Response: `{id: "task-123", status: "processing"}`

3. After status changes to "completed" or "success":
   - Response includes `video_url` or `url` field

## Testing with Curl

```bash
# Create task
curl -X POST http://localhost:3000/api/seedance \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance-1-0-pro-250528",
    "content": [{
      "type": "text",
      "text": "A simple test --duration 5"
    }]
  }'

# The response should contain an id. Use it to query status:
curl -X GET http://localhost:3000/api/seedance/{task-id}
```

## Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Timeout after 10 min | Video too long | Try 5-second videos |
| Task stays pending | API overload | Wait and retry |
| Task fails immediately | Invalid prompt | Check prompt format |
| 405 Method Not Allowed | Wrong HTTP method | Ensure POST for create |
| 500 Server Error | Missing API key | Check .env file |

## Configuration Options

To customize polling behavior, modify in `seedanceService.ts`:

```typescript
// Default: 120 attempts × 5 seconds = 10 minutes
return await pollSeedanceTask(taskId, 120, 5000);

// For shorter timeout (5 minutes):
return await pollSeedanceTask(taskId, 60, 5000);

// For longer timeout (15 minutes):
return await pollSeedanceTask(taskId, 180, 5000);

// For faster polling (check every 2 seconds):
return await pollSeedanceTask(taskId, 300, 2000);
```

## Next Steps

1. Try generating a video and check the browser console logs
2. Share the console logs if you're still getting timeout errors
3. The logs will tell us exactly where the process is stuck
4. We can then adjust the polling configuration based on actual Bytedance API response times
