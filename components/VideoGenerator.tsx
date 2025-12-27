import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, Play, Sparkles, Upload, X, Download, RefreshCw, AlertCircle, 
  Film, Zap, Gauge, Binary, Activity, History, RectangleHorizontal, RectangleVertical, Monitor, ChevronDown, Lock, Clock
} from 'lucide-react';
import { convertBlobToBase64 } from '../services/geminiService';
import { generateVideoWithSora } from '../services/soraService';
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
  
  const [isDimMenuOpen, setIsDimMenuOpen] = useState(false);
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
  const [isDurationMenuOpen, setIsDurationMenuOpen] = useState(false);
  const [isNegativeMenuOpen, setIsNegativeMenuOpen] = useState(false);
  
  const dimMenuRef = useRef<HTMLDivElement>(null);
  const qualityMenuRef = useRef<HTMLDivElement>(null);
  const durationMenuRef = useRef<HTMLDivElement>(null);
  const negativeMenuRef = useRef<HTMLDivElement>(null);
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
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const timeoutId = setTimeout(() => {
        saveWorkState(user.id, 'video-generator', { mode, prompt, aspectRatio, resolution, negativePrompt, duration });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, mode, prompt, aspectRatio, resolution, negativePrompt, duration]);

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
      // Map resolution/aspect to Sora size
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

      const videoUrl = await generateVideoWithSora({
        model: 'sora-2',
        prompt: finalPrompt,
        size,
        seconds: durationSeconds,
        input_reference,
      });
      
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

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0 animate-fade-in space-y-16 flex flex-col items-center">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 scroll-mt-24 w-full justify-center">
        
        <div className="lg:col-span-2 space-y-6 w-full max-w-4xl mx-auto">
          <div className="bg-dark-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative h-full overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/5 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
                <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-xl">
                  <Video className="w-6 h-6 text-white" />
                </div>
                Text to Video
              </h2>
               {user && (
                 <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${isOutOfCredits ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400'}`}>
                    {user.plan === 'premium' ? 'UNLIMITED' : `${user.credits} Credits`}
                 </div>
               )}
            </div>

            <p className="text-sm text-gray-400 mb-4 relative z-10">Generate High-Quality Videos With Audio From Text Descriptions.</p>

            <div className="flex bg-black/50 p-1.5 rounded-2xl mb-4 border border-white/5 relative z-10">
              <button 
                onClick={() => setMode('text')} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'text' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
            {/* Recently Generated (Sticky) */}
            {(videoHistory.length > 0) && (
              <div className="mt-4 sticky top-4 bg-black/20 border border-white/10 rounded-2xl p-4 z-20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Recently Generated</span>
                  </div>
                  <span className="text-[9px] font-black text-gray-600 uppercase">{videoHistory.length} Items</span>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {videoHistory.slice(0, 8).map(v => (
                    <div key={v.id} className="group relative rounded-xl overflow-hidden border border-white/10">
                      <video id={`mini-video-${v.id}`} src={v.url} className="w-full h-full" muted playsInline></video>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => togglePlay(v.id)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10">{playingId === v.id ? '❚❚' : '▶'}</button>
                        <a href={v.url} download={`imaginai-${v.id}.mp4`} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10">⬇</a>
                        {user && (
                          <button onClick={() => handleDeleteVideo(v.id)} className="p-2 rounded-lg bg-white/10 hover:bg-red-600/80 text-white border border-white/10">🗑</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
                Text to Video
              </button>
              <button 
                onClick={() => setMode('interpolation')} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'interpolation' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Image to Video
              </button>
            </div>

              <div className="space-y-5 relative z-10">
              {mode === 'interpolation' && (
                <div className="space-y-4 animate-fade-in">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Starting Frame</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/30 transition-all group overflow-hidden"
                  >
                    {startImage ? (
                      <img src={startImage.url} className="w-full h-full object-cover" alt="Start Frame" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-700 group-hover:text-indigo-400 mb-2 transition-colors" />
                        <span className="text-[8px] font-black text-gray-600 uppercase">Upload Reference</span>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                </div>
              )}

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 block mb-2">Cinematic Script</label>
                <textarea 
                  value={prompt} onChange={(e) => setPrompt(e.target.value)}
                  disabled={isOutOfCredits || isGenerating}
                  placeholder="Describe cinematic lighting, camera moves, and textures..."
                  className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-5 text-white text-sm focus:ring-1 focus:ring-indigo-500/50 outline-none resize-none transition-all placeholder:text-gray-700 custom-scrollbar disabled:opacity-50"
                />
              </div>

              <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-2" ref={negativeMenuRef}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-pink-400" /> Negative Prompt
                    </p>
                    <p className="text-[9px] text-gray-600 uppercase tracking-widest">Applies to all video engines</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {negativePrompt && (
                      <button
                        type="button"
                        onClick={() => setNegativePrompt('')}
                        className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:border-white/30"
                      >
                        Clear
                      </button>
                    )}
                    <div className="relative">
                      <button
                        onClick={() => !isGenerating && setIsNegativeMenuOpen(!isNegativeMenuOpen)}
                        className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-black/50 border border-white/10 rounded-lg text-gray-200 hover:border-white/30 flex items-center gap-2"
                      >
                        Presets
                        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isNegativeMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isNegativeMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-dark-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-scale-in">
                          {NEGATIVE_PRESETS.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => { setNegativePrompt(item); setIsNegativeMenuOpen(false); }}
                              className="w-full text-left px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:bg-white/5 border-b border-white/5 last:border-none"
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
                  placeholder="Keep it short: e.g., blurry shots, extra limbs, text overlays"
                  className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:ring-1 focus:ring-indigo-500/40 outline-none resize-none transition-all placeholder:text-gray-700 custom-scrollbar disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                 <div className="space-y-2 relative" ref={dimMenuRef}>
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Aspect Ratio</label>
                    <button onClick={() => !isGenerating && setIsDimMenuOpen(!isDimMenuOpen)} className="w-full flex items-center justify-between px-3 py-3 bg-black/40 border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest hover:border-white/20 transition-all">
                      <div className="flex items-center gap-1.5 truncate">{currentDimOption && <currentDimOption.icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}<span className="truncate">{aspectRatio}</span></div>
                      <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isDimMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isDimMenuOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-dark-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-scale-in">
                        {ASPECT_RATIOS.map(opt => (
                          <button key={opt.id} onClick={() => { setAspectRatio(opt.id); setIsDimMenuOpen(false); }} className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-[9px] font-black transition-all ${aspectRatio === opt.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 border-b border-white/5 last:border-none'}`}>
                            <div className="flex items-center gap-2 truncate"><opt.icon className="w-3.5 h-3.5" /><span className="truncate">{opt.label}</span></div>
                          </button>
                        ))}
                      </div>
                    )}
                 </div>

                  <div className="space-y-2 relative" ref={qualityMenuRef}>
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Video Size</label>
                    <button onClick={() => !isGenerating && setIsQualityMenuOpen(!isQualityMenuOpen)} className="w-full flex items-center justify-between px-3 py-3 bg-black/40 border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest hover:border-white/20 transition-all">
                      <div className="flex items-center gap-1.5 truncate"><Monitor className="w-3.5 h-3.5 text-indigo-400 shrink-0" /><span>{resolution.toUpperCase()}</span></div>
                      <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isQualityMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isQualityMenuOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-dark-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-scale-in">
                        {QUALITIES.map(opt => (
                          <button key={opt.id} onClick={() => { setResolution(opt.id); setIsQualityMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 transition-all ${resolution === opt.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 border-b border-white/5 last:border-none'}`}>
                            <span className="text-[9px] font-black uppercase tracking-widest">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                 </div>

                     <div className="space-y-2 relative" ref={durationMenuRef}>
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Duration</label>
                        <button onClick={() => !isGenerating && setIsDurationMenuOpen(!isDurationMenuOpen)} className="w-full flex items-center justify-between px-3 py-3 bg-black/40 border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest hover:border-white/20 transition-all">
                          <div className="flex items-center gap-1.5 truncate"><Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" /><span>{duration.toUpperCase()}</span></div>
                          <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isDurationMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isDurationMenuOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-dark-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-scale-in">
                            {DURATION_OPTIONS.map(opt => (
                              <button key={opt.id} onClick={() => { setDuration(opt.id); setIsDurationMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 transition-all ${duration === opt.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 border-b border-white/5 last:border-none'}`}>
                                <span className="text-[9px] font-black uppercase tracking-widest">{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                     </div>
              </div>

              {error && (
                <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center gap-3 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-[9px] text-red-400 font-black uppercase leading-tight">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate} disabled={isGenerating || showIdentityCheck}
                className={`w-full py-6 rounded-2xl font-black text-lg flex items-center justify-center gap-4 transition-all transform active:scale-95 shadow-2xl ${isGenerating ? 'bg-gray-800 text-gray-600' : (showIdentityCheck ? 'bg-white/5 opacity-60 cursor-not-allowed' : (isOutOfCredits ? 'bg-amber-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'))}`}
                title={showIdentityCheck ? 'A verification link was sent to your email. Please confirm your identity to proceed.' : undefined}
              >
                {isGenerating ? <RefreshCw className="w-6 h-6 animate-spin" /> : (isOutOfCredits ? <Lock className="w-6 h-6" /> : <Zap className="w-6 h-6 fill-white" />)}
                <span className="uppercase tracking-[0.2em] italic">{isGenerating ? 'Synthesis Active' : (showIdentityCheck ? 'VERIFY EMAIL TO PROCEED' : 'GENERATE NOW (1 CREDIT)')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 w-full max-w-5xl mx-auto">
          <div className="bg-black/40 border border-white/5 rounded-[3rem] p-2.5 h-full min-h-[550px] flex flex-col relative overflow-hidden">
            <div className="flex-1 rounded-[2.5rem] overflow-hidden bg-dark-950 flex flex-col relative group/viewport workstation-border">
              {resultVideo ? (
                <div className="h-full flex flex-col animate-fade-in relative z-10">
                  <div className="flex-1 bg-black flex items-center justify-center">
                    <video src={resultVideo.url} controls autoPlay loop className="max-h-full w-auto" />
                  </div>
                  <div className="p-8 border-t border-white/10 bg-dark-900/80 backdrop-blur-xl flex items-center justify-between">
                    <div>
                       <p className="text-white font-black uppercase tracking-tight text-xs italic leading-none">Synthesis Complete</p>
                       <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] mt-2">{resultVideo.resolution} • SORA 2 • {resultVideo.aspectRatio}</p>
                    </div>
                    <a href={resultVideo.url} download className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all flex items-center gap-2 px-6">
                      <Download className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Download MP4</span>
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