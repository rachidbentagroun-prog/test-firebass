
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Mic2, Volume2, Sparkles, Wand2, RefreshCw, AlertCircle, 
  Trash2, Download, Play, Pause, Headphones, Star, 
  Settings2, Activity, Info, Zap, ChevronRight, Music,
  History, Clock, FileText, Share2, Scissors, Upload,
  Check, Loader2, Languages, ChevronDown, Lock, Key,
  PlayCircle, DownloadCloud, Volume1, Search, List, X,
  RotateCcw, RotateCw, ThumbsUp, ThumbsDown, FileAudio, FileVideo,
  AudioLines, FileJson, Languages as LangIcon,
  Fingerprint, Copy, Globe,
  User as UserIcon
} from 'lucide-react';
import { 
  generateSpeechWithGemini, 
  enhancePrompt, 
  transcribeMedia, 
  convertBlobToBase64, 
  generateClonedSpeechWithGemini, 
  detectVoiceProfile 
} from '../services/geminiService';
import { 
  generateSpeechWithElevenLabs,
  generateClonedSpeechWithElevenLabs
} from '../services/elevenlabsService';
import { User, GeneratedAudio } from '../types';
import { saveWorkState, getWorkState } from '../services/dbService';
import { saveAudioToFirebase, getAudioFromFirebase, deleteAudioFromFirebase } from '../services/firebase';

const NEGATIVE_PRESETS = [
  'background noise, distortion, static',
  'robotic tone, monotone delivery',
  'mouth clicks, sibilance, pops',
  'echo, reverb, room tone',
  'breaths, filler words, stutters'
];

interface TTSGeneratorProps {
  user: User | null;
  onCreditUsed: () => void;
  onUpgradeRequired: () => void;
  onAudioGenerated: (audio: GeneratedAudio) => void;
  audioHistory?: GeneratedAudio[];
  hasApiKey: boolean;
  onSelectKey: () => void;
  onResetKey: () => void;
}

const VOICES = [
  { id: 'Kore', label: 'Kore', gender: 'Female', desc: 'Professional & Authoritative', color: 'indigo' },
  { id: 'Puck', label: 'Puck', gender: 'Male', desc: 'Youthful & High Energy', color: 'purple' },
  { id: 'Charon', label: 'Charon', gender: 'Male', desc: 'Deep & Cinematic', color: 'pink' },
  { id: 'Zephyr', label: 'Zephyr', gender: 'Female', desc: 'Calm & Breathful', color: 'blue' },
  { id: 'Fenrir', label: 'Fenrir', gender: 'Male', desc: 'Ancient Storyteller', color: 'amber' },
  { id: 'Aoede', label: 'Aoede', gender: 'Female', desc: 'Melodic and Lyrical', color: 'emerald' },
  { id: 'Leda', label: 'Leda', gender: 'Female', desc: 'Bright and Articulate', color: 'orange' },
  { id: 'Orus', label: 'Orus', gender: 'Male', desc: 'Sharp and Commanding', color: 'red' }
];

const ELEVENLABS_VOICES = [
  { id: 'Rachel', label: 'Rachel', gender: 'Female', desc: 'Professional & Clear', color: 'indigo' },
  { id: 'Domi', label: 'Domi', gender: 'Female', desc: 'Energetic & Confident', color: 'purple' },
  { id: 'Bella', label: 'Bella', gender: 'Female', desc: 'Articulate & Elegant', color: 'pink' },
  { id: 'Antoni', label: 'Antoni', gender: 'Male', desc: 'Sharp & Commanding', color: 'blue' },
  { id: 'Elli', label: 'Elli', gender: 'Female', desc: 'Young & Dynamic', color: 'amber' },
  { id: 'Josh', label: 'Josh', gender: 'Male', desc: 'Youthful & Energetic', color: 'emerald' },
  { id: 'Arnold', label: 'Arnold', gender: 'Male', desc: 'Deep & Cinematic', color: 'orange' },
  { id: 'Adam', label: 'Adam', gender: 'Male', desc: 'Storyteller & Rich', color: 'red' },
  { id: 'Sam', label: 'Sam', gender: 'Male', desc: 'Raspy & Mature', color: 'cyan' },
  { id: 'Charlotte', label: 'Charlotte', gender: 'Female', desc: 'Calm & Soothing', color: 'teal' },
  { id: 'Emily', label: 'Emily', gender: 'Female', desc: 'Melodic & Warm', color: 'rose' },
  { id: 'Ethan', label: 'Ethan', gender: 'Male', desc: 'Strong & Authoritative', color: 'slate' }
];

const PREVIEW_SCRIPTS: Record<string, string> = {
  'Kore': "Neural weights synced. I am Kore, your production voice.",
  'Puck': "Yo! Puck here. Let's bring some energy to this track.",
  'Charon': "The shadows have stories. I am Charon.",
  'Zephyr': "Peace and clarity. I am Zephyr.",
  'Fenrir': "Ancient echoes. I am Fenrir.",
  'Aoede': "Melody is thought. I am Aoede.",
  'Leda': "Precision in speech. I am Leda.",
  'Orus': "Commanding focus. I am Orus.",
};

const LANGUAGES = [
  { id: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { id: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
  { id: 'ar-SA', label: 'Arabic (العربية)', flag: '🇸🇦' },
  { id: 'fr-FR', label: 'French (Français)', flag: '🇫🇷' },
  { id: 'es-ES', label: 'Spanish (Español)', flag: '🇪🇸' },
  { id: 'de-DE', label: 'German (Deutsch)', flag: '🇩🇪' },
  { id: 'it-IT', label: 'Italian (Italiano)', flag: '🇮🇹' },
  { id: 'pt-BR', label: 'Portuguese (Portυγυês)', flag: '🇧🇷' },
  { id: 'zh-CN', label: 'Chinese (中文)', flag: '🇨🇳' },
  { id: 'ja-JP', label: 'Japanese (日本語)', flag: '🇯🇵' },
  { id: 'ko-KR', label: 'Korean (한국어)', flag: '🇰🇷' },
  { id: 'hi-IN', label: 'Hindi (हिन्दी)', flag: '🇮🇳' },
];

const ELEVENLABS_LANGUAGES = [
  { id: 'en', label: 'English', flag: '🇺🇸' },
  { id: 'es', label: 'Spanish', flag: '🇪🇸' },
  { id: 'fr', label: 'French', flag: '🇫🇷' },
  { id: 'de', label: 'German', flag: '🇩🇪' },
  { id: 'it', label: 'Italian', flag: '🇮🇹' },
  { id: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  { id: 'pl', label: 'Polish', flag: '🇵🇱' },
  { id: 'nl', label: 'Dutch', flag: '🇳🇱' },
];

export const TTSGenerator: React.FC<TTSGeneratorProps> = ({ 
  user, onCreditUsed, onUpgradeRequired, onAudioGenerated, audioHistory = [], 
  hasApiKey, onSelectKey, onResetKey 
}) => {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'narrator' | 'clone' | 'stt' | 'song'>('narrator');
  const [engine, setEngine] = useState<'gemini' | 'elevenlabs'>('gemini');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [selectedElevenlabsVoice, setSelectedElevenlabsVoice] = useState('Rachel');
  const [selectedElevenlabsLanguage, setSelectedElevenlabsLanguage] = useState('en');
  // Create Song (ElevenLabs) preferences
  const [songGenre, setSongGenre] = useState('Pop');
  const [songBpm, setSongBpm] = useState(120);
  const [songMood, setSongMood] = useState('Upbeat');
  const [songKey, setSongKey] = useState('C Major');
  const [songStyle, setSongStyle] = useState(0.8);
  const [songStability, setSongStability] = useState(0.35);
  const [songSimilarityBoost, setSongSimilarityBoost] = useState(0.6);
  const [songUseSpeakerBoost, setSongUseSpeakerBoost] = useState(true);
  const [songModel, setSongModel] = useState('eleven_multilingual_v2');
  
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isTranscoding, setIsTranscoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showIdentityCheck, setShowIdentityCheck] = useState(false);

  useEffect(() => {
    try {
      const pv = localStorage.getItem('pending_verification');
      setShowIdentityCheck((user && !user.isVerified) || !!pv);
    } catch (e) { /* ignore */ }
  }, [user]);
  
  const [currentAudio, setCurrentAudio] = useState<GeneratedAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [isNegativeMenuOpen, setIsNegativeMenuOpen] = useState(false);
  
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState(false);
  const [isEngineMenuOpen, setIsEngineMenuOpen] = useState(false);
  const [audioList, setAudioList] = useState<GeneratedAudio[]>(audioHistory || []);
  const [listPlayingId, setListPlayingId] = useState<string | null>(null);
  
  const [clonedVoiceData, setClonedVoiceData] = useState<{base64: string, type: string, fileName?: string} | null>(null);
  const [detectedGender, setDetectedGender] = useState<'male' | 'female' | null>(null);

  const mainAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const cloneRefInputRef = useRef<HTMLInputElement>(null);
  const sttInputRef = useRef<HTMLInputElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const voiceMenuRef = useRef<HTMLDivElement>(null);
  const engineMenuRef = useRef<HTMLDivElement>(null);
  const negativeMenuRef = useRef<HTMLDivElement>(null);
  const engineButtonRef = useRef<HTMLButtonElement>(null);
  const langButtonRef = useRef<HTMLButtonElement>(null);
  const voiceButtonRef = useRef<HTMLButtonElement>(null);
  const enginePortalRef = useRef<HTMLDivElement>(null);
  const langPortalRef = useRef<HTMLDivElement>(null);
  const voicePortalRef = useRef<HTMLDivElement>(null);
  const [engineMenuPosition, setEngineMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [langMenuPosition, setLangMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [voiceMenuPosition, setVoiceMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  const isOutOfCredits = user && user.plan !== 'premium' && user.credits <= 0;
  const MAX_CHARS = 1000;

  // Load persistent work state on mount
  useEffect(() => {
    if (user) {
      getWorkState(user.id, 'tts-generator').then(state => {
        if (state) {
          if (state.mode) setMode(state.mode);
          if (state.text) setText(state.text);
          if (state.negativePrompt) setNegativePrompt(state.negativePrompt);
          if (state.engine) setEngine(state.engine);
          if (state.selectedVoice) setSelectedVoice(state.selectedVoice);
          if (state.selectedLanguage) setSelectedLanguage(state.selectedLanguage);
          if (state.selectedElevenlabsVoice) setSelectedElevenlabsVoice(state.selectedElevenlabsVoice);
          if (state.selectedElevenlabsLanguage) setSelectedElevenlabsLanguage(state.selectedElevenlabsLanguage);
          if (state.songGenre) setSongGenre(state.songGenre);
          if (state.songBpm) setSongBpm(state.songBpm);
          if (state.songMood) setSongMood(state.songMood);
          if (state.songKey) setSongKey(state.songKey);
          if (state.songStyle !== undefined) setSongStyle(state.songStyle);
          if (state.songStability !== undefined) setSongStability(state.songStability);
          if (state.songSimilarityBoost !== undefined) setSongSimilarityBoost(state.songSimilarityBoost);
          if (state.songUseSpeakerBoost !== undefined) setSongUseSpeakerBoost(state.songUseSpeakerBoost);
          if (state.songModel) setSongModel(state.songModel);
        }
      });
    }
  }, [user]);

  // Persist work state on change
  useEffect(() => {
    if (user) {
      const timeoutId = setTimeout(() => {
        saveWorkState(user.id, 'tts-generator', {
          mode,
          text,
          negativePrompt,
          engine,
          selectedVoice,
          selectedLanguage,
          selectedElevenlabsVoice,
          selectedElevenlabsLanguage,
          songGenre,
          songBpm,
          songMood,
          songKey,
          songStyle,
          songStability,
          songSimilarityBoost,
          songUseSpeakerBoost,
          songModel
        });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, mode, text, negativePrompt, engine, selectedVoice, selectedLanguage, selectedElevenlabsVoice, selectedElevenlabsLanguage, songGenre, songBpm, songMood, songKey, songStyle, songStability, songSimilarityBoost, songUseSpeakerBoost, songModel]);

  // Auto-play audio when generated
  useEffect(() => {
    if (currentAudio && mainAudioRef.current) {
      console.log('🎵 New audio generated, attempting auto-play');
      const playPromise = mainAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Audio auto-play started successfully');
          })
          .catch((error) => {
            console.warn('⚠️ Auto-play failed (browser may require user interaction):', error);
            // This is expected in some browsers - user needs to click play button
          });
      }
    }
  }, [currentAudio]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isEngineMenuOpen) return;

    const updatePosition = () => {
      if (!engineButtonRef.current) return;
      const rect = engineButtonRef.current.getBoundingClientRect();
      const margin = 8;
      const width = rect.width;
      const maxLeft = window.innerWidth - width - margin;
      const left = Math.max(margin, Math.min(rect.left, maxLeft));
      setEngineMenuPosition({ top: rect.bottom + margin, left, width });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isEngineMenuOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isLangMenuOpen) return;

    const updatePosition = () => {
      if (!langButtonRef.current) return;
      const rect = langButtonRef.current.getBoundingClientRect();
      const margin = 8;
      const width = rect.width;
      const maxLeft = window.innerWidth - width - margin;
      const left = Math.max(margin, Math.min(rect.left, maxLeft));
      setLangMenuPosition({ top: rect.bottom + margin, left, width });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isLangMenuOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isVoiceMenuOpen) return;

    const updatePosition = () => {
      if (!voiceButtonRef.current) return;
      const rect = voiceButtonRef.current.getBoundingClientRect();
      const margin = 8;
      const width = rect.width;
      const maxLeft = window.innerWidth - width - margin;
      const left = Math.max(margin, Math.min(rect.left, maxLeft));
      setVoiceMenuPosition({ top: rect.bottom + margin, left, width });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isVoiceMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (langMenuRef.current && !langMenuRef.current.contains(target) && (!langPortalRef.current || !langPortalRef.current.contains(target))) setIsLangMenuOpen(false);
      if (voiceMenuRef.current && !voiceMenuRef.current.contains(target) && (!voicePortalRef.current || !voicePortalRef.current.contains(target))) setIsVoiceMenuOpen(false);
      if (engineMenuRef.current && !engineMenuRef.current.contains(target) && (!enginePortalRef.current || !enginePortalRef.current.contains(target))) setIsEngineMenuOpen(false);
      if (negativeMenuRef.current && !negativeMenuRef.current.contains(target)) setIsNegativeMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load recent audios from Firebase on mount
  useEffect(() => {
    (async () => {
      try {
        if (!user?.id) return;
        const auds = await getAudioFromFirebase(user.id);
        if (auds?.length) setAudioList(auds);
      } catch (e) { /* noop */ }
    })();
  }, [user?.id]);

  const handleEnhance = async () => {
    if (!text.trim()) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(text, "audio narration");
      setText(enhanced.slice(0, MAX_CHARS));
    } catch (e) { console.error(e); }
    finally { setIsEnhancing(false); }
  };

  const handleNegativePromptSelect = (prompt: string) => {
    setNegativePrompt(prompt);
    setIsNegativeMenuOpen(false);
  };

  const playFromList = async (item: GeneratedAudio) => {
    try {
      setCurrentAudio(item);
      setTimeout(() => {
        if (mainAudioRef.current) {
          mainAudioRef.current.currentTime = 0;
          mainAudioRef.current.play();
        }
      }, 0);
      setListPlayingId(item.id);
    } catch { /* noop */ }
  };

  const deleteFromList = async (id: string) => {
    try {
      if (!user?.id) return;
      await deleteAudioFromFirebase(user.id, id);
      setAudioList(prev => prev.filter(a => a.id !== id));
      if (currentAudio?.id === id) setCurrentAudio(null);
    } catch (e) { console.warn('Failed to delete audio', e); }
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
      let blob: Blob;
      if (engine === 'elevenlabs') {
        blob = await generateSpeechWithElevenLabs(`Speak clearly: ${script}`, voiceId);
      } else {
        blob = await generateSpeechWithGemini(`Speak clearly: ${script}`, voiceId);
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
    }
  };

  const handleMediaImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { setError("Payload too large. Max 20MB."); return; }

    setIsTranscoding(true);
    setError(null);
    try {
      const base64 = await convertBlobToBase64(file);
      if (mode === 'clone') {
        setClonedVoiceData({ base64, type: file.type, fileName: file.name });
        const personaId = await detectVoiceProfile(base64, file.type);
        setDetectedGender(personaId === 'Fenrir' ? 'male' : 'female');
      } else if (mode === 'stt') {
        const transcript = await transcribeMedia(base64, file.type);
        setText(transcript.slice(0, MAX_CHARS));
      }
    } catch (err: any) {
      setError("Neural handshake failed.");
    } finally {
      setIsTranscoding(false);
      if (cloneRefInputRef.current) cloneRefInputRef.current.value = '';
      if (sttInputRef.current) sttInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    // Guest gating: require signup/login before generation
    if (!user) { onUpgradeRequired(); return; }
    if (isOutOfCredits) { onUpgradeRequired(); return; }
    if (!text.trim()) { setError("Input script required."); return; }
    if (mode === 'clone' && !clonedVoiceData) { setError("Reference voice required."); return; }
    if (mode === 'song' && engine !== 'elevenlabs') { setError('Create Song requires ElevenLabs engine.'); return; }

    setIsSynthesizing(true);
    setError(null);
    try {
      const baseScript = text.trim();
      const cleanNegative = negativePrompt.trim();
      const requestScript = cleanNegative ? `${baseScript}\nAvoid: ${cleanNegative}` : baseScript;
      let displayScript = baseScript;
      let lyrics = '';
      let blob: Blob;
      if (mode === 'clone' && clonedVoiceData) {
        if (engine === 'elevenlabs') {
          blob = await generateClonedSpeechWithElevenLabs(requestScript, clonedVoiceData.base64, clonedVoiceData.type);
        } else {
          blob = await generateClonedSpeechWithGemini(requestScript, clonedVoiceData.base64, clonedVoiceData.type);
        }
      } else if (mode === 'song') {
        const voice = selectedElevenlabsVoice;
        // Convert the user's prompt into structured song lyrics (verses + chorus)
        const baseLyrics = text.trim();
        lyrics = await enhancePrompt(baseLyrics || 'Write emotive, concise song lyrics with verse and chorus about hope.', 'songwriting - produce structured verses and chorus as PURE LYRICS (no instructions)');
        const singingPrompt = `Sing in ${songGenre} style, ${songMood} mood, key ${songKey}, tempo ${songBpm} BPM. Lyrics: "${lyrics}"${cleanNegative ? `. Avoid: ${cleanNegative}` : ''}`;
        blob = await generateSpeechWithElevenLabs(singingPrompt, voice, {
          model_id: songModel,
          voice_settings: {
            style: songStyle,
            stability: songStability,
            similarity_boost: songSimilarityBoost,
            use_speaker_boost: songUseSpeakerBoost,
          },
        });
        displayScript = lyrics;
      } else {
        if (engine === 'elevenlabs') {
          const voice = selectedElevenlabsVoice;
          blob = await generateSpeechWithElevenLabs(requestScript, voice);
        } else {
          const lang = LANGUAGES.find(l => l.id === selectedLanguage);
          const prompt = `Directorial Note: Speak in ${lang?.label}. Content: "${requestScript}"`;
          blob = await generateSpeechWithGemini(prompt, selectedVoice);
        }
      }

      const base64 = await convertBlobToBase64(blob);
      const url = `data:${blob.type || 'audio/mpeg'};base64,${base64}`;
      
      console.log('🎵 Audio generated successfully:', {
        blobSize: blob.size,
        blobType: blob.type,
        urlLength: url.length,
        base64Length: base64.length
      });
      
      const voiceLabel = engine === 'elevenlabs' 
        ? (mode === 'clone' ? `Clone (${detectedGender})` : (mode === 'song' ? `${selectedElevenlabsVoice} (Song)` : selectedElevenlabsVoice))
        : (mode === 'clone' ? `Clone (${detectedGender})` : selectedVoice);
      
      const newAudio: GeneratedAudio = {
        id: Date.now().toString(),
        url,
        text: displayScript,
        voice: voiceLabel,
        createdAt: Date.now(),
        blob,
        base64Audio: url,
        isCloned: mode === 'clone',
        engine,
        mimeType: blob.type || 'audio/mpeg'
      };

      console.log('🎵 Setting current audio and adding to list');
      setCurrentAudio(newAudio);
      setAudioList(prev => [newAudio, ...prev].slice(0, 20));
      
      console.log('🎵 Calling onAudioGenerated callback');
      onAudioGenerated(newAudio);
      
      // Save to Firebase if user is logged in
      if (user?.id) {
        try {
          console.log('🎵 Saving audio to Firebase for user:', user.id);
          await saveAudioToFirebase(newAudio, user.id);
          console.log('✅ Audio saved to Firebase successfully');
        } catch (err) {
          console.error('❌ Failed to save audio to Firebase:', err);
          // Continue anyway - audio is still playable
        }
      }
      
      console.log('✅ Audio generation complete!');
      onCreditUsed();
    } catch (e: any) {
      setError(e.message || "Synthesis failure.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const currentLang = engine === 'elevenlabs' 
    ? ELEVENLABS_LANGUAGES.find(l => l.id === selectedElevenlabsLanguage)
    : LANGUAGES.find(l => l.id === selectedLanguage);
  const currentVoice = engine === 'elevenlabs'
    ? ELEVENLABS_VOICES.find(v => v.id === selectedElevenlabsVoice)
    : VOICES.find(v => v.id === selectedVoice);
  const currentVoiceList = engine === 'elevenlabs' ? ELEVENLABS_VOICES : VOICES;
  const currentLanguageList = engine === 'elevenlabs' ? ELEVENLABS_LANGUAGES : LANGUAGES;

  const engineMenuPortal = (isEngineMenuOpen && engineMenuPosition && typeof document !== 'undefined') ? createPortal(
    <div
      ref={enginePortalRef}
      className="fixed z-[12000] bg-dark-900 border border-white/10 rounded-xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.55)] max-h-[70vh] overflow-y-auto animate-scale-in"
      style={{
        top: engineMenuPosition.top,
        left: engineMenuPosition.left,
        width: engineMenuPosition.width,
        maxWidth: 'calc(100vw - 16px)',
      }}
    >
      <button 
        onClick={() => { setEngine('gemini'); setIsEngineMenuOpen(false); }}
        className={`w-full text-left flex items-center justify-between px-4 py-3 text-[10px] font-bold border-b border-white/5 transition-all ${engine === 'gemini' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
      >
        <div className="flex items-center gap-2"><Zap className="w-3.5 h-3.5" /><span>GEMINI ENGINE</span></div>
        {engine === 'gemini' && <Check className="w-3 h-3 flex-shrink-0" />}
      </button>
      <button 
        onClick={() => { setEngine('elevenlabs'); setIsEngineMenuOpen(false); }}
        className={`w-full text-left flex items-center justify-between px-4 py-3 text-[10px] font-bold transition-all ${engine === 'elevenlabs' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
      >
        <div className="flex items-center gap-2"><Zap className="w-3.5 h-3.5" /><span>ELEVENLABS ENGINE</span></div>
        {engine === 'elevenlabs' && <Check className="w-3 h-3 flex-shrink-0" />}
      </button>
    </div>,
    document.body
  ) : null;

  const langMenuPortal = (isLangMenuOpen && langMenuPosition && typeof document !== 'undefined') ? createPortal(
    <div
      ref={langPortalRef}
      className="fixed z-[12000] bg-dark-900 border border-white/10 rounded-xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.55)] max-h-[70vh] overflow-y-auto animate-scale-in"
      style={{
        top: langMenuPosition.top,
        left: langMenuPosition.left,
        width: langMenuPosition.width,
        maxWidth: 'calc(100vw - 16px)',
      }}
    >
      {currentLanguageList.map(l => (
        <button key={l.id} onClick={() => { 
          if (engine === 'elevenlabs') {
            setSelectedElevenlabsLanguage(l.id); 
          } else {
            setSelectedLanguage(l.id); 
          }
          setIsLangMenuOpen(false); 
        }} className={`w-full flex items-center justify-between px-4 py-3 text-[10px] font-bold transition-all ${(engine === 'elevenlabs' ? selectedElevenlabsLanguage : selectedLanguage) === l.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 border-b border-white/5 last:border-none'}`}>
          <div className="flex items-center gap-2"><span>{l.flag}</span><span>{l.label}</span></div>
          {(engine === 'elevenlabs' ? selectedElevenlabsLanguage : selectedLanguage) === l.id && <Check className="w-3 h-3" />}
        </button>
      ))}
    </div>,
    document.body
  ) : null;

  const voiceMenuPortal = (isVoiceMenuOpen && voiceMenuPosition && typeof document !== 'undefined') ? createPortal(
    <div
      ref={voicePortalRef}
      className="fixed z-[12000] bg-dark-900 border border-white/10 rounded-xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.55)] max-h-[70vh] overflow-y-auto animate-scale-in"
      style={{
        top: voiceMenuPosition.top,
        left: voiceMenuPosition.left,
        width: voiceMenuPosition.width,
        maxWidth: 'calc(100vw - 16px)',
      }}
    >
      {currentVoiceList.map(v => (
        <div key={v.id} className="relative group/voice-item border-b border-white/5 last:border-none">
          <button onClick={() => { 
            if (engine === 'elevenlabs') {
              setSelectedElevenlabsVoice(v.id); 
            } else {
              setSelectedVoice(v.id); 
            }
            setIsVoiceMenuOpen(false); 
          }} className={`w-full flex flex-col items-start px-4 py-3 text-[10px] transition-all ${(engine === 'elevenlabs' ? selectedElevenlabsVoice : selectedVoice) === v.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
            <div className="flex justify-between w-full mb-0.5"><span className="font-black uppercase">{v.label}</span><span className="text-[8px] opacity-50">{v.gender}</span></div>
            <p className={`text-[8px] italic truncate w-full ${(engine === 'elevenlabs' ? selectedElevenlabsVoice : selectedVoice) === v.id ? 'text-indigo-200' : 'text-gray-600'}`}>{v.desc}</p>
          </button>
          <button onClick={(e) => { e.stopPropagation(); playVoicePreview(v.id); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/40 text-white opacity-0 group-hover/voice-item:opacity-100 transition-opacity hover:bg-indigo-500">
            {playingVoiceId === v.id ? <Pause className="w-3 h-3" /> : (loadingVoiceId === v.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />)}
          </button>
        </div>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-12 flex flex-col items-center pt-20 md:pt-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full justify-center">
        
        {/* CONTROL SIDEBAR */}
        <div className="lg:col-span-5 space-y-6 w-full max-w-4xl mx-auto relative md:z-20">
          <div className="bg-dark-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-visible">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/5 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-xl">
                  <Mic2 className="w-6 h-6 text-white" />
                </div>
                Ai Voice & Audio
              </h2>
              {user && (
                <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${isOutOfCredits ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400'}`}>
                   {user.plan === 'premium' ? 'UNLIMITED' : `${user.credits} Credits`}
                </div>
              )}
            </div>

              <div className="flex bg-black p-1.5 rounded-[1.2rem] mb-8 border border-white/5 relative z-[1000] w-full overflow-hidden">
              <button onClick={() => setMode('narrator')} className={`flex-1 py-3.5 px-2 rounded-[0.8rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'narrator' ? 'bg-[#4f46e5] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>TEXT TO SPEECH</button>
              <button onClick={() => setMode('clone')} className={`flex-1 py-3.5 px-2 rounded-[0.8rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'clone' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}><Scissors className="w-3.5 h-3.5" /> CLONE VOICE</button>
              <button onClick={() => setMode('stt')} className={`flex-1 py-3.5 px-2 rounded-[0.8rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'stt' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}><FileText className="w-3.5 h-3.5" /> SPEECH TO TEXT</button>
                <button onClick={() => setMode('song')} className={`flex-1 py-3.5 px-2 rounded-[0.8rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'song' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}><Music className="w-3.5 h-3.5" /> CREATE SONG</button>
            </div>
              {mode === 'song' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Engine must be ElevenLabs */}
                  <div className="p-4 bg-purple-600/10 border border-purple-500/20 rounded-xl text-[10px] text-purple-300 font-black uppercase tracking-widest">
                    Uses ElevenLabs TTS with singing-style parameters
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Genre */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Genre</label>
                      <select value={songGenre} onChange={(e) => setSongGenre(e.target.value)} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white">
                        {['Pop','Hip-Hop','EDM','Rock','Ballad','Jazz','Arabic Pop','Classical'].map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    {/* BPM */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Tempo (BPM)</label>
                      <input type="number" min={60} max={180} value={songBpm} onChange={(e) => setSongBpm(Number(e.target.value))} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white" />
                    </div>
                    {/* Mood */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Mood</label>
                      <select value={songMood} onChange={(e) => setSongMood(e.target.value)} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white">
                        {['Upbeat','Melancholic','Romantic','Epic','Calm','Aggressive'].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    {/* Key */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Key</label>
                      <select value={songKey} onChange={(e) => setSongKey(e.target.value)} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white">
                        {['C Major','G Major','D Minor','A Minor','E Major','F# Minor'].map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* ElevenLabs voice settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Style</label>
                      <input type="range" min={0} max={1} step={0.05} value={songStyle} onChange={(e) => setSongStyle(Number(e.target.value))} className="w-full" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Stability</label>
                      <input type="range" min={0} max={1} step={0.05} value={songStability} onChange={(e) => setSongStability(Number(e.target.value))} className="w-full" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Similarity Boost</label>
                      <input type="range" min={0} max={1} step={0.05} value={songSimilarityBoost} onChange={(e) => setSongSimilarityBoost(Number(e.target.value))} className="w-full" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Speaker Boost</label>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setSongUseSpeakerBoost(!songUseSpeakerBoost)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase border ${songUseSpeakerBoost ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-transparent text-gray-500 border-white/10'}`}>{songUseSpeakerBoost ? 'ON' : 'OFF'}</button>
                        <span className="text-[9px] text-gray-500">{songUseSpeakerBoost ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Model selection */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Model</label>
                    <select value={songModel} onChange={(e) => setSongModel(e.target.value)} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white">
                      {['eleven_multilingual_v2','eleven_monolingual_v1'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              )}

            {/* Engine Selector */}
            {mode === 'narrator' && (
              <div className="mb-6 relative z-[1000]" ref={engineMenuRef}>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Select Engine</label>
                <button 
                  ref={engineButtonRef}
                  type="button"
                  onClick={() => setIsEngineMenuOpen(!isEngineMenuOpen)} 
                  className="w-full flex items-center justify-between px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Zap className={`w-3.5 h-3.5 ${engine === 'gemini' ? 'text-blue-400' : 'text-purple-400'}`} />
                    <span className="truncate">{engine === 'gemini' ? 'GEMINI ENGINE' : 'ELEVENLABS ENGINE'}</span>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform flex-shrink-0 ${isEngineMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {engineMenuPortal}
              </div>
            )}

            <div className="space-y-6 relative z-10">
              {mode === 'narrator' && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  {/* Language Selector */}
                  <div className="space-y-2 relative z-[1000]" ref={langMenuRef}>
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Language</label>
                    <button 
                      ref={langButtonRef}
                      onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} 
                      className="w-full flex items-center justify-between px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-2 truncate"><Globe className="w-3.5 h-3.5 text-indigo-400" /><span className="truncate">{currentLang?.label}</span></div>
                      <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {langMenuPortal}
                  </div>
                  {/* Voice Selector */}
                  <div className="space-y-2 relative z-[1000]" ref={voiceMenuRef}>
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Narrator</label>
                    <button 
                      ref={voiceButtonRef}
                      onClick={() => setIsVoiceMenuOpen(!isVoiceMenuOpen)} 
                      className="w-full flex items-center justify-between px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-2 truncate"><UserIcon className={`w-3.5 h-3.5 text-${currentVoice?.color}-400`} /><span className="truncate">{currentVoice?.label}</span></div>
                      <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isVoiceMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {voiceMenuPortal}
                  </div>
                </div>
              )}

              {mode === 'clone' && (
                <div className="space-y-4 animate-fade-in">
                   <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Identity Anchor (Audio Reference)</label>
                   <div onClick={() => !isTranscoding && cloneRefInputRef.current?.click()} className="p-10 bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-pink-600/5 hover:border-pink-500/30 transition-all group">
                      <input type="file" ref={cloneRefInputRef} onChange={handleMediaImport} className="hidden" accept="audio/*" />
                      {isTranscoding ? <RefreshCw className="w-8 h-8 text-pink-400 animate-spin" /> : clonedVoiceData ? (
                        <div className="text-center">
                          <FileAudio className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                          <p className="text-[10px] font-bold text-white uppercase truncate max-w-[200px]">{clonedVoiceData.fileName}</p>
                          <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Detected: {detectedGender} profile</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-pink-500 group-hover:scale-110 transition-transform mb-3" />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Import Reference Voice</p>
                        </>
                      )}
                   </div>
                </div>
              )}

              {mode === 'stt' && (
                <div className="space-y-4 animate-fade-in">
                   <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Import Media Source</label>
                   <div onClick={() => !isTranscoding && sttInputRef.current?.click()} className="aspect-video bg-black/40 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-600/5 hover:border-emerald-500/30 transition-all group">
                      <input type="file" ref={sttInputRef} onChange={handleMediaImport} className="hidden" accept="audio/*,video/*" />
                      {isTranscoding ? <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mx-auto" /> : (
                        <>
                          <Upload className="w-8 h-8 text-emerald-500 group-hover:scale-110 transition-transform mb-4" />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upload Audio or Video</p>
                        </>
                      )}
                   </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-indigo-500" /> {mode === 'stt' ? 'Transcription Result' : 'Directorial Script'}
                  </label>
                  {mode !== 'stt' && (
                    <button onClick={handleEnhance} disabled={isEnhancing || !text.trim()} className="text-[10px] font-bold text-indigo-400 hover:text-white flex items-center gap-1.5 disabled:opacity-30">
                      <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} /> Optimize
                    </button>
                  )}
                  {mode === 'stt' && text && (
                    <button onClick={() => { navigator.clipboard.writeText(text); alert('Copied!'); }} className="text-[10px] font-bold text-emerald-400 hover:text-white flex items-center gap-1.5">
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                  )}
                </div>
                <textarea 
                  value={text} onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                  placeholder={mode === 'stt' ? "Awaiting media input for neural extraction..." : "Initialize synthesis script..."}
                  className="w-full h-44 bg-black/40 border border-white/10 rounded-2xl p-6 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none disabled:opacity-50 transition-all custom-scrollbar"
                />
                {mode !== 'stt' && (
                  <div className="animate-fade-in bg-black/30 border border-white/10 rounded-2xl p-4 space-y-2" ref={negativeMenuRef}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <ThumbsDown className="w-3.5 h-3.5 text-pink-400" /> Negative Prompt
                        </p>
                        <p className="text-[9px] text-gray-600 uppercase tracking-widest">Guide all voice engines on what to avoid</p>
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
                            type="button"
                            onClick={() => setIsNegativeMenuOpen(!isNegativeMenuOpen)}
                            className="px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white flex items-center gap-2 hover:border-white/20"
                          >
                            Presets
                            <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isNegativeMenuOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isNegativeMenuOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-dark-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in">
                              {NEGATIVE_PRESETS.map(p => (
                                <button
                                  key={p}
                                  onClick={() => handleNegativePromptSelect(p)}
                                  className="w-full text-left px-4 py-3 text-[10px] font-bold text-gray-300 hover:bg-white/5 border-b border-white/5 last:border-none"
                                >
                                  {p}
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
                      placeholder="background noise, distortion, static"
                      className="w-full h-16 bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-pink-500/30 outline-none resize-none custom-scrollbar"
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center gap-3 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-[9px] text-red-400 font-black uppercase">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate} 
                disabled={isSynthesizing || isTranscoding || mode === 'stt' || showIdentityCheck}
                className={`w-full h-[68px] rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-2 relative overflow-hidden group uppercase tracking-[0.25em] ${isSynthesizing ? 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 text-gray-500 border-gray-700/20 shadow-none cursor-wait' : (showIdentityCheck ? 'bg-gradient-to-r from-white/5 via-white/5 to-white/5 text-white/30 border-white/5 shadow-none cursor-not-allowed' : (mode === 'stt' ? 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 text-gray-500 border-gray-700/20 shadow-none cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-indigo-500 text-white border-indigo-400/20 hover:border-indigo-300/40 shadow-[0_8px_32px_rgba(99,102,241,0.4)] hover:shadow-[0_12px_48px_rgba(99,102,241,0.6)]'))}`}
                title={showIdentityCheck ? 'A verification link was sent to your email. Please confirm your identity to proceed.' : undefined}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-shimmer"></div>
                {isSynthesizing ? <RefreshCw className="w-6 h-6 animate-spin relative z-10" /> : <Zap className="w-6 h-6 fill-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.5)] relative z-10" />}
                <span className="relative z-10">{isSynthesizing ? 'SYNTHESIZING...' : (showIdentityCheck ? 'VERIFY EMAIL FIRST' : (mode === 'song' ? 'CREATE SONG (1 CREDIT)' : 'GENERATE NOW (1 CREDIT)'))}</span>
              </button>

              {/* Recently Generated Section (Sticky) */}
              {(audioList.length > 0 || currentAudio) && mode === 'narrator' && (
                <div className="mt-8 space-y-4 animate-fade-in sticky top-4 z-20">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <History className="w-4 h-4" /> Recently Generated
                    </h4>
                    <span className="text-[9px] font-black text-gray-600 uppercase">{audioList.length} Items</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {audioList.length > 0 ? (
                      audioList.slice(0, 6).map(item => (
                        <div key={item.id} className="group p-4 bg-black/40 border border-white/5 rounded-xl hover:border-indigo-500/30 transition-all cursor-pointer">
                          <div className="flex items-center gap-3">
                            <button onClick={() => playFromList(item)} className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${currentAudio?.id === item.id ? 'bg-indigo-600' : 'bg-white/5 group-hover:bg-white/10'}`}>
                              <Play className="w-5 h-5 text-gray-300" />
                            </button>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-[9px] font-bold text-white uppercase truncate">{item.voice}</p>
                              <p className="text-[8px] text-gray-500 line-clamp-1 italic">"{item.text}"</p>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a 
                                href={item.url} 
                                download={`imaginai-audio-${item.id}.wav`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              {user && (
                                <button onClick={(e) => { e.stopPropagation(); deleteFromList(item.id); }} className="p-2 bg-white/5 hover:bg-red-600/80 rounded-lg text-gray-300 hover:text-white">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : currentAudio ? (
                      <div className="group p-4 bg-black/40 border border-indigo-500/30 rounded-xl cursor-pointer col-span-1 md:col-span-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-600">
                            <PlayCircle className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-[9px] font-bold text-white uppercase truncate">{currentAudio.voice}</p>
                            <p className="text-[8px] text-gray-500 line-clamp-1 italic">"{currentAudio.text}"</p>
                          </div>
                          <a 
                            href={currentAudio.url} 
                            download={`imaginai-audio-${currentAudio.id}.wav`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-all"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* VIEWPORT & HISTORY */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-black/40 border border-white/5 rounded-[3rem] p-2.5 min-h-[50vh] sm:min-h-[60vh] mobile-viewport flex flex-col relative overflow-hidden">
            <div className="flex-1 rounded-[2.5rem] overflow-hidden bg-dark-950 flex flex-col items-center justify-center relative scroll-touch">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-purple-900/5 pointer-events-none" />
               
               {currentAudio ? (
                 <div className="w-full h-full flex flex-col animate-fade-in relative z-10 p-10">
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                       <div className={`w-48 h-48 rounded-full flex items-center justify-center shadow-2xl transition-all duration-700 ${isPlaying ? 'bg-indigo-600 shadow-indigo-600/40' : 'bg-white/5 border border-white/10 opacity-40'}`}>
                          <Headphones className="w-16 h-16 text-white" />
                       </div>
                       <div className="mt-8 text-center space-y-2">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Protocol Rendered</p>
                          <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">Voice Persona: {currentAudio.voice}</h4>
                       </div>
                       <div className="mt-10 flex items-center gap-6">
                          <button onClick={() => isPlaying ? mainAudioRef.current?.pause() : mainAudioRef.current?.play()} className="w-20 h-20 bg-white text-dark-950 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                             {isPlaying ? <Pause className="w-8 h-8 fill-dark-950" /> : <Play className="w-8 h-8 fill-dark-950 ml-1" />}
                          </button>
                          <a href={currentAudio.url} download={`imaginai-audio-${currentAudio.id}.wav`} className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all">
                             <Download className="w-6 h-6" />
                          </a>
                       </div>
                       
                       {/* Seek Bar */}
                       {audioDuration > 0 && (
                         <div className="mt-8 w-full max-w-md">
                           <input 
                             type="range" 
                             min="0" 
                             max={audioDuration} 
                             value={audioProgress} 
                             onChange={(e) => {
                               if (mainAudioRef.current) {
                                 mainAudioRef.current.currentTime = Number(e.target.value);
                               }
                             }}
                             className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                           />
                           <div className="flex justify-between mt-2 text-[9px] font-bold text-gray-500 uppercase">
                             <span>{Math.floor(audioProgress / 60)}:{String(Math.floor(audioProgress % 60)).padStart(2, '0')}</span>
                             <span>{Math.floor(audioDuration / 60)}:{String(Math.floor(audioDuration % 60)).padStart(2, '0')}</span>
                           </div>
                         </div>
                       )}
                       
                       <audio 
                         ref={mainAudioRef} 
                         src={currentAudio.url} 
                         onEnded={() => {
                           console.log('🎵 Audio playback ended');
                           setIsPlaying(false);
                         }} 
                         onPlay={() => {
                           console.log('🎵 Audio playback started');
                           setIsPlaying(true);
                         }} 
                         onPause={() => {
                           console.log('🎵 Audio playback paused');
                           setIsPlaying(false);
                         }}
                         onLoadedMetadata={(e) => {
                           console.log('🎵 Audio metadata loaded, duration:', e.currentTarget.duration);
                           setAudioDuration(e.currentTarget.duration);
                         }}
                         onTimeUpdate={(e) => setAudioProgress(e.currentTarget.currentTime)}
                         onError={(e) => {
                           console.error('❌ Audio playback error:', e);
                           const audioEl = e.currentTarget;
                           console.error('Audio error details:', {
                             error: audioEl.error,
                             code: audioEl.error?.code,
                             message: audioEl.error?.message,
                             src: audioEl.src,
                             currentSrc: audioEl.currentSrc,
                             networkState: audioEl.networkState,
                             readyState: audioEl.readyState
                           });
                         }}
                         onCanPlay={() => console.log('✅ Audio can play')}
                         onCanPlayThrough={() => console.log('✅ Audio can play through')}
                         onLoadStart={() => console.log('🎵 Audio load started')}
                         onLoadedData={() => console.log('🎵 Audio data loaded')}
                         className="hidden" 
                       />
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center px-12 text-center relative z-10">
                    {/* Motion visualization showing prompt-to-audio translation */}
                    <div className="w-full max-w-2xl space-y-8">
                      {/* Prompt Input Visual */}
                      <div className="flex items-center justify-center gap-4 opacity-60">
                        <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Text Prompt</p>
                        </div>
                        <div className="w-12 h-[2px] bg-gradient-to-r from-white/20 to-indigo-500/40" />
                      </div>
                      
                      {/* Animated Audio Bars - The Core Motion Image */}
                      <div className="audio-motion-bars flex items-end justify-center gap-2 h-32 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent border border-white/10 rounded-3xl px-8 py-6 shadow-2xl">
                        <span className="bar bar-1" />
                        <span className="bar bar-2" />
                        <span className="bar bar-3" />
                        <span className="bar bar-4" />
                        <span className="bar bar-5" />
                        <span className="bar bar-6" />
                        <span className="bar bar-7" />
                        <span className="bar bar-8" />
                        <span className="bar bar-9" />
                        <span className="bar bar-10" />
                        <span className="bar bar-11" />
                        <span className="bar bar-12" />
                      </div>
                      
                      {/* Audio Output Visual */}
                      <div className="flex items-center justify-center gap-4 opacity-60">
                        <div className="w-12 h-[2px] bg-gradient-to-r from-indigo-500/40 to-white/20" />
                        <div className="px-6 py-3 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl">
                          <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Generated Audio</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-500 text-[10px] mt-8 max-w-md font-bold uppercase tracking-widest leading-relaxed opacity-40">Generate audio to see your prompt transform into sound waves</p>
                    </div>
                 </div>
               )}
            </div>
          </div>

          {/* RECENT AUDIO HISTORY */}
          {audioList.length > 0 && (
            <div className="bg-dark-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl animate-fade-in">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Recent Projections</h3>
                  </div>
                  <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black text-gray-500 uppercase">{audioList.length} Cycles Stored</div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {audioList.slice(0, 6).map(item => (
                    <div key={item.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center gap-4 group hover:border-indigo-500/30 transition-all">
                       <button 
                        onClick={() => setCurrentAudio(item)}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${currentAudio?.id === item.id ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-500 group-hover:text-indigo-400'}`}
                       >
                         <PlayCircle className="w-6 h-6" />
                       </button>
                       <div className="flex-1 overflow-hidden">
                          <p className="text-[10px] font-black text-white uppercase truncate">{item.voice} Persona</p>
                          <p className="text-[9px] text-gray-600 line-clamp-1 italic">"{item.text}"</p>
                       </div>
                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => playFromList(item)} className="p-2 text-gray-600 hover:text-white"><Play className="w-4 h-4" /></button>
                         <a href={item.url} download className="p-2 text-gray-600 hover:text-white"><Download className="w-4 h-4" /></a>
                         {user && (<button onClick={() => deleteFromList(item.id)} className="p-2 text-gray-600 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>)}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .audio-motion-bars .bar { 
          width: 8px; 
          border-radius: 9999px; 
          background: linear-gradient(180deg, rgba(139, 92, 246, 0.9), rgba(99, 102, 241, 0.7), rgba(79, 70, 229, 0.5)); 
          animation: audioPulse 1.2s ease-in-out infinite;
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
        }
        .audio-motion-bars .bar-1 { height: 25%; animation-delay: 0s; }
        .audio-motion-bars .bar-2 { height: 55%; animation-delay: 0.08s; }
        .audio-motion-bars .bar-3 { height: 80%; animation-delay: 0.16s; }
        .audio-motion-bars .bar-4 { height: 95%; animation-delay: 0.24s; }
        .audio-motion-bars .bar-5 { height: 100%; animation-delay: 0.32s; }
        .audio-motion-bars .bar-6 { height: 90%; animation-delay: 0.4s; }
        .audio-motion-bars .bar-7 { height: 100%; animation-delay: 0.48s; }
        .audio-motion-bars .bar-8 { height: 85%; animation-delay: 0.56s; }
        .audio-motion-bars .bar-9 { height: 70%; animation-delay: 0.64s; }
        .audio-motion-bars .bar-10 { height: 50%; animation-delay: 0.72s; }
        .audio-motion-bars .bar-11 { height: 35%; animation-delay: 0.8s; }
        .audio-motion-bars .bar-12 { height: 20%; animation-delay: 0.88s; }
        @keyframes audioPulse {
          0%, 100% { transform: scaleY(0.7); opacity: 0.5; }
          50% { transform: scaleY(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
