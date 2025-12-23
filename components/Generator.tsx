
import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, Sparkles, Upload, X, Download, RefreshCw, AlertCircle, 
  Edit, Save, Trash2, Wand2, RectangleHorizontal, RectangleVertical, Square,
  Palette, Camera, Zap, Brush, Box, Ban, Compass, Share2,
  Grid, PenTool, History, Star, Settings, Film, Layers, Smile, FileText, Gem, Sticker,
  Headphones, Play, Volume2, Inbox, ChevronRight, ChevronDown, Mail, Bell, BarChart3, TrendingUp, CreditCard,
  Info, Lock, Check, Repeat, Maximize2, ArrowRightLeft, ZoomIn, ZoomOut, RotateCcw, Eye, User as UserIcon,
  ShieldCheck, Clock, Layout, Terminal, FileImage, Lightbulb, RotateCcw as RotateIcon, Rocket
} from 'lucide-react';
import { generateImageWithGemini, convertBlobToBase64, enhancePrompt, generateSpeechWithGemini } from '../services/geminiService';
import { User, GeneratedImage } from '../types';
import { ImageEditor } from './ImageEditor';
import { saveWorkState, getWorkState } from '../services/dbService';

interface GeneratorProps {
  user: User | null;
  gallery: GeneratedImage[];
  onCreditUsed: () => void;
  onUpgradeRequired: () => void;
  onImageGenerated: (image: GeneratedImage) => void;
  onDeleteImage?: (id: string) => void;
  onDeleteImagePermanent?: (id: string) => void;
  onUpdateUser?: (user: User) => void;
  initialPrompt?: string;
}

const ASPECT_RATIOS: { id: string, label: string, icon: any }[] = [
  { id: '1:1', label: '1:1 (Square)', icon: Square },
  { id: '9:16', label: '9:16 (Portrait)', icon: RectangleVertical },
  { id: '1:2', label: '1:2 (Slim)', icon: RectangleVertical },
  { id: '3:4', label: '3:4 (Tall)', icon: RectangleVertical },
];

const STYLES = [
  { id: 'none', label: 'None', modifier: '' },
  { id: 'photorealistic', label: 'Realistic', modifier: 'photorealistic, 8k, highly detailed, realistic lighting, photography' },
  { id: 'anime', label: 'Anime', modifier: 'anime style, studio ghibli, vibrant colors, cel shaded' },
  { id: '3d-model', label: '3D Render', modifier: '3d render, unreal engine 5, octane render, ray tracing, high fidelity' },
  { id: 'pixel-art', label: 'Pixel Art', modifier: 'pixel art, 16-bit, retro game style, dithering' },
  { id: 'cyberpunk', label: 'Cyberpunk', modifier: 'cyberpunk, neon lights, futuristic, high tech, synthwave' },
  { id: 'cinematic', label: 'Cinematic', modifier: 'cinematic lighting, movie scene, dramatic, 4k, wide angle, depth of field, blockbuster' },
  { id: 'fantasy', label: 'Fantasy', modifier: 'fantasy art, magical, ethereal, highly detailed, concept art, dungeons and dragons style' },
];

const IMAGE_IDEAS = [
  { label: "Neon Samurai", prompt: "A holographic neon samurai in rainy Cyberpunk Tokyo, extreme detail, katana glowing", thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800" },
  { label: "Cosmic Whale", prompt: "Bioluminescent whale flying through a vibrant nebula space clouds, galactic scale", thumbnail: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=800" },
  { label: "Ancient Temple", prompt: "Lost overgrown temple in a deep jungle, shafts of light piercing through canopy, 8k", thumbnail: "https://images.unsplash.com/photo-1545641203-7d072a14e3b2?auto=format&fit=crop&q=80&w=800" },
  { label: "Mech Pilot", prompt: "Close up of a pilot inside a high-tech cockpit, reflections on visor, complex HUD", thumbnail: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800" },
];

const QUICK_IDEAS = [
  { label: "Tropical Island", prompt: "A crystal clear tropical island with white sand and turquoise water, aerial drone shot, high fidelity" },
  { label: "Golden Koi", prompt: "Highly detailed golden koi fish swimming in a mystical pond with cherry blossom petals, 8k" },
  { label: "Hybrid Dragon", prompt: "A majestic hybrid dragon made of obsidian and glowing magma, epic fantasy style, cinematic lighting" }
];

const PROMPT_HISTORY_KEY = 'imaginai_prompt_history';

export const Generator: React.FC<GeneratorProps> = ({ user, gallery, onCreditUsed, onUpgradeRequired, onImageGenerated, onDeleteImage, onUpdateUser, initialPrompt }) => {
  const [genMode, setGenMode] = useState<'tti' | 'iti'>('tti');
  const [imageEngine, setImageEngine] = useState<'klingai' | 'gemini'>('klingai');
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [selectedStyle, setSelectedStyle] = useState('none');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProMode, setIsProMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<GeneratedImage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [showIdentityCheck, setShowIdentityCheck] = useState(false);

  useEffect(() => {
    try {
      const pv = localStorage.getItem('pending_verification');
      setShowIdentityCheck((user && !user.isVerified) || !!pv);
    } catch (e) { /* ignore */ }
  }, [user]);
  
  const [isAspectRatioMenuOpen, setIsAspectRatioMenuOpen] = useState(false);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [showPromptHistory, setShowPromptHistory] = useState(false);
  
  const [promptHistory, setPromptHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(PROMPT_HISTORY_KEY) || '[]');
    } catch {
      return [];
    }
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const workstationRef = useRef<HTMLDivElement>(null);
  const aspectRatioMenuRef = useRef<HTMLDivElement>(null);
  const styleMenuRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const zoomContainerRef = useRef<HTMLDivElement>(null);

  const isOutOfCredits = user && user.plan !== 'premium' && user.credits <= 0;
  const isApiKeyConfigured = !!process.env.API_KEY && process.env.API_KEY !== '""';

  // Load persistent work state on mount
  useEffect(() => {
    if (user) {
      getWorkState(user.id, 'image-generator').then(state => {
        if (state) {
          if (state.genMode) setGenMode(state.genMode);
          if (state.prompt && !initialPrompt) setPrompt(state.prompt);
          if (state.aspectRatio) setAspectRatio(state.aspectRatio);
          if (state.selectedStyle) setSelectedStyle(state.selectedStyle);
          if (state.isProMode !== undefined) setIsProMode(state.isProMode);
        }
      });
    }
  }, [user, initialPrompt]);

  // Persist work state on change (with a simple effect)
  useEffect(() => {
    if (user) {
      const timeoutId = setTimeout(() => {
        saveWorkState(user.id, 'image-generator', {
          genMode,
          prompt,
          aspectRatio,
          selectedStyle,
          isProMode
        });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, genMode, prompt, aspectRatio, selectedStyle, isProMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (aspectRatioMenuRef.current && !aspectRatioMenuRef.current.contains(target)) {
        setIsAspectRatioMenuOpen(false);
      }
      if (styleMenuRef.current && !styleMenuRef.current.contains(target)) {
        setIsStyleMenuOpen(false);
      }
      if (historyRef.current && !historyRef.current.contains(target)) {
        setShowPromptHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const container = zoomContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return; 
      e.preventDefault();
      const delta = e.deltaY * -0.0015;
      setPreviewZoom(prev => Math.min(Math.max(0.5, prev + delta), 5));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [resultImage, isEditing]);

  const saveToHistory = (newPrompt: string) => {
    if (!newPrompt.trim()) return;
    setPromptHistory(prev => {
      const filtered = prev.filter(p => p !== newPrompt);
      const updated = [newPrompt, ...filtered].slice(0, 10);
      localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user && onUpdateUser) {
      const base64 = await convertBlobToBase64(e.target.files[0]);
      onUpdateUser({
        ...user,
        avatarUrl: `data:${e.target.files[0].type};base64,${base64}`
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError("Image size too large. Max 10MB for reference images.");
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setError(null);
    try {
      const enhanced = await enhancePrompt(prompt);
      setPrompt(enhanced);
    } catch (err) {
      console.error(err);
    } finally { setIsEnhancing(false); }
  };

  const handleNarrate = async () => {
    if (!prompt.trim()) return;
    setIsSpeaking(true);
    setError(null);
    try {
      const blob = await generateSpeechWithGemini(`Script: ${prompt}`);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setIsSpeaking(false);
      };
      audio.onerror = () => {
        setError("Vocal playback failed. Reducer signal lost.");
        setIsSpeaking(false);
      };
      await audio.play();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Narrator failed to initialize.");
      setIsSpeaking(false);
    }
  };

  const handleGenerate = async () => {
    if (isOutOfCredits) {
      onUpgradeRequired();
      return;
    }

    if (!prompt.trim()) { setError("Input a directorial script to begin synthesis."); return; }
    
    if (genMode === 'iti' && !selectedImage && !previewUrl) { 
      setError("Please upload a reference image for Image-to-Image mode."); 
      return; 
    }
    
    setIsGenerating(true);
    setError(null);
    setPreviewZoom(1);

    try {
      let base64Image: string | undefined = undefined;
      let mimeType: string = 'image/png';

      if (genMode === 'iti') {
        if (selectedImage) {
          base64Image = await convertBlobToBase64(selectedImage);
          mimeType = selectedImage.type;
        } else if (previewUrl && previewUrl.startsWith('data:')) {
          const parts = previewUrl.split(',');
          if (parts.length > 1) {
            base64Image = parts[1];
            mimeType = parts[0].split(':')[1].split(';')[0];
          }
        }
      }

      const style = STYLES.find(s => s.id === selectedStyle);
      const finalPrompt = style?.modifier && style?.id !== 'none' ? `${prompt}, ${style.modifier}` : prompt;

      const supportedRatio = aspectRatio === '1:2' ? '9:16' : aspectRatio;

      let generatedDataUrl: string;

      if (imageEngine === 'klingai') {
        // KlingAI generation
        console.log('[Generator] Generating with KlingAI:', { prompt: finalPrompt, aspect_ratio: supportedRatio, mode: isProMode ? 'pro' : 'standard' });
        const { generateImageWithKlingAI } = await import('../services/klingaiImageService').then(m => ({ generateImageWithKlingAI: (m as any).generateImageWithKlingAI }));
        const body: any = {
          prompt: finalPrompt,
          aspect_ratio: supportedRatio,
          mode: isProMode ? 'pro' : 'standard',
          image_count: 1
        };
        if (base64Image) {
          body.image_url = `data:${mimeType};base64,${base64Image}`;
        }
        console.log('[Generator] Calling KlingAI API');
        generatedDataUrl = await generateImageWithKlingAI(body);
        console.log('[Generator] KlingAI responded with URL:', generatedDataUrl);
      } else {
        // Gemini generation
        console.log('[Generator] Generating with Gemini:', { prompt: finalPrompt, aspectRatio: supportedRatio, isProMode });
        generatedDataUrl = await generateImageWithGemini(
          finalPrompt, 
          base64Image, 
          mimeType, 
          supportedRatio,
          isProMode
        );
        console.log('[Generator] Gemini responded');
      }
      
      if (!generatedDataUrl || !generatedDataUrl.startsWith('data:')) {
         throw new Error("Handshake failed: Engine returned invalid visual signal.");
      }

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: generatedDataUrl,
        prompt: prompt,
        createdAt: Date.now(),
      };

      saveToHistory(prompt);
      setResultImage(newImage);
      
      // AUTO-SAVE LOGIC: Persistence triggers immediately on success
      if (user) {
        onImageGenerated(newImage);
        onCreditUsed();
      }
    } catch (err: any) {
      setError(err.message || "Neural synthesis failure. Check API logs for link status.");
      console.error("Critical Generation Disruption:", err);
    } finally { setIsGenerating(false); }
  };

  const handleIdeaClick = (idea: { prompt: string }) => {
    if (isOutOfCredits) {
      onUpgradeRequired();
      return;
    }
    setGenMode('tti');
    setPrompt(idea.prompt);
    workstationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const currentRatioOption = ASPECT_RATIOS.find(r => r.id === aspectRatio);
  const currentStyleOption = STYLES.find(s => s.id === selectedStyle);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in space-y-12">
      <div ref={workstationRef} className="grid grid-cols-1 lg:grid-cols-4 gap-8 scroll-mt-24">
        <div className="lg:col-span-3 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl">
                 <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">Synthesis Station</h2>
                <div className="flex items-center gap-2 mt-1.5">
                   <div className={`w-1.5 h-1.5 rounded-full ${isApiKeyConfigured ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                   <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                     Neural Link: {isApiKeyConfigured ? 'ACTIVE' : 'OFFLINE'}
                   </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Credits Remaining Badge */}
              {user && (
                <div 
                  className={`px-4 py-2 rounded-full border transition-all duration-300 flex items-center gap-2 ${
                    isOutOfCredits 
                    ? 'bg-red-600/10 border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse' 
                    : 'bg-white/5 border-white/10 text-gray-300'
                  }`}
                >
                  <CreditCard className={`w-3.5 h-3.5 ${isOutOfCredits ? 'text-red-500' : 'text-indigo-400'}`} />
                  <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                    {user.plan === 'premium' ? 'UNLIMITED' : `${user.credits} CREDITS`}
                  </span>
                </div>
              )}
              
              <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10">
                <button 
                  onClick={() => setIsProMode(!isProMode)}
                  className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${isProMode ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-transparent border-transparent text-gray-500'}`}
                >
                  <Gem className="w-3 h-3" /> Ultra HD 3.0
                </button>
              </div>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex bg-black/50 p-1.5 rounded-2xl border border-white/5 relative z-10 w-fit">
            <button 
              onClick={() => setGenMode('tti')} 
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${genMode === 'tti' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              <FileText className="w-3.5 h-3.5" /> TEXT TO IMAGE
            </button>
            <button 
              onClick={() => setGenMode('iti')} 
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${genMode === 'iti' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              <FileImage className="w-3.5 h-3.5" /> IMAGE TO IMAGE
            </button>
          </div>

          {/* AI Engine Selector */}
          <div className="relative z-10">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">AI Engine</label>
            <div className="flex bg-black/50 p-1.5 rounded-xl border border-white/5 w-fit">
              <button 
                onClick={() => setImageEngine('klingai')}
                className={`px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${imageEngine === 'klingai' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                KlingAI
              </button>
              <button 
                onClick={() => setImageEngine('gemini')}
                className={`px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${imageEngine === 'gemini' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Gemini 2.5
              </button>
            </div>
          </div>

          {/* Input Core */}
          <div className="bg-[#0a0a1a] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-visible group/station">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] rounded-full group-hover/station:bg-indigo-600/10 transition-all pointer-events-none" />
            
            <div className="flex flex-col md:flex-row gap-10">
               {/* Left: IMAGE */}
               {genMode === 'iti' && (
                 <div className="w-full md:w-64 shrink-0 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest">IMAGE ANCHOR</label>
                      {previewUrl && (
                        <button onClick={() => { setPreviewUrl(null); setSelectedImage(null); }} className="text-red-500 p-1 hover:bg-red-500/10 rounded-lg">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    
                    {!previewUrl ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square bg-black/40 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-pink-500/30 group/anchor transition-all"
                      >
                         <Upload className="w-8 h-8 text-gray-700 group-hover/anchor:text-pink-400 mb-2 transition-colors" />
                         <span className="text-[8px] font-black text-gray-600 uppercase">Upload Reference</span>
                      </div>
                    ) : (
                      <div className="aspect-square rounded-3xl overflow-hidden border border-pink-500/30 relative group/preview shadow-2xl">
                         <img src={previewUrl} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity">
                            <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white/10 rounded-2xl backdrop-blur-md text-white"><Edit className="w-5 h-5" /></button>
                         </div>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                 </div>
               )}

               {/* Right: Directorial Script */}
               <div className="flex-1 flex flex-col relative">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{genMode === 'tti' ? 'Script Prompt' : 'Modification Script'}</label>
                    <div className="flex gap-4">
                      {promptHistory.length > 0 && (
                        <div className="relative" ref={historyRef}>
                          <button 
                            onClick={() => setShowPromptHistory(!showPromptHistory)}
                            className="text-[10px] font-black text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                            History
                          </button>
                          
                          {showPromptHistory && (
                            <div className="absolute right-0 top-full mt-2 w-72 bg-dark-900 border border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden animate-scale-in">
                              <div className="p-4 border-b border-white/5 bg-black/20">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Recent Scripts</p>
                              </div>
                              <div className="max-h-60 overflow-y-auto no-scrollbar">
                                {promptHistory.map((h, i) => (
                                  <button 
                                    key={i}
                                    onClick={() => { setPrompt(h); setShowPromptHistory(false); }}
                                    className="w-full text-left p-4 hover:bg-white/5 border-b border-white/5 last:border-none transition-colors group"
                                  >
                                    <p className="text-[11px] text-gray-400 group-hover:text-white line-clamp-2 leading-relaxed">"{h}"</p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <button 
                        onClick={handleEnhancePrompt} 
                        disabled={isEnhancing || !prompt.trim()}
                        className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50"
                      >
                        <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
                        Optimize
                      </button>
                    </div>
                  </div>
                  <textarea 
                    value={prompt} 
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={genMode === 'iti' ? "How should the anchor be transformed?" : "Synthesize your vision into visual reality..."}
                    className="flex-1 bg-transparent border-none text-white text-xl placeholder-gray-800 focus:ring-0 outline-none resize-none no-scrollbar min-h-[150px]"
                  />

                  {/* Tools Row */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4 animate-fade-in border-t border-white/5 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                         <Lightbulb className="w-3 h-3 text-amber-500" /> Ideas:
                      </div>
                      <div className="flex flex-wrap gap-2">
                         {QUICK_IDEAS.map((idea) => (
                           <button 
                             key={idea.label} 
                             onClick={() => handleIdeaClick(idea)}
                             className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all active:scale-95"
                           >
                             {idea.label}
                           </button>
                         ))}
                      </div>
                    </div>

                    <button 
                      onClick={handleNarrate}
                      disabled={isSpeaking || !prompt.trim()}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${isSpeaking ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg animate-pulse' : 'bg-white/5 border-white/10 text-gray-500 hover:text-indigo-400 hover:border-indigo-500/30'}`}
                      title="Audio narration of script"
                    >
                      {isSpeaking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
                      {isSpeaking ? 'Reading...' : 'Voice Preview'}
                    </button>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 pt-10 border-t border-white/5">
               {/* Aspect Ratio Dropdown */}
               <div className="space-y-4 relative" ref={aspectRatioMenuRef}>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block ml-1">ASPECT RATIO</label>
                  <button onClick={() => setIsAspectRatioMenuOpen(!isAspectRatioMenuOpen)} className="w-full flex items-center justify-between px-6 py-4 bg-black/60 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest transition-all hover:border-white/20">
                     <div className="flex items-center gap-3">
                        {currentRatioOption && <currentRatioOption.icon className="w-4 h-4 text-indigo-400" />}
                        <span>{aspectRatio}</span>
                     </div>
                     <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isAspectRatioMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isAspectRatioMenuOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-dark-900 border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-scale-in">
                       {ASPECT_RATIOS.map(ratio => (
                         <button key={ratio.id} onClick={() => { setAspectRatio(ratio.id); setIsAspectRatioMenuOpen(false); }} className={`w-full flex items-center justify-between px-4 py-3 text-[10px] font-black uppercase transition-all ${aspectRatio === ratio.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 border-b border-white/5 last:border-none'}`}>
                            <div className="flex items-center gap-3"><ratio.icon className="w-4 h-4" />{ratio.label}</div>
                            {aspectRatio === ratio.id && <Check className="w-3 h-3" />}
                         </button>
                       ))}
                    </div>
                  )}
               </div>

               {/* Style Dropdown */}
               <div className="space-y-4 relative" ref={styleMenuRef}>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block ml-1">STYLE PRESET</label>
                  <button onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)} className="w-full flex items-center justify-between px-6 py-4 bg-black/60 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest transition-all hover:border-white/20">
                     <div className="flex items-center gap-3">
                        <Palette className="w-4 h-4 text-pink-400" />
                        <span>{currentStyleOption?.label || 'None'}</span>
                     </div>
                     <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isStyleMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isStyleMenuOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-dark-900 border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-scale-in max-h-72 overflow-y-auto custom-scrollbar">
                       {STYLES.map(s => (
                         <button key={s.id} onClick={() => { setSelectedStyle(s.id); setIsStyleMenuOpen(false); }} className={`w-full flex items-center justify-between px-4 py-3 text-[10px] font-black uppercase transition-all ${selectedStyle === s.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 border-b border-white/5 last:border-none'}`}>
                            <span>{s.label}</span>
                            {selectedStyle === s.id && <Check className="w-3 h-3" />}
                         </button>
                       ))}
                    </div>
                  )}
               </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center gap-3 animate-fade-in shadow-[0_0_20px_rgba(220,38,38,0.1)]">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">{error}</p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || showIdentityCheck}
            className={`w-full py-8 rounded-[2.5rem] font-black text-3xl uppercase tracking-[0.4em] italic flex items-center justify-center gap-5 transition-all transform active:scale-[0.98] ${
              isGenerating 
              ? 'bg-gray-800 text-gray-600 shadow-inner' 
              : showIdentityCheck ? 'bg-white/5 opacity-60 cursor-not-allowed' : (isOutOfCredits ? 'bg-red-600 hover:bg-red-500 text-white shadow-xl' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_25px_60px_rgba(99,102,241,0.3)]')
            }`}
          >
            {isGenerating ? <RefreshCw className="w-8 h-8 animate-spin" /> : (isOutOfCredits ? <Lock className="w-8 h-8" /> : <Sparkles className="w-8 h-8 fill-white" />)}
            {isGenerating ? 'Synthesizing...' : (showIdentityCheck ? 'VERIFY EMAIL TO GENERATE' : (isOutOfCredits ? '0 CREDITS - UPGRADE' : 'GENERATE NOW (1 Credit)'))}
          </button>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-dark-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
              <h3 className="text-xs font-black text-white uppercase tracking-widest italic mb-8 flex items-center gap-2">
                 <PenTool className="w-4 h-4 text-pink-400" /> Identity Profile
              </h3>
              <div className="space-y-8">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4 group/avatar relative overflow-hidden">
                    <div 
                      onClick={() => avatarInputRef.current?.click()}
                      className="relative cursor-pointer w-12 h-12 shrink-0 group/img-overlay"
                    >
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} className="w-full h-full rounded-xl object-cover border border-white/10" />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white text-lg">
                           {user ? user.name.charAt(0).toUpperCase() : 'G'}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover/img-overlay:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5">
                        <Camera className="w-4 h-4 text-white" />
                        <span className="text-[6px] font-black text-white uppercase tracking-widest">Update</span>
                      </div>
                      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </div>
                    <div className="overflow-hidden">
                       <p className="text-xs font-black text-white uppercase truncate">{user ? user.name : 'Guest User'}</p>
                       <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Creator Account</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="bg-white/5 p-5 rounded-[1.8rem] border border-white/5 group hover:border-indigo-500/20 transition-all">
                       <div className="flex items-center gap-3 mb-2">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Access Plan</p>
                       </div>
                       <h4 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">
                          {user?.plan || 'Free'} Protocol
                       </h4>
                    </div>

                    <div className={`p-5 rounded-[1.8rem] border transition-all ${isOutOfCredits ? 'bg-red-600/10 border-red-500/30' : 'bg-white/5 border-white/5'}`}>
                       <div className="flex items-center gap-3 mb-2">
                          <CreditCard className={`w-3.5 h-3.5 ${isOutOfCredits ? 'text-red-500' : 'text-emerald-400'}`} />
                          <p className={`text-[9px] font-black uppercase tracking-widest ${isOutOfCredits ? 'text-red-400' : 'text-gray-500'}`}>Credits Remaining</p>
                       </div>
                       <h4 className={`text-xl font-black ${isOutOfCredits ? 'text-red-500' : 'text-white'} uppercase tracking-tight`}>
                          {user ? (user.plan === 'premium' ? 'UNLIMITED' : user.credits) : '0'} 
                          <span className="text-[9px] opacity-40 ml-1.5 font-bold">Units</span>
                       </h4>
                       {isOutOfCredits && (
                         <button onClick={onUpgradeRequired} className="mt-3 w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-colors shadow-lg">Upgrade Authorization</button>
                       )}
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="bg-dark-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
              <h3 className="text-xs font-black text-white uppercase tracking-widest italic mb-6 flex items-center gap-2">
                 <Info className="w-4 h-4 text-indigo-400" /> Node Guide
              </h3>
              <p className="text-[10px] text-gray-500 leading-relaxed font-medium uppercase tracking-tight">
                {genMode === 'tti' 
                  ? "TEXT TO IMAGE: Synthesize unique visual assets from raw natural language input." 
                  : "IMAGE TO IMAGE: Modify an existing visual anchor using directorial script modifiers."
                }
              </p>
           </div>
        </div>
      </div>

      {/* NEURAL VAULT SECTION */}
      {gallery.length > 0 && (
        <section className="bg-dark-900/50 border border-white/10 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden animate-fade-in-up">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 mb-4">
                <History className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Neural Vault</span>
              </div>
              <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Recent History</h3>
              <p className="text-gray-500 text-sm font-medium mt-3 uppercase tracking-widest">Your previously synthesized projections</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black text-gray-600 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5">
               <Grid className="w-4 h-4" /> {gallery.length} Creations
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6 relative z-10">
            {gallery.slice(0, 12).map((img) => (
              <div key={img.id} className="group flex flex-col transition-all relative">
                <div 
                  onClick={() => { setResultImage(img); setPreviewZoom(1); }}
                  className="aspect-square rounded-[2rem] overflow-hidden mb-3 relative bg-dark-950 border border-white/5 hover:border-indigo-500/50 transition-all cursor-zoom-in"
                >
                  <img src={img.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                  
                  {/* Delete button removed as requested */}

                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity p-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-full mb-2"><Eye className="w-4 h-4 text-white" /></div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setGenMode('iti'); setPreviewUrl(img.url); setSelectedImage(null); setPrompt(img.prompt); workstationRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                      className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all"
                    >
                      <Repeat className="w-3 h-3" /> Re-Anchor
                    </button>
                    <a 
                      onClick={(e) => e.stopPropagation()}
                      href={img.url} download={`imaginai-vault-${img.id}.png`}
                      className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/10"
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>
                  </div>
                </div>
                <p className="text-[9px] text-gray-600 truncate italic px-1">"{img.prompt}"</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* EXPLORE IDEAS GRID */}
      <section className="bg-dark-900 border border-white/10 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 mb-4">
              <Compass className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Discovery Hub</span>
            </div>
            <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Visual Blueprints</h3>
            <p className="text-gray-500 text-sm font-medium mt-3 uppercase tracking-widest">Select a creative pattern to initialize the engine</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-black text-gray-600 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl">
             <Layout className="w-4 h-4" /> {IMAGE_IDEAS.length} Templates
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
           {IMAGE_IDEAS.map((idea, idx) => (
             <button 
                key={idx}
                onClick={() => handleIdeaClick(idea)}
                className="group flex flex-col text-left transition-all hover:-translate-y-2"
             >
                <div className="aspect-[4/5] rounded-[2rem] overflow-hidden mb-4 relative bg-dark-950 border border-white/5 group-hover:border-indigo-500/50 group-hover:shadow-2xl transition-all">
                   <img 
                    src={idea.thumbnail} 
                    alt={idea.label} 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-6 flex flex-col justify-end">
                      <div className="flex items-center justify-center w-full py-3 bg-indigo-600/90 backdrop-blur-md rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-300 gap-2">
                         <Terminal className="w-3 h-3" />
                         <span className="text-[9px] font-black uppercase tracking-widest">Deploy Script</span>
                      </div>
                   </div>
                </div>
                <div className="px-2">
                   <h4 className="text-[11px] font-black text-white uppercase tracking-widest group-hover:text-indigo-400 transition-colors">{idea.label}</h4>
                   <p className="text-[9px] text-gray-600 line-clamp-2 mt-1 italic leading-relaxed">"{idea.prompt}"</p>
                </div>
             </button>
           ))}
        </div>
      </section>

      {/* Result Overlay */}
      {resultImage && !isEditing && (
           <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-dark-950/98 backdrop-blur-3xl animate-fade-in">
              <div className="bg-dark-900 border border-white/10 rounded-[3rem] w-full max-w-6xl overflow-hidden shadow-2xl relative flex flex-col lg:flex-row h-[85vh]">
                 <button onClick={() => setResultImage(null)} className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-500 hover:text-white transition-all z-20"><X className="w-6 h-6" /></button>
                 
                 <div 
                   ref={zoomContainerRef}
                   className="flex-1 bg-black flex items-center justify-center p-8 overflow-hidden relative cursor-zoom-in group/zoom-area"
                 >
                    <div 
                      className="relative transition-transform duration-300 ease-out origin-center"
                      style={{ transform: `scale(${previewZoom})` }}
                    >
                       <img src={resultImage.url} alt="Result" className="max-w-full max-h-[70vh] object-contain rounded-3xl shadow-2xl pointer-events-none" />
                    </div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 opacity-0 group-hover/zoom-area:opacity-100 transition-opacity">
                       <button onClick={() => setPreviewZoom(prev => Math.max(0.5, prev - 0.2))} className="p-1 hover:text-indigo-400 transition-colors"><ZoomOut className="w-4 h-4" /></button>
                       <span className="text-[9px] font-black text-white uppercase tracking-widest w-10 text-center">{Math.round(previewZoom * 100)}%</span>
                       <button onClick={() => setPreviewZoom(prev => Math.min(5, prev + 0.2))} className="p-1 hover:text-indigo-400 transition-colors"><ZoomIn className="w-4 h-4" /></button>
                       <div className="h-3 w-px bg-white/10 mx-1" />
                       <button onClick={() => setPreviewZoom(1)} className="p-1 hover:text-indigo-400 transition-colors"><RotateIcon className="w-4 h-4" /></button>
                    </div>
                 </div>

                 <div className="w-full lg:w-96 bg-dark-800 border-l border-white/5 p-10 flex flex-col justify-center gap-8">
                    <div>
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Neural Output</p>
                       <h4 className="text-2xl font-black text-white uppercase italic leading-tight mb-4">Sync Success</h4>
                       <p className="text-xs text-gray-400 leading-relaxed italic border-l-2 border-indigo-500 pl-4 bg-white/5 py-3 rounded-r-xl line-clamp-3">
                          "{resultImage.prompt}"
                       </p>
                    </div>

                    <div className="space-y-3">
                       <button onClick={() => setIsEditing(true)} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl"><Edit className="w-4 h-4" /> START CROP</button>
                       <button onClick={() => { setGenMode('iti'); setSelectedImage(null); setPreviewUrl(resultImage.url); setResultImage(null); setPrompt("Refine this neural anchor..."); workstationRef.current?.scrollIntoView({ behavior: 'smooth' }); }} className="w-full py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 border border-white/5 transition-all"><Repeat className="w-4 h-4" /> Regenerate This Image</button>
                       <a href={resultImage.url} download={`imaginai-export-${resultImage.id}.png`} className="w-full py-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 border border-white/10 transition-all shadow-xl"><Download className="w-4 h-4" /> DOWNLOAD IMAGE</a>
                       {/* Delete button removed as requested */}
                    </div>

                    <div className="mt-auto">
                       <button 
                        disabled
                        className="w-full py-6 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-gray-500"
                       >
                         <Check className="w-5 h-5 text-green-500" /> VAULT SYNCHRONIZED
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        )}

      {resultImage && isEditing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-dark-950/98 backdrop-blur-3xl animate-fade-in">
           <div className="w-full max-w-6xl h-[85vh]">
              <ImageEditor 
                imageUrl={resultImage.url} 
                onSave={(newUrl) => {
                  setResultImage({ ...resultImage, url: newUrl });
                  setIsEditing(false);
                }}
                onCancel={() => setIsEditing(false)}
              />
           </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};
