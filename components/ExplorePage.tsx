import React from 'react';
import { GeneratedImage, GeneratedVideo, SiteConfig, User } from '../types';
import { Compass, Image as ImageIcon, Video as VideoIcon, Sparkles, Play, Maximize2 } from 'lucide-react';

interface ExplorePageProps {
  user: User | null;
  images: GeneratedImage[];
  videos: GeneratedVideo[];
  siteConfig: SiteConfig;
  onNavigate: (page: string) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ user, images, videos, siteConfig, onNavigate }) => {
  // Keep refs to videos so we can control playback reliably
  const videoRefs = React.useRef<Record<string, HTMLVideoElement | null>>({});
  const iframeRefs = React.useRef<Record<string, HTMLIFrameElement | null>>({});
  const [validVideos, setValidVideos] = React.useState<Array<{ id: string; url: string; prompt?: string }>>([]);
  // Rich sample library (fallbacks when user has no assets)
  const sampleImages: string[] = (
    (siteConfig.showcaseImages && siteConfig.showcaseImages.length > 0)
      ? siteConfig.showcaseImages
      : (siteConfig.slideshow || [])
  ).concat([
    'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'https://images.pexels.com/photos/1133957/pexels-photo-1133957.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'https://images.pexels.com/photos/1287075/pexels-photo-1287075.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'https://images.pexels.com/photos/3075993/pexels-photo-3075993.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'https://images.pexels.com/photos/1434580/pexels-photo-1434580.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg?auto=compress&cs=tinysrgb&w=1920',
  ]);

  const sampleVideos: string[] = (
    [siteConfig.videoLab?.hero.videoUrl, siteConfig.videoLab?.scriptToCinema.videoUrl].filter(Boolean) as string[]
  ).concat([
    'https://cdn.pixabay.com/video/2020/05/17/40742-423033758_large.mp4',
    'https://cdn.pixabay.com/video/2021/08/10/84944-591189040_large.mp4',
    'https://cdn.pixabay.com/video/2022/11/07/138620-770015996_large.mp4',
    'https://cdn.pixabay.com/video/2019/06/19/24689-341672183_large.mp4',
    'https://cdn.pixabay.com/video/2022/02/28/109746-684078626_large.mp4',
    'https://cdn.pixabay.com/video/2021/04/05/69617-533759268_large.mp4',
  ]);

  const hasUserImages = images && images.length > 0;
  const hasUserVideos = videos && videos.length > 0;

  const displayImages: Array<{ id: string; url: string; prompt?: string }>= hasUserImages
    ? images.map(img => ({ id: img.id, url: img.url, prompt: img.prompt }))
    : sampleImages.map((url, i) => ({ id: `sample_img_${i}`, url }));

  const displayVideos: Array<{ id: string; url: string; prompt?: string }>= hasUserVideos
    ? videos.map(v => ({ id: v.id, url: v.url, prompt: v.prompt }))
    : sampleVideos.map((url, i) => ({ id: `sample_vid_${i}`, url }));

  // Featured videos in 9:16 aspect ratio (portrait)
  const featuredVideos: Array<{ id: string; url: string; title: string }> = [
    { id: 'featured_1', url: 'https://drive.google.com/uc?export=download&id=1mFU7sTQCPo84WK6aM6BfU26M-CcJbeZJ', title: 'Temporal Sequence 1' },
    { id: 'featured_2', url: 'https://drive.google.com/uc?export=download&id=1nJOHLUU84IGSd4REkT_fJiZ4OYMyvieo', title: 'Temporal Sequence 2' },
    { id: 'featured_3', url: 'https://drive.google.com/uc?export=download&id=1AON4YybKQGq1eEHBygC3lSk0wPn3E3_w', title: 'Temporal Sequence 3' },
    { id: 'featured_4', url: 'https://drive.google.com/uc?export=download&id=1u4r_VQHzWGJbcbiYOSRN1momoq6UmS3Y', title: 'Temporal Sequence 4' },
    { id: 'featured_5', url: 'https://drive.google.com/uc?export=download&id=1XhGbhFNSQIR336RUHKo7SV037asRuePq', title: 'Temporal Sequence 5' },
    { id: 'featured_6', url: 'https://drive.google.com/uc?export=download&id=1lZqtqyO8wLE_bZpCegPsnHOSBrzvDMdS', title: 'Temporal Sequence 6' },
    { id: 'featured_7', url: 'https://drive.google.com/uc?export=download&id=1ikLFKwV-2kMUKBnPPjlYU7i3MOZwJex7', title: 'Temporal Sequence 7' },
    { id: 'featured_8', url: 'https://drive.google.com/uc?export=download&id=1sjtL87kAAKcqj0asJnaecch8vW8UEMNX', title: 'Temporal Sequence 8' },
  ];

  // Curated embeds from official vendor channels (YouTube/Vimeo)
  const curatedEmbeds: Array<{ id: string; vendor: string; title: string; embedUrl: string }>= [
    { id: 'HK6y8DAPN_0', vendor: 'OpenAI', title: 'OpenAI Sora - Official First Look', embedUrl: 'https://www.youtube.com/embed/HK6y8DAPN_0?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=HK6y8DAPN_0&modestbranding=1&rel=0' },
    { id: 'U7Q0uD5pxdY', vendor: 'Runway', title: 'Runway Gen-2 Demo Reel', embedUrl: 'https://www.youtube.com/embed/U7Q0uD5pxdY?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=U7Q0uD5pxdY&modestbranding=1&rel=0' },
    { id: 'aflH0dKNoW0', vendor: 'Runway', title: 'Runway Gen-3 Alpha Announcement', embedUrl: 'https://www.youtube.com/embed/aflH0dKNoW0?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=aflH0dKNoW0&modestbranding=1&rel=0' },
    { id: 'eXm9Tj5L0ns', vendor: 'Pika', title: 'Pika 1.0 Launch Video', embedUrl: 'https://www.youtube.com/embed/eXm9Tj5L0ns?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=eXm9Tj5L0ns&modestbranding=1&rel=0' },
    { id: 'hmEYx70N1hw', vendor: 'Luma AI', title: 'Luma AI Dream Machine Demo', embedUrl: 'https://www.youtube.com/embed/hmEYx70N1hw?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=hmEYx70N1hw&modestbranding=1&rel=0' },
    { id: 'lD9X1l6KmfI', vendor: 'Google DeepMind', title: 'Google Veo Video Generation', embedUrl: 'https://www.youtube.com/embed/lD9X1l6KmfI?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=lD9X1l6KmfI&modestbranding=1&rel=0' },
    { id: '0akzix8Y4lY', vendor: 'Kling AI', title: 'Kling AI Official Demo', embedUrl: 'https://www.youtube.com/embed/0akzix8Y4lY?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=0akzix8Y4lY&modestbranding=1&rel=0' },
    { id: 'QWfaZUgT9wU', vendor: 'Kling AI', title: 'Kling AI Extended Showcase', embedUrl: 'https://www.youtube.com/embed/QWfaZUgT9wU?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=QWfaZUgT9wU&modestbranding=1&rel=0' },
    { id: '6B0s2x-AIxw', vendor: 'Stability AI', title: 'Stable Video Diffusion', embedUrl: 'https://www.youtube.com/embed/6B0s2x-AIxw?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=6B0s2x-AIxw&modestbranding=1&rel=0' },
    { id: 'ftJAaNVSLiI', vendor: 'OpenAI', title: 'OpenAI Sora - Extended', embedUrl: 'https://www.youtube.com/embed/ftJAaNVSLiI?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=ftJAaNVSLiI&modestbranding=1&rel=0' },
    { id: 'c5X2MvPnbH4', vendor: 'Pika', title: 'Pika 1.5 Feature Showcase', embedUrl: 'https://www.youtube.com/embed/c5X2MvPnbH4?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=c5X2MvPnbH4&modestbranding=1&rel=0' },
    { id: 'G1GUpwC5FXs', vendor: 'Google DeepMind', title: 'VideoPoet Demonstration', embedUrl: 'https://www.youtube.com/embed/G1GUpwC5FXs?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=G1GUpwC5FXs&modestbranding=1&rel=0' }
  ];

  // Autoplay/pause videos as they enter/leave viewport (saves CPU and ensures they "work")
  React.useEffect(() => {
    const entries = Object.values(videoRefs.current).filter(Boolean) as HTMLVideoElement[];
    if (entries.length === 0) return;

    const io = new IntersectionObserver((obs) => {
      obs.forEach(async (entry) => {
        const el = entry.target as HTMLVideoElement;
        try {
          if (entry.isIntersecting) {
            await el.play().catch(() => {});
          } else {
            el.pause();
          }
        } catch {}
      });
    }, { threshold: 0.25 });

    entries.forEach(v => io.observe(v));
    return () => io.disconnect();
  }, [validVideos.length]);

  // Lazy-load YouTube/Vimeo embeds when they enter viewport
  React.useEffect(() => {
    const entries = Object.values(iframeRefs.current).filter(Boolean) as HTMLIFrameElement[];
    if (entries.length === 0) return;

    const io = new IntersectionObserver((obs) => {
      obs.forEach((entry) => {
        const el = entry.target as HTMLIFrameElement;
        const dataSrc = el.getAttribute('data-src');
        if (entry.isIntersecting && dataSrc && !el.src) {
          el.src = dataSrc;
        }
      });
    }, { threshold: 0.2 });

    entries.forEach(f => io.observe(f));
    return () => io.disconnect();
  }, [curatedEmbeds.length]);

  // Validate candidate videos and keep only those that load metadata within timeout
  React.useEffect(() => {
    let isCancelled = false;
    const timeoutMs = 5000;

    const checkVideo = (url: string) => new Promise<boolean>((resolve) => {
      try {
        const el = document.createElement('video');
        el.muted = true; // helps autoplay policies even for metadata
        el.preload = 'metadata';
        const onReady = () => { cleanup(); resolve(true); };
        const onError = () => { cleanup(); resolve(false); };
        const cleanup = () => {
          el.removeEventListener('loadedmetadata', onReady);
          el.removeEventListener('canplay', onReady);
          el.removeEventListener('error', onError);
          try { el.src = ''; } catch {}
        };
        el.addEventListener('loadedmetadata', onReady);
        el.addEventListener('canplay', onReady);
        el.addEventListener('error', onError);
        el.src = url;
        // Timeout
        window.setTimeout(() => { onError(); }, timeoutMs);
      } catch {
        resolve(false);
      }
    });

    (async () => {
      const candidates = displayVideos;
      const results = await Promise.all(candidates.map(c => checkVideo(c.url)));
      if (isCancelled) return;
      const filtered = candidates.filter((_, i) => results[i]);
      setValidVideos(filtered);
    })();

    return () => { isCancelled = true; };
  }, [displayVideos.map(v => v.url).join('|')]);

  return (
    <section className="min-h-screen bg-dark-950">
      {/* Local styles for marquee/float animations */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes floaty {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .marquee-track {
          display: flex;
          width: 200%;
          animation: marquee 30s linear infinite;
        }
        .floaty {
          animation: floaty 6s ease-in-out infinite;
        }
      `}</style>
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]" />
          <div className="absolute -bottom-24 -right-24 w-[32rem] h-[32rem] bg-purple-600/10 rounded-full blur-[140px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
              <Compass className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Discovery Hub</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight italic">
            Explore Our AI Engines
          </h1>
          <p className="mt-4 text-gray-400 max-w-2xl font-medium">
            A living gallery showcasing the capabilities of our Image and Video engines. Hover to feel the motion. Click to dive deeper.
          </p>
          <div className="mt-6 flex gap-3">
            <button onClick={() => onNavigate('dashboard')} className="px-5 py-3 rounded-xl bg-white text-dark-950 font-bold text-sm hover:bg-gray-100 transition-colors">
              Start Creating
            </button>
            <button onClick={() => onNavigate('pricing')} className="px-5 py-3 rounded-xl bg-white/5 text-white border border-white/10 font-bold text-sm hover:bg-white/10 transition-colors">
              View Pricing
            </button>
          </div>
        </div>
      </div>

      {/* Featured Videos Section - Portrait 9:16 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-b border-white/10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <VideoIcon className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Featured Videos</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white italic">Temporal Sequences</h2>
          </div>
          <button onClick={() => onNavigate('video-lab-landing')} className="text-sm font-bold text-indigo-400 hover:text-white transition-colors">Open Video Lab →</button>
        </div>
        
        {/* Featured Videos Slideshow - 9:16 Portrait */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 mb-16">
          <div className="marquee-track">
            {[...featuredVideos, ...featuredVideos].map((vid, i) => (
              <div key={`featured_${i}`} className="w-[280px] mr-4 rounded-xl overflow-hidden bg-black/40 border border-white/5 hover:border-purple-500/30 transition-all group cursor-pointer" onClick={() => onNavigate('video-lab-landing')}>
                <div className="aspect-[9/16] relative">
                  <video
                    ref={(el) => { videoRefs.current[`featured_${i}_${vid.id}`] = el; }}
                    src={vid.url}
                    loop
                    muted
                    playsInline
                    autoPlay
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 rounded-full text-[8px] font-black tracking-widest bg-purple-600/30 border border-purple-500/30 text-purple-200 uppercase backdrop-blur-sm">Featured</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-[10px] font-black uppercase tracking-wider truncate">{vid.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Videos Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <VideoIcon className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">User Generated</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white italic">Community Videos</h2>
          </div>
          <button onClick={() => onNavigate('video-lab-landing')} className="text-sm font-bold text-indigo-400 hover:text-white transition-colors">Open Video Lab →</button>
        </div>
        {displayVideos.length === 0 ? (
          <div className="text-gray-600 text-sm">No videos to display.</div>
        ) : (
          <>
          {/* Auto-playing hero strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-10">
            {validVideos.slice(0, 6).map((v, idx) => (
              <div key={v.id} className="group relative rounded-[2rem] overflow-hidden bg-dark-900 border border-white/5 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer" onClick={() => onNavigate('video-lab-landing')}>
                <div className="aspect-video relative overflow-hidden">
                  <video
                    ref={(el) => { videoRefs.current[`grid_${v.id}`] = el; }}
                    src={v.url}
                    className="w-full h-full object-cover opacity-90 transition-opacity duration-300"
                    loop muted playsInline autoPlay crossOrigin="anonymous"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-[9px] font-black tracking-widest bg-white/10 border border-white/10 text-gray-300 uppercase">Veo Engine</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/10 group-hover:opacity-0 transition-opacity duration-300"><Play className="w-6 h-6 text-white fill-white" /></div>
                  </div>
                </div>
                <div className="p-6 flex items-center justify-between">
                  <p className="text-gray-400 text-xs italic truncate">{v.prompt || 'Cinematic AI preview'}</p>
                  <button onClick={() => onNavigate('video-lab-landing')} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"><Maximize2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
          {/* Continuous marquee of video thumbnails */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 mb-10">
            <div className="marquee-track">
              {[...validVideos, ...validVideos].slice(0, 12).map((v, i) => (
                <div key={`mv_${i}`} className="w-[320px] mr-4 rounded-xl overflow-hidden bg-black/40 border border-white/5">
                  <div className="aspect-video">
                    <video
                      ref={(el) => { videoRefs.current[`mq_${i}_${v.id}`] = el; }}
                      src={v.url}
                      loop muted playsInline autoPlay crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official AI Reels (YouTube embeds) */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5">
            <div className="marquee-track">
              {[...curatedEmbeds, ...curatedEmbeds].slice(0, 12).map((em, i) => (
                <div key={`me_${i}`} className="w-[360px] mr-4 rounded-xl overflow-hidden bg-black/40 border border-white/5">
                  <div className="aspect-video relative">
                    <iframe
                      ref={(el) => { iframeRefs.current[`em_${i}_${em.id}`] = el; }}
                      data-src={em.embedUrl}
                      title={`${em.vendor} • ${em.title}`}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/50 text-white text-[9px] font-black uppercase tracking-widest">
                      {em.vendor}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </>
        )}
      </div>

      {/* Images Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Featured Images</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white italic">Neural Renders</h2>
          </div>
          <button onClick={() => onNavigate('home')} className="text-sm font-bold text-indigo-400 hover:text-white transition-colors">Open Image Lab →</button>
        </div>
        {displayImages.length === 0 ? (
          <div className="text-gray-600 text-sm">No images to display.</div>
        ) : (
          <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
            {displayImages.slice(0, 12).map((img, idx) => (
              <div key={img.id} className="group relative aspect-square rounded-[1.75rem] overflow-hidden bg-dark-900 border border-white/5 shadow-xl transition-all hover:-translate-y-1 hover:border-indigo-500/30 floaty" style={{ animationDelay: `${(idx % 6) * 0.2}s` as any }}>
                <img src={img.url} alt={img.prompt || 'AI image'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-white/10 border border-white/10"><ImageIcon className="w-3.5 h-3.5 text-indigo-300" /></div>
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">TTI Engine</span>
                  </div>
                  <button onClick={() => onNavigate(user ? 'dashboard' : 'home')} className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white hover:bg-indigo-600/20">Create</button>
                </div>
              </div>
            ))}
          </div>
          {/* Image thumbnail marquee */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5">
            <div className="marquee-track">
              {[...displayImages, ...displayImages].slice(0, 16).map((img, i) => (
                <div key={`mi_${i}`} className="w-48 h-32 mr-3 rounded-xl overflow-hidden bg-black/20 border border-white/5">
                  <img src={img.url} alt="preview" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
          </>
        )}
      </div>

      {/* CTA Footer */}
      <div className="border-t border-white/10 bg-gradient-to-br from-dark-950 to-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30"><Sparkles className="w-6 h-6 text-indigo-400" /></div>
            <div>
              <h3 className="text-white font-black text-2xl italic leading-tight">Ready to create your masterpiece?</h3>
              <p className="text-gray-400">Join thousands of creators exploring new frontiers with AI.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => onNavigate(user ? 'video-generator' : 'signup')} className="px-5 py-3 rounded-xl bg-white text-dark-950 font-bold text-sm hover:bg-gray-100 transition-colors">{user ? 'Start Creating' : 'Get Started'}</button>
            <button onClick={() => onNavigate('pricing')} className="px-5 py-3 rounded-xl bg-white/5 text-white border border-white/10 font-bold text-sm hover:bg-white/10 transition-colors">View Plans</button>
          </div>
        </div>
      </div>
    </section>
  );
};
