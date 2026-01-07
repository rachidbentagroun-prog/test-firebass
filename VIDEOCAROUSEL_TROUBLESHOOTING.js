/**
 * Video Carousel Troubleshooting Guide
 * Debug common issues with autoplay, loading, and browser compatibility
 */

// ============================================================================
// ISSUE 1: Video appears blank/empty
// ============================================================================

// Diagnosis
const testVideoLoad = async (videoUrl: string) => {
  console.log('🔍 Testing video URL:', videoUrl);
  
  try {
    // Step 1: Check if URL is accessible
    const headResponse = await fetch(videoUrl, { method: 'HEAD' });
    console.log('  ✓ URL accessible:', headResponse.status);
    console.log('  ✓ Content-Type:', headResponse.headers.get('content-type'));
    console.log('  ✓ Content-Length:', headResponse.headers.get('content-length'));
    
    // Step 2: Check CORS headers
    const corsHeader = headResponse.headers.get('access-control-allow-origin');
    if (corsHeader) {
      console.log('  ✓ CORS enabled:', corsHeader);
    } else {
      console.warn('  ⚠️ No CORS headers (video may not play)');
    }
    
    // Step 3: Test actual video element
    const video = document.createElement('video');
    video.src = videoUrl;
    video.addEventListener('loadstart', () => console.log('  ✓ Video loading started'));
    video.addEventListener('canplay', () => console.log('  ✓ Video ready to play'));
    video.addEventListener('error', (e) => {
      console.error('  ❌ Video error:', e);
      console.log('    Error code:', video.error?.code);
      console.log('    Error message:', video.error?.message);
    });
    
    return headResponse.ok;
  } catch (error) {
    console.error('❌ URL test failed:', error);
    return false;
  }
};

// Usage
// testVideoLoad('https://your-project.supabase.co/storage/v1/object/public/ai-video-previews/preview-1.mp4');

// ============================================================================
// ISSUE 2: Autoplay doesn't work
// ============================================================================

const testAutoplay = () => {
  console.log('🔍 Testing autoplay compatibility');
  
  // Create a test video element
  const video = document.createElement('video');
  video.muted = true;  // ← This is REQUIRED
  video.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28ymp4';
  
  const playPromise = video.play();
  
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log('✅ Autoplay works on this browser!');
        console.log('  - Browser: ' + navigator.userAgent.split('(')[1]);
        console.log('  - Supports muted autoplay: YES');
      })
      .catch((error) => {
        console.warn('⚠️ Autoplay blocked:', error.name);
        console.log('  - Browser: ' + navigator.userAgent.split('(')[1]);
        console.log('  - Solution: User must interact with page first');
        
        // Add fallback
        document.addEventListener('click', () => {
          video.play().then(() => console.log('  ✓ Video playing after user interaction'));
        }, { once: true });
      });
  } else {
    console.log('⚠️ Old browser (IE/Edge < 79) - autoplay may not work');
  }
};

// Usage
// testAutoplay();

// ============================================================================
// ISSUE 3: Video won't play on iOS/Safari
// ============================================================================

const iOSVideoFix = () => {
  console.log('📱 Applying iOS fixes...');
  
  // Get all videos
  const videos = document.querySelectorAll('video');
  
  videos.forEach((video) => {
    // Required for iOS
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    
    // Optional but helpful
    if (!video.hasAttribute('muted')) {
      video.setAttribute('muted', '');
    }
    
    console.log('✓ Applied iOS fixes to:', video.src);
  });
};

// Call after DOM is ready
// iOSVideoFix();

// ============================================================================
// ISSUE 4: CORS error in console
// ============================================================================

// Example error:
// Access to XMLHttpRequest at 'https://drive.google.com/...' from origin 'https://yoursite.com' 
// has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.

// Solution checklist:
const corsFix = {
  '1. Check video URL': {
    '❌ Wrong': 'https://drive.google.com/file/d/1AON4YybKQGq1eEHBygC3lSk0wPn3E3_w/view',
    '✅ Correct': 'https://your-project.supabase.co/storage/v1/object/public/ai-video-previews/preview-1.mp4'
  },
  
  '2. Verify Supabase bucket is PUBLIC': {
    'Location': 'Supabase → Storage → ai-video-previews → Settings',
    'Policy': 'Public (RLS disabled)'
  },
  
  '3. Test CORS headers': {
    'Browser DevTools': 'Network → Select video → Response Headers',
    'Look for': 'access-control-allow-origin: *'
  },
  
  '4. If still failing': {
    'Option A': 'Set up CORS proxy (see VIDEOCAROUSEL_GUIDE.md)',
    'Option B': 'Use different CDN (Cloudinary has built-in CORS)'
  }
};

// ============================================================================
// ISSUE 5: Video stutters or buffers
// ============================================================================

const videoPerformanceCheck = () => {
  console.log('📊 Video Performance Check');
  
  const video = document.querySelector('video');
  if (!video) return;
  
  let lastBufferedTime = 0;
  
  video.addEventListener('progress', () => {
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      const percent = (bufferedEnd / video.duration) * 100;
      
      if (bufferedEnd !== lastBufferedTime) {
        console.log(`📥 Buffered: ${percent.toFixed(1)}%`);
        lastBufferedTime = bufferedEnd;
      }
    }
  });
  
  video.addEventListener('stalled', () => {
    console.warn('⚠️ Stalled (waiting for more data)');
  });
  
  video.addEventListener('waiting', () => {
    console.warn('⏸ Waiting for data to play');
  });
  
  video.addEventListener('playing', () => {
    console.log('▶️ Playing smoothly');
  });
};

// ============================================================================
// ISSUE 6: "NotAllowedError: play() request was interrupted"
// ============================================================================

// This happens when autoplay starts, then pause is called before it finishes
// Fix:

const safeVideoControl = () => {
  const video = document.querySelector('video');
  if (!video) return;
  
  // Instead of immediate play/pause, wait for the promise
  const play = () => {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('✓ Video playing');
      }).catch((error) => {
        console.error('❌ Autoplay prevented:', error);
      });
    }
  };
  
  const pause = () => {
    // Always safe to pause
    video.pause();
    console.log('⏸ Video paused');
  };
  
  return { play, pause };
};

// ============================================================================
// ISSUE 7: Mobile video not filling container
// ============================================================================

const mobileVideoFix = () => {
  const videos = document.querySelectorAll('video');
  
  videos.forEach((video) => {
    // Fix CSS
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';      // Fill container
    video.style.objectPosition = 'center'; // Center the video
    
    // Ensure parent has correct dimensions
    const parent = video.parentElement;
    if (parent) {
      parent.style.width = '100%';
      parent.style.height = '100%';
      parent.style.overflow = 'hidden';
      parent.style.position = 'relative';
    }
  });
};

// ============================================================================
// ISSUE 8: Video showing infinite loading spinner
// ============================================================================

const debugVideoLoading = (video: HTMLVideoElement) => {
  console.log('🔍 Video Loading States:');
  
  const states = {
    networkState: ['NETWORK_EMPTY', 'NETWORK_IDLE', 'NETWORK_LOADING', 'NETWORK_NO_SOURCE'][video.networkState],
    readyState: ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'][video.readyState],
    buffered: video.buffered.length > 0 ? video.buffered.end(0) : 0,
    duration: video.duration,
    src: video.src
  };
  
  console.table(states);
  
  // Common fixes:
  if (video.networkState === 0) {
    console.warn('❌ No source - check src attribute');
  }
  if (video.readyState === 0) {
    console.warn('❌ Metadata not loaded - waiting for server');
  }
};

// ============================================================================
// BONUS: Quick Test Page
// ============================================================================

const createTestPage = () => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Video Carousel Debug</title>
      <style>
        body { font-family: monospace; background: #1a1a1a; color: #fff; padding: 20px; }
        .test { margin: 20px 0; padding: 10px; background: #2a2a2a; border-radius: 5px; }
        .success { color: #4ade80; }
        .error { color: #f87171; }
        .warning { color: #fbbf24; }
        video { max-width: 100%; border: 2px solid #4a5568; margin: 10px 0; }
      </style>
    </head>
    <body>
      <h1>Video Carousel Debugger</h1>
      
      <div class="test">
        <h3>Test 1: Can you access your video URL?</h3>
        <input id="videoUrl" placeholder="Paste your video URL here" style="width: 100%; padding: 10px;">
        <button onclick="testVideoLoad(document.getElementById('videoUrl').value)">Test URL</button>
        <div id="test1-result"></div>
      </div>
      
      <div class="test">
        <h3>Test 2: Does autoplay work?</h3>
        <video id="testVideo" controls style="max-width: 100%;">
          <source src="" type="video/mp4">
        </video>
        <button onclick="testAutoplay()">Check Autoplay</button>
        <div id="test2-result"></div>
      </div>
      
      <div class="test">
        <h3>Test 3: Video Loading State</h3>
        <div id="loadingState"></div>
      </div>
      
      <script>
        const log = (id, html) => {
          document.getElementById(id).innerHTML = html;
        };
        
        const testVideoLoad = async (url) => {
          log('test1-result', '⏳ Testing...');
          if (!url) {
            log('test1-result', '<p class="error">❌ Enter a URL first</p>');
            return;
          }
          
          try {
            const r = await fetch(url, { method: 'HEAD' });
            const html = \`
              <p class="success">✅ URL accessible</p>
              <p>Status: \${r.status}</p>
              <p>Type: \${r.headers.get('content-type')}</p>
              <p>Size: \${(r.headers.get('content-length') / 1024 / 1024).toFixed(2)} MB</p>
              <p>CORS: \${r.headers.get('access-control-allow-origin') || '⚠️ Not set'}</p>
            \`;
            log('test1-result', html);
          } catch (e) {
            log('test1-result', '<p class="error">❌ ' + e.message + '</p>');
          }
        };
        
        const testAutoplay = () => {
          const v = document.getElementById('testVideo');
          v.muted = true;
          const p = v.play();
          if (p !== undefined) {
            p.then(() => {
              log('test2-result', '<p class="success">✅ Autoplay works!</p>');
            }).catch(e => {
              log('test2-result', '<p class="error">❌ ' + e.name + ': User interaction needed</p>');
            });
          }
        };
        
        const updateLoadingState = () => {
          const v = document.getElementById('testVideo');
          const states = [
            'networkState: ' + ['EMPTY', 'IDLE', 'LOADING', 'NO_SOURCE'][v.networkState],
            'readyState: ' + ['NOTHING', 'METADATA', 'CURRENT_DATA', 'FUTURE_DATA', 'ENOUGH_DATA'][v.readyState],
            'buffered: ' + (v.buffered.length ? v.buffered.end(0).toFixed(2) + 's' : 'none'),
            'currentTime: ' + v.currentTime.toFixed(2) + 's',
            'duration: ' + (v.duration ? v.duration.toFixed(2) + 's' : 'unknown')
          ].join('<br>');
          log('loadingState', states);
        };
        
        setInterval(updateLoadingState, 500);
      </script>
    </body>
    </html>
  `;
};

export { testVideoLoad, testAutoplay, iOSVideoFix, safeVideoControl, debugVideoLoading, createTestPage };
