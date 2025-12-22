import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { Pricing } from './components/Pricing.tsx';
import { Generator } from './components/Generator.tsx';
import { VideoGenerator } from './components/VideoGenerator.tsx';
import { VideoLabLanding } from './components/VideoLabLanding.tsx';
import { TTSGenerator } from './components/TTSGenerator.tsx';
import { TTSLanding } from './components/TTSLanding.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { UpgradeModal } from './components/UpgradeModal.tsx';
import { Gallery } from './components/Gallery.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { UserProfile } from './components/UserProfile.tsx';
import { Showcase } from './components/Showcase.tsx';
import { MultimodalSection } from './components/MultimodalSection.tsx';
import { ChatWidget } from './components/ChatWidget.tsx';
import { User, GeneratedImage, GeneratedVideo, GeneratedAudio, SiteConfig } from './types.ts';
import { supabase } from './services/supabase.ts';
import { 
  getImagesFromDB, saveImageToDB, getVideosFromDB, 
  saveVideoToDB, getAudioFromDB, saveAudioToDB, getAllUsersFromDB
} from './services/dbService.ts';
import { Sparkles, RefreshCw, ArrowLeft, ShieldAlert } from 'lucide-react';

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
    { id: 'basic', name: 'Basic Creator', price: '$9.9', credits: 50, features: ['50 Generations / mo', 'Private Gallery'], recommended: true, buttonUrl: 'https://bentagroun.gumroad.com/l/huodf' },
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
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    try { 
      const saved = localStorage.getItem(CONFIG_KEY); 
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG; 
    } catch (e) { return DEFAULT_CONFIG; }
  });

  const [currentPage, setCurrentPage] = useState<string>('home');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      const anyWindow = window as any;
      if (anyWindow.aistudio && typeof anyWindow.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await anyWindow.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    const syncUserProfile = async (supabaseUser: any) => {
      if (!supabaseUser) {
        setUser(null);
        setIsInitializing(false);
        return;
      }

      // STRICT VERIFICATION CHECK: Query Supabase directly for the latest confirmation status
      const { data: { user: freshUser } } = await supabase.auth.getUser();
      const isSuperAdmin = freshUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      
      // If user exists but email is not confirmed, force logout and verification screen
      if (freshUser && !freshUser.email_confirmed_at && !isSuperAdmin) {
        await supabase.auth.signOut();
        setUser(null);
        setCurrentPage('verify-email');
        setIsInitializing(false);
        return;
      }

      try {
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .maybeSingle();

        if (!profile) {
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert([{
              id: supabaseUser.id,
              full_name: supabaseUser.user_metadata?.full_name || 'Creator',
              email: supabaseUser.email,
              credits: 3,
              plan: 'free',
              role: 'user'
            }])
            .select()
            .single();
          profile = newProfile;
        }

        const userData: User = {
          id: supabaseUser.id,
          name: profile?.full_name || 'Creator',
          email: supabaseUser.email!,
          role: isSuperAdmin ? 'admin' : (profile?.role || 'user'),
          plan: isSuperAdmin ? 'premium' : (profile?.plan || 'free'),
          credits: isSuperAdmin ? 99999 : (profile?.credits ?? 3),
          isRegistered: true,
          isVerified: true,
          gallery: [],
        };
        
        setUser(userData);
        setIsInitializing(false);

        const images = await getImagesFromDB(supabaseUser.id);
        const videos = await getVideosFromDB(supabaseUser.id);
        const audios = await getAudioFromDB(supabaseUser.id);
        
        setGallery(images);
        setVideoGallery(videos);
        setAudioGallery(audios);
        
        if (userData.role === 'admin') {
          const users = await getAllUsersFromDB();
          setAllUsers(users);
        }
      } catch (err) {
        console.error("Critical sync error", err);
        setIsInitializing(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        syncUserProfile(session?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setGallery([]);
        setVideoGallery([]);
        setAudioGallery([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentPage('home');
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
          <>
            <Hero 
              onGetStarted={() => setIsAuthModalOpen(true)} 
              onGenerate={(p) => { setInitialPrompt(p); if (user) setCurrentPage('dashboard'); else setIsAuthModalOpen(true); }} 
              title={siteConfig.heroTitle} 
              subtitle={siteConfig.heroSubtitle} 
              slideshowImages={siteConfig.slideshow} 
            />
            <MultimodalSection onNavigate={setCurrentPage} onLoginClick={() => setIsAuthModalOpen(true)} isRegistered={!!user} />
            <Showcase images={siteConfig.showcaseImages} />
            <Pricing plans={siteConfig.plans} onSelectPlan={() => setIsAuthModalOpen(true)} />
          </>
        );
      case 'dashboard':
        if (!user) { setCurrentPage('home'); setIsAuthModalOpen(true); return null; }
        return <Generator user={user} gallery={gallery} onCreditUsed={() => {}} onUpgradeRequired={() => setIsUpgradeModalOpen(true)} onImageGenerated={(img) => { setGallery(p => [img, ...p]); saveImageToDB(img, user!.id); }} initialPrompt={initialPrompt} />;
      case 'video-lab-landing':
        return <VideoLabLanding user={user} config={siteConfig.videoLab} onStartCreating={() => setCurrentPage('video-generator')} onLoginClick={() => setIsAuthModalOpen(true)} hasApiKey={hasApiKey} onSelectKey={() => {}} onResetKey={() => {}} />;
      case 'video-generator':
        if (!user) { setCurrentPage('home'); setIsAuthModalOpen(true); return null; }
        return <VideoGenerator user={user} onCreditUsed={() => {}} onUpgradeRequired={() => setIsUpgradeModalOpen(true)} onVideoGenerated={(vid) => { setVideoGallery(p => [vid, ...p]); saveVideoToDB(vid, user!.id); }} hasApiKey={hasApiKey} onSelectKey={() => {}} onResetKey={() => {}} />;
      case 'tts-lab-landing':
        return <TTSLanding user={user} config={siteConfig.ttsLab} onStartCreating={() => setCurrentPage('tts-generator')} onLoginClick={() => setIsAuthModalOpen(true)} hasApiKey={hasApiKey} onSelectKey={() => {}} onResetKey={() => {}} />;
      case 'tts-generator':
        if (!user) { setCurrentPage('home'); setIsAuthModalOpen(true); return null; }
        return <TTSGenerator user={user} onCreditUsed={() => {}} onUpgradeRequired={() => setIsUpgradeModalOpen(true)} onAudioGenerated={(aud) => { setAudioGallery(p => [aud, ...p]); saveAudioToDB(aud, user!.id); }} hasApiKey={hasApiKey} onSelectKey={() => {}} onResetKey={() => {}} />;
      case 'gallery':
        if (!user) { setCurrentPage('home'); setIsAuthModalOpen(true); return null; }
        return <Gallery images={gallery} videos={videoGallery} audioGallery={audioGallery} onDelete={() => {}} />;
      case 'admin':
        return user?.role === 'admin' ? <AdminDashboard users={allUsers} siteConfig={siteConfig} onUpdateConfig={setSiteConfig} onDeleteUser={() => {}} onUpdateUser={() => {}} onSendMessageToUser={() => {}} onBroadcastMessage={() => {}} onSupportReply={() => {}} hasApiKey={hasApiKey} onSelectKey={() => {}} /> : null;
      case 'profile':
        return user ? <UserProfile user={user} gallery={gallery} videoGallery={videoGallery} audioGallery={audioGallery} onLogout={handleLogout} onBack={() => setCurrentPage('home')} onUpdateUser={() => {}} onGalleryImport={() => {}} /> : null;
      default:
        return null;
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center">
        <Sparkles className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px]">Initializing Neural Link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onLoginClick={() => setIsAuthModalOpen(true)} 
        onNavigate={setCurrentPage} 
        currentPage={currentPage} 
        customMenu={[]} 
        onUpgradeClick={() => setIsUpgradeModalOpen(true)}
      />
      <main className="pt-16">
        {renderPage()}
      </main>

      <ChatWidget user={user} isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLoginSuccess={() => { setIsAuthModalOpen(false); if (user) setCurrentPage('dashboard'); }} 
      />
      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        onSelectPlan={() => setIsUpgradeModalOpen(false)} 
      />
    </div>
  );
};

export default App;