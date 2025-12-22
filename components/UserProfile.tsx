
import React, { useState, useRef, useEffect } from 'react';
import { 
  User, Mail, LogOut, ArrowLeft, Shield, 
  Calendar, Edit2, Save, X, Check, Lock, Camera, 
  Upload, RefreshCw, ShieldCheck, AlertCircle, Zap,
  Database, Download, Trash2, Activity,
  Image as ImageIcon, Video as VideoIcon, Mic2, Play, Pause, Headphones,
  FileText, Scissors, FileAudio, Bell, Inbox, CreditCard
} from 'lucide-react';
import { User as UserType, GeneratedImage, GeneratedVideo, GeneratedAudio, SystemMessage } from '../types';
import { convertBlobToBase64 } from '../services/geminiService';
import { deleteAssetFromDB } from '../services/dbService';

interface UserProfileProps {
  user: UserType;
  gallery: GeneratedImage[];
  videoGallery?: GeneratedVideo[];
  audioGallery?: GeneratedAudio[];
  onLogout: () => void;
  onBack: () => void;
  onUpdateUser: (user: UserType) => void;
  onGalleryImport: (images: GeneratedImage[]) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  user, gallery, videoGallery = [], audioGallery = [], 
  onLogout, onBack, onUpdateUser 
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'messages' | 'history'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl
  });

  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const unreadCount = user.messages?.filter(m => !m.isRead).length || 0;

  const handlePlayAudio = (url: string, id: string) => {
    if (playingAudioId === id) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const newAudio = new Audio(url);
      audioRef.current = newAudio;
      newAudio.onended = () => setPlayingAudioId(null);
      newAudio.play();
      setPlayingAudioId(id);
    }
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

  // Compile a unified history stream
  const historyStream = [
    ...gallery.map(i => ({ ...i, type: 'image' as const, label: 'Visual Synthesis', icon: ImageIcon, color: 'text-indigo-400' })),
    ...videoGallery.map(v => ({ ...v, type: 'video' as const, label: 'Temporal Projection', icon: VideoIcon, color: 'text-purple-400' })),
    ...audioGallery.map(a => ({ 
      ...a, 
      type: 'audio' as const, 
      prompt: a.text, 
      label: a.voice.includes('STT') ? 'Neural Transcription' : 'Voice Synthesis', 
      icon: a.voice.includes('STT') ? FileText : Mic2,
      color: a.voice.includes('STT') ? 'text-emerald-400' : 'text-pink-400'
    }))
  ].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
        >
          <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-medium uppercase tracking-widest text-[10px] font-black">Back to Station</span>
        </button>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
           {[
             { id: 'profile', icon: User, label: 'Creator Profile' },
             { id: 'history', icon: Activity, label: 'Generation History' },
             { id: 'messages', icon: Mail, label: 'Inbox', badge: unreadCount },
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

      <div className="max-w-5xl mx-auto">
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-fade-in">
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
                          <h1 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter">{user.name}</h1>
                          <div className="flex items-center gap-2">
                             <Mail className="w-3.5 h-3.5 text-gray-500" />
                             <p className="text-gray-400 text-sm font-medium">{user.email}</p>
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
                           <Edit2 className="w-4 h-4" /> Edit Profile
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
                          <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1">Credits Remaining</p>
                            <h4 className="text-2xl font-black text-white tracking-tighter">
                               {user.plan === 'premium' ? 'UNLIMITED' : user.credits} 
                               <span className="text-[10px] opacity-40 uppercase ml-2 tracking-[0.2em]">Available</span>
                            </h4>
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
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Archive Size</span>
                        <span className="text-[10px] font-black text-white">{historyStream.length} Assets</span>
                     </div>
                     <div className="flex justify-between items-center py-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Status</span>
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
                  <Activity className="w-8 h-8 text-indigo-400" /> Neural Timeline
                </h3>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2 ml-11">
                  A unified archive of your multimodal generations
                </p>
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
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-indigo-950/20">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${playingAudioId === item.id ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white/5 text-indigo-400'}`}>
                            <button onClick={() => handlePlayAudio(item.url, item.id)}>
                              {playingAudioId === item.id ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                            </button>
                         </div>
                         <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Synthesis Decoded</p>
                      </div>
                    )}
                    
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
                   <h4 className="text-xl font-black uppercase tracking-[0.3em] text-gray-500">Vault Empty</h4>
                   <p className="text-[10px] font-bold text-gray-600 uppercase mt-2 tracking-widest">Initialize production to populate your creation archive</p>
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
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">System Transmits</h3>
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
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
};
