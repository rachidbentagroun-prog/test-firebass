import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, Play, Sparkles, Upload, X, Download, RefreshCw, AlertCircle, 
  Film, Zap, Gauge, Binary, Activity, History, RectangleHorizontal, RectangleVertical, Monitor, ChevronDown, Lock
} from 'lucide-react';
import { generateVideoWithVeo, pollVideoOperation, convertBlobToBase64 } from '../services/geminiService';
import { User, GeneratedVideo } from '../types';
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

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ 
  user, onCreditUsed, onUpgradeRequired, onVideoGenerated, 
  hasApiKey, onSelectKey, onResetKey 
}) => {
  const [mode, setMode] = useState<'text' | 'interpolation'>('text');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  
  const [isDimMenuOpen, setIsDimMenuOpen] = useState(false);
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
  
  const dimMenuRef = useRef<HTMLDivElement>(null);
  const qualityMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [startImage, setStartImage] = useState<{file: File, url: string} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [resultVideo, setResultVideo] = useState<GeneratedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOutOfCredits = user && user.plan !== 'premium' && user.credits <= 0;

  useEffect(() => {
    if (user) {
      getWorkState(user.id, 'video-generator').then(state => {
        if (state) {
          if (state.mode) setMode(state.mode);
          if (state.prompt) setPrompt(state.prompt);
          if (state.aspectRatio === '16:9' || state.aspectRatio === '9:16') setAspectRatio(state.aspectRatio);
          if (state.resolution) setResolution(state.resolution);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const timeoutId = setTimeout(() => {
        saveWorkState(user.id, 'video-generator', { mode, prompt, aspectRatio, resolution });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, mode, prompt, aspectRatio, resolution]);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      let startImgData = undefined;
      if (startImage) {
        const base64 = await convertBlobToBase64(startImage.file);
        startImgData = { data: base64, mimeType: startImage.file.type };
      }

      const operation = await generateVideoWithVeo(prompt, { aspectRatio, resolution, startImage: startImgData });
      const videoUrl = await pollVideoOperation(operation);
      
      const newVideo: GeneratedVideo = {
        id: Date.now().toString(),
        url: videoUrl,
        uri: operation.name || '',
        prompt: prompt || 'Synthesized sequence',
        createdAt: Date.now(),
        aspectRatio: aspectRatio,
        resolution: resolution as any,
      };

      setResultVideo(newVideo);
      if (user) {
        onVideoGenerated(newVideo);
        onCreditUsed();
      }
    } catch (err: any) {
      console.error("Generation Error:", err);
      if (err.message?.includes("entity was not found")) {
        onResetKey();
        setError("API session failure. Please re-authorize your key.");
      } else {
        setError(err.message || "Temporal synthesis failed. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const currentDimOption = ASPECT_RATIOS.find(opt => opt.id === aspectRatio);
  const currentQualityOption = QUALITIES.find(opt => opt.id === resolution);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in space-y-16">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 scroll-mt-24">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-dark-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative h-full overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/5 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
            
            <div className="flex justify-between items-start mb-8 relative z-10">
               <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
                 <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-xl">
                   <Video className="w-6 h-6 text-white" />
                 </div>
                 Video Production
               </h2>
               {user && (
                 <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${isOutOfCredits ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400'}`}>
                    {user.plan === 'premium' ? 'UNLIMITED' : `${user.credits} Credits`}
                 </div>
               )}
            </div>

            <div className="flex bg-black/50 p-1.5 rounded-2xl mb-8 border border-white/5 relative z-10">
              <button 
                onClick={() => setMode('text')} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'text' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Script
              </button>
              <button 
                onClick={() => setMode('interpolation')} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'interpolation' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Frame Link
              </button>
            </div>

            <div className="space-y-6 relative z-10">
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

              <div className="grid grid-cols-2 gap-3">
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
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Output Quality</label>
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
              </div>

              {error && (
                <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center gap-3 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-[9px] text-red-400 font-black uppercase leading-tight">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate} disabled={isGenerating}
                className={`w-full py-6 rounded-2xl font-black text-lg flex items-center justify-center gap-4 transition-all transform active:scale-95 shadow-2xl ${isGenerating ? 'bg-gray-800 text-gray-600' : (isOutOfCredits ? 'bg-amber-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20')}`}
              >
                {isGenerating ? <RefreshCw className="w-6 h-6 animate-spin" /> : (isOutOfCredits ? <Lock className="w-6 h-6" /> : <Zap className="w-6 h-6 fill-white" />)}
                <span className="uppercase tracking-[0.2em] italic">{isGenerating ? 'Synthesis Active' : 'Start Synthesis'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
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
                       <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] mt-2">{resultVideo.resolution} • VEO 3.1 • {resultVideo.aspectRatio}</p>
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
                          <p className="text-[10px] font-bold text-white uppercase truncate">Veo 3.1 Adaptive</p>
                       </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
                   <Film className="w-10 h-10 text-gray-700 mb-6" />
                   <h3 className="text-3xl font-black uppercase tracking-[0.3em] text-white leading-none italic">ViewPort</h3>
                   <p className="text-gray-600 mt-4 max-w-xs text-xs font-bold uppercase tracking-widest">Initialize production to begin temporal synthesis.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};