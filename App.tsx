import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { PricingLanding } from './components/PricingLanding.tsx';
import { TTSLanding } from './components/TTSLanding.tsx';
import { Hero } from './components/Hero.tsx';
import { HomeLanding } from './components/HomeLanding.tsx';
import { VideoLabLanding } from './components/VideoLabLanding.tsx';
import { AIImageLanding } from './components/AIImageLanding.tsx';
import { ExplorePage } from './components/ExplorePage.tsx';
import { ChatLanding } from './components/ChatLanding.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import SignupSuccess from './components/SignupSuccess.tsx';
import SignUp from './components/SignUp.tsx';
import { UpgradeModal } from './components/UpgradeModal.tsx';
import { LanguageProvider } from './utils/i18n';
import { WhatsAppWidget } from './components/WhatsAppWidget.tsx';
import { FacebookGroupFloatingButton } from './components/FacebookGroupFloatingButton.tsx';
import { ContactPanel } from './components/ContactPanel.tsx';
import { FacebookGroupPopup } from './components/FacebookGroupPopup.tsx';
import ExitIntentPopup from './components/ExitIntentPopup.tsx';
import { trackPageView as trackPostHogPageView, identifyUser, resetPostHogIdentity } from './services/posthog';

import { User, GeneratedImage, GeneratedVideo, GeneratedAudio, SiteConfig, Plan } from './types.ts';
import { supabase } from './services/supabase.ts';
import { 
  getImagesFromDB, saveImageToDB, getVideosFromDB, 
  saveVideoToDB, getAudioFromDB, saveAudioToDB
} from './services/dbService.ts';
import { Sparkles, RefreshCw, ArrowLeft, ShieldAlert } from 'lucide-react';
import { auth, getUserProfile, getAllUsersFromFirestore, setAnalyticsUserId, trackPageView } from './services/firebase';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';

const CONFIG_KEY = 'imaginai_site_config';
const SUPER_ADMIN_EMAIL = 'isambk92@gmail.com';

const DEFAULT_CONFIG: SiteConfig = {
  heroTitle: "Create your UGC Ads with Ai in 5 Seconds",
  heroSubtitle: "Create best conversion UGC ads in seconds using advanced AI , describe your product and watch it come to life. Join today and get 3 free generations.",
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
  plans: [
    { 
      id: 'free', 
      name: 'Free Trial', 
      price: '$0', 
      credits: 3, 
      features: [
        '1 videos / month',
        'Or Up to 3 images / month',
        'New: Sora2 and 15s / 25s HD video generation supported',
        '3 parallel tasks',
        '1080P HD Output',
        'No Watermarks',
        'No Queues and Instant Generation',
        'Access to all models',
        'Dall-E 3 - Sora2 - Chatgpt'
      ]
    },
    { 
      id: 'test', 
      name: 'Test Plan', 
      price: '$1', 
      credits: 20, 
      features: [
        'Up to 3 videos / month',
        'Or Up to 10 images / month',
        'Up to 1 Minute Ai Voice&Audio / month',
        'New: Sora2 and 15s / 25s HD video generation supported',
        '3 parallel tasks',
        '1080P HD Output',
        'No Watermarks',
        'No Queues and Instant Generation',
        'Access to all models',
        'Dall-E 3 - Sora2 - Chatgpt'
      ],
      buttonUrl: 'https://bentagroun.gumroad.com/l/bnisgtn'
    },
    { 
      id: 'basic', 
      name: 'Basic Plan', 
      price: '$9.9', 
      credits: 100, 
      features: [
        'Up to 10 videos / month',
        'Or Up to 80 images / month',
        'Up to 20 Minutes Ai Voice&Audio / month',
        'New: Sora2 and 15s / 25s HD video generation supported',
        '3 parallel tasks',
        '1080P HD Output',
        'No Watermarks',
        'No Queues and Instant Generation',
        'Access to all models',
        'Dall-E 3 - Sora2 - Chatgpt'
      ], 
      recommended: true, 
      buttonUrl: 'https://bentagroun.gumroad.com/l/huodf' 
    },
    { 
      id: 'premium', 
      name: 'Premium Plan', 
      price: '$20', 
      credits: 250, 
      features: [
        'Up to 20 videos / month',
        'Or Up to 180 images / month',
        'Up to 40 Minutes Ai Voice&Audio / month',
        'New: Sora2 and 15s / 25s HD video generation supported',
        '3 parallel tasks',
        '1080P HD Output',
        'No Watermarks',
        'No Queues and Instant Generation',
        'Access to all models',
        'Dall-E 3 - Sora2 - Chatgpt'
      ], 
      buttonUrl: 'https://bentagroun.gumroad.com/l/zrgraz' 
    }
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
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    },
    scriptToCinema: {
      title: "Script to Cinema",
      subtitle: "Professional lighting, camera moves, and textures from a single prompt.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
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

// Helper to normalize admin roles across both slug and underscore styles
const isAdminRole = (role?: string | null) => role === 'admin' || role === 'super_admin' || role === 'super-admin';

const App: React.FC = () => {
    const [showExitPopup, setShowExitPopup] = useState(false);
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


  // Show exit-intent popup for guests (not logged in)
  useEffect(() => {
    if (user) return; // Only for guests
    let popupShown = false;
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !popupShown) {
        popupShown = true;
        setShowExitPopup(true);
        console.log('[ExitIntent] Mouse leave detected, showing popup');
        sessionStorage.setItem('exit_popup_shown', '1');
      }
    };
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!popupShown && !sessionStorage.getItem('exit_popup_shown')) {
        popupShown = true;
        setShowExitPopup(true);
        console.log('[ExitIntent] beforeunload detected, showing popup');
        sessionStorage.setItem('exit_popup_shown', '1');
        // Optionally show browser dialog
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    if (!sessionStorage.getItem('exit_popup_shown')) {
      window.addEventListener('mouseout', handleMouseLeave);
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
    return () => {
      window.removeEventListener('mouseout', handleMouseLeave);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  // Log user state changes
  useEffect(() => {
    console.log('👤 User state changed:', user ? {
      email: user.email,
      isRegistered: user.isRegistered,
      isVerified: user.isVerified,
      name: user.name
    } : 'null (logged out)');
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('site_theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light', 'light-theme');
    } catch (err) {
      console.warn('Failed to enforce light theme:', err);
    }
  }, []);

  // Map URL paths to internal page names
  const getPageFromPath = (pathname: string): string => {
    const p = pathname.toLowerCase();
    const pathMap: Record<string, string> = {
      '/aiimage': 'aiimage',
      '/aivideo': 'aivideo',
      '/aivoice': 'aivoice',
      '/signup': 'signup',
      '/ai-chat': 'chat-landing',
      '/explore': 'explore',
      '/pricing': 'pricing',
      '/gallery': 'gallery',
      '/profile': 'profile',
      '/admin': 'admin',
      '/upgrade': 'upgrade',
      '/signup-success': 'signup-success',
      '/post-verify': 'post-verify',
      '/': 'home',
    };
    return pathMap[p] || 'home';
  };

  const getPathFromPage = (page: string): string => {
    const pageMap: Record<string, string> = {
      'aiimage': '/aiimage',
      'aivideo': '/aivideo',
      'aivoice': '/aivoice',
      'signup': '/signup',
      'chat-landing': '/AI-Chat',
      'explore': '/Explore',
      'pricing': '/Pricing',
      'gallery': '/GALLERY',
      'profile': '/profile',
      'admin': '/admin',
      'upgrade': '/upgrade',
      'signup-success': '/signup-success',
      'post-verify': '/post-verify',
      'home': '/',
    };
    return pageMap[page] || '/';
  };

  const [currentPage, setCurrentPage] = useState<string>(() => {
    // If app is opened via verification action URL, show the post-verify page
    try {
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/post-verify')) {
        return 'post-verify';
      }
      if (typeof window !== 'undefined' && window.location.pathname === '/signup-success') {
        return 'signup-success';
      }
      if (typeof window !== 'undefined') {
        return 'home';
      }
    } catch (e) {}
    return 'home';
  });

  // Sync URL with current page
  useEffect(() => {
    try {
      const newPath = getPathFromPage(currentPage);
      if (window.location.pathname !== newPath) {
        window.history.pushState({}, '', newPath);
      }
      // Track page view in PostHog
      trackPostHogPageView(newPath, {
        page_name: currentPage,
        user_id: user?.id,
        user_email: user?.email,
        is_registered: user?.isRegistered,
      });
    } catch (e) {
      console.warn('Failed to update URL:', e);
    }
  }, [currentPage, user]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const page = getPageFromPath(window.location.pathname);
      setCurrentPage(page);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle Google Sign-In redirect result (critical for production)
  useEffect(() => {
    let isMounted = true;
    
    // Remove Google Sign-In redirect logic that forced dashboard redirect
    return () => { isMounted = false; };
  }, []);

  // Removed auto-redirect to /aiimage - users can navigate manually from home page

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPrefillEmail, setAuthPrefillEmail] = useState<string | undefined>(undefined);
  const [isIdentityCheckActive, setIsIdentityCheckActive] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
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
          console.log('🔵 onAuthStateChanged fired! User:', fbUser?.uid ? `${fbUser.uid.substring(0, 8)}...` : 'null');
          console.log('   Provider:', fbUser?.providerData?.map(p => p.providerId).join(', ') || 'none');
          console.log('   Email:', fbUser?.email, 'Verified:', fbUser?.emailVerified);
          console.log('   Display Name:', fbUser?.displayName);
          
          if (timeoutId) { clearTimeout(timeoutId); timeoutId = undefined; }

          if (!fbUser) {
            console.log('✅ No user logged in');
            setUser(null);
            setGallery([]);
            setVideoGallery([]);
            setAudioGallery([]);
            // Reset PostHog identity on logout
            resetPostHogIdentity();
            safeSetInitFalse();
            return;
          }

          // ✅ CRITICAL: User is authenticated - this fires for BOTH popup and redirect flows
          console.log('✅ USER IS AUTHENTICATED - setting user in React state');

          // Set a lightweight user immediately so the UI can render the dashboard quickly
          const isQuickSuperAdmin = fbUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
          
          // If email is verified, clear pending_verification from localStorage
          if (fbUser.emailVerified || isQuickSuperAdmin) {
            try {
              localStorage.removeItem('pending_verification');
            } catch (e) {
              console.warn('Failed to clear pending_verification in auth listener', e);
            }
          }
          
          const quickUser: User = {
            id: fbUser.uid,
            name: (fbUser.displayName || fbUser.email?.split('@')[0] || 'Creator') as string,
            email: fbUser.email || '',
            role: isQuickSuperAdmin ? 'super_admin' : 'user',
            plan: isQuickSuperAdmin ? 'premium' : 'free',
            credits: isQuickSuperAdmin ? 99999 : 3,
            isRegistered: true,
            // For Google Sign-In, the email is always verified by Google
            // So we can safely set isVerified to true for Google-signed-in users
            isVerified: isQuickSuperAdmin || !!fbUser.emailVerified || (fbUser.providerData?.some(p => p.providerId === 'google.com') ? true : false),
            gallery: [],
          };

          setUser(quickUser);
          safeSetInitFalse();

          console.log('✅ Auth listener complete - user set in React state');
          console.log('   User will be visible in Navbar and components');
          console.log('   Next: Dashboard should render or onLoginSuccess will navigate');

          // Auto-redirect to dashboard only if user just logged in
          // Clear any login flags but don't auto-redirect - let users navigate manually
          try {
            localStorage.removeItem('google_signin_completed');
            localStorage.removeItem('post_login_target');
          } catch (_) {}

          // Perform heavier profile/entitlements fetches in the background and update the user when ready
          (async () => {
          // Identify user in PostHog
          identifyUser(fbUser.uid, {
            email: fbUser.email || 'unknown',
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Creator',
            isVerified: quickUser.isVerified,
            plan: quickUser.plan,
            role: quickUser.role,
            provider: fbUser.providerData?.map(p => p.providerId).join(', ') || 'unknown',
          });

            try {
              const profile = await getUserProfile(fbUser.uid);

              // Grant entitlements when verified or for the super-admin regardless of verification
              // Also grant for Google Sign-In users since they're pre-verified by Google
              try {
                const { grantDefaultEntitlements } = await import('./services/firebase');
                const isGoogleUser = fbUser.providerData?.some(p => p.providerId === 'google.com') ?? false;
                if ((fbUser.emailVerified || isGoogleUser || fbUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) && !(profile?.entitlements?.image)) {
                  grantDefaultEntitlements(fbUser.uid).catch((err) => console.warn('Failed to grant entitlements on auth bg task', err));
                }
              } catch (err) {
                console.warn('Failed to import grantDefaultEntitlements', err);
              }

              const isSuperAdmin = fbUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
              const isGoogleUser = fbUser.providerData?.some(p => p.providerId === 'google.com') ?? false;

              const updatedUser: User = {
                id: fbUser.uid,
                name: (fbUser.displayName || profile?.name || fbUser.email?.split('@')[0] || 'Creator') as string,
                email: fbUser.email || '',
                role: isSuperAdmin ? 'super_admin' : (profile?.role || 'user'),
                plan: isSuperAdmin ? 'premium' : (profile?.plan || 'free'),
                credits: isSuperAdmin ? 99999 : (profile?.credits ?? 3),
                isRegistered: true,
                // Auto-verify Google Sign-In users (Google email is always verified)
                // Also verify super-admin and users with confirmed emails or profiles marked as verified
                isVerified: isSuperAdmin || isGoogleUser || !!fbUser.emailVerified || !!profile?.verified,
                gallery: [],
                audioGallery: [],
              };

              setUser(updatedUser);
              
              // Load galleries from BOTH Supabase AND Firebase, then merge
              try {
                const { getImagesFromDB, getVideosFromDB, getAudioFromDB } = await import('./services/dbService');
                const { getImagesFromFirebase, getVideosFromFirebase, getAudioFromFirebase } = await import('./services/firebase');
                
                console.log('🔄 Loading galleries for user:', fbUser.uid);
                
                const [supaImages, supaVideos, supaAudios, fbImages, fbVideos, fbAudios] = await Promise.all([
                  getImagesFromDB(fbUser.uid),
                  getVideosFromDB(fbUser.uid),
                  getAudioFromDB(fbUser.uid),
                  getImagesFromFirebase(fbUser.uid),
                  getVideosFromFirebase(fbUser.uid),
                  getAudioFromFirebase(fbUser.uid)
                ]);

                console.log('📊 Loaded images:', { 
                  supabase: supaImages.length, 
                  firebase: fbImages.length 
                });

                // Merge unique items from both sources
                const mergeUnique = <T extends { id: string }>(arr1: T[], arr2: T[]) => {
                  const map = new Map<string, T>();
                  [...arr1, ...arr2].forEach(item => map.set(item.id, item));
                  return Array.from(map.values()).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
                };

                const mergedImages = mergeUnique(supaImages, fbImages);
                console.log('✅ Merged images total:', mergedImages.length);
                
                setGallery(mergedImages);
                setVideoGallery(mergeUnique(supaVideos, fbVideos));
                setAudioGallery(mergeUnique(supaAudios, fbAudios));
              } catch (err) {
                console.error('❌ Failed to load galleries:', err);
              }

              // Admins: fetch all users but don't block UI
              if (isAdminRole(updatedUser.role)) {
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
          trackPageView(window.location.pathname);
        } catch (e) {
          // ignore
        }
      };
      track();
    } catch (e) {
      // ignore
    }
  }, [currentPage, user]);

  useEffect(() => {
    try {
      if (user?.id) setAnalyticsUserId(user.id);
    } catch (e) {
      /* noop */
    }
  }, [user?.id]);

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
    // Optimistically update local state so UI reflects changes immediately
    setAllUsers(prev => prev.map(p => p.id === u.id ? u : p));

    try {
      const { updateUserProfile, updateUserCredits } = await import('./services/dbService');
      await updateUserProfile(u.id, { name: u.name, email: u.email, plan: u.plan, status: u.status });
      await updateUserCredits(u.id, u.credits);
    } catch (e) {
      // Keep UI state; just log to avoid confusing double alerts
      console.warn('Failed to persist user update:', e);
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

  // When user completes verification and comes back, ensure they land on dashboard
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const gotoParam = params.get('goto');
      const verifiedParam = params.get('verified');
      const loginParam = params.get('login');
      
      // If login parameter is set, open the auth modal
      if (loginParam === 'true') {
        setIsAuthModalOpen(true);
        // Clean up URL param
        params.delete('login');
        const search = params.toString();
        const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
      
      // If user just verified, force reload auth state and clean up
      if (gotoParam === 'dashboard' && verifiedParam === '1') {
        // Clean up pending verification from localStorage immediately
        try {
          localStorage.removeItem('pending_verification');
        } catch (e) {
          console.warn('Failed to clear pending_verification', e);
        }
        
        // Force reload Firebase auth state to get updated emailVerified status
        if (auth.currentUser) {
          auth.currentUser.reload().then(() => {
            console.log('Auth state reloaded after verification');
            // The onAuthStateChanged listener will trigger and update the user object
          }).catch((err) => {
            console.warn('Failed to reload auth state', err);
          });
        }
        
        // Navigate to dashboard
        setCurrentPage('dashboard');
        
        // Clean up URL params
        params.delete('goto');
        params.delete('verified');
        const search = params.toString();
        const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    } catch (e) {
      console.warn('verification redirect handler error', e);
    }
  }, []); // Run once on mount

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

  // Handle credit deduction for generation operations
  const handleCreditUsed = async () => {
    if (!user) return;
    
    // Premium users have unlimited credits
    if (user.plan === 'premium') return;
    
    try {
      const newCredits = Math.max(0, user.credits - 1);
      
      // Update local state immediately for responsive UI
      setUser(prev => prev ? { ...prev, credits: newCredits } : null);
      
      // Update in both Firebase and Supabase in the background
      try {
        const { deductCreditInFirebase } = await import('./services/firebase');
        await deductCreditInFirebase(user.id);
      } catch (err) {
        console.warn('Failed to update credits in Firebase:', err);
      }
      
      try {
        const { updateUserCredits } = await import('./services/dbService');
        await updateUserCredits(user.id, newCredits);
      } catch (err) {
        console.warn('Failed to update credits in Supabase:', err);
      }

      // If credits reach 0, redirect to pricing landing page
      if (newCredits === 0) {
        setTimeout(() => {
          setCurrentPage('pricing-landing');
        }, 500);
      }
    } catch (err) {
      console.error('Credit deduction error:', err);
    }
  };

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
    // If the plan has a buttonUrl (external purchase link), open it directly
    if (plan.buttonUrl) {
      window.open(plan.buttonUrl, '_blank');
      return;
    }

    // If guest selects free plan, send to signup page
    if (!user && plan.id === 'free') {
      setCurrentPage('signup');
      return;
    }

    // For other plans, require authentication
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (user.plan === 'free' && plan.id !== 'free') {
      setCurrentPage('upgrade');
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
            <button 
              onClick={() => setCurrentPage('home')}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Return Home
            </button>
          </div>
        </div>
      );
    }
    if (currentPage === 'signup-success') {
      return <SignupSuccess />;
    }
    // Fix: Ensure correct page loads for AI VIDEO, AI IMAGE, Pricing
    if (currentPage === 'aiimage') {
      return <AIImageLanding user={user} onStartCreating={() => setCurrentPage('dashboard')} onLoginClick={() => setIsAuthModalOpen(true)} hasApiKey={hasApiKey} onSelectKey={() => {}} onResetKey={() => {}} />;
    }
    if (currentPage === 'aivideo') {
      return <VideoLabLanding user={user} config={siteConfig.videoLab} onStartCreating={() => setCurrentPage('video-generator')} onLoginClick={() => setIsAuthModalOpen(true)} hasApiKey={hasApiKey} onSelectKey={() => {}} onResetKey={() => {}} />;
    }
    if (currentPage === 'pricing') {
      return <PricingLanding plans={siteConfig.plans} onSelectPlan={handleSelectPlan} />;
    }
    // Add fallback for PricingLanding if credits reach 0
    if (currentPage === 'pricing-landing') {
      return <PricingLanding plans={siteConfig.plans} onSelectPlan={handleSelectPlan} />;
    }
    // Other main pages
    switch (currentPage) {
      case 'profile':
        if (!user) { setCurrentPage('home'); setIsAuthModalOpen(true); return null; }
        return <UserProfile 
          user={user}
          gallery={gallery}
          videoGallery={videoGallery}
          audioGallery={audioGallery}
          onLogout={handleLogout}
          onBack={() => setCurrentPage('home')}
          onUpdateUser={setUser}
          onGalleryImport={(images) => setGallery(images)}
          onNavigate={setCurrentPage}
          initialContactOpen={openContactFromUpgrade}
          initialInboxOpen={openInboxFromDropdown}
        />;
      case 'chat-landing':
        return <ChatLanding user={user} onStartChat={() => { if (!user) { setIsAuthModalOpen(true); return; } setIsChatOpen(true); }} onLoginClick={() => setIsAuthModalOpen(true)} />;
      case 'tts-lab-landing':
        return <TTSLanding user={user} config={siteConfig.ttsLab} onStartCreating={() => setCurrentPage('tts-generator')} onCreditUsed={handleCreditUsed} onUpgradeRequired={() => setIsUpgradeModalOpen(true)} onLoginClick={() => setIsAuthModalOpen(true)} onAudioGenerated={(aud) => { setAudioGallery(p => [aud, ...p]); if (user?.id) saveAudioToDB(aud, user.id); }} hasApiKey={hasApiKey} onSelectKey={() => {}} onResetKey={() => {}} />;
      case 'aivoice':
        return <TTSLanding user={user} config={siteConfig.ttsLab} onStartCreating={() => setCurrentPage('tts-generator')} onCreditUsed={handleCreditUsed} onUpgradeRequired={() => setIsUpgradeModalOpen(true)} onLoginClick={() => setIsAuthModalOpen(true)} onAudioGenerated={(aud) => { setAudioGallery(p => [aud, ...p]); if (user?.id) saveAudioToDB(aud, user.id); }} hasApiKey={hasApiKey} onSelectKey={() => {}} onResetKey={() => {}} />;
      case 'tts-generator':
        return <TTSGenerator 
          user={user} 
          onCreditUsed={() => { if (!user) { setIsAuthModalOpen(true); return; } handleCreditUsed(); }} 
          onUpgradeRequired={() => { if (!user) { setIsAuthModalOpen(true); return; } setIsUpgradeModalOpen(true); }} 
          onAudioGenerated={(aud) => { setAudioGallery(p => [aud, ...p]); if (user?.id) saveAudioToDB(aud, user.id); }} 
          hasApiKey={hasApiKey} 
          onSelectKey={() => {}} 
          onResetKey={() => {}} 
        />;
      case 'gallery':
        if (!user && !isInitializing) { setCurrentPage('home'); setIsAuthModalOpen(true); return null; }
        if (isInitializing) return null; // Wait for auth to complete
        return <Gallery images={gallery} videos={videoGallery} audioGallery={audioGallery} onDelete={() => {}} />;
      case 'explore':
        return <ExplorePage user={user} images={gallery} videos={videoGallery} siteConfig={siteConfig} onNavigate={setCurrentPage} />;
      case 'admin':
        // ...existing admin logic...
        if (!user || !isAdminRole(user.role)) {
          // ...existing access denied logic...
        }
        // ...existing admin dashboard logic...
        break;
      case 'signup':
        return <SignUp />;
      // Add other cases as needed
      default:
        // Always show HomeLanding for home page and fallback
        return <HomeLanding 
          onSubmitPrompt={(promptText) => { setInitialPrompt(promptText); setCurrentPage('dashboard'); }}
          onGoToImage={() => setCurrentPage('dashboard')}
          onGoToVideo={() => setCurrentPage('video-generator')}
          onGoToWebsite={() => setCurrentPage('chat-landing')}
          onGoToAudio={() => setCurrentPage('tts-generator')}
        />;
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white text-gray-900 flex flex-col items-center justify-center">
        <Sparkles className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        {authInitTimedOut ? (
          <div className="text-center max-w-md space-y-4 px-6">
            <p className="text-rose-600 font-semibold leading-relaxed">Authentication initialization timed out. The app couldn't connect to Firebase Auth.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-500">Retry</button>
              <button onClick={() => setIsInitializing(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-white">Continue (limited)</button>
            </div>
          </div>
        ) : (
          <p className="text-indigo-600 font-black uppercase tracking-[0.3em] text-[10px]">Initializing Neural Link...</p>
        )}
      </div>
    );
  }

  return (
      <LanguageProvider>
        <div className={`min-h-screen transition-colors duration-300 ${
          currentPage === 'admin'
            ? '' /* No theme class for admin - uses inline styles */
            : 'landing-theme bg-gradient-to-b from-white via-gray-50 to-white text-gray-900'
        }`}>
        {showExitPopup && (
          <ExitIntentPopup
            onClose={() => setShowExitPopup(false)}
            onSignup={() => {
              setShowExitPopup(false);
              setCurrentPage('signup');
            }}
          />
        )}
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onLoginClick={() => setIsAuthModalOpen(true)} 
        onNavigate={setCurrentPage} 
        currentPage={currentPage} 
        customMenu={[]} 
        onUpgradeClick={() => setIsUpgradeModalOpen(true)}
        onOpenInbox={() => setOpenInboxFromDropdown(true)}
      />
      <main className={`pt-16 ${currentPage === 'admin' ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen' : ''}`}>
        {renderPage()}
      </main>

      <FacebookGroupFloatingButton />
      <WhatsAppWidget phoneNumber="2120630961392" message="Hello! I would like to know more about ImaginAI services." />
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => { setIsAuthModalOpen(false); setAuthPrefillEmail(undefined); }}
        onLoginSuccess={() => { 
          console.log('✅ onLoginSuccess called - closing modal and navigating to dashboard');
          console.log('   Current auth.currentUser:', auth.currentUser ? `${auth.currentUser.email}` : 'null');
          
          setIsAuthModalOpen(false); 
          setAuthPrefillEmail(undefined); 
          
          // Navigate to dashboard immediately
          // The auth listener should have already set the user by now (we waited 1000ms in AuthModal)
          setTimeout(() => {
            console.log('✅ About to navigate to dashboard');
            console.log('   Auth.currentUser:', auth.currentUser ? auth.currentUser.email : 'null');
            console.log('   React user state:', user ? user.email : 'null');
            
            // If auth listener hasn't fired yet, manually set the user
            if (!user && auth.currentUser) {
              console.warn('⚠️ Auth listener may not have fired - manually setting user from auth.currentUser');
              const fbUser = auth.currentUser;
              const quickUser: User = {
                id: fbUser.uid,
                name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Creator',
                email: fbUser.email || '',
                role: 'user',
                plan: 'free',
                credits: 3,
                isRegistered: true,
                isVerified: fbUser.emailVerified || (fbUser.providerData?.some(p => p.providerId === 'google.com') ? true : false),
                gallery: [],
              };
              setUser(quickUser);
              console.log('✅ Manually set user:', quickUser.email);
            }
            
            // Check if we should navigate to a specific page after login
            try {
              const params = new URLSearchParams(window.location.search);
              const gotoParam = params.get('goto');
              const verifiedParam = params.get('verified');
              
              if (gotoParam === 'dashboard' || verifiedParam === '1') {
                setCurrentPage('dashboard');
                
                // Clean up pending verification from localStorage
                if (verifiedParam === '1') {
                  try {
                    localStorage.removeItem('pending_verification');
                  } catch (e) {
                    console.warn('Failed to clear pending_verification', e);
                  }
                  
                  // Force reload Firebase auth state to ensure emailVerified is up to date
                  if (auth.currentUser) {
                    auth.currentUser.reload().then(() => {
                      console.log('Auth state reloaded after login following verification');
                    }).catch((err) => {
                      console.warn('Failed to reload auth state after login', err);
                    });
                  }
                }
                
                // Clean up URL params
                params.delete('goto');
                params.delete('openAuth');
                params.delete('email');
                params.delete('verified');
                const search = params.toString();
                const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
                window.history.replaceState({}, '', newUrl);
              } else {
                setCurrentPage('dashboard');
              }
            } catch (e) {
              setCurrentPage('dashboard');
            }
          }, 0);
        }}
        initialEmail={authPrefillEmail}
      />
      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        onSelectPlan={() => setIsUpgradeModalOpen(false)} 
      />
      
      {/* Facebook Group Popup removed, only floating button remains */}
      </div>
    </LanguageProvider>
  );
};

export default App;