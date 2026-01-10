
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  User, Mail, LogOut, ArrowLeft, Shield, 
  Calendar, Edit2, Save, X, Check, Lock, Camera, 
  Upload, RefreshCw, ShieldCheck, AlertCircle, Zap,
  Database, Download, Trash2, Activity,
  Image as ImageIcon, Video as VideoIcon, Mic2, Play, Pause, Headphones,
  FileText, Scissors, FileAudio, Bell, Inbox, CreditCard, Languages, ChevronDown, Crown
} from 'lucide-react';
import { User as UserType, GeneratedImage, GeneratedVideo, GeneratedAudio, SystemMessage, SupportSession } from '../types';
import { convertBlobToBase64 } from '../services/geminiService';
import { deleteAssetFromDB } from '../services/dbService';
import {
  getImagesFromFirebase as fetchImagesFromFirebase,
  getVideosFromFirebase as fetchVideosFromFirebase,
  getAudioFromFirebase as fetchAudioFromFirebase
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
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  user, gallery, videoGallery = [], audioGallery = [], 
  onLogout, onBack, onUpdateUser, onNavigate, initialContactOpen, initialInboxOpen
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'messages' | 'history'>(initialInboxOpen ? 'messages' : 'profile');
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const [tabDropdownPosition, setTabDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const tabButtonRef = useRef<HTMLButtonElement>(null);
  const tabDropdownRef = useRef<HTMLDivElement>(null);
  const tabPortalRef = useRef<HTMLDivElement>(null);
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
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const contactButtonRef = useRef<HTMLDivElement>(null);
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

  const unreadCount = user.messages?.filter(m => !m.isRead).length || 0;

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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (langDropdownRef.current && !langDropdownRef.current.contains(target)) {
        setIsLangOpen(false);
      }
      if (contactButtonRef.current && !contactButtonRef.current.contains(target)) {
        setIsContactOpen(false);
      }
      if (tabDropdownRef.current && !tabDropdownRef.current.contains(target) && (!tabPortalRef.current || !tabPortalRef.current.contains(target))) {
        setIsTabDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Position tab dropdown portal
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isTabDropdownOpen) return;

    const updatePosition = () => {
      if (!tabButtonRef.current) return;
      const rect = tabButtonRef.current.getBoundingClientRect();
      const margin = 8;
      const width = 280;
      const maxLeft = window.innerWidth - width - margin;
      const left = Math.max(margin, Math.min(rect.left, maxLeft));
      setTabDropdownPosition({ top: rect.bottom + margin, left, width });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isTabDropdownOpen]);

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
          <div ref={tabDropdownRef} className="relative">
            <button
              ref={tabButtonRef}
              onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
              className="flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-indigo-600 text-white shadow-xl shadow-indigo-600/20"
            >
              {activeTab === 'profile' ? (
                <>
                  <User className="w-4 h-4" />
                  Creator Profile
                </>
              ) : activeTab === 'history' ? (
                <>
                  <Database className="w-4 h-4" />
                  Generation History
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Inbox
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-dark-950">
                      {unreadCount}
                    </span>
                  )}
                </>
              )}
              <ChevronDown className={`w-3 h-3 transition-transform ${isTabDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Tab Dropdown Portal */}
            {isTabDropdownOpen && tabDropdownPosition && typeof document !== 'undefined' && createPortal(
              <div
                ref={tabPortalRef}
                className="fixed z-[12000] bg-dark-900 border border-white/10 rounded-xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.55)] animate-scale-in"
                style={{
                  top: tabDropdownPosition.top,
                  left: tabDropdownPosition.left,
                  width: tabDropdownPosition.width,
                  maxWidth: 'calc(100vw - 16px)',
                }}
              >
                <button
                  onClick={() => { setActiveTab('profile'); setIsTabDropdownOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold transition-all border-b border-white/5 last:border-none ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                >
                  <User className="w-3.5 h-3.5" />
                  Creator Profile
                </button>
                <button
                  onClick={() => { setActiveTab('history'); setIsTabDropdownOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold transition-all border-b border-white/5 last:border-none ${activeTab === 'history' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                >
                  <Database className="w-3.5 h-3.5" />
                  Generation History
                </button>
                <button
                  onClick={() => { setActiveTab('messages'); setIsTabDropdownOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold transition-all ${activeTab === 'messages' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Inbox
                  {unreadCount > 0 && (
                    <span className="ml-auto w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border border-red-400">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>,
              document.body
            )}
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
                            <div ref={langDropdownRef}>
                              <button onClick={() => setIsLangOpen(p => !p)} className="px-5 py-3 rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-white shadow-lg hover:from-indigo-600/30 hover:to-purple-600/30 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                                <Languages className="w-4 h-4" /> {t('profile.language')}: {language.toUpperCase()}
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
                            <button onClick={() => setIsContactOpen(true)} className="px-5 py-3 rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-white shadow-lg hover:from-emerald-600/30 hover:to-teal-600/30 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                              <Mail className="w-4 h-4" /> {t('profile.contactUs')}
                            </button>
                             <button onClick={() => onNavigate?.('pricing')} className="px-5 py-3 rounded-2xl border border-white/10 bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white shadow-lg hover:from-purple-600/30 hover:to-pink-600/30 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                              <Zap className="w-4 h-4" /> SUBSCRIBE NOW
                            </button>
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
                     <Activity className="w-4 h-4" /> Information
                  </h4>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Joined Date</span>
                        <span className="text-[10px] font-black text-white">{new Date(user.joinedAt || Date.now()).toLocaleDateString()}</span>
                     </div>
                     <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Gallery</span>
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
      <div ref={contactButtonRef}>
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
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
};
