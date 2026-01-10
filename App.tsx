import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { HomeLanding } from './components/HomeLanding.tsx';
import { Pricing } from './components/Pricing.tsx';
import { PricingLanding } from './components/PricingLanding.tsx';
import { Generator } from './components/Generator.tsx';
import { VideoLabLanding } from './components/VideoLabLanding.tsx';
import { VideoGenerator } from './components/VideoGenerator.tsx';
import { TTSGenerator } from './components/TTSGenerator.tsx';
import { TTSLanding } from './components/TTSLanding.tsx';
import { ChatLanding } from './components/ChatLanding.tsx';
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
import { ContactPanel } from './components/ContactPanel.tsx';
import { ChatWidget } from './components/ChatWidget.tsx';
import { WhatsAppWidget } from './components/WhatsAppWidget.tsx';
import SignUp from './components/SignUp.tsx';
import PostVerify from './components/PostVerify';
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

// Helper to normalize admin roles across both slug and underscore styles
const isAdminRole = (role?: string | null) => role === 'admin' || role === 'super_admin' || role === 'super-admin';

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
      '/dashboard': 'dashboard',
      '/ai-image': 'dashboard',
      '/ai-video': 'video-generator',
      '/ai-voice': 'tts-generator',
      '/ai-chat': 'chat-landing',
      '/explore': 'explore',
      '/pricing': 'pricing',
      '/gallery': 'gallery',
      '/profile': 'profile',
      '/admin': 'admin',
      '/upgrade': 'upgrade',
      '/signup': 'signup',
      '/post-verify': 'post-verify',
      '/': 'home',
    };
    return pathMap[p] || 'home';
  };

  const getPathFromPage = (page: string): string => {
    const pageMap: Record<string, string> = {
      'dashboard': '/dashboard',
      'video-generator': '/AI-Video',
      'tts-generator': '/AI-Voice',
      'chat-landing': '/AI-Chat',
      'explore': '/Explore',
      'pricing': '/Pricing',
      'gallery': '/GALLERY',
      'profile': '/profile',
      'admin': '/admin',
      'upgrade': '/upgrade',
      'signup': '/signup',
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
      // Support '?goto=dashboard' redirection after verification
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('goto') === 'dashboard') return 'dashboard';
        
        // If we just completed Google sign-in, always go to dashboard
        try {
          const googleSigninCompleted = localStorage.getItem('google_signin_completed');
          if (googleSigninCompleted === 'true') {
            console.log('🔵 Detected completed Google sign-in - starting on dashboard');
            localStorage.removeItem('google_signin_completed');
            return 'dashboard';
          }
        } catch {}
        
        // If we just signed in, honor a stored post-login target
        try {
          const target = localStorage.getItem('post_login_target');
          if (target === 'dashboard') {
            // Clear flag and go to dashboard
            localStorage.removeItem('post_login_target');
            return 'dashboard';
          }
        } catch {}
        
        // Get page from URL pathname
        return getPageFromPath(window.location.pathname);
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
    } catch (e) {
      console.warn('Failed to update URL:', e);
    }
  }, [currentPage]);

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
    
    const handleRedirectResult = async () => {
      try {
        console.log('🔵 Checking for Google Sign-In redirect result...');
        const { handleGoogleSignInRedirect } = await import('./services/firebase');
        const result = await handleGoogleSignInRedirect();
        
        if (!isMounted) return;
        
        if (result?.user) {
          console.log('✅ Google Sign-In redirect successful! User:', result.user.email);
          console.log('🎯 FORCING NAVIGATION TO DASHBOARD after Google OAuth');

          // Set a lightweight user immediately to avoid auth modal flicker
          try {
            const fbUser = result.user;
            const isQuickSuperAdmin = (fbUser.email || '').toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
            const quickUser: User = {
              id: fbUser.uid,
              name: (fbUser.displayName || fbUser.email?.split('@')[0] || 'Creator') as string,
              email: fbUser.email || '',
              role: isQuickSuperAdmin ? 'super_admin' : 'user',
              plan: isQuickSuperAdmin ? 'premium' : 'free',
              credits: isQuickSuperAdmin ? 99999 : 3,
              isRegistered: true,
              isVerified: isQuickSuperAdmin || !!fbUser.emailVerified || (fbUser.providerData?.some(p => p.providerId === 'google.com') ? true : false),
              gallery: [],
            };
            setUser(quickUser);
          } catch (e) {
            console.warn('Failed to set quick user from redirect result', e);
          }

          // Immediately navigate to dashboard to avoid landing back on login/signup
          try { 
            localStorage.setItem('post_login_target', 'dashboard'); 
            localStorage.setItem('google_signin_completed', 'true');
          } catch {}

          // Force page state to dashboard
          setCurrentPage('dashboard');

          // Ensure URL reflects dashboard path in case route state was home
          try {
            const newPath = '/dashboard';
            if (window.location.pathname !== newPath) {
              console.log('🔄 Replacing URL from', window.location.pathname, 'to', newPath);
              window.history.replaceState({}, '', newPath);
            }
          } catch (e) { console.warn('Failed to replace URL after redirect', e); }
        } else if (result?.error) {
          console.error('❌ Google Sign-In redirect error:', result.error);
        } else {
          console.log('ℹ️ No redirect result found (first page load or no pending redirect)');
        }
      } catch (err) {
        console.warn('Redirect result handler error:', err);
      }
    };

    handleRedirectResult();
    
    return () => { isMounted = false; };
  }, []);

  // After initialization, if we already have an authenticated session, enforce dashboard route
  useEffect(() => {
    if (isInitializing) return;
    try {
      const fbUser = auth.currentUser;
      if (fbUser && currentPage !== 'dashboard' && currentPage !== 'profile' && currentPage !== 'admin') {
        console.log('✅ Session detected post-init, routing to /dashboard');
        setCurrentPage('dashboard');
        try {
          if (window.location.pathname !== '/dashboard') {
            window.history.replaceState({}, '', '/dashboard');
          }
        } catch (e) { console.warn('Failed to update URL after session restore', e); }
      }
    } catch (e) {
      console.warn('Post-init session route check failed', e);
    }
  }, [isInitializing, currentPage]);

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

          // Ensure authenticated users land on the dashboard (especially after Google OAuth redirect)
          try {
            const isGoogleUser = fbUser.providerData?.some(p => p.providerId === 'google.com') ?? false;
            const shouldGoDashboard = isGoogleUser || !!fbUser.email || !!fbUser.uid;
            
            if (shouldGoDashboard && currentPage !== 'dashboard' && currentPage !== 'profile' && currentPage !== 'admin') {
              console.log('🎯 Auth listener forcing navigation to dashboard (current page:', currentPage, ')');
              setTimeout(() => setCurrentPage('dashboard'), 100); // Slight delay to ensure state is ready
              try {
                if (window.location.pathname !== '/dashboard') {
                  window.history.replaceState({}, '', '/dashboard');
                }
              } catch (_) {}
            }
          } catch (_) {}

          // Perform heavier profile/entitlements fetches in the background and update the user when ready
          (async () => {
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

    // For free plan or plans without buttonUrl, require authentication
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
          <HomeLanding 
            onSubmitPrompt={(promptText) => { setInitialPrompt(promptText); setCurrentPage('dashboard'); }}
            onGoToImage={() => setCurrentPage('dashboard')}
            onGoToVideo={() => setCurrentPage('video-generator')}
            onGoToWebsite={() => setCurrentPage('chat-landing')}
            onGoToAudio={() => setCurrentPage('tts-generator')}
          />
        );
      case 'dashboard':
        return (
          <Generator 
            user={user} 
            gallery={gallery} 
            onCreditUsed={handleCreditUsed} 
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
        return <VideoGenerator 
          user={user} 
          onCreditUsed={() => { if (!user) { setIsAuthModalOpen(true); return; } handleCreditUsed(); }} 
          onUpgradeRequired={() => { if (!user) { setIsAuthModalOpen(true); return; } setIsUpgradeModalOpen(true); }} 
          onVideoGenerated={(video) => { setVideoGallery(p => [video, ...p]); if (user?.id) saveVideoToDB(video, user.id); }} 
          hasApiKey={hasApiKey} 
          onSelectKey={() => {}} 
          onResetKey={() => {}} 
        />;
      case 'chat-landing':
        return <ChatLanding user={user} onStartChat={() => { if (!user) { setIsAuthModalOpen(true); return; } setIsChatOpen(true); }} onLoginClick={() => setIsAuthModalOpen(true)} />;
      case 'tts-lab-landing':
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
      case 'pricing':
        return <PricingLanding plans={siteConfig.plans} onSelectPlan={handleSelectPlan} />;
      case 'admin':
        console.group('👤 ADMIN PAGE ACCESS ATTEMPT');
        console.log('User object:', user ? { 
          id: user.id.substring(0, 8), 
          email: user.email, 
          role: user.role,
          isRegistered: user.isRegistered,
          isVerified: user.isVerified
        } : '❌ NULL');
        console.log('isAdminRole check:', user ? isAdminRole(user.role) : 'N/A');
        console.log('allUsers loaded:', allUsers.length, 'users');
        console.groupEnd();
        
        if (!user || !isAdminRole(user.role)) {
          console.warn('❌ ADMIN ACCESS DENIED - Rendering access denied screen');
          return (
            <div className="min-h-screen flex items-center justify-center p-6 text-center animate-fade-in" style={{ background: '#111827' }}>
              <div className="max-w-md w-full p-12 rounded-3xl border border-red-500/20 shadow-2xl relative overflow-hidden" style={{ background: '#1f2937' }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl rounded-full -mr-16 -mt-16" />
                <div className="w-20 h-20 bg-red-600/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                   <ShieldAlert className="w-10 h-10 text-red-400" />
                </div>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">Access Denied</h2>
                <p className="text-gray-400 font-medium leading-relaxed mb-8">
                  You do not have permission to access the Control Center. <br />
                  <strong>Admin privileges required.</strong>
                  {user && <span className="block mt-4 text-sm text-red-400">Your role: {user.role || 'none'}</span>}
                </p>
                <button 
                  onClick={() => setCurrentPage('home')}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Return Home
                </button>
              </div>
            </div>
          );
        }
        
        console.log('✅ ADMIN ACCESS GRANTED - Rendering AdminDashboard');
        return <AdminDashboard users={allUsers} siteConfig={siteConfig} onUpdateConfig={setSiteConfig} onDeleteUser={handleDeleteUser} onUpdateUser={handleUpdateUser} onSendMessageToUser={handleSendMessageToUser} onBroadcastMessage={handleBroadcastMessage} onSupportReply={() => {}} hasApiKey={hasApiKey} onSelectKey={() => {}} onSyncFirebase={handleSyncFirebaseUsers} />;
      case 'profile':
        return user ? <UserProfile user={user} gallery={gallery} videoGallery={videoGallery} audioGallery={audioGallery} onLogout={handleLogout} onBack={() => setCurrentPage('home')} onUpdateUser={() => {}} onGalleryImport={() => {}} onNavigate={setCurrentPage} initialContactOpen={openContactFromUpgrade} initialInboxOpen={openInboxFromDropdown} /> : null;
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

      {/* Contact Panel - WhatsApp + Support Chat */}
      <ContactPanel 
        onWhatsAppClick={() => {
          // Open WhatsApp directly
          const phoneNumber = '2120630961392';
          const message = encodeURIComponent('Hello! I would like to know more about ImaginAI services.');
          window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
        }}
        onChatClick={() => setIsChatOpen(true)}
      />

      {/* Support Chat Widget - Only show on home page for guests, hide for logged-in users and on chat-landing */}
      {(currentPage === 'home' && !user) && (
        <ChatWidget user={user} isOpen={isChatOpen} setIsOpen={setIsChatOpen} hideLauncher={false} />
      )}
      {/* On other pages (including chat-landing), use hidden launcher variant controlled only by ContactPanel */}
      {currentPage !== 'home' && (
        <ChatWidget user={user} isOpen={isChatOpen} setIsOpen={setIsChatOpen} hideLauncher={true} />
      )}
      
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
      </div>
    </LanguageProvider>
  );
};

export default App;