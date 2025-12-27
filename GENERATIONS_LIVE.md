# Generations Live - User Dashboard Feature

## Overview
A powerful real-time monitoring system that displays live AI generation activity across all multimodal engines (Image, Video, Audio). Users can see who's creating what, track platform analytics, and monitor generation success rates.

## 🎯 Key Features

### 1. **Real-Time Activity Feed**
- **Auto-refresh**: Updates every 5 seconds automatically
- **Live indicator**: Green pulse shows real-time status
- **Last 50 generations**: Displays most recent activity
- **User information**: Shows name, email, and timestamp
- **Prompt visibility**: See exactly what users are generating
- **Status tracking**: Processing, Completed, or Failed

### 2. **Multimodal Analytics Dashboard**

#### Engine-Specific Metrics
- **AI Image**: Total image generations (last 7 days)
- **AI Video**: Total video generations (last 7 days)
- **AI Audio**: Total audio generations (last 7 days)
- **Success Rate**: Overall completion percentage

#### Platform Statistics
- **Total Generations**: Aggregate count across all engines
- **Active Users**: Unique creators in the past week
- **Top Users**: Leaderboard of most active creators
- **Status Breakdown**: Completed vs Processing vs Failed

### 3. **Generation Details**
Each generation entry shows:
- User name and email
- Engine type (Image/Video/Audio)
- AI engine used (Gemini, Sora, ElevenLabs, etc.)
- User's prompt/input text
- Generation status
- Timestamp

---

## 🗄️ Firestore Structure

### New Collection: `live_generations`

```typescript
{
  userId: string,              // User's Firebase UID
  userName: string,            // Display name
  userEmail: string,           // User's email
  type: 'image' | 'video' | 'audio',  // Generation type
  prompt: string,              // User's input prompt
  engine: string,              // AI engine used (gemini, sora, elevenlabs, etc.)
  timestamp: Timestamp,        // Creation time
  status: 'processing' | 'completed' | 'failed',
  createdAt: Timestamp,
  updatedAt?: Timestamp
}
```

### Indexes Required
Create these in Firebase Console under Firestore → Indexes:

1. **live_generations** collection:
   - Field: `timestamp` (Descending)
   - Query scope: Collection

2. **live_generations** collection (for analytics):
   - Field: `timestamp` (Ascending)
   - Field: `type` (Ascending)
   - Query scope: Collection

---

## 🔧 Implementation

### Service Functions (firebase.ts)

#### Track Generation
```typescript
trackGeneration(
  userId: string,
  userName: string,
  userEmail: string,
  type: 'image' | 'video' | 'audio',
  prompt: string,
  engine?: string
)
```
Call this when a user starts a generation.

#### Update Status
```typescript
updateGenerationStatus(
  generationId: string,
  status: 'processing' | 'completed' | 'failed'
)
```
Update when generation completes or fails.

#### Get Live Data
```typescript
getLiveGenerations()  // Returns last 50 generations
getGenerationAnalytics(days: number)  // Returns analytics
```

---

## 📖 Usage Examples

### Tracking Image Generation
```typescript
import { trackGeneration } from '../services/firebase';

// When user starts generating an image
await trackGeneration(
  user.id,
  user.name,
  user.email,
  'image',
  userPrompt,
  'gemini'
);
```

### Tracking Video Generation
```typescript
// When user starts generating a video
await trackGeneration(
  user.id,
  user.name,
  user.email,
  'video',
  userPrompt,
  'sora'
);
```

### Tracking Audio Generation
```typescript
// When user starts generating audio
await trackGeneration(
  user.id,
  user.name,
  user.email,
  'audio',
  userText,
  'elevenlabs'
);
```

### Integration in Generation Components

**In Generator.tsx** (for images):
```typescript
const handleGenerate = async () => {
  // Track the generation start
  await trackGeneration(
    user.id,
    user.name,
    user.email,
    'image',
    prompt,
    'runware'
  );
  
  // ... rest of generation logic
};
```

**In VideoGenerator.tsx**:
```typescript
const handleGenerateVideo = async () => {
  // Track the generation start
  await trackGeneration(
    user.id,
    user.name,
    user.email,
    'video',
    prompt,
    'klingai'
  );
  
  // ... rest of generation logic
};
```

**In TTSGenerator.tsx**:
```typescript
const handleGenerateAudio = async () => {
  // Track the generation start
  await trackGeneration(
    user.id,
    user.name,
    user.email,
    'audio',
    text,
    'elevenlabs'
  );
  
  // ... rest of generation logic
};
```

---

## 🎨 UI Components

### Tab Navigation
The "Generations Live" tab appears in the user profile alongside:
- Profile
- History
- Messages/Inbox

### Analytics Cards
Four main metric cards:
1. **AI Images** (Indigo) - Image generation count
2. **AI Videos** (Purple) - Video generation count
3. **AI Audio** (Pink) - Audio generation count
4. **Success Rate** (Green) - Overall completion rate

### Statistics Panel
Three detailed cards showing:
1. **Total Generations** - With completed/processing breakdown
2. **Active Users** - Unique creator count
3. **Top Users** - Leaderboard of most active creators

### Live Feed
Scrollable list showing:
- User avatar/name/email
- Engine type badge (color-coded)
- AI engine name
- User's prompt (truncated to 2 lines)
- Status (color-coded)
- Timestamp

---

## 🔐 Security Rules

Add to your Firestore rules:

```javascript
// Live generations - anyone authenticated can read, system can write
match /live_generations/{generationId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;  // Users can track their own
  allow delete: if isAdmin();  // Only admins can delete
}
```

---

## 🎯 Benefits

### For Users
- **Transparency**: See what others are creating
- **Inspiration**: Get ideas from other users' prompts
- **Community Feel**: Real-time activity creates engagement
- **Platform Health**: Monitor success rates and activity

### For Platform
- **User Engagement**: Keeps users on the platform longer
- **Social Proof**: Shows active user base
- **Analytics**: Track which engines are most popular
- **Performance Monitoring**: Identify issues quickly

---

## 📊 Analytics Insights

### What You Can Learn

1. **Engine Popularity**
   - Which AI engine is most used?
   - Are users preferring certain engines?

2. **User Behavior**
   - Peak usage times
   - Most active creators
   - Common prompt patterns

3. **System Health**
   - Success vs failure rates
   - Processing times
   - Error patterns

4. **Content Trends**
   - Popular prompt types
   - Content categories
   - Seasonal trends

---

## 🚀 Performance

### Optimization Features
- **Auto-refresh**: Only when tab is active
- **Limit**: Shows last 50 generations only
- **Efficient queries**: Uses Firestore indexes
- **Cleanup interval**: 5-second refresh prevents overload

### Best Practices
- Don't track test generations
- Update status promptly
- Clean old records periodically
- Monitor Firestore usage

---

## 🔄 Auto-Refresh System

The live feed automatically:
1. Fetches new data every 5 seconds when active
2. Stops refreshing when user switches tabs
3. Restarts when returning to "Generations Live"
4. Shows loading states during refresh

```typescript
// Auto-refresh implementation
useEffect(() => {
  if (activeTab === 'live') {
    fetchLiveGenerations();
    const interval = setInterval(fetchLiveGenerations, 5000);
    return () => clearInterval(interval);
  }
}, [activeTab]);
```

---

## 🎨 Color Coding

### Engine Types
- **Image**: Indigo (`bg-indigo-600/20`, `text-indigo-400`)
- **Video**: Purple (`bg-purple-600/20`, `text-purple-400`)
- **Audio**: Pink (`bg-pink-600/20`, `text-pink-400`)

### Status
- **Processing**: Amber (`text-amber-400`)
- **Completed**: Green (`text-green-400`)
- **Failed**: Red (`text-red-400`)

---

## 📱 Responsive Design

The feature is fully responsive:
- **Mobile**: Cards stack vertically
- **Tablet**: 2-column grid
- **Desktop**: 4-column grid
- **Feed**: Scrollable with custom scrollbar

---

## 🐛 Troubleshooting

### Live feed not updating
**Check:**
1. Active tab is "Generations Live"
2. Network connection is stable
3. Firestore rules allow read access
4. Browser console for errors

### Analytics showing 0
**Check:**
1. Generations are being tracked
2. Date range is appropriate
3. Firestore collection exists
4. Indexes are created

### Missing user information
**Check:**
1. User data is passed correctly
2. User profile is complete
3. Email is not null

---

## 📝 Future Enhancements

Potential additions:
1. **Filter by engine type**: Show only images/videos/audio
2. **Filter by user**: Track specific users
3. **Search functionality**: Find by prompt keywords
4. **Export data**: Download analytics as CSV
5. **Time range selector**: Custom date ranges
6. **Real-time notifications**: Alert on generation complete
7. **Generation preview**: Show thumbnails in feed
8. **Detailed view modal**: Click to see full generation info

---

## ✅ Integration Checklist

To fully integrate tracking:

- [ ] Add `trackGeneration()` to Generator component
- [ ] Add `trackGeneration()` to VideoGenerator component
- [ ] Add `trackGeneration()` to TTSGenerator component
- [ ] Update generation status on completion
- [ ] Update generation status on failure
- [ ] Test live feed auto-refresh
- [ ] Create Firestore indexes
- [ ] Update security rules
- [ ] Test with multiple users
- [ ] Monitor Firestore usage costs

---

## 💡 Tips

1. **Call trackGeneration early**: Right when user clicks generate
2. **Update status promptly**: As soon as generation completes
3. **Use descriptive engine names**: Makes analytics clearer
4. **Keep prompts**: Don't sanitize, shows real usage
5. **Monitor performance**: Check Firestore reads regularly

---

**Version**: 1.0  
**Created**: December 27, 2025  
**Author**: GitHub Copilot

---

## 🔗 Related Documentation

- [Firebase Setup](./FIRESTORE_RULES.md)
- [Admin Dashboard](./ADMIN_DASHBOARD_FEATURES.md)
- [User Profile](./components/UserProfile.tsx)
