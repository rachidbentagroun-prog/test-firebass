
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
import { useLanguage } from '../utils/i18n';

interface VideoLabLandingProps {
  user: User | null;
  config?: VideoLabConfig;
  onStartCreating: () => void;
  onLoginClick: () => void;
  hasApiKey: boolean;
  onSelectKey: () => void;
  onResetKey: () => void;
}

const ASPECT_RATIOS: { id: '16:9' | '9:16', label: string, icon: any, labelKey: string }[] = [
  { id: '16:9', label: '16:9 (Landscape)', icon: RectangleHorizontal, labelKey: 'videoLanding.landscapeLabel' },
  { id: '9:16', label: '9:16 (Portrait)', icon: RectangleVertical, labelKey: 'videoLanding.portraitLabel' },
];

const QUALITIES: { id: '720p' | '1080p', label: string, desc: string, badge: string, descKey: string }[] = [
  { id: '720p', label: '720P', desc: 'Fast Generation', badge: 'HD', descKey: 'videoLanding.fastGenerationLabel' },
  { id: '1080p', label: '1080P', desc: 'High Fidelity', badge: 'FHD', descKey: 'videoLanding.highFidelityLabel' },
];

export const VideoLabLanding: React.FC<VideoLabLandingProps> = ({ 
  user, config, onStartCreating, onLoginClick, 
  hasApiKey, onSelectKey, onResetKey 
}) => {
  const { t } = useLanguage();
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
  const [showVideoPopup, setShowVideoPopup] = useState(true);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

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
      alert(t('videoLanding.alertVerification'));
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
      alert(t('videoLanding.alertPromptRequired'));
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
        // Store generated video URL for viewport display
        setGeneratedVideoUrl(url);
        
        const engineName = videoEngine === 'sora' ? 'Sora' : 'KlingAI';
        alert(t('videoLanding.alertGenerationStarted').replace('{engine}', engineName).replace('{url}', url));
        window.open(url, '_blank', 'noopener');
      } else {
        alert(t('videoLanding.alertNoUrl').replace('{engine}', videoEngine.toUpperCase()));
      }
    } catch (e: any) {
      console.error('[VideoLabLanding] Generation failed:', e);
      const engineName = videoEngine === 'sora' ? 'Sora' : 'KlingAI';
      alert(t('videoLanding.alertGenerationFailed').replace('{engine}', engineName).replace('{error}', e?.message || e));
    } finally {
      setIsGenerating(false);
    }
  };

  const currentDimOption = ASPECT_RATIOS.find(opt => opt.id === aspectRatio);
  const currentQualityOption = QUALITIES.find(opt => opt.id === resolution);

  return (
    <div className="bg-dark-950 text-white min-h-screen font-sans selection:bg-pink-500/30">
      {/* Video Popup Modal */}
      {showVideoPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-[95vw] max-w-7xl mx-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowVideoPopup(false)}
              className="absolute -top-12 right-0 sm:-right-12 sm:top-0 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all group z-50"
              aria-label="Close video"
            >
              <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>
            
            {/* Video Container with 9:1 aspect ratio */}
            <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10" style={{ aspectRatio: '9/1' }}>
              <iframe
                src="https://drive.google.com/file/d/1d-CCQZFQ4wdMjsCFHVu57evgdbQ0TyLl/preview"
                className="absolute inset-0 w-full h-full"
                allow="autoplay"
                allowFullScreen
                title="Tutorial Video"
              />
            </div>
          </div>
        </div>
      )}
      
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
              <h2 className="text-xs sm:text-sm font-black text-indigo-400 uppercase tracking-[0.4em] mb-3 sm:mb-4">{t('videoLanding.liveProductionEngine')}</h2>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter">{t('videoLanding.workstationTitle')}</h3>
           </div>

           {showIdentityCheck && (
             <div className="max-w-2xl mx-auto mb-6 p-3 sm:p-4 rounded-2xl bg-amber-900/10 border border-amber-500/10 text-center">
               <div className="flex items-center justify-center gap-2 sm:gap-3">
                 <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-amber-300" />
                 <h4 className="text-xs sm:text-sm font-black uppercase text-amber-300">{t('videoLanding.identityCheck')}</h4>
               </div>
               <p className="text-gray-300 text-xs sm:text-sm mt-2">{t('videoLanding.verificationMessage')}</p>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-10 items-start">
              {/* Controls Column */}
              <div className="md:col-span-1 lg:col-span-5 space-y-8">
                 <div className="bg-dark-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/10 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                    
                    {/* AI Engine Selector */}
                    <div className="mb-4 relative z-10">
                      <label className="form-label text-[10px] tracking-[0.18em]">{t('videoLanding.engineLabel')}</label>
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
                         <Terminal className="w-4 h-4" /> {t('videoLanding.textToVideo')}
                      </button>
                      <button 
                        onClick={() => setMoteurMode('video')}
                        className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${moteurMode === 'video' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-300 hover:text-gray-100'}`}
                      >
                         <Layers className="w-4 h-4" /> {t('videoLanding.frameLink')}
                      </button>
                    </div>

                    <div className="space-y-6 relative z-10">
                       {moteurMode === 'text' ? (
                          <div className="animate-fade-in">
                             <div className="flex justify-between mb-2">
                               <label className="form-label text-[10px] tracking-[0.18em]">{t('videoLanding.directorialScript')}</label>
                               <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">{videoEngine === 'sora' ? 'Sora 2' : 'KlingAI'}</span>
                             </div>
                             <textarea 
                               placeholder={t('videoLanding.scriptPlaceholder')}
                               className="w-full h-44 bg-black/40 border border-white/10 rounded-[1.5rem] p-6 text-white text-base outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none custom-scrollbar"
                               value={textPrompt}
                               onChange={(e) => setTextPrompt(e.target.value)}
                             />
                          </div>
                       ) : (
                          <div className="animate-fade-in space-y-6">
                             <div className="flex justify-between mb-2">
                               <label className="form-label text-[10px] tracking-[0.18em]">{t('videoLanding.temporalAnchor')}</label>
                             </div>
                             <div onClick={() => fileInputRef.current?.click()} className="aspect-video bg-black/60 border-2 border-dashed border-white/10 rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-indigo-500/30 transition-all group">
                                <Upload className="w-10 h-10 text-gray-600 mb-4 group-hover:text-indigo-400 group-hover:scale-110 transition-all" />
                                <p className="text-[10px] font-black text-gray-500 uppercase">{referenceFrame ? t('videoLanding.frameSelected') : t('videoLanding.uploadFrame')}</p>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = () => setReferenceFrame(reader.result as string);
                                  reader.readAsDataURL(file);
                                }} />
                             </div>
                              <div className="space-y-2">
                                <label className="form-label text-[10px] tracking-[0.18em]">{t('videoLanding.motionGuidance')}</label>
                                <input 
                                  type="text" 
                                  placeholder={t('videoLanding.motionPlaceholder')}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50"                                   value={videoGuidance}
                                   onChange={(e) => setVideoGuidance(e.target.value)}                                />
                             </div>
                          </div>
                       )}

                       <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2 relative" ref={dimMenuRef}>
                             <label className="form-label text-[9px] tracking-[0.18em]">{t('videoLanding.dimension')}</label>
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
                                     <div className="flex items-center gap-2 truncate"><opt.icon className="w-3.5 h-3.5" /><span className="truncate">{t(opt.labelKey)}</span></div>
                                     {aspectRatio === opt.id && <Check className="w-2.5 h-2.5 shrink-0" />}
                                   </button>
                                 ))}
                               </div>
                             )}
                          </div>

                          <div className="space-y-2 relative" ref={qualityMenuRef}>
                             <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('videoLanding.quality')}</label>
                             <button onClick={() => setIsQualityMenuOpen(!isQualityMenuOpen)} className="w-full flex items-center justify-between px-3 py-3 bg-black/40 border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest hover:border-white/20 transition-all group">
                               <div className="flex items-center gap-1.5 truncate"><Monitor className="w-3.5 h-3.5 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" /><span>{resolution.toUpperCase()}</span></div>
                               <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform shrink-0 ${isQualityMenuOpen ? 'rotate-180' : ''}`} />
                             </button>
                             {isQualityMenuOpen && (
                               <div className="absolute top-full left-0 right-0 mt-2 z-[200] bg-dark-900 border border-white/10 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-scale-in">
                                 {QUALITIES.map(opt => (
                                   <button key={opt.id} onClick={() => { setResolution(opt.id); setIsQualityMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 transition-all ${resolution === opt.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 border-b border-white/5 last:border-none'}`}>
                                     <div className="flex justify-between mb-0.5"><span className="text-[9px] font-black uppercase tracking-widest">{opt.label}</span><span className={`text-[7px] font-bold px-1 py-0.5 rounded ${resolution === opt.id ? 'bg-white/20' : 'bg-indigo-500/10 text-indigo-400'}`}>{opt.badge}</span></div>
                                     <p className={`text-[7px] uppercase tracking-tighter truncate ${resolution === opt.id ? 'text-indigo-100' : 'text-gray-600'}`}>{t(opt.descKey)}</p>
                                   </button>
                                 ))}
                               </div>
                             )}
                          </div>
                       </div>

                       <button onClick={handleCTAClick} disabled={isGenerating || showIdentityCheck} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 disabled:text-white/50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                         {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-white" />} {user?.isRegistered ? (isGenerating ? t('videoLanding.generating') : t('videoLanding.startSynthesis')) : t('videoLanding.generateFree')}
                       </button>
                    </div>
                 </div>
              </div>

              {/* Viewport Column - AI Video Preview */}
              <div className="md:col-span-1 lg:col-span-7 bg-black/40 border border-white/5 rounded-[3rem] p-2.5 min-h-[500px] flex flex-col relative overflow-hidden\">
                <div className="flex-1 rounded-[2.5rem] overflow-hidden bg-dark-950 flex flex-col items-center justify-center relative group/viewport">
                   {/* Gradient Overlay */}
                   <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5 pointer-events-none z-10" />
                   
                   {/* Video Preview - Demo or Generated */}
                   {generatedVideoUrl ? (
                     /* User's Generated Video */
                     <video 
                       key={generatedVideoUrl}
                       autoPlay 
                       muted 
                       loop 
                       playsInline
                       controls
                       src={generatedVideoUrl} 
                       className="w-full h-full object-contain"
                       onError={(e) => {
                         console.error('Generated video failed to load:', generatedVideoUrl);
                         // Fallback to demo if generated video fails
                         setGeneratedVideoUrl(null);
                       }}
                     />
                   ) : (
                     /* Demo AI Video Preview */
                     <>
                       <video 
                         autoPlay 
                         muted 
                         loop 
                         playsInline
                         preload="auto"
                         src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" 
                         className="max-h-full w-auto opacity-60 group-hover/viewport:opacity-90 transition-all duration-700"
                         onError={(e) => {
                           console.warn('[VideoLabLanding] Demo video failed to load, replacing with fallback');
                           const videoElement = e.currentTarget;
                           if (videoElement.src !== 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4') {
                             videoElement.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
                           }
                         }}
                       />
                       
                       {/* AI Generated Example Badge */}
                       <div className="absolute top-6 right-6 z-20">
                         <div className="bg-gradient-to-r from-indigo-600/90 to-purple-600/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-2xl flex items-center gap-2 animate-fade-in">
                           <Sparkles className="w-4 h-4 text-white" />
                           <span className="text-white text-xs font-bold uppercase tracking-wider">AI Generated Example</span>
                         </div>
                       </div>
                       
                       {/* Info Overlay - Shows on initial load, fades on hover */}
                       <div className="absolute inset-0 bg-dark-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-12 group-hover/viewport:opacity-0 transition-opacity pointer-events-none z-10">
                          <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl mb-6">
                            <MonitorPlay className="w-10 h-10 text-white" />
                          </div>
                          <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-2">{t('videoLanding.cinemaViewport')}</h4>
                          <p className="text-gray-500 text-sm max-w-xs font-medium leading-relaxed uppercase tracking-widest">{t('videoLanding.viewportDesc')}</p>
                       </div>
                     </>
                   )}
                   
                   {/* Generation Status Badge */}
                   {generatedVideoUrl && (
                     <div className="absolute top-6 right-6 z-20">
                       <div className="bg-gradient-to-r from-green-600/90 to-emerald-600/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-2xl flex items-center gap-2 animate-fade-in">
                         <Check className="w-4 h-4 text-white" />
                         <span className="text-white text-xs font-bold uppercase tracking-wider">Your Generated Video</span>
                       </div>
                     </div>
                   )}
                </div>
              </div>
           </div>
        </div>
      </section>
      
    </div>
  );
};
