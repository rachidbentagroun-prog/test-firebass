
import React, { useState, useRef, useEffect } from 'react';
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
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');

  const [isDimMenuOpen, setIsDimMenuOpen] = useState(false);
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);

  const dimMenuRef = useRef<HTMLDivElement>(null);
  const qualityMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dimMenuRef.current && !dimMenuRef.current.contains(target)) setIsDimMenuOpen(false);
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(target)) setIsQualityMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!config) return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
       <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { hero, scriptToCinema, refineExtend, showcase } = config;

  const handleCTAClick = () => {
    if (user?.isRegistered) {
      onStartCreating();
    } else {
      onLoginClick();
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

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8 shadow-2xl animate-fade-in">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Neural Production Protocol v3.1</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter uppercase italic leading-tight animate-fade-in-up">
             Make UGC / <br />
             VIDEO ADS / <br />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
               ANY CONTENT WITH Ai Video
             </span>
          </h1>

          <p className="max-w-2xl mx-auto text-gray-400 text-lg md:text-2xl font-medium mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {hero.subtitle}
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <button 
              onClick={handleCTAClick}
              className="px-12 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xl flex items-center gap-3 transition-all transform hover:scale-105 shadow-[0_20px_50px_rgba(79,70,229,0.3)] group"
            >
              <Zap className="w-6 h-6 fill-white group-hover:animate-pulse" /> 
              Start Free Generation
            </button>
          </div>
        </div>
      </section>

      {/* 2. PRODUCTION MOTEUR SECTION */}
      <section id="moteur" className="py-32 relative bg-dark-900/40 border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4">
           <div className="text-center mb-20">
              <h2 className="text-sm font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Live Production Engine</h2>
              <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter">Ai Video Synthesis Moteur</h3>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Controls Column */}
              <div className="lg:col-span-5 space-y-8">
                 <div className="bg-dark-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/10 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                    
                    <div className="flex bg-black/50 p-1.5 rounded-2xl mb-10 border border-white/5 relative z-10">
                      <button 
                        onClick={() => setMoteurMode('text')}
                        className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${moteurMode === 'text' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                         <Terminal className="w-4 h-4" /> Text To Video
                      </button>
                      <button 
                        onClick={() => setMoteurMode('video')}
                        className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${moteurMode === 'video' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                         <Layers className="w-4 h-4" /> Frame Link
                      </button>
                    </div>

                    <div className="space-y-8 relative z-10">
                       {moteurMode === 'text' ? (
                          <div className="animate-fade-in">
                             <div className="flex justify-between mb-2">
                               <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Directorial Script</label>
                               <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Veo 3.1 LLM</span>
                             </div>
                             <textarea 
                               placeholder="Describe the cinematic motion, lighting, and textures..."
                               className="w-full h-44 bg-black/40 border border-white/10 rounded-[1.5rem] p-6 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none custom-scrollbar"
                             />
                          </div>
                       ) : (
                          <div className="animate-fade-in space-y-6">
                             <div className="flex justify-between mb-2">
                               <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Temporal Anchor</label>
                             </div>
                             <div className="aspect-video bg-black/60 border-2 border-dashed border-white/10 rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-indigo-500/30 transition-all group">
                                <Upload className="w-10 h-10 text-gray-600 mb-4 group-hover:text-indigo-400 group-hover:scale-110 transition-all" />
                                <p className="text-[10px] font-black text-gray-500 uppercase">Upload Starting Frame</p>
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Motion Guidance Script</label>
                                <input 
                                  type="text" 
                                  placeholder="Transform into cyberpunk aesthetic..."
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                             </div>
                          </div>
                       )}

                       <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2 relative" ref={dimMenuRef}>
                             <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Dimension</label>
                             <button onClick={() => setIsDimMenuOpen(!isDimMenuOpen)} className="w-full flex items-center justify-between px-3 py-3 bg-black/40 border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest hover:border-white/20 transition-all group">
                               <div className="flex items-center gap-1.5 truncate">
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

                       <button onClick={handleCTAClick} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                         <Zap className="w-5 h-5 fill-white" /> {user?.isRegistered ? 'Start Ai Video Synthesis' : 'Generate Free Now'}
                       </button>
                    </div>
                 </div>
              </div>

              {/* Viewport Column */}
              <div className="lg:col-span-7 bg-black/40 border border-white/5 rounded-[3rem] p-2.5 min-h-[500px] flex flex-col relative overflow-hidden">
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
      
      {/* Ready to Direct CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center">
           <h2 className="text-5xl md:text-8xl font-black text-white uppercase italic tracking-tighter mb-8 leading-none">Ready to <br /> Direct the Future?</h2>
           <button onClick={handleCTAClick} className="px-16 py-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black text-3xl uppercase italic tracking-widest shadow-2xl transition-transform hover:scale-105 active:scale-95">
              {user?.isRegistered ? 'Enter Ai Video Production' : 'Generate Free Now'}
           </button>
        </div>
      </section>
    </div>
  );
};
