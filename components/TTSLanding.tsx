
import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic2, Headphones, Sparkles, Volume2, Zap, ArrowRight,
  Music, Radio, MessageCircle, Play, Globe, Cpu, ArrowRightCircle,
  Loader2, Pause, RefreshCw, Wand2, Volume1, Activity, ChevronRight,
  Lock, UserPlus, Languages, Check, Download, Upload, Scissors, Star,
  Video, AlertCircle, FileAudio, FileVideo, X, User as UserIcon,
  Smile, VolumeX, TrendingUp, Gem, Flag, ChevronDown, Key, Settings2,
  Clock, History, RotateCcw, ShieldCheck, DownloadCloud, Terminal,
  Fingerprint, Copy, FileText
} from 'lucide-react';
import { TTSLabConfig, User, GeneratedAudio } from '../types';
import { 
  generateSpeechWithGemini, 
  enhancePrompt,
  convertBlobToBase64,
  detectVoiceProfile,
  generateClonedSpeechWithGemini,
  transcribeMedia
} from '../services/geminiService';

interface TTSLandingProps {
  user: User | null;
  config?: TTSLabConfig;
  onStartCreating: () => void;
  onCreditUsed?: () => void;
  onUpgradeRequired?: () => void;
  onLoginClick: () => void;
  hasApiKey: boolean;
  onSelectKey: () => void;
  onResetKey: () => void;
}

const MODE_USES_KEY = 'imaginai_tts_mode_uses';

const VOICES = [
  { id: 'Kore', label: 'Kore', gender: 'Female', desc: 'Professional & Authoritative', color: 'indigo' },
  { id: 'Puck', label: 'Puck', gender: 'Male', desc: 'Youthful & High Energy', color: 'purple' },
  { id: 'Charon', label: 'Charon', gender: 'Male', desc: 'Deep & Cinematic Bass', color: 'pink' },
  { id: 'Zephyr', label: 'Zephyr', gender: 'Female', desc: 'Calm & Breathful Texture', color: 'blue' },
  { id: 'Fenrir', label: 'Fenrir', gender: 'Male', desc: 'Grizzled & Ancient Storyteller', color: 'amber' },
  { id: 'Aoede', label: 'Aoede', gender: 'Female', desc: 'Melodic and Lyrical', color: 'emerald' },
  { id: 'Leda', label: 'Leda', gender: 'Female', desc: 'Bright and Articulate', color: 'orange' },
  { id: 'Orus', label: 'Orus', gender: 'Male', desc: 'Sharp and commanding', color: 'red' }
];

const PREVIEW_SCRIPTS: Record<string, string> = {
  'Kore': "Synchronizing neural weights. I am Kore, your high-fidelity production voice.",
  'Puck': "Whoa! Puck here. Ready to bring some serious energy to your next project.",
  'Charon': "The shadows have stories to tell. I am Charon, the deep voice of the void.",
  'Zephyr': "Breathe in. I am Zephyr, here to bring peace and calm to your listeners.",
  'Fenrir': "Old stories are etched in bone. I am Fenrir, the texture of time itself.",
  'Aoede': "Melody is the heartbeat of thought. I am Aoede.",
  'Leda': "Clarity defines communication. I am Leda.",
  'Orus': "Precision is absolute. I am Orus.",
};

const LANGUAGES = [
  { id: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { id: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
  { id: 'ar-SA', label: 'Arabic (العربية)', flag: '🇸🇦' },
  { id: 'fr-FR', label: 'French (Français)', flag: '🇫🇷' },
  { id: 'es-ES', label: 'Spanish (Español)', flag: '🇪🇸' },
  { id: 'de-DE', label: 'German (Deutsch)', flag: '🇩🇪' },
  { id: 'it-IT', label: 'Italian (Italiano)', flag: '🇮🇹' },
  { id: 'pt-BR', label: 'Portuguese (Português)', flag: '🇧🇷' },
  { id: 'zh-CN', label: 'Chinese (中文)', flag: '🇨🇳' },
  { id: 'ja-JP', label: 'Japanese (日本語)', flag: '🇯🇵' },
  { id: 'ko-KR', label: 'Korean (한국어)', flag: '🇰🇷' },
  { id: 'hi-IN', label: 'Hindi (हिन्दी)', flag: '🇮🇳' },
];

export const TTSLanding: React.FC<TTSLandingProps> = ({ 
  user, config, onStartCreating, onCreditUsed, onUpgradeRequired, onLoginClick,
  hasApiKey, onSelectKey, onResetKey 
}) => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [mode, setMode] = useState<'narrator' | 'clone' | 'stt'>('narrator');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isTranscoding, setIsTranscoding] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [localHistory, setLocalHistory] = useState<GeneratedAudio[]>([]);
  
  // Clone Mode Specific State
  const [clonedVoiceData, setClonedVoiceData] = useState<{base64: string, type: string, fileName?: string} | null>(null);
  const [clonedVoiceName, setClonedVoiceName] = useState('');
  const [detectedGender, setDetectedGender] = useState<'male' | 'female' | null>(null);

  const [modeUses, setModeUses] = useState(() => {
    try {
      const saved = localStorage.getItem(MODE_USES_KEY);
      return saved ? JSON.parse(saved) : { narrator: 0, clone: 0, stt: 0 };
    } catch {
      return { narrator: 0, clone: 0, stt: 0 };
    }
  });

  const isLimitReached = user?.plan === 'free' && modeUses[mode] >= 2;

  useEffect(() => {
    localStorage.setItem(MODE_USES_KEY, JSON.stringify(modeUses));
  }, [modeUses]);

  const MAX_CHARS = 1000;

  const mainAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const voiceMenuRef = useRef<HTMLDivElement>(null);
  const cloneRefInputRef = useRef<HTMLInputElement>(null);
  const sttInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (langMenuRef.current && !langMenuRef.current.contains(target)) setIsLangMenuOpen(false);
      if (voiceMenuRef.current && !voiceMenuRef.current.contains(target)) setIsVoiceMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEnhance = async () => {
    if (!text.trim()) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(text, "audio narration");
      setText(enhanced.slice(0, MAX_CHARS));
    } catch (e) { console.error(e); }
    finally { setIsEnhancing(false); }
  };

  const handleMediaImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      setError("Media file exceeds bandwidth. Max 30MB.");
      return;
    }

    setIsTranscoding(true);
    setError(null);

    try {
      const base64 = await convertBlobToBase64(file);
      
      if (mode === 'clone') {
        setClonedVoiceData({ base64, type: file.type, fileName: file.name });
        if (!clonedVoiceName) setClonedVoiceName(file.name.split('.')[0]);
        const personaId = await detectVoiceProfile(base64, file.type);
        setDetectedGender(personaId === 'Fenrir' ? 'male' : 'female');
      } else if (mode === 'stt') {
        const transcript = await transcribeMedia(base64, file.type);
        if (transcript) {
          setText(transcript.slice(0, MAX_CHARS));
          if (user?.plan === 'free') setModeUses(prev => ({ ...prev, stt: prev.stt + 1 }));
        }
      }
    } catch (err: any) {
      setError("Handshake failed. Ensure your API Key is linked.");
      console.error(err);
    } finally {
      setIsTranscoding(false);
      if (cloneRefInputRef.current) cloneRefInputRef.current.value = '';
      if (sttInputRef.current) sttInputRef.current.value = '';
    }
  };

  const playVoicePreview = async (voiceId: string) => {
    if (playingVoiceId === voiceId) {
      previewAudioRef.current?.pause();
      setPlayingVoiceId(null);
      return;
    }
    if (previewAudioRef.current) previewAudioRef.current.pause();
    
    setLoadingVoiceId(voiceId);
    try {
      const script = PREVIEW_SCRIPTS[voiceId] || `Hello, I am ${voiceId}.`;
      const blob = await generateSpeechWithGemini(`Directorial Note: Speak clearly: ${script}`, voiceId);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      previewAudioRef.current = audio;
      audio.onplay = () => { setLoadingVoiceId(null); setPlayingVoiceId(voiceId); };
      audio.onended = () => { setPlayingVoiceId(null); URL.revokeObjectURL(url); };
      await audio.play();
    } catch (e) {
      setLoadingVoiceId(null);
      setPlayingVoiceId(null);
      console.error(e);
    }
  };

  const handleMoteurGenerate = async () => {
    if (!user?.isRegistered) {
      onLoginClick();
      return;
    }

    const currentModeKey = mode === 'narrator' ? 'narrator' : 'clone';
    if (user?.plan === 'free' && modeUses[currentModeKey] >= 2) {
      onUpgradeRequired?.();
      return;
    }

    if (!text.trim()) { setError("Enter the script to be narrated."); return; }
    if (text.length > MAX_CHARS) { setError(`SYNTHESIS FAILED. SCRIPT EXCEEDS ${MAX_CHARS} CHARACTERS.`); return; }
    if (mode === 'clone' && !clonedVoiceData) { setError("Neural anchor missing. Upload a reference voice."); return; }

    setIsSynthesizing(true);
    setAudioUrl(null);
    setError(null);

    try {
      let blob: Blob;
      if (mode === 'clone' && clonedVoiceData) {
        blob = await generateClonedSpeechWithGemini(text, clonedVoiceData.base64, clonedVoiceData.type);
      } else {
        const voiceToUse = selectedVoice;
        const lang = LANGUAGES.find(l => l.id === selectedLanguage);
        const prompt = `Directorial Note: Speak in ${lang?.label}. Content: "${text}"`;
        blob = await generateSpeechWithGemini(prompt, voiceToUse);
      }

      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      
      const newAudio: GeneratedAudio = {
        id: Date.now().toString(),
        url,
        text,
        voice: mode === 'clone' ? `${clonedVoiceName} (Clone)` : selectedVoice,
        createdAt: Date.now(),
      };
      
      setLocalHistory(prev => [newAudio, ...prev]);
      
      if (user?.plan === 'free') {
        setModeUses(prev => ({ ...prev, [currentModeKey]: prev[currentModeKey] + 1 }));
      }
      
      onCreditUsed?.();
    } catch (e: any) {
      if (e.message?.includes("entity was not found")) {
        onResetKey();
        setError("API Key session expired.");
      } else {
        setError("SYNTHESIS FAILED. TRY A SHORTER SCRIPT.");
      }
    } finally {
      setIsSynthesizing(false);
    }
  };

  const currentLang = LANGUAGES.find(l => l.id === selectedLanguage);
  const currentVoice = VOICES.find(v => v.id === selectedVoice);

  return (
    <div className="bg-dark-950 text-white min-h-screen font-sans selection:bg-pink-500/30">
      {/* Ai Voice & Audio Workstation Header */}
      <section id="workstation" className="py-24 pt-32 relative overflow-hidden bg-dark-950">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
             <h2 className="text-sm font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Neural Vocalization Engine</h2>
             <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Ai Voice & Audio Workstation</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 space-y-8">
              <div className="bg-dark-900 border border-white/5 rounded-[2.5rem] p-10 shadow-2xl space-y-8 relative overflow-visible">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/10 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                
                <div className="flex bg-black/50 p-1.5 rounded-2xl mb-4 border border-white/5 relative z-10 overflow-x-auto no-scrollbar">
                  <button onClick={() => setMode('narrator')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${mode === 'narrator' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Ai Narrator</button>
                  <button onClick={() => setMode('clone')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${mode === 'clone' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}><Scissors className="w-3.5 h-3.5" /> Voice Clone</button>
                  <button onClick={() => setMode('stt')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${mode === 'stt' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}><FileText className="w-3.5 h-3.5" /> Speech To Text</button>
                </div>

                <div className="space-y-6 relative z-10">
                  {mode !== 'stt' ? (
                    <div className="space-y-6 animate-fade-in">
                      {/* Dropdown controls for Narrator Mode */}
                      {mode === 'narrator' && (
                        <div className="grid grid-cols-2 gap-4">
                           {/* Global Language Dropdown */}
                           <div className="space-y-2 relative" ref={langMenuRef}>
                              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Language Output</label>
                              <button 
                                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white transition-all hover:border-white/20"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                                  <span className="truncate">{currentLang?.label}</span>
                                </div>
                                <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                              </button>
                              {isLangMenuOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-dark-900 border border-white/10 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-scale-in max-h-64 overflow-y-auto no-scrollbar">
                                   {LANGUAGES.map(lang => (
                                     <button 
                                      key={lang.id} 
                                      onClick={() => { setSelectedLanguage(lang.id); setIsLangMenuOpen(false); }}
                                      className={`w-full flex items-center justify-between px-4 py-3 text-[10px] font-bold transition-all ${selectedLanguage === lang.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 border-b border-white/5 last:border-none'}`}
                                     >
                                        <div className="flex items-center gap-2"><span>{lang.flag}</span> <span>{lang.label}</span></div>
                                        {selectedLanguage === lang.id && <Check className="w-3 h-3" />}
                                     </button>
                                   ))}
                                </div>
                              )}
                           </div>

                           {/* Global Narrator Dropdown */}
                           <div className="space-y-2 relative" ref={voiceMenuRef}>
                              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Neural Persona</label>
                              <button 
                                onClick={() => setIsVoiceMenuOpen(!isVoiceMenuOpen)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white transition-all hover:border-white/20"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <UserIcon className={`w-3.5 h-3.5 text-${currentVoice?.color}-400`} />
                                  <span className="truncate">{currentVoice?.label}</span>
                                </div>
                                <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isVoiceMenuOpen ? 'rotate-180' : ''}`} />
                              </button>
                              {isVoiceMenuOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-dark-900 border border-white/10 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-scale-in max-h-64 overflow-y-auto no-scrollbar">
                                   {VOICES.map(voice => (
                                     <div key={voice.id} className="relative group/voice-item border-b border-white/5 last:border-none">
                                        <button 
                                          onClick={() => { setSelectedVoice(voice.id); setIsVoiceMenuOpen(false); }}
                                          className={`w-full flex flex-col items-start px-4 py-3 text-[10px] transition-all ${selectedVoice === voice.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                                        >
                                          <div className="flex justify-between w-full mb-0.5">
                                            <span className="font-black uppercase tracking-widest">{voice.label}</span>
                                            <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${selectedVoice === voice.id ? 'bg-white/20' : 'bg-white/5 text-gray-500'}`}>{voice.gender}</span>
                                          </div>
                                          <p className={`text-[8px] italic leading-tight truncate w-full ${selectedVoice === voice.id ? 'text-indigo-200' : 'text-gray-600'}`}>{voice.desc}</p>
                                        </button>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); playVoicePreview(voice.id); }}
                                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/40 text-white opacity-0 group-hover/voice-item:opacity-100 transition-opacity hover:bg-indigo-500"
                                        >
                                          {playingVoiceId === voice.id ? <Pause className="w-3 h-3" /> : (loadingVoiceId === voice.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />)}
                                        </button>
                                     </div>
                                   ))}
                                </div>
                              )}
                           </div>
                        </div>
                      )}

                      {/* Voice Clone neural anchor upload */}
                      {mode === 'clone' && (
                        <div className="space-y-2 animate-fade-in">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Neural Anchor (Reference Voice)</label>
                          <div 
                            onClick={() => !isLimitReached && !isTranscoding && cloneRefInputRef.current?.click()}
                            className={`p-6 bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-pink-600/5 hover:border-pink-500/30 transition-all group ${isLimitReached ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <input type="file" ref={cloneRefInputRef} onChange={handleMediaImport} className="hidden" accept="audio/*" />
                            {isTranscoding ? (
                              <RefreshCw className="w-8 h-8 text-pink-400 animate-spin" />
                            ) : clonedVoiceData ? (
                              <div className="flex flex-col items-center gap-2">
                                <div className="p-3 bg-pink-500/20 rounded-xl text-pink-400">
                                  <FileAudio className="w-6 h-6" />
                                </div>
                                <p className="text-[10px] font-bold text-white uppercase truncate max-w-[200px]">{clonedVoiceData.fileName || 'Reference Locked'}</p>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setClonedVoiceData(null); }}
                                  className="text-[9px] font-black text-gray-500 hover:text-red-400 uppercase tracking-widest mt-2"
                                >
                                  Remove Anchor
                                </button>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-6 h-6 text-pink-500 group-hover:scale-110 transition-transform mb-3" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upload Identity Sample</p>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             <Zap className="w-3.5 h-3.5 text-indigo-500" /> {mode === 'clone' ? 'TARGET SCRIPT' : 'PRODUCTION SCRIPT'}
                          </label>
                          <div className="flex gap-4 items-center">
                            <button onClick={handleEnhance} disabled={isEnhancing || !text.trim() || isLimitReached} className="text-[10px] font-bold text-indigo-400 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-30">
                              <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} /> Optimize
                            </button>
                          </div>
                        </div>
                        
                        <textarea 
                          value={text} onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                          dir="auto" disabled={isLimitReached}
                          placeholder={mode === 'clone' ? "What should the neural anchor say?" : "Enter script for high-fidelity synthesis..."}
                          className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-6 text-white text-base outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none custom-scrollbar disabled:opacity-50"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-fade-in">
                      <div 
                        onClick={() => !isLimitReached && !isTranscoding && sttInputRef.current?.click()}
                        className={`aspect-video bg-black/40 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-600/5 hover:border-emerald-500/30 transition-all group ${isLimitReached ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <input type="file" ref={sttInputRef} onChange={handleMediaImport} className="hidden" accept="audio/*,video/*" />
                        {isTranscoding ? (
                          <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-emerald-500 group-hover:scale-110 transition-transform mb-4" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Import Media Signal</p>
                          </>
                        )}
                      </div>
                      
                      {text && mode === 'stt' && (
                        <div className="animate-fade-in space-y-3">
                           <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Extracted Payload</label>
                              <button onClick={() => { navigator.clipboard.writeText(text); alert('Payload copied to clipboard.'); }} className="text-[9px] font-black text-emerald-400 hover:text-white uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                                 <Copy className="w-3 h-3" /> Copy Text
                              </button>
                           </div>
                           <div className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-gray-300 text-sm leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                              {text}
                           </div>
                        </div>
                      )}
                    </div>
                  )}

                  {error && (
                    <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center gap-3 animate-fade-in">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-[9px] text-red-400 font-black uppercase tracking-widest leading-none">{error}</p>
                    </div>
                  )}

                  {mode !== 'stt' && (
                    <button onClick={handleMoteurGenerate} disabled={isSynthesizing || isTranscoding} className={`w-full py-6 rounded-2xl font-black text-lg flex items-center justify-center gap-4 transition-all shadow-2xl ${isSynthesizing ? 'bg-gray-800 text-gray-600' : isLimitReached ? 'bg-amber-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
                      {isSynthesizing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 fill-white" />}
                      <span className="uppercase tracking-[0.2em] italic">Start Ai Voice & Audio production</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-black/40 border border-white/5 rounded-[3rem] p-2.5 flex flex-col relative overflow-hidden h-full min-h-[650px]">
               <div className="flex-1 rounded-[2.5rem] overflow-hidden bg-dark-950 flex flex-col items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-pink-900/5 pointer-events-none" />
                  
                  {audioUrl ? (
                    <div className="w-full h-full flex flex-col animate-fade-in z-10">
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                         <div className={`w-64 h-64 rounded-full flex items-center justify-center shadow-2xl transition-all duration-700 ${isPlaying ? 'bg-indigo-600 shadow-indigo-600/40' : 'bg-white/5 border border-white/10 opacity-40'}`}>
                            <Headphones className="w-24 h-24 text-white" />
                            <audio ref={mainAudioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
                         </div>
                         <button onClick={() => isPlaying ? mainAudioRef.current?.pause() : mainAudioRef.current?.play()} className="mt-16 p-10 bg-white text-dark-950 rounded-full shadow-2xl transition-all">
                            {isPlaying ? <Pause className="w-10 h-10 fill-dark-950" /> : <Play className="w-10 h-10 fill-dark-950 ml-1" />}
                         </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center opacity-30 px-12 text-center relative z-10">
                      <Music className="w-14 h-14 text-gray-700 mb-12" />
                      <h3 className="text-4xl font-black uppercase tracking-[0.4em] text-white mb-6 italic leading-none">Voice Viewport</h3>
                      <p className="text-gray-500 text-lg max-w-md font-medium leading-relaxed uppercase tracking-widest">Connect signal to begin synthesis.</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Ready to Narrate CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center">
           <h2 className="text-4xl md:text-8xl font-black text-white uppercase italic tracking-tighter mb-10 leading-none">Ready to Narrate <br /> the Future?</h2>
           <button onClick={user?.isRegistered ? onStartCreating : onLoginClick} className="px-20 py-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2.5rem] font-black text-3xl uppercase italic tracking-widest shadow-2xl transition-transform hover:scale-105 active:scale-95">
              {user?.isRegistered ? 'Open Ai Voice & Audio Workstation' : 'Generate Free Now'}
           </button>
        </div>
      </section>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};
