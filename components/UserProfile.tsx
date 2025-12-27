
import React, { useState, useRef, useEffect } from 'react';
import { 
  User, Mail, LogOut, ArrowLeft, Shield, 
  Calendar, Edit2, Save, X, Check, Lock, Camera, 
  Upload, RefreshCw, ShieldCheck, AlertCircle, Zap,
  Database, Download, Trash2, Activity,
  Image as ImageIcon, Video as VideoIcon, Mic2, Play, Pause, Headphones,
  FileText, Scissors, FileAudio, Bell, Inbox, CreditCard, Languages, ChevronDown, Crown,
  Sun, Moon
} from 'lucide-react';
import { User as UserType, GeneratedImage, GeneratedVideo, GeneratedAudio, SystemMessage, SupportSession } from '../types';
import { convertBlobToBase64 } from '../services/geminiService';
import { deleteAssetFromDB } from '../services/dbService';
import {
  getImagesFromFirebase as fetchImagesFromFirebase,
  getVideosFromFirebase as fetchVideosFromFirebase,
  getAudioFromFirebase as fetchAudioFromFirebase,
  getLiveGenerations,
  getGenerationAnalytics
} from '../services/firebase';
import { useLanguage } from '../utils/i18n';

interface UserProfileProps {
  user: UserType;
  gallery: GeneratedImage[];
  videoGallery?: GeneratedVideo[];
  audioGallery?: GeneratedAudio[];
  onLogout: () => void;
  onBack: () => void;
  onUpdateUser: (user: UserType) => void;
  onGalleryImport: (images: GeneratedImage[]) => void;
   onNavigate?: (page: string) => void;
  initialContactOpen?: boolean;
  initialInboxOpen?: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  user, gallery, videoGallery = [], audioGallery = [], 
  onLogout, onBack, onUpdateUser, onNavigate, initialContactOpen, initialInboxOpen,
  theme, onToggleTheme
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'messages' | 'history' | 'live'>(initialInboxOpen ? 'messages' : 'profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl
  });

  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});
  const [audioDuration, setAudioDuration] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isContactSending, setIsContactSending] = useState(false);
  const [supportSessions, setSupportSessions] = useState<SupportSession[]>([]);
  const [activeSupportId, setActiveSupportId] = useState<string | null>(null);
  const [supportReply, setSupportReply] = useState('');

  const [images, setImages] = useState<GeneratedImage[]>(gallery || []);
  const [videos, setVideos] = useState<GeneratedVideo[]>(videoGallery || []);
  const [audios, setAudios] = useState<GeneratedAudio[]>(audioGallery || []);

  // Live Generations state
  const [liveGenerations, setLiveGenerations] = useState<any[]>([]);
  const [generationAnalytics, setGenerationAnalytics] = useState<any>(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [liveRefreshInterval, setLiveRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const unreadCount = user.messages?.filter(m => !m.isRead).length || 0;
  const isLight = theme === 'light';

  useEffect(() => {
    if (initialContactOpen) setIsContactOpen(true);
  }, [initialContactOpen]);

  useEffect(() => {
    // Sync local state with incoming props when user changes
    setImages(gallery || []);
    setVideos(videoGallery || []);
    setAudios(audioGallery || []);
  }, [gallery, videoGallery, audioGallery, user?.id]);

  useEffect(() => {
    const mergeUnique = <T extends { id: string }>(primary: T[], fallback: T[]) => {
      const map = new Map<string, T>();
      primary.forEach(item => map.set(item.id, item));
      fallback.forEach(item => { if (!map.has(item.id)) map.set(item.id, item); });
      return Array.from(map.values());
    };

    const fetchGallery = async () => {
      if (!user?.id) return;
      try {
        const [fbImages, fbVideos, fbAudios] = await Promise.all([
          fetchImagesFromFirebase(user.id),
          fetchVideosFromFirebase(user.id),
          fetchAudioFromFirebase(user.id)
        ]);
        setImages(mergeUnique(fbImages, gallery || []));
        setVideos(mergeUnique(fbVideos, videoGallery || []));
        setAudios(mergeUnique(fbAudios, audioGallery || []));
      } catch (e) {
        console.warn('Failed to load gallery from Firebase', e);
      }
    };

    fetchGallery();
  }, [user?.id]);

  // Fetch live generations
  const fetchLiveGenerations = async () => {
    setLoadingLive(true);
    try {
      const [generations, analytics] = await Promise.all([
        getLiveGenerations(),
        getGenerationAnalytics(7)
      ]);
      setLiveGenerations(generations);
      setGenerationAnalytics(analytics);
    } catch (e) {
      console.warn('Failed to load live generations', e);
    } finally {
      setLoadingLive(false);
    }
  };

  // Auto-refresh live generations when on live tab
  useEffect(() => {
    if (activeTab === 'live') {
      fetchLiveGenerations();
      // Refresh every 5 seconds
      const interval = setInterval(fetchLiveGenerations, 5000);
      setLiveRefreshInterval(interval);
      return () => {
        clearInterval(interval);
        setLiveRefreshInterval(null);
      };
    } else {
      if (liveRefreshInterval) {
        clearInterval(liveRefreshInterval);
        setLiveRefreshInterval(null);
      }
    }
  }, [activeTab]);

  // UI derived values
  const planGradient = user.plan === 'premium' 
    ? 'from-amber-500/30 to-pink-500/30' 
    : 'from-indigo-500/30 to-purple-500/30';
  const planTextColor = user.plan === 'premium' ? 'text-amber-300' : 'text-indigo-300';
  const joinedDate = new Date(user.joinedAt || Date.now()).toLocaleDateString();
  const baseName = (user.name || '').toLowerCase() === 'creator' ? '' : user.name;
  let completeness = 0;
  if (user.avatarUrl) completeness += 40;
  if (baseName) completeness += 35;
  if (user.email) completeness += 25;
  if (completeness > 100) completeness = 100;

  const handlePlayAudio = (url: string, id: string) => {
    if (playingAudioId === id) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const newAudio = new Audio(url);
      audioRef.current = newAudio;
      
      newAudio.onloadedmetadata = () => {
        setAudioDuration(prev => ({ ...prev, [id]: newAudio.duration }));
      };
      
      newAudio.ontimeupdate = () => {
        setAudioProgress(prev => ({ ...prev, [id]: newAudio.currentTime }));
      };
      
      newAudio.onended = () => setPlayingAudioId(null);
      newAudio.play();
      setPlayingAudioId(id);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        if (!user?.id) return;
        const { getSupportSessionsForUser } = await import('../services/dbService');
        const sessions = await getSupportSessionsForUser(user.id);
        setSupportSessions(sessions);
      } catch (e) {
        /* noop */
      }
    })();
  }, [user?.id]);

  const handleOpenSupport = async (sessionId: string) => {
    try {
      const { getChatHistory } = await import('../services/dbService');
      const history = await getChatHistory(sessionId);
      setSupportSessions(prev => prev.map(s => s.id === sessionId ? { ...s, chatHistory: history } : s));
      setActiveSupportId(sessionId);
    } catch (e) {}
  };

  const handleSendSupportReply = async () => {
    if (!activeSupportId || !supportReply.trim()) return;
    try {
      const { sendSupportChatMessage } = await import('../services/dbService');
      await sendSupportChatMessage(activeSupportId, supportReply.trim(), 'user');
      setSupportReply('');
      // Refresh chat
      const { getChatHistory } = await import('../services/dbService');
      const history = await getChatHistory(activeSupportId);
      setSupportSessions(prev => prev.map(s => s.id === activeSupportId ? { ...s, chatHistory: history } : s));
    } catch (e) { alert('Failed to send reply'); }
  };
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateUser({ ...user, name: formData.name, email: formData.email, avatarUrl: formData.avatarUrl });
      setIsEditing(false);
    } catch (e) {
      console.error("Update failed", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePurgeAsset = async (id: string) => {
    if (window.confirm("Purge this creation from the neural vault? This action is permanent.")) {
      try {
        await deleteAssetFromDB(id);
        window.location.reload();
      } catch (e) {
        alert("Purge sequence failed.");
      }
    }
  };

  const handleSendContact = async () => {
    if (!contactMessage.trim()) { alert('Please enter a message.'); return; }
    setIsContactSending(true);
    try {
      const { contactAdmin } = await import('../services/dbService');
      await contactAdmin(user.name, user.email, user.id, contactSubject.trim(), contactMessage.trim());
      setIsContactOpen(false);
      setContactSubject('');
      setContactMessage('');
      alert('Message sent to admin. We will get back to you shortly.');
    } catch (e) {
      alert('Failed to send message. Please try again later.');
    } finally {
      setIsContactSending(false);
    }
  };

  // Compile a unified history stream
  const historyStream = [
    ...images.map(i => ({ ...i, type: 'image' as const, label: 'Visual Synthesis', icon: ImageIcon, color: 'text-indigo-400' })),
    ...videos.map(v => ({ ...v, type: 'video' as const, label: 'Temporal Projection', icon: VideoIcon, color: 'text-purple-400' })),
    ...audios.map(a => ({ 
      ...a, 
      type: 'audio' as const, 
      prompt: a.text, 
      label: a.voice.includes('STT') ? 'Neural Transcription' : 'Voice Synthesis', 
      icon: a.voice.includes('STT') ? FileText : Mic2,
      color: a.voice.includes('STT') ? 'text-emerald-400' : 'text-pink-400'
    }))
  ].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
      <div className="flex items-center justify-between mb-12 gap-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
        >
          <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-medium uppercase tracking-widest text-[10px] font-black">{t('profile.backToStation')}</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-gray-200 transition-all"
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            {isLight ? 'Dark Mode' : 'Light Mode'}
          </button>

          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
             {[
               { id: 'profile', icon: User, label: t('tabs.profile') },
               { id: 'live', icon: Activity, label: 'Generations Live' },
               { id: 'history', icon: Database, label: t('tabs.history') },
               { id: 'messages', icon: Mail, label: t('tabs.inbox'), badge: unreadCount },
             ].map(tab => (
               <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-gray-500 hover:text-white'}`}
               >
                 <tab.icon className="w-4 h-4" />
                 {tab.label}
                 {tab.badge && tab.badge > 0 ? (
                   <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-dark-950">
                     {tab.badge}
                   </span>
                 ) : null}
               </button>
             ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10 animate-fade-in">
            <div className="lg:col-span-2">
              <div className="bg-dark-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="h-40 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 relative">
                  <div className="absolute -bottom-16 left-10">
                    <div className="relative group">
                      <div className={`w-32 h-32 rounded-[2rem] bg-dark-950 p-1.5 shadow-2xl cursor-pointer ring-4 ring-dark-950`}
                           onClick={() => fileInputRef.current?.click()}>
                        <div className="w-full h-full rounded-[1.8rem] bg-dark-900 overflow-hidden flex items-center justify-center border border-white/10 relative">
                           {formData.avatarUrl ? (
                             <img src={formData.avatarUrl} alt={formData.name} className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-4xl font-black text-white shadow-lg">
                                {formData.name.charAt(0).toUpperCase()}
                             </div>
                           )}
                           <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="flex flex-col items-center gap-1">
                               <Camera className="w-6 h-6 text-white" />
                               <span className="text-[8px] font-black text-white uppercase tracking-widest">Change Photo</span>
                             </div>
                           </div>
                        </div>
                      </div>
                      <input type="file" ref={fileInputRef} onChange={async (e) => {
                        if (e.target.files?.[0]) {
                          const base64 = await convertBlobToBase64(e.target.files[0]);
                          const newAvatar = `data:${e.target.files![0].type};base64,${base64}`;
                          setFormData(prev => ({ ...prev, avatarUrl: newAvatar }));
                        }
                      }} className="hidden" accept="image/*" />

                    </div>
                  </div>
                </div>

                <div className="pt-20 pb-12 px-10">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      {isEditing ? (
                         <div className="space-y-3">
                            <div className="space-y-1">
                               <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Identity Display Name</label>
                               <input 
                                 type="text" 
                                 autoFocus
                                 value={formData.name} 
                                 onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                 className="w-full bg-black/40 border border-indigo-500/50 rounded-xl px-4 py-3 text-2xl font-black text-white outline-none italic tracking-tighter uppercase focus:ring-1 focus:ring-indigo-500" 
                               />
                            </div>
                         </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">{user.name}</h1>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest bg-gradient-to-r ${planGradient} border border-white/10 ${planTextColor}`}>
                              {user.plan === 'premium' ? <Crown className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                              {user.plan}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                             <Mail className="w-3.5 h-3.5 text-gray-500" />
                             <p className="text-gray-400 text-sm font-medium">{user.email}</p>
                          </div>

                          {/* Quick chips */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-300">
                              {t('profile.credits')}: <span className="text-white">{user.plan === 'premium' ? 'UNLIMITED' : user.credits}</span>
                            </span>
                            <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-300 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-indigo-300" /> {t('profile.joined')}: <span className="text-white ml-1">{joinedDate}</span>
                            </span>
                            <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-300">
                              {t('profile.status')}: <span className="text-white">{(user.status || 'active').toUpperCase()}</span>
                            </span>
                          </div>

                          {/* Profile completeness */}
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Profile Completeness</span>
                              <span className="text-[9px] font-black uppercase tracking-widest text-white">{completeness}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/10">
                              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${completeness}%` }} />
                            </div>
                          </div>

                          <div className="mt-5 relative flex flex-wrap gap-3">
                            <button onClick={() => setIsLangOpen(p => !p)} className="px-5 py-3 rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-white shadow-lg hover:from-indigo-600/30 hover:to-purple-600/30 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                              <Languages className="w-4 h-4" /> {t('profile.language')}: {language.toUpperCase()}
                            </button>
                            <button onClick={() => setIsContactOpen(true)} className="px-5 py-3 rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-white shadow-lg hover:from-emerald-600/30 hover:to-teal-600/30 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                              <Mail className="w-4 h-4" /> {t('profile.contactUs')}
                            </button>
                             <button onClick={() => onNavigate?.('upgrade')} className="px-5 py-3 rounded-2xl border border-white/10 bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white shadow-lg hover:from-purple-600/30 hover:to-pink-600/30 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                              <Zap className="w-4 h-4" /> SUBSCRIBE NOW
                            </button>
                            {isLangOpen && (
                              <div className="absolute z-50 mt-2 w-56 bg-dark-900 border border-white/10 rounded-2xl shadow-2xl">
                                {[
                                  { id: 'en', label: 'English' },
                                  { id: 'ar', label: 'Arabic' },
                                  { id: 'fr', label: 'French' },
                                  { id: 'de', label: 'German' },
                                  { id: 'es', label: 'Spanish' },
                                ].map(opt => (
                                  <button
                                    key={opt.id}
                                    onClick={() => { setLanguage(opt.id as any); setIsLangOpen(false); }}
                                    className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest ${language === opt.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                         <>
                            <button onClick={() => { setFormData({ name: user.name, email: user.email, avatarUrl: user.avatarUrl }); setIsEditing(false); }} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-500 transition-all border border-white/10">
                               <X className="w-5 h-5" />
                            </button>
                            <button onClick={handleSave} disabled={isSaving} className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-all shadow-xl disabled:opacity-50">
                               {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            </button>
                         </>
                      ) : (
                        <button onClick={() => setIsEditing(true)} className="px-5 py-3 bg-white/5 hover:bg-indigo-600/10 rounded-2xl text-indigo-400 transition-all border border-white/10 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                           <Edit2 className="w-4 h-4" /> {t('profile.edit')}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 group hover:border-indigo-500/20 transition-all">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                             <Zap className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1">Assigned Protocol</p>
                            <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">{user.plan} Access</h4>
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-500 font-medium uppercase tracking-tight leading-relaxed">
                           Current authorization level provided by the administration.
                        </p>
                     </div>

                     <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 group hover:border-emerald-500/20 transition-all">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                             <CreditCard className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1">{t('profile.credits')}</p>
                            <div className="flex items-baseline gap-2 flex-wrap text-2xl font-black text-white tracking-tighter">
                              <span className="uppercase break-words">{user.plan === 'premium' ? 'UNLIMITED' : String(user.credits)}</span>
                              <span className="text-[10px] opacity-60 uppercase tracking-[0.2em]">Available</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-500 font-medium uppercase tracking-tight leading-relaxed">
                           Neural compute units remaining in your production balance.
                        </p>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-[40px] rounded-full -mr-12 -mt-12" />
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                     <Activity className="w-4 h-4" /> Node Telemetry
                  </h4>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Joined Protocol</span>
                        <span className="text-[10px] font-black text-white">{new Date(user.joinedAt || Date.now()).toLocaleDateString()}</span>
                     </div>
                     <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{t('profile.archiveSize')}</span>
                        <span className="text-[10px] font-black text-white">{historyStream.length} {t('profile.assets')}</span>
                     </div>
                     <div className="flex justify-between items-center py-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{t('profile.status')}</span>
                        <span className="flex items-center gap-1.5">
                           <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                           <span className="text-[10px] font-black text-white uppercase tracking-widest">{user.status || 'Active'}</span>
                        </span>
                     </div>
                  </div>
               </div>
               
               <button onClick={onLogout} className="w-full py-5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-lg group">
                  <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Logout
               </button>
            </div>
          </div>
        )}

        {/* GENERATIONS LIVE TAB */}
        {activeTab === 'live' && (
          <div className="space-y-10 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                  <Activity className="w-8 h-8 text-indigo-400" /> Generations Live
                </h3>
                <p className="text-sm text-gray-400 mt-2">Real-time multimodal AI activity across the platform</p>
              </div>
              <button 
                onClick={fetchLiveGenerations}
                disabled={loadingLive}
                className="px-6 py-3 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-600/20 rounded-2xl text-xs font-bold text-indigo-400 transition-all flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loadingLive ? 'animate-spin' : ''}`} />
                {loadingLive ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {/* Analytics Cards */}
            {generationAnalytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-dark-900 border border-white/5 p-6 rounded-[2rem] shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-indigo-600/20 rounded-xl">
                      <ImageIcon className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">AI Images</div>
                      <div className="text-2xl font-black text-white">{generationAnalytics.imageCount}</div>
                    </div>
                  </div>
                  <div className="text-[9px] text-gray-600 uppercase tracking-widest">Last 7 days</div>
                </div>

                <div className="bg-dark-900 border border-white/5 p-6 rounded-[2rem] shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-purple-600/20 rounded-xl">
                      <VideoIcon className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">AI Videos</div>
                      <div className="text-2xl font-black text-white">{generationAnalytics.videoCount}</div>
                    </div>
                  </div>
                  <div className="text-[9px] text-gray-600 uppercase tracking-widest">Last 7 days</div>
                </div>

                <div className="bg-dark-900 border border-white/5 p-6 rounded-[2rem] shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-pink-600/20 rounded-xl">
                      <Mic2 className="w-6 h-6 text-pink-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">AI Audio</div>
                      <div className="text-2xl font-black text-white">{generationAnalytics.audioCount}</div>
                    </div>
                  </div>
                  <div className="text-[9px] text-gray-600 uppercase tracking-widest">Last 7 days</div>
                </div>

                <div className="bg-dark-900 border border-white/5 p-6 rounded-[2rem] shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-green-600/20 rounded-xl">
                      <Activity className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Success Rate</div>
                      <div className="text-2xl font-black text-white">{generationAnalytics.successRate.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="text-[9px] text-gray-600 uppercase tracking-widest">Completion rate</div>
                </div>
              </div>
            )}

            {/* Additional Stats */}
            {generationAnalytics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-dark-900 border border-white/10 rounded-[2rem] p-8">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Total Generations</h4>
                  <div className="text-4xl font-black text-white mb-2">{generationAnalytics.totalGenerations}</div>
                  <div className="flex items-center gap-2 text-[9px] text-gray-600 uppercase tracking-widest">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>{generationAnalytics.completedCount} Completed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>{generationAnalytics.processingCount} Processing</span>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-900 border border-white/10 rounded-[2rem] p-8">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Active Users</h4>
                  <div className="text-4xl font-black text-white mb-2">{generationAnalytics.uniqueUsers}</div>
                  <div className="text-[9px] text-gray-600 uppercase tracking-widest">Unique creators this week</div>
                </div>

                <div className="bg-dark-900 border border-white/10 rounded-[2rem] p-8">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Top Users</h4>
                  <div className="space-y-2">
                    {generationAnalytics.topUsers.slice(0, 3).map((user: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-white font-bold truncate">{user.userName}</span>
                        <span className="text-gray-600 font-black">{user.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Live Generations List */}
            <div className="bg-dark-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5 bg-black/20 flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">Live Activity Feed</h4>
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Real-time generation events • Auto-refresh every 5s</p>
                </div>
                <div className="flex items-center gap-2 bg-green-600/10 px-4 py-2 rounded-xl border border-green-600/20">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Live</span>
                </div>
              </div>

              <div className="p-8">
                {loadingLive && liveGenerations.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                    <p className="text-sm text-gray-500">Loading live generations...</p>
                  </div>
                ) : liveGenerations.length > 0 ? (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {liveGenerations.map((gen: any) => {
                      const isImage = gen.type === 'image';
                      const isVideo = gen.type === 'video';
                      const isAudio = gen.type === 'audio';
                      
                      let iconColor = 'text-indigo-400';
                      let bgColor = 'bg-indigo-600/20';
                      let Icon = ImageIcon;
                      
                      if (isVideo) {
                        iconColor = 'text-purple-400';
                        bgColor = 'bg-purple-600/20';
                        Icon = VideoIcon;
                      } else if (isAudio) {
                        iconColor = 'text-pink-400';
                        bgColor = 'bg-pink-600/20';
                        Icon = Mic2;
                      }

                      const statusColor = gen.status === 'completed' ? 'text-green-400' : 
                                         gen.status === 'failed' ? 'text-red-400' : 'text-amber-400';
                      
                      return (
                        <div key={gen.id} className="flex items-start gap-4 p-6 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                          <div className={`p-3 rounded-xl ${bgColor} shrink-0`}>
                            <Icon className={`w-6 h-6 ${iconColor}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-black text-white uppercase tracking-tight truncate">{gen.userName}</h5>
                                <p className="text-[10px] text-gray-600 uppercase tracking-widest">{gen.userEmail}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className={`text-[9px] font-black uppercase tracking-widest ${statusColor}`}>
                                  {gen.status}
                                </span>
                                <span className="text-[8px] text-gray-600 uppercase tracking-widest whitespace-nowrap">
                                  {new Date(gen.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                <span className={`px-2 py-1 rounded-lg ${bgColor} ${iconColor}`}>
                                  AI {gen.type.toUpperCase()}
                                </span>
                                {gen.engine && (
                                  <span className="px-2 py-1 rounded-lg bg-white/5 text-gray-400">
                                    {gen.engine}
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-xs text-gray-400 italic line-clamp-2 leading-relaxed">
                                "{gen.prompt}"
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-32 text-center opacity-30">
                    <Activity className="w-16 h-16 mx-auto mb-6 text-gray-600" />
                    <h4 className="text-xl font-black uppercase tracking-[0.3em] text-gray-500">No Live Activity</h4>
                    <p className="text-[10px] font-bold uppercase mt-3 tracking-widest">Generations will appear here as users create content</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB - FUNCTIONAL & MULTIMODAL */}
        {activeTab === 'history' && (
          <div className="space-y-10 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                  <Activity className="w-8 h-8 text-indigo-400" /> {t('history.title')}
                </h3>
              </div>
              <div className="flex bg-white/5 px-4 py-2 rounded-xl border border-white/5 items-center gap-2">
                 <span className="text-[10px] font-black text-gray-500 uppercase">{historyStream.length} Authorized Assets</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {historyStream.map((item: any) => (
                <div key={item.id} className="bg-dark-900 border border-white/5 rounded-[2rem] p-6 hover:border-indigo-500/30 transition-all group relative overflow-hidden flex flex-col h-full shadow-2xl">
                  {/* Media Viewport */}
                  <div className="aspect-video mb-5 rounded-2xl overflow-hidden bg-black/40 border border-white/5 relative group/media">
                    {item.type === 'image' && <img src={item.url} className="w-full h-full object-cover opacity-80 group-hover/media:opacity-100 transition-opacity" alt="Projection" />}
                    {item.type === 'video' && (
                      <video src={item.url} className="w-full h-full object-cover opacity-60 group-hover/media:opacity-100" muted onMouseOver={e => e.currentTarget.play()} onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} />
                    )}
                    {item.type === 'audio' && (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-indigo-950/20 p-4">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${playingAudioId === item.id ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white/5 text-indigo-400'}`}>
                            <button onClick={() => handlePlayAudio(item.url, item.id)} className="focus:outline-none">
                              {playingAudioId === item.id ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                            </button>
                         </div>
                         {audioDuration[item.id] > 0 && (
                           <div className="w-full space-y-2">
                             <input 
                               type="range" 
                               min="0" 
                               max={audioDuration[item.id]} 
                               value={audioProgress[item.id] || 0} 
                               onChange={(e) => {
                                 const time = Number(e.target.value);
                                 setAudioProgress(prev => ({ ...prev, [item.id]: time }));
                                 if (audioRef.current) {
                                   audioRef.current.currentTime = time;
                                 }
                               }}
                               className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                             />
                             <div className="flex justify-between text-[8px] font-bold text-gray-400 uppercase">
                               <span>{Math.floor((audioProgress[item.id] || 0) / 60)}:{String(Math.floor((audioProgress[item.id] || 0) % 60)).padStart(2, '0')}</span>
                               <span>{Math.floor((audioDuration[item.id] || 0) / 60)}:{String(Math.floor((audioDuration[item.id] || 0) % 60)).padStart(2, '0')}</span>
                             </div>
                           </div>
                         )}
                         <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Synthesis Decoded</p>
                      </div>
                    )}
              <div className="mt-10">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">Support Sessions</h4>
                </div>
                {supportSessions.length === 0 ? (
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">No support activity yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {supportSessions.map(s => (
                      <div key={s.id} className={`bg-dark-900 border border-white/10 rounded-2xl p-6 ${activeSupportId === s.id ? 'ring-2 ring-emerald-500/40' : ''}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Session</p>
                            <h5 className="text-white font-black">{s.name}</h5>
                          </div>
                          <button onClick={() => handleOpenSupport(s.id)} className="px-3 py-2 bg-white/5 text-gray-300 rounded-xl border border-white/10">Open</button>
                        </div>
                        {activeSupportId === s.id && (
                          <div className="space-y-3">
                            <div className="max-h-48 overflow-y-auto custom-scrollbar bg-black/30 border border-white/5 rounded-xl p-3">
                              {s.chatHistory.length === 0 ? (
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest">No messages yet.</p>
                              ) : (
                                s.chatHistory.map(m => (
                                  <div key={m.id} className={`p-2 rounded-lg mb-2 ${m.sender === 'user' ? 'bg-indigo-500/10 text-indigo-200' : 'bg-emerald-500/10 text-emerald-200'}`}>
                                    <div className="text-[10px] uppercase tracking-widest opacity-70">{m.sender}</div>
                                    <div className="text-sm">{m.text}</div>
                                    <div className="text-[8px] opacity-50">{new Date(m.timestamp).toLocaleString()}</div>
                                  </div>
                                ))
                              )}
                            </div>
                            <div className="flex gap-2">
                              <input value={supportReply} onChange={(e) => setSupportReply(e.target.value)} className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white" placeholder="Type a reply..." />
                              <button onClick={handleSendSupportReply} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl">Send</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
                    
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                       <div className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg flex items-center gap-2 border border-white/10">
                          <item.icon className={`w-3 h-3 ${item.color}`} />
                          <span className="text-[8px] font-black text-white uppercase tracking-widest">{item.type}</span>
                       </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 space-y-3 mb-6">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{item.label}</p>
                    <p className="text-xs text-gray-300 font-medium line-clamp-2 italic leading-relaxed">"{item.prompt}"</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-5 border-t border-white/5">
                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em]">{new Date(item.createdAt).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                       <a 
                        href={item.url} 
                        download={`imaginai-${item.type}-${item.id}`}
                        className="p-2.5 bg-white/5 hover:bg-indigo-600 text-gray-500 hover:text-white rounded-xl border border-white/5 transition-all"
                       >
                         <Download className="w-4 h-4" />
                       </a>
                       <button 
                        onClick={() => handlePurgeAsset(item.id)}
                        className="p-2.5 bg-white/5 hover:bg-red-600 text-gray-500 hover:text-white rounded-xl border border-white/5 transition-all"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {historyStream.length === 0 && (
                <div className="col-span-full py-32 text-center opacity-30 animate-pulse">
                   <Activity className="w-16 h-16 mx-auto mb-6 text-gray-600" />
                   <h4 className="text-xl font-black uppercase tracking-[0.3em] text-gray-500">{t('history.empty')}</h4>
                   <p className="text-[10px] font-bold text-gray-600 uppercase mt-2 tracking-widest">{t('history.emptyDesc')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="space-y-6 animate-fade-in">
             <div className="flex items-center gap-3 mb-8">
                <Bell className="w-8 h-8 text-indigo-400" />
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{t('messages.title')}</h3>
             </div>
             {user.messages && user.messages.length > 0 ? (
                user.messages.map(msg => (
                  <div key={msg.id} className={`bg-dark-900 border rounded-[2rem] p-8 transition-all ${msg.isRead ? 'border-white/5 opacity-60' : 'border-indigo-500/30 bg-indigo-500/5 shadow-xl'}`}>
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <h4 className="text-lg font-black text-white uppercase italic tracking-tight">{msg.subject}</h4>
                           <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">From: {msg.sender}</p>
                        </div>
                        <span className="text-[8px] font-black text-gray-500 uppercase">{new Date(msg.timestamp).toLocaleDateString()}</span>
                     </div>
                     <p className="text-sm text-gray-400 leading-relaxed">{msg.content}</p>
                  </div>
                ))
             ) : (
                <div className="py-32 text-center opacity-30">
                   <Inbox className="w-16 h-16 mx-auto mb-6 text-gray-600" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">No active transmits in buffer</p>
                </div>
             )}
          </div>
        )}
      </div>
      
      {/* Contact Modal */}
      {isContactOpen && (
        <div className="fixed inset-0 z-[300] bg-dark-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-lg bg-dark-900 border border-white/10 rounded-[2rem] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2"><Mail className="w-5 h-5 text-emerald-400" /> {t('contact.title')}</h3>
              <button onClick={() => setIsContactOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('contact.subject')}</label>
                <input value={contactSubject} onChange={(e) => setContactSubject(e.target.value)} className="w-full mt-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none" placeholder={t('contact.subjectPlaceholder')} />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('contact.message')}</label>
                <textarea value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} className="w-full mt-1 h-32 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none resize-none" placeholder={t('contact.messagePlaceholder')} />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsContactOpen(false)} className="px-4 py-2 bg-white/5 text-gray-300 rounded-xl border border-white/10">{t('contact.cancel')}</button>
                <button onClick={handleSendContact} disabled={isContactSending} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl border border-white/10 disabled:opacity-50">
                  {isContactSending ? t('contact.sending') : t('contact.send')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
};
