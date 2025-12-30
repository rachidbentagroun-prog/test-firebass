
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
import { saveImageToFirebase, getImagesFromFirebase, deleteImageFromFirebase } from '../services/firebase';
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
  hasApiKey: boolean;
  onSelectKey: () => void;
  onResetKey?: () => void;
  onLoginClick?: () => void;
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

const NEGATIVE_PRESETS = [
  { id: 'quality', label: 'Low quality / blur', value: 'blurry, low resolution, pixelated, compression artifacts, noisy, distorted details, watermark' },
  { id: 'anatomy', label: 'Bad anatomy', value: 'bad anatomy, extra fingers, deformed hands, malformed limbs, distorted faces, asymmetry' },
  { id: 'content', label: 'NSFW / violence', value: 'nsfw, nudity, gore, blood, violence, offensive, hateful, copyrighted logos' },
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

export const Generator: React.FC<GeneratorProps> = ({ user, gallery, onCreditUsed, onUpgradeRequired, onImageGenerated, onDeleteImage, onUpdateUser, initialPrompt, hasApiKey, onSelectKey, onLoginClick }) => {
  const [genMode, setGenMode] = useState<'tti' | 'iti'>('tti');
  const [imageEngine, setImageEngine] = useState<'klingai' | 'gemini' | 'deapi' | 'runware' | 'seedream'>('runware');
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [selectedStyle, setSelectedStyle] = useState('none');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProMode, setIsProMode] = useState(false);
  // Seedream-specific preferences
  const [seedreamResolution, setSeedreamResolution] = useState<string>('1024x1024');
  const [seedreamQuality, setSeedreamQuality] = useState<'standard' | 'high' | 'ultra'>('high');
  const [seedreamGuidance, setSeedreamGuidance] = useState<number>(8);
  const [seedreamSeed, setSeedreamSeed] = useState<number | undefined>(undefined);
  const [seedreamModel, setSeedreamModel] = useState<string>('sd-4.5');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<GeneratedImage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([]);

  const [showIdentityCheck, setShowIdentityCheck] = useState(false);

  useEffect(() => {
    try {
      const pv = localStorage.getItem('pending_verification');
      setShowIdentityCheck((user && !user.isVerified) || !!pv);
    } catch (e) { /* ignore */ }
  }, [user]);
  
  const [isAspectRatioMenuOpen, setIsAspectRatioMenuOpen] = useState(false);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [isNegativeMenuOpen, setIsNegativeMenuOpen] = useState(false);
  const [showPromptHistory, setShowPromptHistory] = useState(false);
  const [isCreditDropdownOpen, setIsCreditDropdownOpen] = useState(false);
  
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
  const negativeMenuRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const zoomContainerRef = useRef<HTMLDivElement>(null);
  const creditDropdownRef = useRef<HTMLDivElement>(null);

  const isOutOfCredits = user && user.plan !== 'premium' && user.credits <= 0;
  const isApiKeyConfigured = hasApiKey || (!!process.env.API_KEY && process.env.API_KEY !== '""');

  // Load persistent work state on mount
  useEffect(() => {
    if (user) {
      getWorkState(user.id, 'image-generator').then(state => {
        if (state) {
          if (state.genMode) setGenMode(state.genMode);
          if (state.imageEngine) setImageEngine(state.imageEngine);
          if (state.prompt && !initialPrompt) setPrompt(state.prompt);
          if (state.negativePrompt) setNegativePrompt(state.negativePrompt);
          if (state.aspectRatio) setAspectRatio(state.aspectRatio);
          if (state.selectedStyle) setSelectedStyle(state.selectedStyle);
          if (state.isProMode !== undefined) setIsProMode(state.isProMode);
          if (state.seedreamSettings) {
            if (state.seedreamSettings.resolution) setSeedreamResolution(state.seedreamSettings.resolution);
            if (state.seedreamSettings.quality) setSeedreamQuality(state.seedreamSettings.quality);
            if (typeof state.seedreamSettings.guidance === 'number') setSeedreamGuidance(state.seedreamSettings.guidance);
            if (typeof state.seedreamSettings.seed === 'number') setSeedreamSeed(state.seedreamSettings.seed);
            if (typeof state.seedreamSettings.model === 'string') setSeedreamModel(state.seedreamSettings.model);
          }
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
          imageEngine,
          prompt,
          negativePrompt,
          aspectRatio,
          selectedStyle,
          isProMode,
          seedreamSettings: {
            resolution: seedreamResolution,
            quality: seedreamQuality,
            guidance: seedreamGuidance,
            seed: seedreamSeed,
            model: seedreamModel,
          }
        });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, genMode, imageEngine, prompt, negativePrompt, aspectRatio, selectedStyle, isProMode, seedreamResolution, seedreamQuality, seedreamGuidance, seedreamSeed, seedreamModel]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (aspectRatioMenuRef.current && !aspectRatioMenuRef.current.contains(target)) {
        setIsAspectRatioMenuOpen(false);
      }
      if (styleMenuRef.current && !styleMenuRef.current.contains(target)) {
        setIsStyleMenuOpen(false);
      }
      if (negativeMenuRef.current && !negativeMenuRef.current.contains(target)) {
        setIsNegativeMenuOpen(false);
      }
      if (historyRef.current && !historyRef.current.contains(target)) {
        setShowPromptHistory(false);
      }
      if (creditDropdownRef.current && !creditDropdownRef.current.contains(target)) {
        setIsCreditDropdownOpen(false);
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

  // Load recent images from Firebase on mount for this user
  useEffect(() => {
    (async () => {
      try {
        if (!user?.id) return;
        const imgs = await getImagesFromFirebase(user.id);
        if (imgs?.length) setImageHistory(imgs);
      } catch (e) {
        /* silent */
      }
    })();
  }, [user?.id]);

  const handleDeleteGeneratedImage = async (imgId: string) => {
    try {
      if (!user?.id) return;
      await deleteImageFromFirebase(user.id, imgId);
      setImageHistory(prev => prev.filter(i => i.id !== imgId));
      onDeleteImage?.(imgId);
    } catch (e) {
      console.warn('Failed to delete image', e);
    }
  };

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
    // Guest gating: require signup/login before generation
    if (!user) {
      if (onLoginClick) onLoginClick();
      return;
    }

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
      const cleanNegativePrompt = negativePrompt.trim();

      const supportedRatio = aspectRatio === '1:2' ? '9:16' : aspectRatio;

      let generatedDataUrl: string;

      if (imageEngine === 'klingai') {
        // KlingAI generation
        console.log('[Generator] Generating with KlingAI:', { prompt: finalPrompt, aspect_ratio: supportedRatio, mode: isProMode ? 'pro' : 'standard' });
        const { generateImageWithKlingAI } = await import('../services/klingaiImageService').then(m => ({ generateImageWithKlingAI: (m as any).generateImageWithKlingAI }));
        const body: any = {
          prompt: finalPrompt,
          negative_prompt: cleanNegativePrompt || undefined,
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
      } else if (imageEngine === 'deapi') {
        // DeAPI.ai generation
        console.log('[Generator] Generating with DeAPI.ai:', { prompt: finalPrompt, aspect_ratio: supportedRatio, mode: isProMode ? 'pro' : 'standard' });
        const { generateImageWithDeAPI } = await import('../services/deapiService').then(m => ({ generateImageWithDeAPI: (m as any).generateImageWithDeAPI }));
        const body: any = {
          prompt: finalPrompt,
          negative_prompt: cleanNegativePrompt || undefined,
          aspect_ratio: supportedRatio,
          mode: isProMode ? 'pro' : 'standard',
          image_count: 1
        };
        if (base64Image) {
          body.image_url = `data:${mimeType};base64,${base64Image}`;
        }
        console.log('[Generator] Calling DeAPI.ai API');
        generatedDataUrl = await generateImageWithDeAPI(body);
        console.log('[Generator] DeAPI.ai responded with URL:', generatedDataUrl);
      } else if (imageEngine === 'runware') {
        console.log('[Generator] Generating with Runware.ai:', { prompt: finalPrompt, aspect_ratio: supportedRatio });
        const { generateImageWithRunware } = await import('../services/runwareService').then(m => ({ generateImageWithRunware: (m as any).generateImageWithRunware }));
        const body: any = {
          prompt: finalPrompt,
          negative_prompt: cleanNegativePrompt || undefined,
          aspect_ratio: supportedRatio,
          image_count: 1
        };
        if (base64Image) {
          body.image_url = `data:${mimeType};base64,${base64Image}`;
        }
        console.log('[Generator] Calling Runware.ai API via proxy');
        generatedDataUrl = await generateImageWithRunware(body);
        console.log('[Generator] Runware.ai responded with URL:', generatedDataUrl);
      } else if (imageEngine === 'seedream') {
        console.log('[Generator] Generating with Seedream 4.5:', { prompt: finalPrompt, aspect_ratio: supportedRatio, resolution: seedreamResolution, quality: seedreamQuality, guidance: seedreamGuidance, seed: seedreamSeed });
        const { generateImageWithSeedream } = await import('../services/seedreamService').then(m => ({ generateImageWithSeedream: (m as any).generateImageWithSeedream }));
        const body: any = {
          model: seedreamModel || undefined,
          prompt: finalPrompt,
          negative_prompt: cleanNegativePrompt || undefined,
          aspect_ratio: supportedRatio,
          image_count: 1,
          resolution: seedreamResolution,
          quality: seedreamQuality,
          guidance: seedreamGuidance,
          seed: seedreamSeed,
        };
        if (base64Image) {
          body.image_url = `data:${mimeType};base64,${base64Image}`;
        }
        console.log('[Generator] Calling Seedream 4.5 via proxy');
        generatedDataUrl = await generateImageWithSeedream(body);
        console.log('[Generator] Seedream responded with URL/Data');
      } else {
        // Gemini generation requires the shared Gemini API key (same as Voice & Audio)
        if (!hasApiKey) {
          setError('Gemini API key missing. Select a key to use Gemini Image engine.');
          onSelectKey();
          throw new Error('Gemini API key missing');
        }

        console.log('[Generator] Generating with Gemini:', { prompt: finalPrompt, aspectRatio: supportedRatio, isProMode });
        generatedDataUrl = await generateImageWithGemini(
          finalPrompt, 
          base64Image, 
          mimeType, 
          supportedRatio,
          isProMode,
          cleanNegativePrompt
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
      setImageHistory(prev => [newImage, ...prev].slice(0, 8));
      
      // AUTO-SAVE LOGIC: Persistence triggers immediately on success
      if (user) {
        onImageGenerated(newImage);
        onCreditUsed();
        try { await saveImageToFirebase(newImage, user.id); } catch {}
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
    <div className="min-h-screen bg-dark-950 py-6 sm:py-8">
      {/* Header Section */}
      <section className="pt-6 sm:pt-8 pb-8 sm:pb-12 relative">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-[10px] sm:text-xs font-black text-indigo-400 uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-2 sm:mb-3 md:mb-4 px-2">Live Production Engine</h2>
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase italic tracking-tighter px-2">Generate High-Quality Images</h3>
          </div>

          {error && (
            <div className="max-w-2xl mx-auto mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-red-900/10 border border-red-500/20 text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-red-300" />
                <h4 className="text-[10px] sm:text-xs font-black uppercase text-red-300">ENGINE ERROR</h4>
              </div>
              <p className="text-red-200 text-xs sm:text-sm mt-2">{error}</p>
            </div>
          )}

          {showIdentityCheck && (
            <div className="max-w-2xl mx-auto mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-900/10 border border-amber-500/10 text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-amber-300" />
                <h4 className="text-[10px] sm:text-xs font-black uppercase text-amber-300">IDENTITY CHECK</h4>
              </div>
              <p className="text-gray-300 text-xs sm:text-sm mt-2 px-2">A verification link was sent to your email. Access is restricted until you confirm your identity.</p>
            </div>
          )}

          {/* Main Production Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-8 items-start">
            {/* Left Controls Column */}
            <div className="lg:col-span-5 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
              <div className="bg-dark-900 border border-white/10 rounded-xl sm:rounded-2xl md:rounded-[2rem] lg:rounded-[2.5rem] p-3 sm:p-4 md:p-6 lg:p-8 shadow-2xl relative">
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-indigo-600/10 blur-[40px] sm:blur-[60px] md:blur-[80px] rounded-full -mr-12 sm:-mr-16 md:-mr-20 -mt-12 sm:-mt-16 md:-mt-20 pointer-events-none" />
                
                {/* AI Engine Selector */}
                <div className="mb-3 sm:mb-4 relative z-10">
                  <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 sm:mb-2 block">AI Engine</label>
                  <div className="flex overflow-x-auto bg-black/50 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-white/5 gap-1 no-scrollbar">
                    <button 
                      onClick={() => setImageEngine('klingai')}
                      className={`flex-shrink-0 px-2 sm:px-3 py-1.5 sm:py-2.5 md:py-3 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${imageEngine === 'klingai' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      KlingAI
                    </button>
                    <button 
                      onClick={() => setImageEngine('gemini')}
                      className={`flex-shrink-0 px-2 sm:px-3 py-1.5 sm:py-2.5 md:py-3 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${imageEngine === 'gemini' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      Gemini 2.5
                    </button>
                    <button 
                      onClick={() => setImageEngine('deapi')}
                      className={`flex-shrink-0 px-2 sm:px-3 py-1.5 sm:py-2.5 md:py-3 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${imageEngine === 'deapi' ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      DeAPI.ai
                    </button>
                    <button 
                      onClick={() => setImageEngine('runware')}
                      className={`flex-shrink-0 px-2 sm:px-3 py-1.5 sm:py-2.5 md:py-3 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${imageEngine === 'runware' ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      Runware.ai
                    </button>
                    <button 
                      onClick={() => setImageEngine('seedream')}
                      className={`flex-shrink-0 px-2 sm:px-3 py-1.5 sm:py-2.5 md:py-3 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${imageEngine === 'seedream' ? 'bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      Seedream 4.5
                    </button>
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="flex bg-black/50 p-1 sm:p-1.5 rounded-lg sm:rounded-xl md:rounded-2xl mb-3 sm:mb-4 md:mb-5 border border-white/5 relative z-10 gap-1">
                  <button 
                    onClick={() => setGenMode('tti')}
                    className={`flex-1 py-2 sm:py-2.5 md:py-3 lg:py-4 rounded-lg text-[9px] sm:text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 ${genMode === 'tti' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    <Terminal className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" /> <span className="hidden xs:inline">Text</span>Image
                  </button>
                  <button 
                    onClick={() => setGenMode('iti')}
                    className={`flex-1 py-2 sm:py-2.5 md:py-3 lg:py-4 rounded-lg text-[9px] sm:text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 ${genMode === 'iti' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" /> <span className="hidden xs:inline">Image</span>Transform
                  </button>
                </div>

                <div className="space-y-6 relative z-10">
                  {/* Image Upload for ITI Mode */}
                  {genMode === 'iti' && (
                    <div className="animate-fade-in">
                      <div className="flex justify-between mb-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Image Anchor</label>
                        {previewUrl && (
                          <button onClick={() => { setPreviewUrl(null); setSelectedImage(null); }} className="text-red-500 p-1 hover:bg-red-500/10 rounded-lg">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div onClick={() => fileInputRef.current?.click()} className="aspect-video bg-black/60 border-2 border-dashed border-white/10 rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-purple-500/30 transition-all group overflow-hidden">
                        {previewUrl ? (
                          <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                          <>
                            <Upload className="w-10 h-10 text-gray-600 mb-4 group-hover:text-purple-400 group-hover:scale-110 transition-all" />
                            <p className="text-[10px] font-black text-gray-500 uppercase">Upload Reference Image</p>
                          </>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                      </div>
                    </div>
                  )}

                  {/* Prompt Textarea */}
                  <div className="animate-fade-in">
                    <div className="flex justify-between mb-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                        {genMode === 'tti' ? 'Directorial Script' : 'Transformation Script'}
                      </label>
                      <div className="flex gap-2">
                        {promptHistory.length > 0 && (
                          <div className="relative" ref={historyRef}>
                            <button 
                              onClick={() => setShowPromptHistory(!showPromptHistory)}
                              className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300"
                            >
                              History
                            </button>
                            {showPromptHistory && (
                              <div className="absolute right-0 top-full mt-2 w-72 bg-dark-900 border border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden animate-scale-in">
                                <div className="max-h-60 overflow-y-auto no-scrollbar">
                                  {promptHistory.map((h, i) => (
                                    <button 
                                      key={i}
                                      onClick={() => { setPrompt(h); setShowPromptHistory(false); }}
                                      className="w-full text-left p-3 hover:bg-white/5 border-b border-white/5 last:border-none text-xs text-gray-400 hover:text-white line-clamp-2"
                                    >
                                      "{h}"
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
                          className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300 disabled:opacity-50"
                        >
                          {isEnhancing ? 'Optimizing...' : 'Enhance'}
                        </button>
                      </div>
                    </div>
                    <textarea 
                      placeholder={genMode === 'iti' ? "Describe how to transform the image..." : "Describe the cinematic composition, lighting, and textures..."}
                      className="w-full h-32 sm:h-40 lg:h-44 bg-black/40 border border-white/10 rounded-xl sm:rounded-[1.5rem] p-4 sm:p-6 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                  </div>

                  {/* Seedream Preferences */}
                  {imageEngine === 'seedream' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Model ID (optional - defaults to doubao-image-1)</label>
                        <input
                          type="text"
                          value={seedreamModel}
                          onChange={(e) => setSeedreamModel(e.target.value)}
                          placeholder="doubao-image-1 (default)"
                          className="w-full px-3 py-3 bg-black/40 border border-white/10 rounded-xl text-[9px] font-black text-white tracking-widest"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Seedream Resolution</label>
                        <select
                          value={seedreamResolution}
                          onChange={(e) => setSeedreamResolution(e.target.value)}
                          className="w-full px-3 py-3 bg-black/40 border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest"
                        >
                          {['512x512','768x768','1024x1024'].map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Quality</label>
                        <select
                          value={seedreamQuality}
                          onChange={(e) => setSeedreamQuality(e.target.value as any)}
                          className="w-full px-3 py-3 bg-black/40 border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest"
                        >
                          {['standard','high','ultra'].map(q => (
                            <option key={q} value={q}>{q.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Guidance</label>
                        <input
                          type="range"
                          min={1}
                          max={20}
                          value={seedreamGuidance}
                          onChange={(e) => setSeedreamGuidance(Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="text-[9px] text-gray-500 ml-1">CFG: {seedreamGuidance}</div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Seed (optional)</label>
                        <input
                          type="number"
                          value={seedreamSeed ?? ''}
                          onChange={(e) => setSeedreamSeed(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="random"
                          className="w-full px-3 py-3 bg-black/40 border border-white/10 rounded-xl text-[9px] font-black text-white tracking-widest"
                        />
                      </div>
                    </div>
                  )}

                  {/* Negative Prompt */}
                  <div className="animate-fade-in relative bg-black/30 border border-white/10 rounded-2xl p-4" ref={negativeMenuRef}>
                    <div className="flex justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 ml-1">
                          <Ban className="w-3.5 h-3.5 text-pink-400" />
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Negative Prompt</span>
                        </div>
                        <p className="text-[9px] text-gray-600 uppercase tracking-widest ml-1">Clean up results across all engines</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {negativePrompt && (
                          <button
                            onClick={() => setNegativePrompt('')}
                            className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:border-white/25"
                          >
                            Clear
                          </button>
                        )}
                        <button 
                          onClick={() => setIsNegativeMenuOpen(!isNegativeMenuOpen)}
                          className="px-3 py-1.5 text-[9px] font-bold text-pink-300 uppercase tracking-widest bg-black/50 border border-white/10 rounded-lg hover:border-white/25"
                        >
                          Presets
                        </button>
                      </div>
                    </div>
                    {isNegativeMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-72 bg-dark-900 border border-white/10 rounded-2xl shadow-2xl z-[80] overflow-hidden animate-scale-in">
                        {NEGATIVE_PRESETS.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => { setNegativePrompt(opt.value); setIsNegativeMenuOpen(false); }}
                            className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:bg-white/5 border-b border-white/5 last:border-none"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <textarea 
                      placeholder="Things you want to avoid (e.g., blurry, watermarks, distorted hands)"
                      className="w-full h-28 bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:ring-2 focus:ring-pink-500/40 resize-none"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                    />
                  </div>

                  {/* Parameters */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Aspect Ratio */}
                    <div className="space-y-2 relative" ref={aspectRatioMenuRef}>
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Dimension</label>
                      <button onClick={() => setIsAspectRatioMenuOpen(!isAspectRatioMenuOpen)} className="w-full flex items-center justify-between px-3 py-3 bg-black/40 border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest hover:border-white/20 transition-all group">
                        <div className="flex items-center gap-1.5 truncate">
                          {currentRatioOption && <currentRatioOption.icon className="w-3.5 h-3.5 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />}
                          <span className="truncate">{aspectRatio}</span>
                        </div>
                        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform shrink-0 ${isAspectRatioMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isAspectRatioMenuOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 z-[200] bg-dark-900 border border-white/10 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-scale-in">
                          {ASPECT_RATIOS.map(opt => (
                            <button key={opt.id} onClick={() => { setAspectRatio(opt.id); setIsAspectRatioMenuOpen(false); }} className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-[9px] font-black transition-all ${aspectRatio === opt.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 border-b border-white/5 last:border-none'}`}>
                              <div className="flex items-center gap-2 truncate"><opt.icon className="w-3.5 h-3.5" /><span className="truncate">{opt.label}</span></div>
                              {aspectRatio === opt.id && <Check className="w-2.5 h-2.5 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Style */}
                    <div className="space-y-2 relative" ref={styleMenuRef}>
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Style</label>
                      <button onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)} className="w-full flex items-center justify-between px-3 py-3 bg-black/40 border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest hover:border-white/20 transition-all">
                        <span className="truncate">{currentStyleOption?.label || 'None'}</span>
                        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform shrink-0 ${isStyleMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isStyleMenuOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 z-[200] bg-dark-900 border border-white/10 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-scale-in max-h-60 overflow-y-auto">
                          {STYLES.map(opt => (
                            <button key={opt.id} onClick={() => { setSelectedStyle(opt.id); setIsStyleMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 transition-all ${selectedStyle === opt.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 border-b border-white/5 last:border-none'}`}>
                              <span className="text-[9px] font-black uppercase tracking-widest">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pro Mode Toggle */}
                  <div className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-xl">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ultra HD 3.0</label>
                      <p className="text-[8px] text-gray-600 mt-0.5">Enhanced quality mode</p>
                    </div>
                    <button 
                      onClick={() => setIsProMode(!isProMode)}
                      className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${isProMode ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-transparent border-white/10 text-gray-500'}`}
                    >
                      <Gem className="w-3 h-3" /> {isProMode ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Generate Button */}
                  <button 
                    onClick={handleGenerate} 
                    disabled={isGenerating || showIdentityCheck || (!prompt.trim() && genMode === 'tti') || (genMode === 'iti' && !selectedImage)}
                    className="w-full py-4 sm:py-5 lg:py-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 disabled:text-white/50 disabled:cursor-not-allowed text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 sm:gap-3 transition-all transform active:scale-[0.98] min-h-[56px]"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        <span className="hidden xs:inline">Synthesizing...</span>
                        <span className="xs:hidden">Creating...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                        <span className="hidden sm:inline">{showIdentityCheck ? 'Verify Email First' : 'Generate Image (1 Credit)'}</span>
                        <span className="sm:hidden">{showIdentityCheck ? 'Verify Email' : 'Generate (1)'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Preview Column */}
            <div className="lg:col-span-7 bg-black/40 border border-white/5 rounded-xl sm:rounded-2xl md:rounded-[2rem] lg:rounded-[3rem] p-2 sm:p-3 md:p-4 lg:p-5 min-h-[45vh] sm:min-h-[50vh] md:min-h-[55vh] lg:min-h-[60vh] mobile-viewport flex flex-col relative overflow-hidden">
              <div className="flex-1 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-[2.5rem] overflow-hidden bg-dark-950 flex flex-col items-center justify-center relative group/viewport"
                ref={zoomContainerRef}>
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5 pointer-events-none" />
                
                {resultImage && !isEditing ? (
                  <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-3 md:p-4">
                    <img 
                      src={resultImage.url} 
                      alt="Generated" 
                      className="max-h-full responsive-media object-contain transition-transform duration-300"
                      style={{ transform: `scale(${previewZoom})` }}
                    />
                    
                    {/* Image Controls Overlay */}
                    <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-dark-900/90 backdrop-blur-md border border-white/10 rounded-lg sm:rounded-xl lg:rounded-2xl p-1.5 sm:p-2 md:p-3 shadow-2xl">
                      <button 
                        onClick={() => setPreviewZoom(Math.max(0.5, previewZoom - 0.25))}
                        className="p-1 sm:p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <ZoomOut className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
                      </button>
                      <div className="text-[9px] sm:text-[10px] md:text-xs font-black text-white px-1.5 sm:px-2 md:px-3">{Math.round(previewZoom * 100)}%</div>
                      <button 
                        onClick={() => setPreviewZoom(Math.min(5, previewZoom + 0.25))}
                        className="p-1 sm:p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <ZoomIn className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
                      </button>
                      <div className="w-px h-4 sm:h-5 md:h-6 bg-white/10 mx-0.5 sm:mx-1 md:mx-2" />
                      <a 
                        href={resultImage.url} 
                        download 
                        className="p-1 sm:p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
                      </a>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="p-1 sm:p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
                      </button>
                    </div>
                  </div>
                ) : isEditing && resultImage ? (
                  <div className="w-full h-full p-2 sm:p-3 md:p-4">
                    <ImageEditor 
                      imageUrl={resultImage.url} 
                      onSave={(url) => { if (resultImage) setResultImage({ ...resultImage, url }); setIsEditing(false); }} 
                      onCancel={() => setIsEditing(false)} 
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 sm:p-6 md:p-8 lg:p-12 pointer-events-none overflow-y-auto">
                    {/* Animated Illustration - Text to Image Flow */}
                    <div className="relative mb-4 sm:mb-6 md:mb-8">
                      {/* Text Input Visualization - Responsive */}
                      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 mb-4 sm:mb-6">
                        <div className="relative group">
                          <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-lg sm:rounded-2xl border-2 border-indigo-500/30 flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                            <FileText className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-indigo-400 animate-pulse" />
                          </div>
                          <div className="absolute -bottom-6 sm:-bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <span className="text-[8px] sm:text-xs font-black text-indigo-400 uppercase tracking-wider">Your Prompt</span>
                          </div>
                        </div>
                        
                        {/* Animated Arrow - Responsive */}
                        <div className="flex flex-row sm:flex-col items-center gap-2">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-4 h-0.5 sm:w-8 sm:h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
                            <ArrowRightLeft className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-purple-500 animate-bounce" style={{ animationDuration: '2s' }} />
                            <div className="w-4 h-0.5 sm:w-8 sm:h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
                          </div>
                          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
                          <div className="text-[7px] sm:text-[9px] font-black text-purple-400 uppercase tracking-wider px-1.5 sm:px-2 py-0.5 sm:py-1 bg-purple-600/10 rounded-full border border-purple-500/20">
                            AI Magic
                          </div>
                        </div>
                        
                        {/* Real AI Generated Image Sample */}
                        <div className="relative group">
                          <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-lg sm:rounded-2xl border-2 border-purple-500/50 overflow-hidden shadow-2xl ring-4 ring-purple-600/20 animate-pulse flex-shrink-0" style={{ animationDuration: '3s' }}>
                            <img 
                              src="https://images.unsplash.com/photo-1680382948929-2d092cd01263?w=400&h=400&fit=crop&q=80"
                              alt="AI Generated Sample" 
                              className="w-full h-full object-cover"
                              loading="eager"
                              onError={(e) => {
                                // Fallback gradient if image fails to load
                                (e.target as HTMLImageElement).style.display = 'none';
                                const parent = (e.target as HTMLElement).parentElement;
                                if (parent) {
                                  parent.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                                  const icon = document.createElement('div');
                                  icon.innerHTML = `<svg class="w-10 sm:w-12 md:w-16 h-10 sm:h-12 md:h-16 text-white/60 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;
                                  parent.appendChild(icon.firstChild as Node);
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-purple-600/30 via-transparent to-indigo-600/20 pointer-events-none" />
                            <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-green-500/90 backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 flex items-center gap-0.5 sm:gap-1">
                              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                              <span className="text-[7px] sm:text-[8px] font-black text-white uppercase">AI</span>
                            </div>
                          </div>
                          <div className="absolute -bottom-6 sm:-bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <span className="text-[8px] sm:text-xs font-black text-purple-400 uppercase tracking-wider">Generated Image</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="mt-4 sm:mt-6 md:mt-8">
                      <h4 className="text-lg sm:text-xl md:text-2xl font-black uppercase italic tracking-tighter mb-2 sm:mb-3 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        AI Image Generator
                      </h4>
                      <p className="text-gray-400 text-[11px] sm:text-xs md:text-sm max-w-sm mx-auto font-medium leading-relaxed mb-2 sm:mb-3">
                        Transform your text prompts into stunning images using advanced AI models
                      </p>
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-widest">
                        <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-500" />
                        <span>Write a prompt & click Generate</span>
                        <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-500" />
                      </div>
                    </div>

                    {/* Feature Badges */}
                    <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-6 justify-center">
                      <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-indigo-600/10 border border-indigo-500/20 rounded-full text-[8px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-wider">
                        <span className="inline-block w-1.5 h-1.5 bg-indigo-400 rounded-full mr-1 animate-pulse" />
                        Fast
                      </div>
                      <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-600/10 border border-purple-500/20 rounded-full text-[8px] sm:text-[10px] font-black text-purple-400 uppercase tracking-wider">
                        <span className="inline-block w-1.5 h-1.5 bg-purple-400 rounded-full mr-1 animate-pulse" style={{ animationDelay: '0.3s' }} />
                        HD
                      </div>
                      <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-pink-600/10 border border-pink-500/20 rounded-full text-[8px] sm:text-[10px] font-black text-pink-400 uppercase tracking-wider">
                        <span className="inline-block w-1.5 h-1.5 bg-pink-400 rounded-full mr-1 animate-pulse" style={{ animationDelay: '0.6s' }} />
                        Multi-Engine
                      </div>
                    </div>
                  </div>
                )}

                {/* Background Animation */}
                {!resultImage && (
                  <div className="absolute inset-0 opacity-50 grayscale">
                    <div className="absolute top-1/4 left-1/4 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-indigo-600/20 rounded-full blur-2xl sm:blur-3xl animate-float" />
                    <div className="absolute bottom-1/4 right-1/4 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-purple-600/20 rounded-full blur-2xl sm:blur-3xl animate-float" style={{ animationDelay: '1s' }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Ideas Section */}
      {IMAGE_IDEAS.length > 0 && (
        <section className="py-16 bg-dark-900/20">
          <div className="max-w-[1400px] mx-auto px-4">
            <div className="text-center mb-12">
              <h3 className="text-sm font-black text-indigo-400 uppercase tracking-[0.4em] mb-3">Quick Start</h3>
              <h4 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">Trending Ideas</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {IMAGE_IDEAS.map((idea, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleIdeaClick(idea)}
                  className="group cursor-pointer bg-dark-900 border border-white/10 rounded-3xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={idea.thumbnail} 
                      alt={idea.label}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h5 className="text-white font-black text-sm uppercase">{idea.label}</h5>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-400 text-xs line-clamp-2">{idea.prompt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent History Section */}
      {imageHistory.length > 0 && (
        <section className="py-16">
          <div className="max-w-[1400px] mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-black text-pink-400 uppercase tracking-[0.4em] mb-2">Neural Vault</h3>
                <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter">Recent History</h4>
              </div>
              <div className="text-xs font-black text-gray-600 uppercase tracking-widest">
                {imageHistory.length} Creations
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {imageHistory.slice(0, 12).map((img) => (
                <div 
                  key={img.id} 
                  onClick={() => { setResultImage(img); setPreviewZoom(1); }}
                  className="group aspect-square bg-dark-900 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all cursor-pointer relative"
                >
                  <img src={img.url} alt="History" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
