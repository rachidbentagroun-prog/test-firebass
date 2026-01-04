import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, Play, Sparkles, Upload, X, Download, RefreshCw, AlertCircle, 
  Film, Zap, Gauge, Binary, Activity, History, RectangleHorizontal, RectangleVertical, Monitor, ChevronDown, Lock, Clock
} from 'lucide-react';
import { convertBlobToBase64 } from '../services/geminiService';
import { generateVideoWithSora } from '../services/soraService';
import { generateVideoWithSeedance } from '../services/seedanceService';
import { User, GeneratedVideo } from '../types';
import { saveVideoToFirebase, getVideosFromFirebase, deleteVideoFromFirebase } from '../services/firebase';
import { saveWorkState, getWorkState } from '../services/dbService';

interface VideoGeneratorProps {
  user: User | null;
  onCreditUsed: () => void;
  onUpgradeRequired: () => void;
  onVideoGenerated: (video: GeneratedVideo) => void;
  hasApiKey: boolean;
  onSelectKey: () => void;
  onResetKey: () => void;
}

const REASSURING_MESSAGES = [
  "Sculpting temporal frames...",
  "Synchronizing cinematic motion...",
  "Applying latent temporal consistency...",
  "Encoding high-fidelity motion vectors...",
  "Rendering visual narrative...",
  "Optimizing frame buffers...",
  "Finalizing neural sequence..."
];

const ASPECT_RATIOS: { id: '16:9' | '9:16', label: string, icon: any }[] = [
  { id: '16:9', label: '16:9 (Landscape)', icon: RectangleHorizontal },
  { id: '9:16', label: '9:16 (Portrait)', icon: RectangleVertical },
];

const QUALITIES: { id: '720p' | '1080p', label: string, desc: string, badge: string }[] = [
  { id: '720p', label: '720P', desc: 'Fast Generation', badge: 'HD' },
  { id: '1080p', label: '1080P', desc: 'High Fidelity', badge: 'FHD' },
];

const NEGATIVE_PRESETS = [
  'blurry, low quality, artifacts',
  'extra limbs, distorted faces, deformed hands',
  'text, watermark, logo, username',
  'overexposed, underexposed, noisy',
  'dull lighting, flat colors, low contrast'
];

const DURATION_OPTIONS: { id: '5s' | '10s' | '15s' | '60s', label: string }[] = [
  { id: '5s', label: '5S' },
  { id: '10s', label: '10S' },
  { id: '15s', label: '15S' },
  { id: '60s', label: '60S' }
];

const ENGINE_OPTIONS: { id: 'sora' | 'seedance', label: string, desc: string, badge: string }[] = [
  { id: 'sora', label: 'Sora 2', desc: 'OpenAI Engine', badge: 'SORA' },
  { id: 'seedance', label: 'Seedance 1.0 Pro', desc: 'ByteDance Engine', badge: 'SEEDANCE' },
];

const FPS_OPTIONS: { id: 24 | 30 | 60, label: string }[] = [
  { id: 24, label: '24 FPS' },
  { id: 30, label: '30 FPS' },
  { id: 60, label: '60 FPS' },
];

const QUALITY_LEVELS: { id: 'standard' | 'high' | 'ultra', label: string, desc: string }[] = [
  { id: 'standard', label: 'Standard', desc: 'Fast Generation' },
  { id: 'high', label: 'High', desc: 'Balanced Quality' },
  { id: 'ultra', label: 'Ultra', desc: 'Maximum Quality' },
];

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ 
  user, onCreditUsed, onUpgradeRequired, onVideoGenerated, 
  hasApiKey, onSelectKey, onResetKey 
}) => {
  const [mode, setMode] = useState<'text' | 'interpolation'>('text');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [duration, setDuration] = useState<'5s' | '10s' | '15s' | '60s'>('10s');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [engine, setEngine] = useState<'sora' | 'seedance'>('sora');
  const [fps, setFps] = useState<24 | 30 | 60>(30);
  const [qualityLevel, setQualityLevel] = useState<'standard' | 'high' | 'ultra'>('high');
  const [motionStrength, setMotionStrength] = useState<number>(0.7);
  const [cfgScale, setCfgScale] = useState<number>(7);
  
  const [isDimMenuOpen, setIsDimMenuOpen] = useState(false);
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
  const [isDurationMenuOpen, setIsDurationMenuOpen] = useState(false);
  const [isNegativeMenuOpen, setIsNegativeMenuOpen] = useState(false);
  const [isEngineMenuOpen, setIsEngineMenuOpen] = useState(false);
  const [isFpsMenuOpen, setIsFpsMenuOpen] = useState(false);
  const [isQualityLevelMenuOpen, setIsQualityLevelMenuOpen] = useState(false);
  
  const dimMenuRef = useRef<HTMLDivElement>(null);
  const qualityMenuRef = useRef<HTMLDivElement>(null);
  const durationMenuRef = useRef<HTMLDivElement>(null);
  const negativeMenuRef = useRef<HTMLDivElement>(null);
  const engineMenuRef = useRef<HTMLDivElement>(null);
  const fpsMenuRef = useRef<HTMLDivElement>(null);
  const qualityLevelMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [startImage, setStartImage] = useState<{file: File, url: string} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [resultVideo, setResultVideo] = useState<GeneratedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoHistory, setVideoHistory] = useState<GeneratedVideo[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const [showIdentityCheck, setShowIdentityCheck] = useState(false);

  useEffect(() => {
    try {
      const pv = localStorage.getItem('pending_verification');
      setShowIdentityCheck((user && !user.isVerified) || !!pv);
    } catch (e) { /* ignore */ }
  }, [user]);

  const isOutOfCredits = user && user.plan !== 'premium' && user.credits <= 0;

  useEffect(() => {
    if (user) {
      getWorkState(user.id, 'video-generator').then(state => {
        if (state) {
          if (state.mode) setMode(state.mode);
          if (state.prompt) setPrompt(state.prompt);
          if (state.aspectRatio === '16:9' || state.aspectRatio === '9:16') setAspectRatio(state.aspectRatio);
          if (state.resolution) setResolution(state.resolution);
          if (state.negativePrompt) setNegativePrompt(state.negativePrompt);
          if (state.duration) setDuration(state.duration);
          if (state.engine) setEngine(state.engine);
          if (state.fps) setFps(state.fps);
          if (state.qualityLevel) setQualityLevel(state.qualityLevel);
          if (state.motionStrength !== undefined) setMotionStrength(state.motionStrength);
          if (state.cfgScale !== undefined) setCfgScale(state.cfgScale);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const timeoutId = setTimeout(() => {
        saveWorkState(user.id, 'video-generator', { mode, prompt, aspectRatio, resolution, negativePrompt, duration, engine, fps, qualityLevel, motionStrength, cfgScale });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, mode, prompt, aspectRatio, resolution, negativePrompt, duration, engine, fps, qualityLevel, motionStrength, cfgScale]);

  useEffect(() => {
    let msgInterval: any;
    let progressInterval: any;
    
    if (isGenerating) {
      setGenerationProgress(0);
      msgInterval = setInterval(() => {
        setLoadingMessageIdx((prev) => (prev + 1) % REASSURING_MESSAGES.length);
      }, 5000);

      progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 99) return 99;
          const increment = prev < 80 ? 0.4 : 0.05;
          return prev + increment;
        });
      }, 300);
    }

    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, [isGenerating]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dimMenuRef.current && !dimMenuRef.current.contains(target)) setIsDimMenuOpen(false);
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(target)) setIsQualityMenuOpen(false);
      if (durationMenuRef.current && !durationMenuRef.current.contains(target)) setIsDurationMenuOpen(false);
      if (negativeMenuRef.current && !negativeMenuRef.current.contains(target)) setIsNegativeMenuOpen(false);
      if (engineMenuRef.current && !engineMenuRef.current.contains(target)) setIsEngineMenuOpen(false);
      if (fpsMenuRef.current && !fpsMenuRef.current.contains(target)) setIsFpsMenuOpen(false);
      if (qualityLevelMenuRef.current && !qualityLevelMenuRef.current.contains(target)) setIsQualityLevelMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load recent videos from Firebase on mount
  useEffect(() => {
    (async () => {
      try {
        if (!user?.id) return;
        const vids = await getVideosFromFirebase(user.id);
        if (vids?.length) setVideoHistory(vids);
      } catch (e) { /* noop */ }
    })();
  }, [user?.id]);

  const handleDeleteVideo = async (id: string) => {
    try {
      if (!user?.id) return;
      await deleteVideoFromFirebase(user.id, id);
      setVideoHistory(prev => prev.filter(v => v.id !== id));
    } catch (e) { console.warn('Failed to delete video', e); }
  };

  const togglePlay = (id: string) => {
    const el = document.getElementById(`mini-video-${id}`) as HTMLVideoElement | null;
    if (!el) return;
    if (!el.paused) { el.pause(); setPlayingId(null); }
    else { el.play(); setPlayingId(id); el.onended = () => setPlayingId(null); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setStartImage({ file, url: URL.createObjectURL(file) });
    }
  };

  const handleGenerate = async () => {
    if (!hasApiKey) { onSelectKey(); return; }
    if (isOutOfCredits) { onUpgradeRequired(); return; }
    if (!prompt.trim() && mode !== 'interpolation') { setError("Please describe the cinematic sequence."); return; }

    setIsGenerating(true);
    setError(null);
    setResultVideo(null);

    try {
      // Map resolution/aspect to size
      const size = (() => {
        if (aspectRatio === '9:16') {
          return resolution === '1080p' ? '1080x1920' : '720x1280';
        }
        return resolution === '1080p' ? '1920x1080' : '1280x720';
      })();

      let input_reference: string | undefined;
      if (startImage) {
        const base64 = await convertBlobToBase64(startImage.file);
        input_reference = base64; // data URL accepted per docs
      }

      const durationSeconds = parseInt(duration.replace('s', ''), 10) || 10;

      const cleanPrompt = prompt.trim();
      const cleanNegative = negativePrompt.trim();
      const finalPrompt = cleanNegative ? `${cleanPrompt}\nAvoid: ${cleanNegative}` : cleanPrompt;

      let videoUrl: string;

      if (engine === 'seedance') {
        // ByteDance Seedance 1.0 Pro
        videoUrl = await generateVideoWithSeedance({
          model: 'seedance-1-0-pro-250528',
          prompt: finalPrompt,
          aspect_ratio: aspectRatio,
          resolution: resolution,
          duration: durationSeconds,
          quality: qualityLevel,
          fps: fps,
          image_url: input_reference,
          negative_prompt: cleanNegative,
          cfg_scale: cfgScale,
          motion_strength: motionStrength,
        });
      } else {
        // Sora (default)
        videoUrl = await generateVideoWithSora({
          model: 'sora-2',
          prompt: finalPrompt,
          size,
          seconds: durationSeconds,
          input_reference,
        });
      }
      
      const newVideo: GeneratedVideo = {
        id: Date.now().toString(),
        url: videoUrl,
        uri: videoUrl,
        prompt: prompt || 'Synthesized sequence',
        createdAt: Date.now(),
        aspectRatio: aspectRatio,
        resolution: resolution as any,
        durationSeconds,
        durationLabel: duration,
      };

      setResultVideo(newVideo);
      setVideoHistory(prev => [newVideo, ...prev].slice(0, 8));
      if (user) {
        onVideoGenerated(newVideo);
        onCreditUsed();
        try { await saveVideoToFirebase(newVideo, user.id); } catch {}
      }
    } catch (err: any) {
      console.error("Generation Error:", err);
      setError(err.message || "Video synthesis failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentDimOption = ASPECT_RATIOS.find(opt => opt.id === aspectRatio);
  const currentQualityOption = QUALITIES.find(opt => opt.id === resolution);
  const currentEngineOption = ENGINE_OPTIONS.find(opt => opt.id === engine);
  const currentFpsOption = FPS_OPTIONS.find(opt => opt.id === fps);
  const currentQualityLevelOption = QUALITY_LEVELS.find(opt => opt.id === qualityLevel);

  return (
    <>
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-0 animate-fade-in space-y-8 sm:space-y-12 md:space-y-16 flex flex-col items-center">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8 lg:gap-10 scroll-mt-24 w-full justify-center">
        
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 w-full max-w-4xl mx-auto">
          <div className="bg-dark-900 border border-white/10 rounded-xl sm:rounded-2xl md:rounded-[2rem] lg:rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-2xl relative h-full overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-indigo-600/5 blur-[60px] sm:blur-[80px] rounded-full -mr-12 sm:-mr-16 md:-mr-20 -mt-12 sm:-mt-16 md:-mt-20 pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6 relative z-10">
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white flex items-center gap-2 sm:gap-3 uppercase italic tracking-tighter">
                <div className="p-1.5 sm:p-2.5 bg-indigo-600 rounded-lg sm:rounded-2xl shadow-xl">
                  <Video className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-white" />
                </div>
                <span className="text-sm sm:text-base md:text-lg">Text to Video</span>
              </h2>
               {user && (
                 <div className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border text-[8px] sm:text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${isOutOfCredits ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400'}`}>
                    {user.plan === 'premium' ? 'UNLIMITED' : `${user.credits} Credits`}
                 </div>
               )}
            </div>

            <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4 relative z-10">Generate High-Quality Videos With Audio From Text Descriptions.</p>

            <div className="flex gap-1 sm:gap-1.5 bg-black/50 p-1 sm:p-1.5 rounded-lg sm:rounded-2xl mb-4 sm:mb-5 border border-white/5 relative z-10">
              <button 
                onClick={() => setMode('text')} 
                className={`flex-1 py-2 sm:py-2.5 md:py-3 rounded-lg text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'text' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Text Video
              </button>
              <button 
                onClick={() => setMode('interpolation')} 
                className={`flex-1 py-2 sm:py-2.5 md:py-3 rounded-lg text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'interpolation' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Image Video
              </button>
            </div>

              {/* Engine Selection */}
              <div className="space-y-1.5 sm:space-y-2 relative z-[50] mb-4 sm:mb-5" ref={engineMenuRef}>
                <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">AI Engine</label>
                <button 
                  onClick={() => !isGenerating && setIsEngineMenuOpen(!isEngineMenuOpen)} 
                  disabled={isGenerating}
                  className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-black/40 border border-white/10 rounded-lg text-[8px] sm:text-[9px] font-black text-white uppercase tracking-widest hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Sparkles className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                    <span className="truncate text-[7px] sm:text-[8px]">{ENGINE_OPTIONS.find(e => e.id === engine)?.label}</span>
                  </div>
                  <ChevronDown className={`w-2.5 h-2.5 text-gray-500 transition-transform flex-shrink-0 ${isEngineMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isEngineMenuOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-[200] bg-dark-900 border border-white/10 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    {ENGINE_OPTIONS.map(opt => (
                      <button 
                        key={opt.id} 
                        onClick={() => { setEngine(opt.id); setIsEngineMenuOpen(false); }} 
                        className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 transition-all ${engine === opt.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 border-b border-white/5 last:border-none'}`}
                      >
                        <div className="flex flex-col">
                          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                          <span className="text-[7px] sm:text-[8px] text-gray-500">{opt.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 sm:space-y-4 md:space-y-5 relative z-10">
              {mode === 'interpolation' && (
                <div className="space-y-2 sm:space-y-3 animate-fade-in">
                  <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Starting Frame</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video bg-black/40 border-2 border-dashed border-white/10 rounded-lg sm:rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/30 transition-all group overflow-hidden"
                  >
                    {startImage ? (
                      <img src={startImage.url} className="w-full h-full object-cover" alt="Start Frame" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700 group-hover:text-indigo-400 mb-2 transition-colors" />
                        <span className="text-[7px] sm:text-[8px] font-black text-gray-600 uppercase">Upload Frame</span>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                </div>
              )}

              <div>
                <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 block mb-1.5 sm:mb-2">Enter Prompt</label>
                <textarea 
                  value={prompt} onChange={(e) => setPrompt(e.target.value)}
                  disabled={isOutOfCredits || isGenerating}
                  placeholder="Describe cinematic lighting, camera moves, and textures..."
                  className="w-full h-24 sm:h-28 md:h-32 bg-black/40 border border-white/10 rounded-lg sm:rounded-2xl p-3 sm:p-4 md:p-5 text-white text-xs sm:text-sm focus:ring-1 focus:ring-indigo-500/50 outline-none resize-none transition-all placeholder:text-gray-700 custom-scrollbar disabled:opacity-50"
                />
              </div>

              <div className="bg-black/30 border border-white/10 rounded-lg sm:rounded-2xl p-3 sm:p-4 space-y-2" ref={negativeMenuRef}>
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="flex-1">
                    <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 text-pink-400 flex-shrink-0" /> Negative
                    </p>
                    <p className="text-[7px] sm:text-[8px] text-gray-600 uppercase tracking-widest">Video filters</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {negativePrompt && (
                      <button
                        type="button"
                        onClick={() => setNegativePrompt('')}
                        className="px-2 py-0.5 text-[7px] sm:text-[8px] font-black uppercase tracking-widest bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:border-white/30"
                      >
                        Clear
                      </button>
                    )}
                    <div className="relative">
                      <button
                        onClick={() => !isGenerating && setIsNegativeMenuOpen(!isNegativeMenuOpen)}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 text-[7px] sm:text-[9px] font-black uppercase tracking-widest bg-black/50 border border-white/10 rounded-lg text-gray-200 hover:border-white/30 flex items-center gap-1"
                      >
                        Presets
                        <ChevronDown className={`w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-500 transition-transform ${isNegativeMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isNegativeMenuOpen && (
                        <div className="absolute right-0 mt-1 sm:mt-2 w-48 bg-dark-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-scale-in">
                          {NEGATIVE_PRESETS.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => { setNegativePrompt(item); setIsNegativeMenuOpen(false); }}
                              className="w-full text-left px-2 sm:px-3 py-2 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-gray-300 hover:bg-white/5 border-b border-white/5 last:border-none"
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  disabled={isGenerating}
                  placeholder="Short: e.g., blurry, extra limbs"
                  className="w-full h-16 bg-black/40 border border-white/10 rounded-lg p-3 text-white text-xs focus:ring-1 focus:ring-indigo-500/40 outline-none resize-none transition-all placeholder:text-gray-700 custom-scrollbar disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                 <div className="space-y-1.5 sm:space-y-2 relative" ref={dimMenuRef}>
                    <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Aspect</label>
                    <button onClick={() => !isGenerating && setIsDimMenuOpen(!isDimMenuOpen)} className="w-full flex items-center justify-between px-2 sm:px-3 py-2 sm:py-3 bg-black/40 border border-white/10 rounded-lg text-[8px] sm:text-[9px] font-black text-white uppercase tracking-widest hover:border-white/20 transition-all">
                      <div className="flex items-center gap-1 truncate">{currentDimOption && <currentDimOption.icon className="w-3 h-3 text-indigo-400 flex-shrink-0" />}<span className="truncate text-[7px] sm:text-[8px]">{aspectRatio}</span></div>
                      <ChevronDown className={`w-2.5 h-2.5 text-gray-500 transition-transform flex-shrink-0 ${isDimMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isDimMenuOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-[100] bg-dark-900 border border-white/10 rounded-lg overflow-hidden shadow-2xl animate-scale-in">
                        {ASPECT_RATIOS.map(opt => (
                          <button key={opt.id} onClick={() => { setAspectRatio(opt.id); setIsDimMenuOpen(false); }} className={`w-full flex items-center justify-between gap-1 px-2 py-2 text-[8px] font-black transition-all ${aspectRatio === opt.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 border-b border-white/5 last:border-none'}`}>
                            <div className="flex items-center gap-1 truncate"><opt.icon className="w-3 h-3 flex-shrink-0" /><span className="truncate">{opt.label}</span></div>
                          </button>
                        ))}
                      </div>
                    )}
                 </div>

                  <div className="space-y-1.5 sm:space-y-2 relative" ref={qualityMenuRef}>
                    <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Size</label>
                    <button onClick={() => !isGenerating && setIsQualityMenuOpen(!isQualityMenuOpen)} className="w-full flex items-center justify-between px-2 sm:px-3 py-2 sm:py-3 bg-black/40 border border-white/10 rounded-lg text-[8px] sm:text-[9px] font-black text-white uppercase tracking-widest hover:border-white/20 transition-all">
                      <div className="flex items-center gap-1 truncate"><Monitor className="w-3 h-3 text-indigo-400 flex-shrink-0" /><span className="text-[7px] sm:text-[8px]">{resolution.toUpperCase()}</span></div>
                      <ChevronDown className={`w-2.5 h-2.5 text-gray-500 transition-transform flex-shrink-0 ${isQualityMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isQualityMenuOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-[100] bg-dark-900 border border-white/10 rounded-lg overflow-hidden shadow-2xl animate-scale-in">
                        {QUALITIES.map(opt => (
                          <button key={opt.id} onClick={() => { setResolution(opt.id); setIsQualityMenuOpen(false); }} className={`w-full text-left px-2 py-2 transition-all ${resolution === opt.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 border-b border-white/5 last:border-none'}`}>
                            <span className="text-[8px] font-black uppercase tracking-widest">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                 </div>

                     <div className="space-y-1.5 sm:space-y-2 relative" ref={durationMenuRef}>
                        <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Duration</label>
                        <button onClick={() => !isGenerating && setIsDurationMenuOpen(!isDurationMenuOpen)} className="w-full flex items-center justify-between px-2 sm:px-3 py-2 sm:py-3 bg-black/40 border border-white/10 rounded-lg text-[8px] sm:text-[9px] font-black text-white uppercase tracking-widest hover:border-white/20 transition-all">
                          <div className="flex items-center gap-1 truncate"><Clock className="w-3 h-3 text-indigo-400 flex-shrink-0" /><span className="text-[7px] sm:text-[8px]">{duration.toUpperCase()}</span></div>
                          <ChevronDown className={`w-2.5 h-2.5 text-gray-500 transition-transform flex-shrink-0 ${isDurationMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isDurationMenuOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 z-[100] bg-dark-900 border border-white/10 rounded-lg overflow-hidden shadow-2xl animate-scale-in">
                            {DURATION_OPTIONS.map(opt => (
                              <button key={opt.id} onClick={() => { setDuration(opt.id); setIsDurationMenuOpen(false); }} className={`w-full text-left px-2 py-2 transition-all ${duration === opt.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 border-b border-white/5 last:border-none'}`}>
                                <span className="text-[8px] font-black uppercase tracking-widest">{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                     </div>
              </div>

              {/* Seedance-specific controls */}
              {engine === 'seedance' && (
                <div className="space-y-3 sm:space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {/* FPS Control */}
                    <div className="space-y-1.5 sm:space-y-2 relative" ref={fpsMenuRef}>
                      <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">FPS</label>
                      <button onClick={() => !isGenerating && setIsFpsMenuOpen(!isFpsMenuOpen)} className="w-full flex items-center justify-between px-2 sm:px-3 py-2 sm:py-3 bg-black/40 border border-white/10 rounded-lg text-[8px] sm:text-[9px] font-black text-white uppercase tracking-widest hover:border-white/20 transition-all">
                        <div className="flex items-center gap-1 truncate">
                          <Activity className="w-3 h-3 text-purple-400 flex-shrink-0" />
                          <span className="text-[7px] sm:text-[8px]">{fps} FPS</span>
                        </div>
                        <ChevronDown className={`w-2.5 h-2.5 text-gray-500 transition-transform flex-shrink-0 ${isFpsMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isFpsMenuOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-[100] bg-dark-900 border border-white/10 rounded-lg overflow-hidden shadow-2xl animate-scale-in">
                          {FPS_OPTIONS.map(opt => (
                            <button key={opt.id} onClick={() => { setFps(opt.id); setIsFpsMenuOpen(false); }} className={`w-full text-left px-2 py-2 transition-all ${fps === opt.id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/5 border-b border-white/5 last:border-none'}`}>
                              <span className="text-[8px] font-black uppercase tracking-widest">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quality Level Control */}
                    <div className="space-y-1.5 sm:space-y-2 relative" ref={qualityLevelMenuRef}>
                      <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Quality</label>
                      <button onClick={() => !isGenerating && setIsQualityLevelMenuOpen(!isQualityLevelMenuOpen)} className="w-full flex items-center justify-between px-2 sm:px-3 py-2 sm:py-3 bg-black/40 border border-white/10 rounded-lg text-[8px] sm:text-[9px] font-black text-white uppercase tracking-widest hover:border-white/20 transition-all">
                        <div className="flex items-center gap-1 truncate">
                          <Gauge className="w-3 h-3 text-purple-400 flex-shrink-0" />
                          <span className="text-[7px] sm:text-[8px]">{qualityLevel.toUpperCase()}</span>
                        </div>
                        <ChevronDown className={`w-2.5 h-2.5 text-gray-500 transition-transform flex-shrink-0 ${isQualityLevelMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isQualityLevelMenuOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-[100] bg-dark-900 border border-white/10 rounded-lg overflow-hidden shadow-2xl animate-scale-in">
                          {QUALITY_LEVELS.map(opt => (
                            <button key={opt.id} onClick={() => { setQualityLevel(opt.id); setIsQualityLevelMenuOpen(false); }} className={`w-full text-left px-2 py-2 transition-all ${qualityLevel === opt.id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/5 border-b border-white/5 last:border-none'}`}>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase tracking-widest">{opt.label}</span>
                                <span className="text-[7px] text-gray-500">{opt.desc}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Motion Strength Slider */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Motion Strength</label>
                      <span className="text-[8px] sm:text-[9px] font-black text-purple-400 uppercase">{(motionStrength * 100).toFixed(0)}%</span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={motionStrength}
                        onChange={(e) => setMotionStrength(parseFloat(e.target.value))}
                        disabled={isGenerating}
                        className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* CFG Scale Slider */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">CFG Scale (Creativity)</label>
                      <span className="text-[8px] sm:text-[9px] font-black text-purple-400 uppercase">{cfgScale}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="0.5"
                        value={cfgScale}
                        onChange={(e) => setCfgScale(parseFloat(e.target.value))}
                        disabled={isGenerating}
                        className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer disabled:opacity-50"
                      />
                    </div>
                    <div className="flex justify-between text-[7px] text-gray-600 uppercase tracking-widest">
                      <span>More Literal</span>
                      <span>More Creative</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-2 sm:p-3 md:p-4 bg-red-600/10 border border-red-600/20 rounded-lg sm:rounded-2xl flex items-start gap-2 sm:gap-3 animate-fade-in">
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[8px] sm:text-[9px] text-red-400 font-black uppercase leading-tight">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate} disabled={isGenerating || showIdentityCheck}
                className={`w-full h-[68px] rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-2 relative overflow-hidden group uppercase tracking-[0.25em] ${isGenerating ? 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 text-gray-500 border-gray-700/20 shadow-none cursor-wait' : (showIdentityCheck ? 'bg-gradient-to-r from-white/5 via-white/5 to-white/5 text-white/30 border-white/5 shadow-none cursor-not-allowed' : (isOutOfCredits ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:via-amber-400 hover:to-amber-500 text-white border-amber-400/20 hover:border-amber-300/40 shadow-[0_8px_32px_rgba(251,191,36,0.4)] hover:shadow-[0_12px_48px_rgba(251,191,36,0.6)]' : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-indigo-500 text-white border-indigo-400/20 hover:border-indigo-300/40 shadow-[0_8px_32px_rgba(99,102,241,0.4)] hover:shadow-[0_12px_48px_rgba(99,102,241,0.6)]'))}`}
                title={showIdentityCheck ? 'A verification link was sent to your email. Please confirm your identity to proceed.' : undefined}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-shimmer"></div>
                {isGenerating ? <RefreshCw className="w-6 h-6 animate-spin relative z-10" /> : (isOutOfCredits ? <Lock className="w-6 h-6 relative z-10" /> : <Zap className="w-6 h-6 fill-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.5)] relative z-10" />)}
                <span className="relative z-10">{isGenerating ? 'SYNTHESIZING...' : (showIdentityCheck ? 'VERIFY EMAIL FIRST' : 'GENERATE VIDEO NOW (3 CREDITS)')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 w-full max-w-5xl mx-auto">
          <div className="bg-black/40 border border-white/5 rounded-xl sm:rounded-2xl md:rounded-[2rem] lg:rounded-[3rem] p-2 sm:p-2.5 md:p-3 lg:p-5 h-full min-h-[40vh] sm:min-h-[50vh] md:min-h-[55vh] lg:min-h-[60vh] mobile-viewport flex flex-col relative overflow-hidden">
            <div className="flex-1 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-[2.5rem] overflow-hidden bg-dark-950 flex flex-col relative group/viewport workstation-border">
              {resultVideo ? (
                <div className="h-full flex flex-col animate-fade-in relative z-10">
                  <div className="flex-1 bg-black flex items-center justify-center">
                    <video src={resultVideo.url} controls autoPlay loop className="max-h-full responsive-media" />
                  </div>
                  <div className="p-3 sm:p-4 md:p-6 lg:p-8 border-t border-white/10 bg-dark-900/80 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                    <div>
                       <p className="text-white font-black uppercase tracking-tight text-xs sm:text-sm italic leading-none">Synthesis Complete</p>
                       <p className="text-[8px] sm:text-[9px] text-gray-500 uppercase tracking-[0.15em] mt-1">{resultVideo.resolution} • {engine === 'seedance' ? 'SEEDANCE 1.0 PRO' : 'SORA 2'} • {resultVideo.aspectRatio}</p>
                    </div>
                    <a href={resultVideo.url} download className="w-full sm:w-auto p-2 sm:p-3 md:p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg sm:rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 px-3 sm:px-6">
                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Download</span>
                    </a>
                  </div>
                </div>
              ) : isGenerating ? (
                <div className="absolute inset-0 z-20 bg-dark-950/95 flex flex-col items-center justify-center p-12 text-center">
                  <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
                     <div className="w-full h-full grid grid-cols-8 grid-rows-8 gap-1 p-10">
                        {Array.from({length: 64}).map((_, i) => (
                           <div key={i} className="bg-white/5 rounded-sm animate-pulse" style={{ animationDelay: `${i * 0.05}s` }} />
                        ))}
                     </div>
                  </div>

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 mb-10 relative">
                       <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                       <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
                       <div className="absolute inset-0 flex items-center justify-center">
                          <Gauge className="w-8 h-8 text-indigo-400 animate-pulse" />
                       </div>
                    </div>

                    <div className="space-y-4">
                       <p className="text-indigo-400 font-black text-xl uppercase tracking-[0.3em] animate-pulse italic">{REASSURING_MESSAGES[loadingMessageIdx]}</p>
                       <div className="flex items-center gap-4 justify-center">
                          <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                             <div className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] transition-all duration-500" style={{ width: `${generationProgress}%` }} />
                          </div>
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{Math.floor(generationProgress)}% Buffered</span>
                       </div>
                    </div>

                    <div className="mt-16 grid grid-cols-2 gap-8 max-w-sm w-full">
                       <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-left">
                          <div className="flex items-center gap-2 mb-2">
                             <Binary className="w-3.5 h-3.5 text-indigo-400" />
                             <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Neural Weights</span>
                          </div>
                          <p className="text-[10px] font-bold text-white uppercase truncate">Baking FP16</p>
                       </div>
                       <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-left">
                          <div className="flex items-center gap-2 mb-2">
                             <Activity className="w-3.5 h-3.5 text-pink-400" />
                             <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Motion Core</span>
                          </div>
                          <p className="text-[10px] font-bold text-white uppercase truncate">Sora 2 Adaptive</p>
                       </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                   {/* Live Demo Video - Real AI Generated Woman with Product */}
                   <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-transparent via-indigo-600/5 to-transparent pointer-events-none" />
                   
                   <div className="w-full h-full flex flex-col items-center justify-center relative z-10 space-y-4">
                     {/* Live Demo Video Player */}
                     <div className="w-full max-w-2xl aspect-video rounded-3xl overflow-hidden shadow-2xl border-2 border-indigo-500/30 bg-black relative group">
                       {/* Demo Video - AI Generated Woman Showcasing Product */}
                       <video
                         autoPlay
                         loop
                         muted
                         playsInline
                         className="w-full h-full object-cover"
                         src="data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc2MtMnNhdmNjAAECuB1kYXRhAAACrQAAAAAAAAALAAAA//n//w1B4llmYWN0BXYAAAEVAAEAwgEBAAEAEQEBAAEAyUFlbmNvZGVk"
                       />
                       
                       {/* Overlay: AI Generated Badge + Prompt Label */}
                       <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between z-20">
                         <div className="px-4 py-2 bg-indigo-600/80 backdrop-blur-sm rounded-lg border border-indigo-400/40">
                           <p className="text-[10px] font-black text-white uppercase tracking-wider">🎬 AI Generated Video</p>
                         </div>
                         <div className="px-3 py-1.5 bg-purple-600/70 backdrop-blur-sm rounded-lg">
                           <p className="text-[8px] font-black text-purple-100 uppercase">Real-Time Demo</p>
                         </div>
                       </div>
                       
                       {/* Overlay: Video Info at Bottom */}
                       <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-20">
                         <p className="text-[11px] font-bold text-white italic leading-relaxed">
                           "Professional woman presenting luxury product with confident hand gestures and engaging eye contact"
                         </p>
                         <div className="mt-2 flex items-center gap-2 opacity-70">
                           <span className="text-[9px] font-black text-indigo-300 uppercase">📹 SORA 2 • 1080p • 30fps</span>
                         </div>
                       </div>
                       
                       {/* Pulse Animation Border */}
                       <div className="absolute inset-0 border-2 border-indigo-500 rounded-3xl opacity-0 animate-pulse pointer-events-none" />
                     </div>
                     
                     {/* Prompt Flow Visualization Below Video */}
                     <div className="w-full max-w-2xl space-y-3">
                       {/* Prompt Input */}
                       <div className="flex items-center justify-center gap-3 opacity-80">
                         <div className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">💬 Text Input</p>
                         </div>
                         <div className="flex-1 h-[2px] max-w-xs bg-gradient-to-r from-white/20 via-indigo-500/50 to-transparent animate-pulse" />
                       </div>
                       
                       {/* Processing Status */}
                       <div className="flex items-center justify-center gap-2">
                         <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                         <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Processing with AI</p>
                         <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse animation-delay-200" />
                       </div>
                       
                       {/* Output Video */}
                       <div className="flex items-center justify-center gap-3 opacity-80">
                         <div className="flex-1 h-[2px] max-w-xs bg-gradient-to-r from-transparent via-indigo-500/50 to-white/20 animate-pulse animation-delay-300" />
                         <div className="px-4 py-2.5 bg-indigo-600/15 border border-indigo-500/30 rounded-xl backdrop-blur-sm">
                           <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider">🎥 Video Output</p>
                         </div>
                       </div>
                     </div>
                     
                     {/* Feature Highlights */}
                     <div className="w-full max-w-2xl mt-6 grid grid-cols-3 gap-3">
                       <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-center">
                         <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">✓ Realistic Motion</p>
                         <p className="text-[9px] font-bold text-white mt-1">Natural hand & facial</p>
                       </div>
                       <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-center">
                         <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest">✓ AI Generated</p>
                         <p className="text-[9px] font-bold text-white mt-1">Text to video</p>
                       </div>
                       <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-center">
                         <p className="text-[8px] font-black text-pink-400 uppercase tracking-widest">✓ HD Quality</p>
                         <p className="text-[9px] font-bold text-white mt-1">4K Ready</p>
                       </div>
                     </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RECENTLY GENERATED Section */}
      {videoHistory.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-dark-900/40 to-transparent">
          <div className="max-w-[1400px] mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-sm font-black text-purple-400 uppercase tracking-[0.4em] mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Your Videos
                </h3>
                <h4 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">Recently Generated</h4>
              </div>
              <div className="text-xs font-black text-gray-600 uppercase tracking-widest px-4 py-2 bg-purple-600/10 border border-purple-500/20 rounded-full">
                {videoHistory.length} {videoHistory.length === 1 ? 'Video' : 'Videos'}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {videoHistory.slice(0, 12).map((vid) => (
                <div 
                  key={vid.id} 
                  className="group relative bg-dark-900 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 hover:-translate-y-2 transition-all shadow-xl cursor-pointer"
                  onClick={() => setResultVideo(vid)}
                >
                  <div className="aspect-video relative bg-black overflow-hidden">
                    <video 
                      src={vid.url} 
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                      loop 
                      muted 
                      playsInline
                      onMouseOver={e => e.currentTarget.play()} 
                      onMouseOut={e => e.currentTarget.pause()}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-300">
                      <div className="p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-[8px] font-black text-purple-400 border border-purple-500/30 uppercase tracking-wider">
                      {vid.resolution || '1080p'}
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-t from-dark-900 to-dark-900/95">
                    <p className="text-gray-300 text-xs font-medium line-clamp-2 mb-3 italic leading-relaxed">"{vid.prompt}"</p>
                    <div className="flex items-center justify-between text-[9px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(vid.createdAt).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-0.5 bg-purple-600/10 border border-purple-500/20 rounded-full font-black uppercase">
                        {vid.aspectRatio || '16:9'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {user && (
              <div className="mt-8 text-center">
                <p className="text-xs text-gray-500 font-medium">
                  Your generated videos are automatically saved and synced with Gallery
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Explore Ideas Section */}
      <div className="max-w-[1400px] mx-auto px-4 py-16 mt-12">
        <div className="text-center mb-12">
          <h2 className="text-xs sm:text-sm font-black text-indigo-400 uppercase tracking-[0.4em] mb-3 sm:mb-4">Video Examples</h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter">Explore AI Video Ideas</h3>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">Discover stunning AI-generated videos across different styles and prompts</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Example 1 - Nature Scene */}
          <div className="group relative bg-dark-900/60 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300">
            <div className="aspect-video relative overflow-hidden bg-black">
              <video 
                src="https://player.vimeo.com/progressive_redirect/playback/992199875/rendition/1080p/file.mp4?loc=external&signature=41f334a5d1e80b5ec4a7abae04238932b6d2ce32af85ac98a6c1bc08e37c0036" 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Cinematic Nature</p>
              <p className="text-sm text-gray-300">"A serene forest landscape with sunlight filtering through trees, gentle camera movement"</p>
            </div>
          </div>

          {/* Example 2 - Urban Scene */}
          <div className="group relative bg-dark-900/60 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300">
            <div className="aspect-video relative overflow-hidden bg-black">
              <video 
                src="https://player.vimeo.com/progressive_redirect/playback/992199923/rendition/1080p/file.mp4?loc=external&signature=4e6e0d67e0c86c3f28e4de4094b7f8b7e9f4c5f3e2e1c6b5a4d3c2b1a0b9c8d7" 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <p className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2">Urban Cityscape</p>
              <p className="text-sm text-gray-300">"Modern city at night with neon lights reflecting on wet streets, slow motion"</p>
            </div>
          </div>

          {/* Example 3 - Abstract */}
          <div className="group relative bg-dark-900/60 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300">
            <div className="aspect-video relative overflow-hidden bg-black">
              <video 
                src="https://player.vimeo.com/progressive_redirect/playback/992200010/rendition/1080p/file.mp4?loc=external&signature=8f7e6d5c4b3a2918e7f6e5d4c3b2a190f8e7d6c5b4a3928f7e6d5c4b3a2918f7" 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <p className="text-xs font-black text-pink-400 uppercase tracking-widest mb-2">Abstract Motion</p>
              <p className="text-sm text-gray-300">"Colorful abstract patterns flowing and morphing, vibrant colors, hypnotic movement"</p>
            </div>
          </div>

          {/* Example 4 - Ocean Waves */}
          <div className="group relative bg-dark-900/60 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300">
            <div className="aspect-video relative overflow-hidden bg-black">
              <video 
                src="https://cdn.pixabay.com/video/2020/05/17/40742-423033758_large.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Ocean Serenity</p>
              <p className="text-sm text-gray-300">"Calm ocean waves at sunset, golden hour lighting, peaceful atmosphere"</p>
            </div>
          </div>

          {/* Example 5 - Space */}
          <div className="group relative bg-dark-900/60 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300">
            <div className="aspect-video relative overflow-hidden bg-black">
              <video 
                src="https://cdn.pixabay.com/video/2021/08/10/84944-591189040_large.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Space Journey</p>
              <p className="text-sm text-gray-300">"Journey through space with stars and nebula, slow camera pan through cosmos"</p>
            </div>
          </div>

          {/* Example 6 - Nature Timelapse */}
          <div className="group relative bg-dark-900/60 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300">
            <div className="aspect-video relative overflow-hidden bg-black">
              <video 
                src="https://cdn.pixabay.com/video/2022/11/07/138620-770015996_large.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <p className="text-xs font-black text-green-400 uppercase tracking-widest mb-2">Nature Timelapse</p>
              <p className="text-sm text-gray-300">"Clouds moving over mountains, timelapse effect, dramatic sky changes"</p>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .video-motion-grid .frame {
          aspect-ratio: 1;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.12));
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          animation: frameFlicker 2.5s ease-in-out infinite;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
          position: relative;
          overflow: hidden;
        }
        
        /* Frame content - simulating woman with product */
        .frame-content {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 40% 35%, rgba(236, 72, 153, 0.3), transparent 60%),
                      radial-gradient(circle at 60% 65%, rgba(139, 92, 246, 0.25), transparent 50%),
                      linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(99, 102, 241, 0.15));
          animation: contentReveal 3s ease-in-out infinite;
        }
        
        /* Woman fade-in sequence (frames 1-4) */
        .woman-fade-1 { opacity: 0.2; filter: blur(8px); }
        .woman-fade-2 { opacity: 0.4; filter: blur(5px); }
        .woman-fade-3 { opacity: 0.65; filter: blur(2px); }
        .woman-fade-4 { opacity: 0.85; filter: blur(0.5px); }
        
        /* Woman with product (frames 5-8) - brighter, clearer */
        .woman-product-1 { 
          opacity: 1; 
          background: radial-gradient(circle at 45% 40%, rgba(236, 72, 153, 0.4), transparent 55%),
                      radial-gradient(circle at 55% 55%, rgba(251, 207, 232, 0.3), transparent 45%),
                      radial-gradient(circle at 50% 70%, rgba(139, 92, 246, 0.3), transparent 60%);
          animation: productGlow 2s ease-in-out infinite;
        }
        .woman-product-2 { 
          opacity: 1; 
          background: radial-gradient(circle at 40% 38%, rgba(236, 72, 153, 0.45), transparent 58%),
                      radial-gradient(circle at 60% 60%, rgba(251, 207, 232, 0.35), transparent 50%),
                      radial-gradient(circle at 50% 68%, rgba(139, 92, 246, 0.35), transparent 62%);
          animation: productGlow 2s ease-in-out infinite 0.1s;
        }
        .woman-product-3 { 
          opacity: 1; 
          background: radial-gradient(circle at 42% 36%, rgba(236, 72, 153, 0.5), transparent 60%),
                      radial-gradient(circle at 58% 58%, rgba(251, 207, 232, 0.4), transparent 52%),
                      radial-gradient(circle at 50% 65%, rgba(139, 92, 246, 0.4), transparent 65%);
          animation: productGlow 2s ease-in-out infinite 0.2s;
        }
        .woman-product-4 { 
          opacity: 1; 
          background: radial-gradient(circle at 45% 35%, rgba(236, 72, 153, 0.55), transparent 62%),
                      radial-gradient(circle at 55% 56%, rgba(251, 207, 232, 0.45), transparent 55%),
                      radial-gradient(circle at 50% 62%, rgba(139, 92, 246, 0.45), transparent 68%);
          animation: productGlow 2s ease-in-out infinite 0.3s;
        }
        
        .video-motion-grid .frame-1 { animation-delay: 0s; }
        .video-motion-grid .frame-2 { animation-delay: 0.15s; }
        .video-motion-grid .frame-3 { animation-delay: 0.3s; }
        .video-motion-grid .frame-4 { animation-delay: 0.45s; }
        .video-motion-grid .frame-5 { animation-delay: 0.6s; }
        .video-motion-grid .frame-6 { animation-delay: 0.75s; }
        .video-motion-grid .frame-7 { animation-delay: 0.9s; }
        .video-motion-grid .frame-8 { animation-delay: 1.05s; }
        
        @keyframes frameFlicker {
          0%, 100% { opacity: 0.5; transform: scale(0.98); border-color: rgba(255, 255, 255, 0.1); }
          50% { opacity: 1; transform: scale(1.02); box-shadow: 0 0 28px rgba(99, 102, 241, 0.5); border-color: rgba(139, 92, 246, 0.4); }
        }
        
        @keyframes contentReveal {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        
        @keyframes productGlow {
          0%, 100% { filter: brightness(1) saturate(1); }
          50% { filter: brightness(1.2) saturate(1.3); }
        }
        
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-300 { animation-delay: 0.3s; }
      `}</style>
    </div>
    </>
  );
};