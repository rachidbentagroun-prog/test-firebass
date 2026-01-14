
// TTSLanding Component - AI Voice & Audio Workstation with full multilingual support
import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic2, Headphones, Sparkles, Volume2, Zap, ArrowRight,
  Music, Radio, MessageCircle, Play, Globe, Cpu, ArrowRightCircle,
  Loader2, Pause, RefreshCw, Wand2, Volume1, Activity, ChevronRight,
  Lock, UserPlus, Languages, Check, Download, Upload, Scissors, Star,
  Video, AlertCircle, FileAudio, FileVideo, X, User as UserIcon,
  Smile, VolumeX, TrendingUp, Gem, Flag, ChevronDown, Key, Settings2,
  Clock, History, RotateCcw, ShieldCheck, DownloadCloud, Terminal,
  Fingerprint, Copy, FileText, SkipBack, SkipForward
} from 'lucide-react';
import { TTSLabConfig, User, GeneratedAudio } from '../types';
import { useLanguage } from '../utils/i18n';
import { 
  generateSpeechWithGemini, 
  enhancePrompt,
  convertBlobToBase64,
  detectVoiceProfile,
  generateClonedSpeechWithGemini,
  transcribeMedia
} from '../services/geminiService';
import {
  generateSpeechWithElevenLabs,
  generateClonedSpeechWithElevenLabs,
  detectVoiceProfileElevenLabs
} from '../services/elevenlabsService';

interface TTSLandingProps {
  user: User | null;
  config?: TTSLabConfig;
  onStartCreating: () => void;
  onCreditUsed?: () => void;
  onUpgradeRequired?: () => void;
  onLoginClick: () => void;
  onAudioGenerated?: (audio: GeneratedAudio) => void;
  hasApiKey: boolean;
  onSelectKey: () => void;
  onResetKey: () => void;
}

const MODE_USES_KEY = 'imaginai_tts_mode_uses';
const MAX_CHARS = 5000;

// Gemini Voices
const GEMINI_VOICES = [
  { id: 'Kore', label: 'Kore', gender: 'Female', desc: 'Professional & Authoritative', color: 'indigo' },
  { id: 'Puck', label: 'Puck', gender: 'Male', desc: 'Youthful & High Energy', color: 'purple' },
  { id: 'Charon', label: 'Charon', gender: 'Male', desc: 'Deep & Cinematic Bass', color: 'pink' },
  { id: 'Zephyr', label: 'Zephyr', gender: 'Female', desc: 'Calm & Breathful Texture', color: 'blue' },
  { id: 'Fenrir', label: 'Fenrir', gender: 'Male', desc: 'Grizzled & Ancient Storyteller', color: 'amber' },
  { id: 'Aoede', label: 'Aoede', gender: 'Female', desc: 'Melodic and Lyrical', color: 'emerald' },
  { id: 'Leda', label: 'Leda', gender: 'Female', desc: 'Bright and Articulate', color: 'orange' },
  { id: 'Orus', label: 'Orus', gender: 'Male', desc: 'Sharp and commanding', color: 'red' }
];

// ElevenLabs Voices
const ELEVENLABS_VOICES = [
  { id: 'Rachel', label: 'Rachel', gender: 'Female', desc: 'Professional & Clear', color: 'indigo' },
  { id: 'Bella', label: 'Bella', gender: 'Female', desc: 'Warm & Friendly', color: 'pink' },
  { id: 'Charlotte', label: 'Charlotte', gender: 'Female', desc: 'Calm & Serene', color: 'blue' },
  { id: 'Emily', label: 'Emily', gender: 'Female', desc: 'Youthful & Energetic', color: 'purple' },
  { id: 'Domi', label: 'Domi', gender: 'Female', desc: 'Expressive & Lively', color: 'emerald' },
  { id: 'Elli', label: 'Elli', gender: 'Female', desc: 'Sweet & Cheerful', color: 'amber' },
  { id: 'Josh', label: 'Josh', gender: 'Male', desc: 'Energetic & Young', color: 'orange' },
  { id: 'Antoni', label: 'Antoni', gender: 'Male', desc: 'Professional & Serious', color: 'rose' },
  { id: 'Arnold', label: 'Arnold', gender: 'Male', desc: 'Deep & Commanding', color: 'red' },
  { id: 'Adam', label: 'Adam', gender: 'Male', desc: 'Warm & Experienced', color: 'cyan' },
  { id: 'Sam', label: 'Sam', gender: 'Male', desc: 'Casual & Friendly', color: 'green' },
  { id: 'Ethan', label: 'Ethan', gender: 'Male', desc: 'Calm & Thoughtful', color: 'violet' }
];

// Keep VOICES for backward compatibility
const VOICES = GEMINI_VOICES;

const GEMINI_PREVIEW_SCRIPTS: Record<string, string> = {
  'Kore': "Synchronizing neural weights. I am Kore, your high-fidelity production voice.",
  'Puck': "Whoa! Puck here. Ready to bring some serious energy to your next project.",
  'Charon': "The shadows have stories to tell. I am Charon, the deep voice of the void.",
  'Zephyr': "Breathe in. I am Zephyr, here to bring peace and calm to your listeners.",
  'Fenrir': "Old stories are etched in bone. I am Fenrir, the texture of time itself.",
  'Aoede': "Melody is the heartbeat of thought. I am Aoede.",
  'Leda': "Clarity defines communication. I am Leda.",
  'Orus': "Precision is absolute. I am Orus.",
};

const ELEVENLABS_PREVIEW_SCRIPTS: Record<string, string> = {
  'Rachel': "Hello! I am Rachel, your professional voice assistant.",
  'Bella': "Hi there! I'm Bella, here to help with warmth and clarity.",
  'Charlotte': "Welcome. I'm Charlotte, bringing calm to your projects.",
  'Emily': "Hey! I'm Emily, ready to bring energy to your content.",
  'Domi': "What's up! Domi here, expressive and ready to go.",
  'Elli': "Hi! I'm Elli, sweet and cheerful as always.",
  'Josh': "Hey! Josh here, bringing youthful energy to the table.",
  'Antoni': "Good day. Antoni speaking, professional and serious.",
  'Arnold': "Greetings. I am Arnold, with a deep commanding voice.",
  'Adam': "Hello! I'm Adam, with warmth and experience.",
  'Sam': "Hey! Sam here, casual and friendly.",
  'Ethan': "Hi. I'm Ethan, calm and thoughtful.",
};

const PREVIEW_SCRIPTS = GEMINI_PREVIEW_SCRIPTS;

// Gemini Languages
const GEMINI_LANGUAGES = [
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

// ElevenLabs Supported Languages
const ELEVENLABS_LANGUAGES = [
  { id: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { id: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
  { id: 'es-ES', label: 'Spanish (Español)', flag: '🇪🇸' },
  { id: 'fr-FR', label: 'French (Français)', flag: '🇫🇷' },
  { id: 'de-DE', label: 'German (Deutsch)', flag: '🇩🇪' },
  { id: 'it-IT', label: 'Italian (Italiano)', flag: '🇮🇹' },
  { id: 'pt-BR', label: 'Portuguese (Português)', flag: '🇧🇷' },
  { id: 'pt-PT', label: 'Portuguese (Portugal)', flag: '🇵🇹' },
  { id: 'nl-NL', label: 'Dutch (Nederlands)', flag: '🇳🇱' },
  { id: 'pl-PL', label: 'Polish (Polski)', flag: '🇵🇱' },
  { id: 'sv-SE', label: 'Swedish (Svenska)', flag: '🇸🇪' },
  { id: 'da-DK', label: 'Danish (Dansk)', flag: '🇩🇰' },
  { id: 'fi-FI', label: 'Finnish (Suomi)', flag: '🇫🇮' },
  { id: 'tr-TR', label: 'Turkish (Türkçe)', flag: '🇹🇷' },
  { id: 'ru-RU', label: 'Russian (Русский)', flag: '🇷🇺' },
  { id: 'ja-JP', label: 'Japanese (日本語)', flag: '🇯🇵' },
  { id: 'zh-CN', label: 'Chinese Mandarin (中文)', flag: '🇨🇳' },
  { id: 'ko-KR', label: 'Korean (한국어)', flag: '🇰🇷' },
];

const LANGUAGES = GEMINI_LANGUAGES;

export const TTSLanding: React.FC<TTSLandingProps> = ({
  user, config, onStartCreating, onCreditUsed, onUpgradeRequired, onLoginClick,
  onAudioGenerated, hasApiKey, onSelectKey, onResetKey
}) => {
  const { t, language } = useLanguage();
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [voiceEngine, setVoiceEngine] = useState<'gemini' | 'elevenlabs'>('gemini');
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
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  // Get voices and languages based on engine selection
  const currentVoices = voiceEngine === 'elevenlabs' ? ELEVENLABS_VOICES : GEMINI_VOICES;
  const currentLanguages = voiceEngine === 'elevenlabs' ? ELEVENLABS_LANGUAGES : GEMINI_LANGUAGES;
  const currentPreviewScripts = voiceEngine === 'elevenlabs' ? ELEVENLABS_PREVIEW_SCRIPTS : GEMINI_PREVIEW_SCRIPTS;

  // Reset voice when switching engines
  useEffect(() => {
    const firstVoice = currentVoices[0]?.id || 'Rachel';
    setSelectedVoice(firstVoice);
  }, [voiceEngine, currentVoices]);
  
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

  const [showIdentityCheck, setShowIdentityCheck] = useState(false);

  useEffect(() => {
    try {
      const pv = localStorage.getItem('pending_verification');
      if ((user && !user.isVerified) || pv) setShowIdentityCheck(true);
      else setShowIdentityCheck(false);
    } catch (e) { /* ignore */ }
  }, [user]);

  const isLimitReached = user?.plan === 'free' && modeUses[mode] >= 2;

  useEffect(() => {
    localStorage.setItem(MODE_USES_KEY, JSON.stringify(modeUses));
  }, [modeUses]);

  // Load history from localStorage on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const saved = localStorage.getItem('tts_audio_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Recreate blob URLs from base64
          const recreated = await Promise.all(
            parsed.map(async (item: any) => {
              if (item.base64Audio) {
                const response = await fetch(item.base64Audio);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                return { ...item, url, blob };
              }
              return item;
            })
          );
          setLocalHistory(recreated);
        }
      } catch (e) {
        console.error('Failed to load audio history:', e);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadHistory();
  }, []);

  // Persist audio history to localStorage
  useEffect(() => {
    if (isLoadingHistory) return; // Don't save while loading
    
    const saveHistory = async () => {
      try {
        // Convert blobs to base64 for storage
        const toSave = await Promise.all(
          localHistory.map(async (item) => {
            if (item.blob && !item.base64Audio) {
              const reader = new FileReader();
              const base64 = await new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(item.blob!);
              });
              return { ...item, base64Audio: base64, blob: undefined, url: undefined };
            }
            return { ...item, blob: undefined, url: undefined };
          })
        );
        localStorage.setItem('tts_audio_history', JSON.stringify(toSave));
      } catch (e) {
        console.error('Failed to save audio history:', e);
      }
    };
    saveHistory();
  }, [localHistory, isLoadingHistory]);

  const MAX_CHARS = 1000;

  const mainAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Format time helper (converts seconds to MM:SS)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle seek bar change
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (mainAudioRef.current) {
      mainAudioRef.current.currentTime = time;
    }
  };

  // Update current time as audio plays
  const handleTimeUpdate = () => {
    if (mainAudioRef.current && !isSeeking) {
      setCurrentTime(mainAudioRef.current.currentTime);
    }
  };

  // Handle audio metadata loaded (duration)
  const handleLoadedMetadata = () => {
    if (mainAudioRef.current) {
      setDuration(mainAudioRef.current.duration);
      setCurrentTime(0);
    }
  };

  // Skip forward/backward functions
  const handleSkipBackward = () => {
    if (mainAudioRef.current) {
      mainAudioRef.current.currentTime = Math.max(0, mainAudioRef.current.currentTime - 10);
    }
  };

  const handleSkipForward = () => {
    if (mainAudioRef.current) {
      mainAudioRef.current.currentTime = Math.min(
        mainAudioRef.current.duration,
        mainAudioRef.current.currentTime + 10
      );
    }
  };
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
      setError(t('aiVoice.errorMediaTooLarge'));
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
          if (user?.plan === 'free') setModeUses((prev: any) => ({ ...prev, stt: prev.stt + 1 }));
        }
      }
    } catch (err: any) {
      setError(t('aiVoice.errorHandshakeFailed'));
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
      const script = currentPreviewScripts[voiceId] || `Hello, I am ${voiceId}.`;
      let blob: Blob;
      
      if (voiceEngine === 'elevenlabs') {
        blob = await generateSpeechWithElevenLabs(script, voiceId);
      } else {
        blob = await generateSpeechWithGemini(`Directorial Note: Speak clearly: ${script}`, voiceId);
      }
      
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

    if (!text.trim()) { setError(t('aiVoice.errorEnterPrompt')); return; }
    if (text.length > MAX_CHARS) { setError(t('aiVoice.errorScriptTooLong').replace('{0}', MAX_CHARS.toString())); return; }
    if (mode === 'clone' && !clonedVoiceData) { setError(t('aiVoice.errorMissingAnchor')); return; }

    setIsSynthesizing(true);
    setAudioUrl(null);
    setError(null);

    try {
      let blob: Blob;
      if (mode === 'clone' && clonedVoiceData) {
        if (voiceEngine === 'elevenlabs') {
          blob = await generateClonedSpeechWithElevenLabs(text, clonedVoiceData.base64, clonedVoiceData.type);
        } else {
          blob = await generateClonedSpeechWithGemini(text, clonedVoiceData.base64, clonedVoiceData.type);
        }
      } else {
        const voiceToUse = selectedVoice;
        if (voiceEngine === 'elevenlabs') {
          blob = await generateSpeechWithElevenLabs(text, voiceToUse);
        } else {
          const lang = currentLanguages.find(l => l.id === selectedLanguage);
          const prompt = `Directorial Note: Speak in ${lang?.label}. Content: "${text}"`;
          blob = await generateSpeechWithGemini(prompt, voiceToUse);
        }
      }

      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      
      // Convert blob to base64 for storage
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      const newAudio: GeneratedAudio = {
        id: Date.now().toString(),
        url,
        text,
        voice: mode === 'clone' ? `${clonedVoiceName} (Clone)` : selectedVoice,
        createdAt: Date.now(),
        blob,
        base64Audio,
      };
      
      setLocalHistory(prev => [newAudio, ...prev]);
      
      // Notify parent component
      if (onAudioGenerated) {
        onAudioGenerated(newAudio);
      }
      
      // Save to user's audio gallery in Supabase
      if (user?.id) {
        try {
          const { saveAudioToDB } = await import('../services/dbService');
          await saveAudioToDB(newAudio, user.id);
        } catch (err) {
          console.error('Failed to save to gallery:', err);
        }
      }
      
      if (user?.plan === 'free') {
        setModeUses((prev: any) => ({ ...prev, [currentModeKey]: prev[currentModeKey] + 1 }));
      }
      
      onCreditUsed?.();
    } catch (e: any) {
      if (e.message?.includes("entity was not found")) {
        onResetKey();
        setError(t('aiVoice.errorApiExpired'));
      } else {
        setError(t('aiVoice.errorSynthesisFailed'));
      }
    } finally {
      setIsSynthesizing(false);
    }
  };

  const currentLang = currentLanguages.find(l => l.id === selectedLanguage);
  const currentVoice = currentVoices.find(v => v.id === selectedVoice);

  return (
    <div className="bg-dark-950 text-white min-h-screen font-sans selection:bg-pink-500/30">
      {/* Ai Voice & Audio Workstation Header */}
      <section id="workstation" className="py-12 sm:py-16 md:py-24 pt-16 sm:pt-24 md:pt-32 relative overflow-hidden bg-dark-950">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-10 sm:mb-12 md:mb-16">
             <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">{t('aiVoice.workstationTitle')}</h3>
           </div>

          {showIdentityCheck && (
            <div className="max-w-2xl mx-auto mb-6 p-3 sm:p-4 rounded-2xl bg-amber-900/10 border border-amber-500/10 text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-amber-300" />
                <h4 className="text-xs sm:text-sm font-black uppercase text-amber-300">{t('aiVoice.identityCheck')}</h4>
              </div>
              <p className="text-gray-300 text-xs sm:text-sm mt-2">{t('aiVoice.verificationMessage')}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-10">
            <div className="md:col-span-1 lg:col-span-5 space-y-6 sm:space-y-8">
              <div className="bg-dark-900 border border-white/5 rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-2xl space-y-8 relative overflow-visible">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/10 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                
                <div className="flex bg-black/50 p-1.5 rounded-2xl mb-4 border border-white/5 relative z-10 overflow-x-auto no-scrollbar">
                  <button onClick={() => setMode('narrator')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${mode === 'narrator' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>{t('aiVoice.textToSpeech')}</button>
                  <button onClick={() => setMode('clone')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${mode === 'clone' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}><Scissors className="w-3.5 h-3.5" /> {t('aiVoice.voiceClone')}</button>
                  <button onClick={() => setMode('stt')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${mode === 'stt' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}><FileText className="w-3.5 h-3.5" /> {t('aiVoice.speechToText')}</button>
                </div>

                {/* Engine Selector */}
                <div className="space-y-2 relative z-10">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('aiVoice.aiEngine')}</label>
                  <div className="flex bg-black/50 p-1.5 rounded-xl border border-white/10">
                    <button 
                      onClick={() => setVoiceEngine('gemini')}
                      className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${voiceEngine === 'gemini' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      Gemini
                    </button>
                    <button 
                      onClick={() => setVoiceEngine('elevenlabs')}
                      className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${voiceEngine === 'elevenlabs' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      ElevenLabs
                    </button>
                  </div>
                </div>

                <div className="space-y-6 relative z-10">
                  {mode !== 'stt' ? (
                    <div className="space-y-6 animate-fade-in">
                      {/* Dropdown controls for Narrator Mode */}
                      {mode === 'narrator' && (
                        <div className="grid grid-cols-2 gap-4">
                           {/* Global Language Dropdown */}
                           <div className="space-y-2 relative" ref={langMenuRef}>
                              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('aiVoice.languageOutput')}</label>
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
                                   {currentLanguages.map(lang => (
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
                              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('aiVoice.narrator')}</label>
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
                                   {currentVoices.map(voice => (
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
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('aiVoice.neuralAnchor')}</label>
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
                                <p className="text-[10px] font-bold text-white uppercase truncate max-w-[200px]">{clonedVoiceData.fileName || t('aiVoice.referenceLocked')}</p>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setClonedVoiceData(null); }}
                                  className="text-[9px] font-black text-gray-500 hover:text-red-400 uppercase tracking-widest mt-2"
                                >
                                  {t('aiVoice.removeAnchor')}
                                </button>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-6 h-6 text-pink-500 group-hover:scale-110 transition-transform mb-3" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('aiVoice.uploadIdentitySample')}</p>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <Zap className="w-3.5 h-3.5 text-indigo-500" /> {mode === 'clone' ? t('aiVoice.targetScript') : t('aiVoice.enterPrompt')}
                            </label>
                          <div className="flex gap-4 items-center">
                            <button onClick={handleEnhance} disabled={isEnhancing || !text.trim() || isLimitReached} className="text-[10px] font-bold text-indigo-400 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-30">
                              <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} /> {t('aiVoice.optimize')}
                            </button>
                          </div>
                        </div>
                        
                        <textarea 
                          value={text} onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                          dir="auto" disabled={isLimitReached}
                          placeholder={mode === 'clone' ? t('aiVoice.neuralAnchorPlaceholder') : t('aiVoice.scriptPlaceholder')}
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
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('aiVoice.importMediaSignal')}</p>
                          </>
                        )}
                      </div>
                      
                      {text && mode === 'stt' && (
                        <div className="animate-fade-in space-y-3">
                           <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('aiVoice.extractedPayload')}</label>
                              <button onClick={() => { navigator.clipboard.writeText(text); alert(t('aiVoice.payloadCopied')); }} className="text-[9px] font-black text-emerald-400 hover:text-white uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                                 <Copy className="w-3 h-3" /> {t('aiVoice.copyText')}
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
                    <button onClick={handleMoteurGenerate} disabled={isSynthesizing || isTranscoding || showIdentityCheck} className={`w-full py-6 rounded-2xl font-black text-lg flex items-center justify-center gap-4 transition-all shadow-2xl ${isSynthesizing ? 'bg-gray-800 text-gray-600' : (showIdentityCheck ? 'bg-white/5 opacity-60 cursor-not-allowed' : (isLimitReached ? 'bg-amber-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'))}`} title={showIdentityCheck ? t('aiVoice.verificationMessage') : undefined}>
                      {isSynthesizing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 fill-white" />}
                      <span className="uppercase tracking-[0.2em] italic">{showIdentityCheck ? t('aiVoice.verifyEmail') : t('aiVoice.startGenerate')}</span>
                    </button>
                  )}
                  
                  {/* Recently Run Section */}
                  {!isLoadingHistory && localHistory.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-white/5">
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <History className="w-4 h-4" /> {t('aiVoice.recentlyRun')}
                      </h4>
                      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                        {localHistory.slice(0, 5).map((audio) => (
                          <div key={audio.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all group">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white truncate">{audio.voice}</p>
                              <p className="text-[10px] text-gray-400 truncate">{audio.text.slice(0, 40)}...</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  if (audioUrl === audio.url && isPlaying) {
                                    mainAudioRef.current?.pause();
                                  } else {
                                    setAudioUrl(audio.url);
                                    setTimeout(() => {
                                      mainAudioRef.current?.play();
                                    }, 100);
                                  }
                                }}
                                className={`p-2 rounded-lg transition-all ${audioUrl === audio.url && isPlaying ? 'bg-indigo-600 text-white' : 'bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white'}`}
                                title={audioUrl === audio.url && isPlaying ? "Pause" : "Play"}
                              >
                                {audioUrl === audio.url && isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                              </button>
                              <a 
                                href={audio.url} 
                                download={`audio-${audio.id}.mp3`}
                                className="p-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition-all"
                                title="Download"
                              >
                                <Download className="w-3 h-3" />
                              </a>
                              <button 
                                onClick={() => {
                                  setLocalHistory(prev => prev.filter(a => a.id !== audio.id));
                                  if (audioUrl === audio.url) {
                                    setAudioUrl(null);
                                    setIsPlaying(false);
                                  }
                                }}
                                className="p-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-all"
                                title="Delete"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-1 lg:col-span-7 bg-black/40 border border-white/5 rounded-[3rem] p-2 sm:p-2.5 flex flex-col relative overflow-hidden h-full min-h-[500px] sm:min-h-[650px]">
               <div className="flex-1 rounded-[2.5rem] overflow-hidden bg-dark-950 flex flex-col items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-pink-900/5 pointer-events-none" />
                  
                  {audioUrl ? (
                    <div className="w-full h-full flex flex-col animate-fade-in z-10">
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                         <div className={`w-64 h-64 rounded-full flex items-center justify-center shadow-2xl transition-all duration-700 ${isPlaying ? 'bg-indigo-600 shadow-indigo-600/40' : 'bg-white/5 border border-white/10 opacity-40'}`}>
                            <Headphones className="w-24 h-24 text-white" />
                            <audio 
                              ref={mainAudioRef} 
                              src={audioUrl} 
                              onEnded={() => setIsPlaying(false)} 
                              onPlay={() => setIsPlaying(true)} 
                              onPause={() => setIsPlaying(false)}
                              onTimeUpdate={handleTimeUpdate}
                              onLoadedMetadata={handleLoadedMetadata}
                            />
                         </div>
                         
                         {/* Seek Bar and Time Display */}
                         <div className="w-full max-w-2xl mt-12 space-y-4">
                           <div className="flex items-center gap-4">
                             <span className="text-xs font-bold text-gray-400 min-w-[45px] text-right">{formatTime(currentTime)}</span>
                             <div className="flex-1 relative group">
                               <input 
                                 type="range" 
                                 min="0" 
                                 max={duration || 0} 
                                 value={currentTime} 
                                 onChange={handleSeek}
                                 onMouseDown={() => setIsSeeking(true)}
                                 onMouseUp={() => setIsSeeking(false)}
                                 onTouchStart={() => setIsSeeking(true)}
                                 onTouchEnd={() => setIsSeeking(false)}
                                 className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                                   [&::-webkit-slider-thumb]:appearance-none
                                   [&::-webkit-slider-thumb]:w-4
                                   [&::-webkit-slider-thumb]:h-4
                                   [&::-webkit-slider-thumb]:rounded-full
                                   [&::-webkit-slider-thumb]:bg-white
                                   [&::-webkit-slider-thumb]:cursor-pointer
                                   [&::-webkit-slider-thumb]:shadow-xl
                                   [&::-webkit-slider-thumb]:transition-all
                                   [&::-webkit-slider-thumb]:hover:scale-125
                                   [&::-moz-range-thumb]:w-4
                                   [&::-moz-range-thumb]:h-4
                                   [&::-moz-range-thumb]:rounded-full
                                   [&::-moz-range-thumb]:bg-white
                                   [&::-moz-range-thumb]:border-0
                                   [&::-moz-range-thumb]:cursor-pointer
                                   [&::-moz-range-thumb]:shadow-xl
                                   [&::-moz-range-thumb]:transition-all
                                   [&::-moz-range-thumb]:hover:scale-125"
                                 style={{
                                   background: `linear-gradient(to right, rgb(99, 102, 241) 0%, rgb(99, 102, 241) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.1) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.1) 100%)`
                                 }}
                               />
                             </div>
                             <span className="text-xs font-bold text-gray-400 min-w-[45px]">{formatTime(duration)}</span>
                           </div>
                         </div>
                         
                         <div className="mt-8 flex items-center gap-4">
                           <button 
                             onClick={handleSkipBackward}
                             className="p-6 bg-white/10 hover:bg-white/20 text-white rounded-full shadow-xl transition-all hover:scale-105"
                             title="Skip back 10 seconds"
                           >
                              <SkipBack className="w-6 h-6" />
                           </button>
                           <button onClick={() => isPlaying ? mainAudioRef.current?.pause() : mainAudioRef.current?.play()} className="p-10 bg-white text-dark-950 rounded-full shadow-2xl transition-all hover:scale-105">
                              {isPlaying ? <Pause className="w-10 h-10 fill-dark-950" /> : <Play className="w-10 h-10 fill-dark-950 ml-1" />}
                           </button>
                           <button 
                             onClick={handleSkipForward}
                             className="p-6 bg-white/10 hover:bg-white/20 text-white rounded-full shadow-xl transition-all hover:scale-105"
                             title="Skip forward 10 seconds"
                           >
                              <SkipForward className="w-6 h-6" />
                           </button>
                           <a href={audioUrl} download="audio.mp3" className="p-10 bg-indigo-600 text-white rounded-full shadow-2xl transition-all hover:scale-105 hover:bg-indigo-500">
                              <Download className="w-10 h-10" />
                           </a>
                         </div>
                      </div>
                      
                      {/* Recently Generated Audios */}
                      {localHistory.length > 0 && (
                        <div className="border-t border-white/5 p-8">
                          <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">{t('aiVoice.recentlyGenerated')}</h4>
                          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                            {localHistory.slice(0, 5).map((audio) => (
                              <div key={audio.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all group">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-white truncate">{audio.voice}</p>
                                  <p className="text-xs text-gray-400 truncate">{audio.text.slice(0, 50)}...</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => {
                                      if (audioUrl === audio.url && isPlaying) {
                                        mainAudioRef.current?.pause();
                                      } else {
                                        setAudioUrl(audio.url);
                                        setTimeout(() => {
                                          mainAudioRef.current?.play();
                                        }, 100);
                                      }
                                    }}
                                    className={`p-2 rounded-lg transition-all ${audioUrl === audio.url && isPlaying ? 'bg-indigo-600 text-white' : 'bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white'}`}
                                    title={audioUrl === audio.url && isPlaying ? "Pause" : "Play"}
                                  >
                                    {audioUrl === audio.url && isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                  </button>
                                  <a 
                                    href={audio.url} 
                                    download={`audio-${audio.id}.mp3`}
                                    className="p-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition-all"
                                    title="Download"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                  <button 
                                    onClick={() => {
                                      setLocalHistory(prev => prev.filter(a => a.id !== audio.id));
                                      if (audioUrl === audio.url) {
                                        setAudioUrl(null);
                                        setIsPlaying(false);
                                      }
                                    }}
                                    className="p-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-all"
                                    title="Delete"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center opacity-30 px-12 text-center relative z-10">
                      <Music className="w-14 h-14 text-gray-700 mb-12" />
                      <h3 className="text-4xl font-black uppercase tracking-[0.4em] text-white mb-6 italic leading-none">{t('aiVoice.voiceViewport')}</h3>
                      <p className="text-gray-500 text-lg max-w-md font-medium leading-relaxed uppercase tracking-widest">{t('aiVoice.connectSignal')}</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
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
