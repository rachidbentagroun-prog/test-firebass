
import React, { useState, useRef, useEffect } from 'react';
import { generateVideoWithSora } from '../services/soraService';
import { generateVideoWithKlingAI } from '../services/klingaiService';
import { 
  Play, Sparkles, Film, Zap, ArrowRight, Scissors, 
  Layers, MonitorPlay, Clapperboard, ChevronRight,
  ShieldCheck, Globe, Star, Cpu, FileText, ArrowRightCircle,
  Video, RefreshCw, Wand2, Upload, PlusCircle, X, Camera,
  Focus, Move, Sun, Maximize, Activity, RectangleHorizontal,
  RectangleVertical, Clock, Highlighter, Download, Loader2,
  Lock, UserPlus, AlertCircle, Maximize2, Square, ChevronDown, 
  Check, Key, Settings, ZapOff, Image as ImageIcon,
  MousePointer2, Terminal, Shield, Workflow, MessageSquare, Monitor
} from 'lucide-react';
import { VideoLabConfig, User } from '../types';

interface VideoLabLandingProps {
  user: User | null;
  config?: VideoLabConfig;
  onStartCreating: () => void;
  onLoginClick: () => void;
  hasApiKey: boolean;
  onSelectKey: () => void;
  onResetKey: () => void;
}

const ASPECT_RATIOS: { id: '16:9' | '9:16', label: string, icon: any }[] = [
  { id: '16:9', label: '16:9 (Landscape)', icon: RectangleHorizontal },
  { id: '9:16', label: '9:16 (Portrait)', icon: RectangleVertical },
];

const QUALITIES: { id: '720p' | '1080p', label: string, desc: string, badge: string }[] = [
  { id: '720p', label: '720P', desc: 'Fast Generation', badge: 'HD' },
  { id: '1080p', label: '1080P', desc: 'High Fidelity', badge: 'FHD' },
];

export const VideoLabLanding: React.FC<VideoLabLandingProps> = ({ 
  user, config, onStartCreating, onLoginClick, 
  hasApiKey, onSelectKey, onResetKey 
}) => {
  const [moteurMode, setMoteurMode] = useState<'text' | 'video'>('text');
  const [videoEngine, setVideoEngine] = useState<'sora' | 'klingai'>('klingai');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [isGenerating, setIsGenerating] = useState(false);
  const [textPrompt, setTextPrompt] = useState('');
  const [videoGuidance, setVideoGuidance] = useState('');
  const [referenceFrame, setReferenceFrame] = useState<string | null>(null);

  const [isDimMenuOpen, setIsDimMenuOpen] = useState(false);
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
  const [showIdentityCheck, setShowIdentityCheck] = useState(false);

  const dimMenuRef = useRef<HTMLDivElement>(null);
  const qualityMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dimMenuRef.current && !dimMenuRef.current.contains(target)) setIsDimMenuOpen(false);
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(target)) setIsQualityMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check whether to show an identity verification notice
  useEffect(() => {
    try {
      const pv = localStorage.getItem('pending_verification');
      if ((user && !user.isVerified) || pv) {
        setShowIdentityCheck(true);
      } else {
        setShowIdentityCheck(false);
      }
    } catch (e) {
      // ignore
    }
  }, [user]);

  if (!config) return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
       <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { hero, scriptToCinema, refineExtend, showcase } = config;
  const handleCTAClick = async () => {
    console.log('[VideoLabLanding] CTA clicked', { 
      isRegistered: user?.isRegistered, 
      showIdentityCheck, 
      hasApiKey, 
      videoEngine,
      moteurMode,
      textPrompt,
      videoGuidance,
      aspectRatio,
      resolution
    });

    // Require login/registration first
    if (!user?.isRegistered) {
      console.log('[VideoLabLanding] User not registered, opening login');
      onLoginClick();
      return;
    }

    // Enforce identity check gating
    if (showIdentityCheck) {
      console.log('[VideoLabLanding] Identity check required');
      alert('A verification link was sent to your email. Please confirm your identity to proceed.');
      return;
    }

    // Ensure API key is configured
    if (!hasApiKey) {
      console.log('[VideoLabLanding] API key missing');
      onSelectKey();
      return;
    }

    // Validate prompt based on current mode
    const prompt = moteurMode === 'text' ? textPrompt.trim() : videoGuidance.trim();
    console.log('[VideoLabLanding] Prompt:', prompt);
    
    if (!prompt) {
      alert('Please enter a prompt in the Directorial Script textarea before starting synthesis.');
      return;
    }

    setIsGenerating(true);
    try {
      let url: string;
      
      if (videoEngine === 'sora') {
        // Sora format
        const size = aspectRatio === '16:9'
          ? (resolution === '1080p' ? '1920x1080' : '1280x720')
          : (resolution === '1080p' ? '1080x1920' : '720x1280');
        const seconds = resolution === '1080p' ? 10 : 8;
        
        console.log('[VideoLabLanding] Generating with Sora:', { model: 'sora-2', prompt, size, seconds, hasReference: !!referenceFrame });
        
        const body: any = { model: 'sora-2', prompt, size, seconds };
        if (moteurMode === 'video' && referenceFrame) {
          body.input_reference = referenceFrame;
        }
        console.log('[VideoLabLanding] Calling Sora API with body:', body);
        url = await generateVideoWithSora(body);
        console.log('[VideoLabLanding] Sora responded with URL:', url);
      } else {
        // KlingAI format
        const duration = resolution === '1080p' ? 10 : 5;
        
        console.log('[VideoLabLanding] Generating with KlingAI:', { prompt, aspect_ratio: aspectRatio, duration, hasReference: !!referenceFrame });
        const body: any = { 
          prompt, 
          aspect_ratio: aspectRatio,
          duration,
          mode: resolution === '1080p' ? 'pro' : 'standard'
        };
        if (moteurMode === 'video' && referenceFrame) {
          body.image_url = referenceFrame;
        }
        console.log('[VideoLabLanding] Calling KlingAI API with body:', body);
        url = await generateVideoWithKlingAI(body);
        console.log('[VideoLabLanding] KlingAI responded with URL:', url);
      }
      
      if (url && typeof url === 'string') {
        const engineName = videoEngine === 'sora' ? 'Sora' : 'KlingAI';
        alert(`${engineName} video generation started! Opening: ${url}`);
        window.open(url, '_blank', 'noopener');
      } else {
        alert(`${videoEngine.toUpperCase()} responded without a video URL. Please check your generation queue.`);
      }
    } catch (e: any) {
      console.error('[VideoLabLanding] Generation failed:', e);
      const engineName = videoEngine === 'sora' ? 'Sora' : 'KlingAI';
      alert(`Failed to start ${engineName} generation: ${e?.message || e}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentDimOption = ASPECT_RATIOS.find(opt => opt.id === aspectRatio);
  const currentQualityOption = QUALITIES.find(opt => opt.id === resolution);

  return (
    <div className="bg-dark-950 text-white min-h-screen font-sans selection:bg-pink-500/30">
      {/* 1. Cinematic Hero Section */}
      <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            muted 
            loop 
            playsInline 
            className="w-full h-full object-cover opacity-30 scale-105 blur-[2px]" 
            src={hero.videoUrl} 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark-950/90 via-dark-950/20 to-dark-950" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center" />
      </section>

      {/* 2. PRODUCTION MOTEUR SECTION */}
      <section id="moteur" className="pt-0 pb-16 sm:pb-24 md:pb-32 relative bg-dark-900/40 border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4">
           <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <h2 className="text-xs sm:text-sm font-black text-indigo-400 uppercase tracking-[0.4em] mb-3 sm:mb-4">Live Production Engine</h2>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter">Ai Video Synthesis Moteur</h3>
           </div>

           {showIdentityCheck && (
             <div className="max-w-2xl mx-auto mb-6 p-3 sm:p-4 rounded-2xl bg-amber-900/10 border border-amber-500/10 text-center">
               <div className="flex items-center justify-center gap-2 sm:gap-3">
                 <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-amber-300" />
                 <h4 className="text-xs sm:text-sm font-black uppercase text-amber-300">IDENTITY CHECK</h4>
               </div>
               <p className="text-gray-300 text-xs sm:text-sm mt-2">A verification link was sent to your email. Access is strictly restricted until you confirm your identity via that link.</p>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-10 items-start">
              {/* Controls Column */}
              <div className="md:col-span-1 lg:col-span-5 space-y-8">
                 <div className="bg-dark-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/10 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                    
                    {/* AI Engine Selector */}
                    <div className="mb-4 relative z-10">
                      <label className="form-label text-[10px] tracking-[0.18em]">AI Engine</label>
                      <div className="flex bg-black/50 p-1.5 rounded-xl border border-white/5">
                        <button 
                          onClick={() => setVideoEngine('klingai')}
                          className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${videoEngine === 'klingai' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-gray-300 hover:text-gray-100'}`}
                        >
                          KlingAI
                        </button>
                        <button 
                          onClick={() => setVideoEngine('sora')}
                          className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${videoEngine === 'sora' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg' : 'text-gray-300 hover:text-gray-100'}`}
                        >
                          Sora 2
                        </button>
                      </div>
                    </div>

                    <div className="flex bg-black/50 p-1.5 rounded-2xl mb-5 border border-white/5 relative z-10">
                      <button 
                        onClick={() => setMoteurMode('text')}
                        className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${moteurMode === 'text' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-300 hover:text-gray-100'}`}
                      >
                         <Terminal className="w-4 h-4" /> Text To Video
                      </button>
                      <button 
                        onClick={() => setMoteurMode('video')}
                        className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${moteurMode === 'video' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-300 hover:text-gray-100'}`}
                      >
                         <Layers className="w-4 h-4" /> Frame Link
                      </button>
                    </div>

                    <div className="space-y-6 relative z-10">
                       {moteurMode === 'text' ? (
                          <div className="animate-fade-in">
                             <div className="flex justify-between mb-2">
                               <label className="form-label text-[10px] tracking-[0.18em]">Directorial Script</label>
                               <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">{videoEngine === 'sora' ? 'Sora 2' : 'KlingAI'}</span>
                             </div>
                             <textarea 
                               placeholder="Describe the cinematic motion, lighting, and textures..."
                               className="w-full h-44 bg-black/40 border border-white/10 rounded-[1.5rem] p-6 text-white text-base outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none custom-scrollbar"
                               value={textPrompt}
                               onChange={(e) => setTextPrompt(e.target.value)}
                             />
                          </div>
                       ) : (
                          <div className="animate-fade-in space-y-6">
                             <div className="flex justify-between mb-2">
                               <label className="form-label text-[10px] tracking-[0.18em]">Temporal Anchor</label>
                             </div>
                             <div onClick={() => fileInputRef.current?.click()} className="aspect-video bg-black/60 border-2 border-dashed border-white/10 rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-indigo-500/30 transition-all group">
                                <Upload className="w-10 h-10 text-gray-600 mb-4 group-hover:text-indigo-400 group-hover:scale-110 transition-all" />
                                <p className="text-[10px] font-black text-gray-500 uppercase">{referenceFrame ? 'Frame Selected' : 'Upload Starting Frame'}</p>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = () => setReferenceFrame(reader.result as string);
                                  reader.readAsDataURL(file);
                                }} />
                             </div>
                              <div className="space-y-2">
                                <label className="form-label text-[10px] tracking-[0.18em]">Motion Guidance Script</label>
                                <input 
                                  type="text" 
                                  placeholder="Transform into cyberpunk aesthetic..."
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50"                                   value={videoGuidance}
                                   onChange={(e) => setVideoGuidance(e.target.value)}                                />
                             </div>
                          </div>
                       )}

                       <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2 relative" ref={dimMenuRef}>
                             <label className="form-label text-[9px] tracking-[0.18em]">Dimension</label>
                             <button onClick={() => setIsDimMenuOpen(!isDimMenuOpen)} className="w-full flex items-center justify-between px-3 py-3 bg-black/40 border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest hover:border-white/20 transition-all group">
                               <div className="flex items-center gap-1.5 truncate text-white">
                                 {currentDimOption && <currentDimOption.icon className="w-3.5 h-3.5 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />}
                                 <span className="truncate">{aspectRatio}</span>
                               </div>
                               <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform shrink-0 ${isDimMenuOpen ? 'rotate-180' : ''}`} />
                             </button>
                             {isDimMenuOpen && (
                               <div className="absolute top-full left-0 right-0 mt-2 z-[200] bg-dark-900 border border-white/10 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-scale-in">
                                 {ASPECT_RATIOS.map(opt => (
                                   <button key={opt.id} onClick={() => { setAspectRatio(opt.id); setIsDimMenuOpen(false); }} className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-[9px] font-black transition-all ${aspectRatio === opt.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 border-b border-white/5 last:border-none'}`}>
                                     <div className="flex items-center gap-2 truncate"><opt.icon className="w-3.5 h-3.5" /><span className="truncate">{opt.label}</span></div>
                                     {aspectRatio === opt.id && <Check className="w-2.5 h-2.5 shrink-0" />}
                                   </button>
                                 ))}
                               </div>
                             )}
                          </div>

                          <div className="space-y-2 relative" ref={qualityMenuRef}>
                             <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Quality</label>
                             <button onClick={() => setIsQualityMenuOpen(!isQualityMenuOpen)} className="w-full flex items-center justify-between px-3 py-3 bg-black/40 border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest hover:border-white/20 transition-all group">
                               <div className="flex items-center gap-1.5 truncate"><Monitor className="w-3.5 h-3.5 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" /><span>{resolution.toUpperCase()}</span></div>
                               <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform shrink-0 ${isQualityMenuOpen ? 'rotate-180' : ''}`} />
                             </button>
                             {isQualityMenuOpen && (
                               <div className="absolute top-full left-0 right-0 mt-2 z-[200] bg-dark-900 border border-white/10 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-scale-in">
                                 {QUALITIES.map(opt => (
                                   <button key={opt.id} onClick={() => { setResolution(opt.id); setIsQualityMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 transition-all ${resolution === opt.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 border-b border-white/5 last:border-none'}`}>
                                     <div className="flex justify-between mb-0.5"><span className="text-[9px] font-black uppercase tracking-widest">{opt.label}</span><span className={`text-[7px] font-bold px-1 py-0.5 rounded ${resolution === opt.id ? 'bg-white/20' : 'bg-indigo-500/10 text-indigo-400'}`}>{opt.badge}</span></div>
                                     <p className={`text-[7px] uppercase tracking-tighter truncate ${resolution === opt.id ? 'text-indigo-100' : 'text-gray-600'}`}>{opt.desc}</p>
                                   </button>
                                 ))}
                               </div>
                             )}
                          </div>
                       </div>

                       <button onClick={handleCTAClick} disabled={isGenerating || showIdentityCheck} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 disabled:text-white/50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                         {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-white" />} {user?.isRegistered ? (isGenerating ? 'Generating…' : 'Start Ai Video Synthesis') : 'Generate Free Now'}
                       </button>
                    </div>
                 </div>
              </div>

              {/* Viewport Column */}
              <div className="md:col-span-1 lg:col-span-7 bg-black/40 border border-white/5 rounded-[3rem] p-2.5 min-h-[500px] flex flex-col relative overflow-hidden\">
                <div className="flex-1 rounded-[2.5rem] overflow-hidden bg-dark-950 flex flex-col items-center justify-center relative group/viewport">
                   <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5 pointer-events-none" />
                   <video autoPlay muted loop playsInline src={scriptToCinema.videoUrl} className="max-h-full w-auto opacity-50 grayscale group-hover/viewport:opacity-100 group-hover/viewport:grayscale-0 transition-all duration-700" />
                   <div className="absolute inset-0 bg-dark-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-12 group-hover/viewport:opacity-0 transition-opacity pointer-events-none">
                      <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl mb-6"><MonitorPlay className="w-10 h-10 text-white" /></div>
                      <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Cinema Viewport</h4>
                      <p className="text-gray-500 text-sm max-w-xs font-medium leading-relaxed uppercase tracking-widest">Connect your production parameters to begin high-fidelity synthesis.</p>
                   </div>
                </div>
              </div>
           </div>
        </div>
      </section>
      
    </div>
  );
};
