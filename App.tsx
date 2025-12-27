import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { FutureLanding } from './components/FutureLanding.tsx';
import { Pricing } from './components/Pricing.tsx';
import { Generator } from './components/Generator.tsx';
import { VideoLabLanding } from './components/VideoLabLanding.tsx';
import { VideoGenerator } from './components/VideoGenerator.tsx';
import { TTSGenerator } from './components/TTSGenerator.tsx';
import { TTSLanding } from './components/TTSLanding.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { UpgradeModal } from './components/UpgradeModal.tsx';
import { LanguageProvider } from './utils/i18n';
import { Gallery } from './components/Gallery.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { UserProfile } from './components/UserProfile.tsx';
import { UpgradePage } from './components/UpgradePage.tsx';
import { Showcase } from './components/Showcase.tsx';
import { ExplorePage } from './components/ExplorePage.tsx';
import { MultimodalSection } from './components/MultimodalSection.tsx';
import { ChatWidget } from './components/ChatWidget.tsx';
import SignUp from './components/SignUp.tsx';
import PostVerify from './components/PostVerify';
import { User, GeneratedImage, GeneratedVideo, GeneratedAudio, SiteConfig, Plan } from './types.ts';
import { supabase } from './services/supabase.ts';
import { 
  getImagesFromDB, saveImageToDB, getVideosFromDB, 
  saveVideoToDB, getAudioFromDB, saveAudioToDB
} from './services/dbService.ts';
import { Sparkles, RefreshCw, ArrowLeft, ShieldAlert } from 'lucide-react';
import { auth, getUserProfile, getAllUsersFromFirestore } from './services/firebase';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';

const CONFIG_KEY = 'imaginai_site_config';
const SUPER_ADMIN_EMAIL = 'isambk92@gmail.com';

const DEFAULT_CONFIG: SiteConfig = {
  heroTitle: "Turn your imagination into Visual Reality",
  heroSubtitle: "Create stunning, unique images and cinematic videos in seconds using advanced AI. Describe your vision, and watch it come to life. Join today and get 3 free generations.",
  promptPlaceholder: "Describe what you want to imagine...",
  maintenanceMode: false,
  slideshow: [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=1200"
  ],
  seo: {
    title: "ImaginAI - AI Multimodal Lab",
    description: "Create stunning AI art and videos with ImaginAI. Powered by advanced Gemini Veo & Flash models.",
    keywords: "ai art, video generator, gemini veo, ai tools, art creator"
  },
  testimonials: [],
  articles: [],
  plans: [
    { id: 'free', name: 'Free Trial', price: '$0', credits: 3, features: ['3 Free Generations', 'Public Gallery'] },
    { id: 'basic', name: 'Basic Creator', price: '$9.9', credits: 16, features: ['16 Generations / mo', 'Private Gallery'], recommended: true, buttonUrl: 'https://bentagroun.gumroad.com/l/huodf' },
    { id: 'premium', name: 'Premium', price: '$20', credits: 'Unlimited', features: ['Unlimited Access', 'Priority Rendering'], buttonUrl: 'https://bentagroun.gumroad.com/l/zrgraz' }
  ],
  topMenu: [],
  footerMenu: [],
  socialLinks: {},
  customPages: [],
  showcaseImages: [],
  landingPageOrder: ['hero', 'multimodal', 'pricing'],
  videoLab: {
    hero: {
      title: "Cinematic AI Video Moteur",
      subtitle: "Transform scripts into high-fidelity cinematic experiences using Gemini Veo 3.1 technology.",
      videoUrl: "https://v.ftcdn.net/06/18/88/54/700_F_618885472_vU6YfF48xY5MvP8n0q2xN8J0Z6n3B0N7_ST.mp4"
    },
    scriptToCinema: {
      title: "Script to Cinema",
      subtitle: "Professional lighting, camera moves, and textures from a single prompt.",
      videoUrl: "https://v.ftcdn.net/06/18/88/54/700_F_618885472_vU6YfF48xY5MvP8n0q2xN8J0Z6n3B0N7_ST.mp4",
      prompt: "Cinematic drone shot of a futuristic neon city in the rain, hyper-realistic."
    },
    refineExtend: {
      title: "Refine & Extend",
      subtitle: "Iterate on your masterpieces with frame-to-frame interpolation.",
      frames: []
    },
    showcase: []
  },
  ttsLab: {
    voices: [
      { id: 'Kore', name: 'Kore', description: 'Professional & Authoritative' },
      { id: 'Puck', name: 'Puck', description: 'Youthful & Energetic' }
    ]
  }
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [videoGallery, setVideoGallery] = useState<GeneratedVideo[]>([]);
  const [audioGallery, setAudioGallery] = useState<GeneratedAudio[]>([]);
  const [openContactFromUpgrade, setOpenContactFromUpgrade] = useState(false);
  const [openInboxFromDropdown, setOpenInboxFromDropdown] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    try { 
      const saved = localStorage.getItem(CONFIG_KEY); 
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG; 
    } catch (e) { return DEFAULT_CONFIG; }
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    try {
      return (localStorage.getItem('site_theme') as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [currentPage, setCurrentPage] = useState<string>(() => {
    // If app is opened via verification action URL, show the post-verify page
    try {
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/post-verify')) {
        return 'post-verify';
      }
      // Support '?goto=dashboard' redirection after verification
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('goto') === 'dashboard') return 'dashboard';
      }
    } catch (e) {}
    return 'home';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPrefillEmail, setAuthPrefillEmail] = useState<string | undefined>(undefined);
  const [isIdentityCheckActive, setIsIdentityCheckActive] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  // Track whether auth initialization timed out so we render a helpful message instead of an unending spinner
  const [authInitTimedOut, setAuthInitTimedOut] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      const anyWindow = window as any;
      const hasEnvKey = !!(process.env.SORA_API_KEY && process.env.SORA_API_KEY !== '""') || !!(process.env.API_KEY && process.env.API_KEY !== '""');
      let hasUiKey = false;
      if (anyWindow.aistudio && typeof anyWindow.aistudio.hasSelectedApiKey === 'function') {
        hasUiKey = await anyWindow.aistudio.hasSelectedApiKey();
      }
      setHasApiKey(hasEnvKey || hasUiKey);
    };
    checkApiKey();
  }, []);

  // Apply theme to document root
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === 'light') root.classList.add('light-theme');
      else root.classList.remove('light-theme');
      localStorage.setItem('site_theme', theme);
    } catch (e) {
      /* noop */
    }
  }, [theme]);

  // If navigating to profile from Upgrade -> Contact Us, open the contact modal once
  useEffect(() => {
    if (currentPage === 'profile' && openContactFromUpgrade) {
      // reset on next tick so the modal only auto-opens once
      const t = setTimeout(() => setOpenContactFromUpgrade(false), 0);
      return () => clearTimeout(t);
    }
  }, [currentPage, openContactFromUpgrade]);

  // If navigating to profile from dropdown -> Inbox, open the inbox tab once
  useEffect(() => {
    if (currentPage === 'profile' && openInboxFromDropdown) {
      // reset on next tick so the inbox only auto-opens once
      const t = setTimeout(() => setOpenInboxFromDropdown(false), 0);
      return () => clearTimeout(t);
    }
  }, [currentPage, openInboxFromDropdown]);

  useEffect(() => {
    let didCancel = false;
    let timeoutId: number | undefined;

    const safeSetInitFalse = () => { if (!didCancel) setIsInitializing(false); };

    try {
      console.debug('Initializing Firebase auth listener');

      // If auth doesn't respond within 5s, show a helpful timeout message instead of an infinite spinner
      timeoutId = window.setTimeout(() => {
        console.warn('Auth init timed out after 5s');
        setAuthInitTimedOut(true);
        safeSetInitFalse();
      }, 5000);

      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        try {
          if (timeoutId) { clearTimeout(timeoutId); timeoutId = undefined; }

          if (!fbUser) {
            setUser(null);
            setGallery([]);
            setVideoGallery([]);
            setAudioGallery([]);
            safeSetInitFalse();
            return;
          }

          // Set a lightweight user immediately so the UI can render the dashboard quickly
          const isQuickSuperAdmin = fbUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
          const quickUser: User = {
            id: fbUser.uid,
            name: (fbUser.displayName || fbUser.email?.split('@')[0] || 'Creator') as string,
            email: fbUser.email || '',
            role: isQuickSuperAdmin ? 'admin' : 'user',
            plan: isQuickSuperAdmin ? 'premium' : 'free',
            credits: isQuickSuperAdmin ? 99999 : 3,
            isRegistered: true,
            isVerified: isQuickSuperAdmin || !!fbUser.emailVerified,
            gallery: [],
          };

          setUser(quickUser);
          safeSetInitFalse();

          // Perform heavier profile/entitlements fetches in the background and update the user when ready
          (async () => {
            try {
              const profile = await getUserProfile(fbUser.uid);

              // Grant entitlements when verified or for the super-admin regardless of verification
              try {
                const { grantDefaultEntitlements } = await import('./services/firebase');
                if ((fbUser.emailVerified && !(profile?.entitlements?.image)) || fbUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
                  grantDefaultEntitlements(fbUser.uid).catch((err) => console.warn('Failed to grant entitlements on auth bg task', err));
                }
              } catch (err) {
                console.warn('Failed to import grantDefaultEntitlements', err);
              }

              const isSuperAdmin = fbUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

              const updatedUser: User = {
                id: fbUser.uid,
                name: (fbUser.displayName || profile?.name || fbUser.email?.split('@')[0] || 'Creator') as string,
                email: fbUser.email || '',
                role: isSuperAdmin ? 'admin' : (profile?.role || 'user'),
                plan: isSuperAdmin ? 'premium' : (profile?.plan || 'free'),
                credits: isSuperAdmin ? 99999 : (profile?.credits ?? 3),
                isRegistered: true,
                // Auto-verify the super-admin email so they can access the Admin Dashboard without an email verification
                isVerified: isSuperAdmin || !!fbUser.emailVerified || !!profile?.verified,
                gallery: [],
                audioGallery: [],
              };

              setUser(updatedUser);
              
              // Load galleries from BOTH Supabase AND Firebase, then merge
              try {
                const { getImagesFromDB, getVideosFromDB, getAudioFromDB } = await import('./services/dbService');
                const { getImagesFromFirebase, getVideosFromFirebase, getAudioFromFirebase } = await import('./services/firebase');
                
                const [supaImages, supaVideos, supaAudios, fbImages, fbVideos, fbAudios] = await Promise.all([
                  getImagesFromDB(fbUser.uid),
                  getVideosFromDB(fbUser.uid),
                  getAudioFromDB(fbUser.uid),
                  getImagesFromFirebase(fbUser.uid),
                  getVideosFromFirebase(fbUser.uid),
                  getAudioFromFirebase(fbUser.uid)
                ]);

                // Merge unique items from both sources
                const mergeUnique = <T extends { id: string }>(arr1: T[], arr2: T[]) => {
                  const map = new Map<string, T>();
                  [...arr1, ...arr2].forEach(item => map.set(item.id, item));
                  return Array.from(map.values()).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
                };

                setGallery(mergeUnique(supaImages, fbImages));
                setVideoGallery(mergeUnique(supaVideos, fbVideos));
                setAudioGallery(mergeUnique(supaAudios, fbAudios));
              } catch (err) {
                console.warn('Failed to load galleries:', err);
              }

              // Admins: fetch all users but don't block UI
              if (updatedUser.role === 'admin') {
                try {
                  const users = await getAllUsersFromFirestore();
                  setAllUsers(users);
                } catch (err) {
                  console.warn('Failed to fetch all users from Firestore:', err);
                }
              }
            } catch (err) {
              console.warn('Background auth tasks failed', err);
            }
          })();
        } catch (err) {
          console.error('Auth sync error', err);
          safeSetInitFalse();
        }
      });

      return () => { didCancel = true; if (timeoutId) clearTimeout(timeoutId); unsubscribe(); };
    } catch (err) {
      console.error('Auth listener setup failed', err);
      setAuthInitTimedOut(true);
      setIsInitializing(false);
    }
  }, []);

  // Log visits and referrers for basic analytics (soft fail if analytics table doesn't exist)
  useEffect(() => {
    try {
      const track = async () => {
        try {
          const { logTrafficEvent } = await import('./services/dbService');
          await logTrafficEvent({ path: window.location.pathname, referrer: document.referrer || 'direct', userAgent: navigator.userAgent, userId: user?.id || null });
        } catch (e) {
          // ignore
        }
      };
      track();
    } catch (e) {
      // ignore
    }
  }, [currentPage, user]);

  // Admin action handlers
  const handleDeleteUser = async (userId: string) => {
    try {
      const { deleteUserFromDB } = await import('./services/dbService');
      await deleteUserFromDB(userId);
      setAllUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e) {
      console.warn('Failed to delete user:', e);
      alert('Failed to delete user.');
    }
  };

  const handleUpdateUser = async (u: User) => {
    try {
      const { updateUserProfile, updateUserCredits } = await import('./services/dbService');
      await updateUserProfile(u.id, { name: u.name, email: u.email, plan: u.plan, status: u.status });
      await updateUserCredits(u.id, u.credits);
      setAllUsers(prev => prev.map(p => p.id === u.id ? u : p));
      alert('User updated.');
    } catch (e) {
      console.warn('Failed to update user:', e);
      alert('Failed to update user.');
    }
  };

  const handleSendMessageToUser = async (userId: string, message: {subject: string, content: string}) => {
    try {
      const { sendMessageToUserInDB, sendEmailToUser } = await import('./services/dbService');
      await sendMessageToUserInDB(userId, { subject: message.subject, content: message.content });
      // also attempt to deliver as an email for real-world admin workflows
      const target = allUsers.find(u => u.id === userId);
      if (target && target.email) await sendEmailToUser(target.email, message.subject, message.content);
      alert('Message queued.');
    } catch (e) {
      console.warn('Failed to send message to user:', e);
      alert('Message dispatch failed.');
    }
  };

  const handleBroadcastMessage = async (msg: {subject: string, content: string}) => {
    try {
      const { broadcastMessageToAllInDB } = await import('./services/dbService');
      await broadcastMessageToAllInDB(msg);
      alert('Broadcast queued.');
    } catch (e) {
      console.warn('Failed to broadcast message:', e);
      alert('Broadcast failed.');
    }
  };

  // Allow admin to trigger a Firebase sync on demand
  const handleSyncFirebaseUsers = async () => {
    try {
      const { getAllFirebaseUsers } = await import('./services/firebase');
      const fbUsers = await getAllFirebaseUsers();
      if (!fbUsers || fbUsers.length === 0) {
        alert('No Firebase users found or the operation failed.');
        return;
      }
      // Merge into current allUsers (preferring existing Supabase entries)
      const byEmail = new Map(allUsers.map(u => [u.email?.toLowerCase(), u]));
      const merged = [...allUsers];
      fbUsers.forEach((fb: any) => {
        if (!fb.email) return;
        const key = fb.email.toLowerCase();
        if (!byEmail.has(key)) {
          merged.push({
            id: fb.id,
            name: fb.name || 'Creator',
            email: fb.email,
            role: fb.role || 'user',
            plan: fb.plan || 'free',
            credits: fb.credits ?? 0,
            isRegistered: true,
            isVerified: !!fb.verified,
            avatarUrl: fb.avatarUrl || null,
            status: fb.status || 'active',
            gallery: []
          });
        } else {
          const existing = byEmail.get(key)!;
          existing.role = existing.role || fb.role;
          existing.plan = existing.plan || fb.plan;
          existing.credits = existing.credits ?? fb.credits ?? existing.credits;
        }
      });
      setAllUsers(merged);
      alert('Firebase users synced into admin directory.');
    } catch (e) {
      console.warn('Sync failed:', e);
      alert('Sync failed.');
    }
  };

  // Developer helpers: support dev-only URL actions for testing flows
  useEffect(() => {
    try {
      if (process.env.NODE_ENV === 'production') return; // only in dev
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');

      if (action === 'devVerify') {
        const uid = params.get('uid');
        if (uid) {
          (async () => {
            try {
              const { grantDefaultEntitlements } = await import('./services/firebase');
              await grantDefaultEntitlements(uid);
              console.log('Dev: granted entitlements to', uid);
              window.location.href = `${window.location.origin}/?goto=dashboard`;
            } catch (err) {
              console.error('Dev verify failed', err);
            }
          })();
        }
      }

      if (action === 'devAutoLogin') {
        const email = params.get('email');
        const password = params.get('password');
        if (email && password) {
          (async () => {
            try {
              const { signInWithEmailAndPassword } = await import('firebase/auth');
              const { auth } = await import('./services/firebase');
              await signInWithEmailAndPassword(auth, email, password);
              window.location.href = `${window.location.origin}/?goto=dashboard`;
            } catch (err) {
              console.error('Dev auto-login failed', err);
            }
          })();
        }
      }
    } catch (e) {
      console.warn('Dev helper handler error', e);
    }
  }, []);

  // If a verification flow redirected the user here and they need to log in,
  // support opening the auth modal automatically via a URL flag `openAuth=1`.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openAuth')) {
        setIsAuthModalOpen(true);

        // Try to prefill the email for convenience:
        // 1) Use pending_verification in localStorage (set during signup)
        // 2) Fallback to an explicit `email` query param if present
        try {
          let prefill: string | undefined;
          const pv = localStorage.getItem('pending_verification');
          if (pv) {
            try {
              const parsed = JSON.parse(pv);
              if (parsed?.email) prefill = parsed.email;
            } catch (e) {
              console.warn('Failed to parse pending_verification', e);
            }
          }
          if (!prefill && params.get('email')) {
            prefill = params.get('email') || undefined;
          }
          if (prefill) setAuthPrefillEmail(prefill);
        } catch (e) {
          console.warn('prefill email parse error', e);
        }

        // Remove param so it doesn't persist in history
        params.delete('openAuth');
        const search = params.toString();
        const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    } catch (e) {
      console.warn('openAuth handler error', e);
    }
  }, []);

  // Keep a simple app-level flag in sync with auth and pending verification info
  useEffect(() => {
    try {
      const pv = typeof window !== 'undefined' && localStorage.getItem('pending_verification');
      if ((user && !user.isVerified) || pv) setIsIdentityCheckActive(true);
      else setIsIdentityCheckActive(false);
    } catch (e) {
      console.warn('identity check handler error', e);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn('Firebase sign out failed:', err);
    }
    setUser(null);
    setCurrentPage('home');
  };

  const handleSelectPlan = (plan: Plan) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (user.plan === 'free' && plan.id !== 'free') {
      setCurrentPage('upgrade');
      return;
    }

    if (plan.buttonUrl) {
      window.open(plan.buttonUrl, '_blank');
      return;
    }

    setCurrentPage('profile');
  };

  const renderPage = () => {
    if (currentPage === 'verify-email') {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center animate-fade-in bg-dark-950">
          <div className="max-w-md w-full glass p-12 rounded-[3rem] border border-indigo-500/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl rounded-full -mr-16 -mt-16" />
            <div className="w-20 h-20 bg-indigo-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-indigo-500/20 shadow-inner">
               <ShieldAlert className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">Identity Check</h2>
            <p className="text-gray-400 font-medium leading-relaxed mb-8">
              A verification link was sent to your email. <br />
              <strong>Access is strictly restricted</strong> until you confirm your identity via that link.
            </p>
            <div className="space-y-4">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Check Status
              </button>
              <button 
                onClick={() => setCurrentPage('home')}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'home':
        return (
          <FutureLanding 
            onGetStarted={() => setIsAuthModalOpen(true)} 
            onNavigate={setCurrentPage}
            isRegistered={!!user}
            onSelectPlan={handleSelectPlan}
            plans={siteConfig.plans}
          />
        );
      case 'dashboard':
        return (
          <Generator 
            user={user} 
            gallery={gallery} 
            onCreditUsed={() => {}} 
            onUpgradeRequired={() => setCurrentPage('upgrade')} 
            onImageGenerated={(img) => { setGallery(p => [img, ...p]); if (user?.id) saveImageToDB(img, user.id); }} 
            initialPrompt={initialPrompt} 
            hasApiKey={hasApiKey} 
            onSelectKey={() => {}} 
            onLoginClick={() => setIsAuthModalOpen(true)}
          />
        );
      case 'video-lab-landing':
        return <VideoLabLanding user={user} config={siteConfig.videoLab} onStartCreating={() => setCurrentPage('video-generator')} onLoginClick={() => setIsAuthModalOpen(true)} hasApiKey={hasApiKey} onSelectKey={() => {}} onResetKey={() => {}} />;
      case 'video-generator':
        if (!user) { setCurrentPage('home'); setIsAuthModalOpen(true); return null; }
        return <VideoGenerator user={user} onCreditUsed={() => {}} onUpgradeRequired={() => setIsUpgradeModalOpen(true)} onVideoGenerated={(video) => { setVideoGallery(p => [video, ...p]); saveVideoToDB(video, user!.id); }} hasApiKey={hasApiKey} onSelectKey={() => {}} onResetKey={() => {}} />;
      case 'tts-lab-landing':
        return <TTSLanding user={user} config={siteConfig.ttsLab} onStartCreating={() => setCurrentPage('tts-generator')} onLoginClick={() => setIsAuthModalOpen(true)} onAudioGenerated={(aud) => { setAudioGallery(p => [aud, ...p]); if (user?.id) saveAudioToDB(aud, user.id); }} hasApiKey={hasApiKey} onSelectKey={() => {}} onResetKey={() => {}} />;
      case 'tts-generator':
        if (!user) { setCurrentPage('home'); setIsAuthModalOpen(true); return null; }
        return <TTSGenerator user={user} onCreditUsed={() => {}} onUpgradeRequired={() => setIsUpgradeModalOpen(true)} onAudioGenerated={(aud) => { setAudioGallery(p => [aud, ...p]); saveAudioToDB(aud, user!.id); }} hasApiKey={hasApiKey} onSelectKey={() => {}} onResetKey={() => {}} />;
      case 'gallery':
        if (!user) { setCurrentPage('home'); setIsAuthModalOpen(true); return null; }
        return <Gallery images={gallery} videos={videoGallery} audioGallery={audioGallery} onDelete={() => {}} />;
      case 'explore':
        return <ExplorePage user={user} images={gallery} videos={videoGallery} siteConfig={siteConfig} onNavigate={setCurrentPage} />;
      case 'admin':
        return user?.role === 'admin' ? <AdminDashboard users={allUsers} siteConfig={siteConfig} onUpdateConfig={setSiteConfig} onDeleteUser={handleDeleteUser} onUpdateUser={handleUpdateUser} onSendMessageToUser={handleSendMessageToUser} onBroadcastMessage={handleBroadcastMessage} onSupportReply={() => {}} hasApiKey={hasApiKey} onSelectKey={() => {}} onSyncFirebase={handleSyncFirebaseUsers} /> : null;
      case 'profile':
        return user ? <UserProfile user={user} gallery={gallery} videoGallery={videoGallery} audioGallery={audioGallery} onLogout={handleLogout} onBack={() => setCurrentPage('home')} onUpdateUser={() => {}} onGalleryImport={() => {}} onNavigate={setCurrentPage} initialContactOpen={openContactFromUpgrade} initialInboxOpen={openInboxFromDropdown} theme={theme} onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} /> : null;
      case 'upgrade':
        return <UpgradePage onBack={() => setCurrentPage(user ? 'profile' : 'home')} onContactUs={() => { setOpenContactFromUpgrade(true); setCurrentPage('profile'); }} />;
      case 'signup':
        return <SignUp />;
      case 'post-verify':
        return <PostVerify />;
      default:
        return null;
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center">
        <Sparkles className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        {authInitTimedOut ? (
          <div className="text-center">
            <p className="text-red-400 font-bold mb-4">Authentication initialization timed out. The app couldn't connect to Firebase Auth.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Retry</button>
              <button onClick={() => setIsInitializing(false)} className="px-4 py-2 bg-white/5 text-gray-200 rounded-lg">Continue (limited)</button>
            </div>
          </div>
        ) : (
          <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px]">Initializing Neural Link...</p>
        )}
      </div>
    );
  }

  return (
      <LanguageProvider>
        <div className="min-h-screen bg-dark-950">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onLoginClick={() => setIsAuthModalOpen(true)} 
        onNavigate={setCurrentPage} 
        currentPage={currentPage} 
        customMenu={[]} 
        onUpgradeClick={() => setIsUpgradeModalOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        onOpenInbox={() => setOpenInboxFromDropdown(true)}
      />
      <main className="pt-16">
        {renderPage()}
      </main>

      <ChatWidget user={user} isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => { setIsAuthModalOpen(false); setAuthPrefillEmail(undefined); }}
        onLoginSuccess={() => { setIsAuthModalOpen(false); setAuthPrefillEmail(undefined); setCurrentPage('dashboard'); }}
        initialEmail={authPrefillEmail}
      />
      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        onSelectPlan={() => setIsUpgradeModalOpen(false)} 
      />
      <style>{`
        :root.light-theme { filter: invert(1) hue-rotate(180deg); }
        :root.light-theme img,
        :root.light-theme video,
        :root.light-theme picture,
        :root.light-theme iframe {
          filter: invert(1) hue-rotate(180deg);
        }
      `}</style>
      </div>
    </LanguageProvider>
  );
};

export default App;