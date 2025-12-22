
import React, { useState, useRef, useEffect } from 'react';
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
import { User, GeneratedAudio } from '../types';
import { saveWorkState, getWorkState } from '../services/dbService';

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

export const TTSGenerator: React.FC<TTSGeneratorProps> = ({ 
  user, onCreditUsed, onUpgradeRequired, onAudioGenerated, audioHistory = [], 
  hasApiKey, onSelectKey, onResetKey 
}) => {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'narrator' | 'clone' | 'stt'>('narrator');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isTranscoding, setIsTranscoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentAudio, setCurrentAudio] = useState<GeneratedAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState(false);
  
  const [clonedVoiceData, setClonedVoiceData] = useState<{base64: string, type: string, fileName?: string} | null>(null);
  const [detectedGender, setDetectedGender] = useState<'male' | 'female' | null>(null);

  const mainAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const cloneRefInputRef = useRef<HTMLInputElement>(null);
  const sttInputRef = useRef<HTMLInputElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const voiceMenuRef = useRef<HTMLDivElement>(null);

  const isOutOfCredits = user && user.plan !== 'premium' && user.credits <= 0;
  const MAX_CHARS = 1000;

  // Load persistent work state on mount
  useEffect(() => {
    if (user) {
      getWorkState(user.id, 'tts-generator').then(state => {
        if (state) {
          if (state.mode) setMode(state.mode);
          if (state.text) setText(state.text);
          if (state.selectedVoice) setSelectedVoice(state.selectedVoice);
          if (state.selectedLanguage) setSelectedLanguage(state.selectedLanguage);
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
          selectedVoice,
          selectedLanguage
        });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, mode, text, selectedVoice, selectedLanguage]);

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
      const blob = await generateSpeechWithGemini(`Speak clearly: ${script}`, voiceId);
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
    if (isOutOfCredits) { onUpgradeRequired(); return; }
    if (!text.trim()) { setError("Input script required."); return; }
    if (mode === 'clone' && !clonedVoiceData) { setError("Reference voice required."); return; }

    setIsSynthesizing(true);
    setError(null);
    try {
      let blob: Blob;
      if (mode === 'clone' && clonedVoiceData) {
        blob = await generateClonedSpeechWithGemini(text, clonedVoiceData.base64, clonedVoiceData.type);
      } else {
        const lang = LANGUAGES.find(l => l.id === selectedLanguage);
        const prompt = `Directorial Note: Speak in ${lang?.label}. Content: "${text}"`;
        blob = await generateSpeechWithGemini(prompt, selectedVoice);
      }

      const url = URL.createObjectURL(blob);
      const newAudio: GeneratedAudio = {
        id: Date.now().toString(),
        url,
        text,
        voice: mode === 'clone' ? `Clone (${detectedGender})` : selectedVoice,
        createdAt: Date.now(),
        blob
      };

      setCurrentAudio(newAudio);
      onAudioGenerated(newAudio);
      onCreditUsed();
    } catch (e: any) {
      setError(e.message || "Synthesis failure.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const currentLang = LANGUAGES.find(l => l.id === selectedLanguage);
  const currentVoice = VOICES.find(v => v.id === selectedVoice);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* CONTROL SIDEBAR */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-dark-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative">
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

            <div className="flex bg-black p-1.5 rounded-[1.2rem] mb-8 border border-white/5 relative z-10 w-full overflow-hidden">
              <button onClick={() => setMode('narrator')} className={`flex-1 py-3.5 px-2 rounded-[0.8rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'narrator' ? 'bg-[#4f46e5] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>TEXT TO SPEECH</button>
              <button onClick={() => setMode('clone')} className={`flex-1 py-3.5 px-2 rounded-[0.8rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'clone' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}><Scissors className="w-3.5 h-3.5" /> CLONE VOICE</button>
              <button onClick={() => setMode('stt')} className={`flex-1 py-3.5 px-2 rounded-[0.8rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'stt' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}><FileText className="w-3.5 h-3.5" /> SPEECH TO TEXT</button>
            </div>

            <div className="space-y-6 relative z-10">
              {mode === 'narrator' && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  {/* Language Selector */}
                  <div className="space-y-2 relative" ref={langMenuRef}>
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Language</label>
                    <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white hover:border-white/20 transition-all">
                      <div className="flex items-center gap-2 truncate"><Globe className="w-3.5 h-3.5 text-indigo-400" /><span className="truncate">{currentLang?.label}</span></div>
                      <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isLangMenuOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-dark-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-scale-in max-h-64 overflow-y-auto no-scrollbar">
                        {LANGUAGES.map(l => (
                          <button key={l.id} onClick={() => { setSelectedLanguage(l.id); setIsLangMenuOpen(false); }} className={`w-full flex items-center justify-between px-4 py-3 text-[10px] font-bold ${selectedLanguage === l.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 border-b border-white/5 last:border-none'}`}>
                            <div className="flex items-center gap-2"><span>{l.flag}</span><span>{l.label}</span></div>
                            {selectedLanguage === l.id && <Check className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Voice Selector */}
                  <div className="space-y-2 relative" ref={voiceMenuRef}>
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Narrator</label>
                    <button onClick={() => setIsVoiceMenuOpen(!isVoiceMenuOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white hover:border-white/20 transition-all">
                      <div className="flex items-center gap-2 truncate"><UserIcon className={`w-3.5 h-3.5 text-${currentVoice?.color}-400`} /><span className="truncate">{currentVoice?.label}</span></div>
                      <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isVoiceMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isVoiceMenuOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-dark-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-scale-in max-h-64 overflow-y-auto no-scrollbar">
                        {VOICES.map(v => (
                          <div key={v.id} className="relative group/voice-item border-b border-white/5 last:border-none">
                            <button onClick={() => { setSelectedVoice(v.id); setIsVoiceMenuOpen(false); }} className={`w-full flex flex-col items-start px-4 py-3 text-[10px] transition-all ${selectedVoice === v.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
                              <div className="flex justify-between w-full mb-0.5"><span className="font-black uppercase">{v.label}</span><span className="text-[8px] opacity-50">{v.gender}</span></div>
                              <p className={`text-[8px] italic truncate w-full ${selectedVoice === v.id ? 'text-indigo-200' : 'text-gray-600'}`}>{v.desc}</p>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); playVoicePreview(v.id); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/40 text-white opacity-0 group-hover/voice-item:opacity-100 transition-opacity hover:bg-indigo-500">
                              {playingVoiceId === v.id ? <Pause className="w-3 h-3" /> : (loadingVoiceId === v.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />)}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
              </div>

              {error && (
                <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center gap-3 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-[9px] text-red-400 font-black uppercase">{error}</p>
                </div>
              )}

              <button 
                onClick={handleGenerate} 
                disabled={isSynthesizing || isTranscoding || mode === 'stt'} 
                className={`w-full py-6 rounded-2xl font-black text-lg flex items-center justify-center gap-4 transition-all shadow-2xl transform active:scale-[0.98] ${isSynthesizing ? 'bg-gray-800 text-gray-600' : mode === 'stt' ? 'bg-gray-900 text-gray-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
              >
                {isSynthesizing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 fill-white" />}
                <span className="uppercase tracking-[0.2em] italic">{isSynthesizing ? 'Synthesizing...' : 'GENERATE NOW (1 CREDIT)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* VIEWPORT & HISTORY */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-black/40 border border-white/5 rounded-[3rem] p-2.5 min-h-[450px] flex flex-col relative overflow-hidden">
            <div className="flex-1 rounded-[2.5rem] overflow-hidden bg-dark-950 flex flex-col items-center justify-center relative">
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
                       <audio ref={mainAudioRef} src={currentAudio.url} onEnded={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} className="hidden" />
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center opacity-20 px-12 text-center relative z-10">
                    <Music className="w-14 h-14 text-gray-700 mb-8" />
                    <h3 className="text-3xl font-black uppercase tracking-[0.4em] text-white italic">Audio Viewport</h3>
                    <p className="text-gray-500 text-xs mt-4 max-w-xs font-bold uppercase tracking-widest leading-relaxed">Initialize neural production parameters to populate visualizer.</p>
                 </div>
               )}
            </div>
          </div>

          {/* RECENT AUDIO HISTORY */}
          {audioHistory.length > 0 && (
            <div className="bg-dark-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl animate-fade-in">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Recent Projections</h3>
                  </div>
                  <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black text-gray-500 uppercase">{audioHistory.length} Cycles Stored</div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {audioHistory.slice(0, 4).map(item => (
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
                       <a href={item.url} download className="p-2 text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                         <Download className="w-4 h-4" />
                       </a>
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
      `}</style>
    </div>
  );
};
