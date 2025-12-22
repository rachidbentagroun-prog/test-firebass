
import React from 'react';
import { Sparkles, Zap, Shield, User as UserIcon, Image as ImageIcon, Menu, X, Video, Compass, Home, Mic2, Bell, CreditCard } from 'lucide-react';
import { User, NavItem } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onLoginClick: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  customMenu: NavItem[];
  logoUrl?: string;
  onUpgradeClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onLoginClick, onNavigate, currentPage, customMenu, logoUrl, onUpgradeClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleNavClick = (pageOrUrl: string) => {
    if (pageOrUrl.startsWith('http')) {
      window.open(pageOrUrl, '_blank');
    } else if (pageOrUrl.startsWith('/')) {
        onNavigate(pageOrUrl.substring(1));
    } else {
        onNavigate(pageOrUrl);
    }
    setIsMobileMenuOpen(false);
  };

  const handlePricingClick = () => {
    if (currentPage === 'home') {
      const element = document.getElementById('pricing-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setIsMobileMenuOpen(false);
        return;
      }
    }
    
    onNavigate('home');
    
    setTimeout(() => {
      const element = document.getElementById('pricing-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    
    setIsMobileMenuOpen(false);
  };

  const handleAIImageClick = () => {
    if (user?.isRegistered) {
      onNavigate('dashboard');
      setIsMobileMenuOpen(false);
      return;
    }

    if (currentPage === 'home') {
      const element = document.getElementById('hero-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setIsMobileMenuOpen(false);
        return;
      }
    }

    onNavigate('home');
    
    setTimeout(() => {
      const element = document.getElementById('hero-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    
    setIsMobileMenuOpen(false);
  };

  const unreadCount = user?.messages?.filter(m => !m.isRead).length || 0;
  const isOutOfCredits = user && user.plan !== 'premium' && user.credits <= 0;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-dark-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer z-50" 
            onClick={() => onNavigate('home')}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              ImaginAI
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onNavigate('home')}
              className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${currentPage === 'home' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
              <Home className="w-4 h-4" />
              Home
            </button>

            <button
              onClick={handleAIImageClick}
              className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${currentPage === 'dashboard' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
              <Sparkles className="w-4 h-4" />
              Ai Image
            </button>

            {user?.isRegistered && (
              <>
                <button 
                  onClick={() => onNavigate('video-lab-landing')}
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${currentPage === 'video-lab-landing' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
                >
                  <Video className="w-4 h-4" />
                  Ai Video
                </button>
                <button 
                  onClick={() => onNavigate('tts-lab-landing')}
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${currentPage === 'tts-lab-landing' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
                >
                  <Mic2 className="w-4 h-4" />
                  Ai Voice & Audio
                </button>
                <button 
                  onClick={() => onNavigate('gallery')}
                  className={`text-sm font-medium transition-colors flex items-center gap-1 ${currentPage === 'gallery' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
                >
                  <ImageIcon className="w-4 h-4" />
                  Gallery
                </button>
              </>
            )}

            {user?.role === 'admin' && (
               <button 
                onClick={() => onNavigate('admin')}
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${currentPage === 'admin' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
            )}

            {customMenu.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.url)}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                {item.label}
              </button>
            ))}

            <button 
              onClick={handlePricingClick}
              className={`text-sm font-medium transition-colors ${currentPage === 'pricing' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
              Pricing
            </button>
            
            <div className="flex items-center gap-4 border-l border-white/10 pl-6 ml-2">
              {!user?.isRegistered && (
                <>
                  <button
                    onClick={() => onNavigate('video-lab-landing')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentPage === 'video-lab-landing' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <Video className="w-4 h-4" />
                    Ai Video
                  </button>
                  <button
                    onClick={() => onNavigate('tts-lab-landing')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentPage === 'tts-lab-landing' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <Mic2 className="w-4 h-4" />
                    Ai Voice & Audio
                  </button>
                </>
              )}

              {user?.isRegistered ? (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={isOutOfCredits ? onUpgradeClick : () => onNavigate('dashboard')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-300 ${
                      isOutOfCredits 
                        ? 'bg-amber-600/20 border-amber-500/50 text-amber-400 hover:bg-amber-600 hover:text-white shadow-lg shadow-amber-600/20' 
                        : 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-300'
                    }`}
                  >
                    {isOutOfCredits ? (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Upgrade Plan</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-semibold">
                          {user.plan === 'premium' ? '∞' : user.credits} Credits
                        </span>
                      </>
                    )}
                  </button>
                  
                  <div className="flex items-center gap-3 pl-4 border-l border-white/10 relative">
                    <button 
                      onClick={() => onNavigate('profile')}
                      className="p-1 rounded-full hover:ring-2 hover:ring-indigo-500 transition-all relative"
                    >
                      {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                      ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                              {user.name.charAt(0).toUpperCase()}
                          </div>
                      )}
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-dark-950 flex items-center justify-center">
                           <span className="text-[7px] text-white font-black">{unreadCount}</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onNavigate('signup')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors"
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={onLoginClick}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-dark-950 font-bold hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    <UserIcon className="w-4 h-4" />
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-400 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-dark-900 border-b border-white/10 p-4 space-y-4 shadow-2xl">
           <button onClick={() => handleNavClick('home')} className="block w-full text-left text-base font-bold text-gray-400 hover:text-white py-2 flex items-center gap-2"><Home className="w-5 h-5" /> Home</button>
           <button onClick={handleAIImageClick} className="block w-full text-left text-base font-bold text-gray-400 hover:text-white py-2 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-400" /> Ai Image</button>
           {!user?.isRegistered && (
              <>
                <button onClick={() => handleNavClick('video-lab-landing')} className="block w-full text-left text-base font-bold text-indigo-400 py-2 flex items-center gap-2"><Video className="w-5 h-5" /> Ai Video</button>
                <button onClick={() => handleNavClick('tts-lab-landing')} className="block w-full text-left text-base font-bold text-indigo-400 py-2 flex items-center gap-2"><Mic2 className="w-5 h-5" /> Ai Voice & Audio</button>
              </>
           )}
           {user?.isRegistered && (
               <>
                <button onClick={isOutOfCredits ? onUpgradeClick : () => handleNavClick('dashboard')} className={`block w-full text-left text-base font-black py-2 flex items-center gap-2 ${isOutOfCredits ? 'text-amber-500' : 'text-gray-400'}`}>
                   <Zap className="w-5 h-5" /> {isOutOfCredits ? 'Upgrade (0 Credits)' : `${user.credits} Credits Available`}
                </button>
                <button onClick={() => handleNavClick('video-lab-landing')} className="block w-full text-left text-base font-medium text-indigo-400 py-2 flex items-center gap-2"><Video className="w-5 h-5" /> Ai Video</button>
                <button onClick={() => handleNavClick('tts-lab-landing')} className="block w-full text-left text-base font-medium text-indigo-400 py-2 flex items-center gap-2"><Mic2 className="w-5 h-5" /> Ai Voice & Audio</button>
                <button onClick={() => handleNavClick('gallery')} className="block w-full text-left text-base font-medium text-gray-400 hover:text-white py-2">My Gallery</button>
                <button onClick={() => handleNavClick('profile')} className="block w-full text-left text-base font-medium text-gray-400 hover:text-white py-2 flex items-center justify-between">
                   My Profile {unreadCount > 0 && <span className="px-2 py-0.5 bg-red-500 rounded-full text-[8px] text-white">{unreadCount} New</span>}
                </button>
               </>
            )}
            <button onClick={handlePricingClick} className="block w-full text-left text-base font-medium text-gray-400 hover:text-white py-2">Pricing</button>
            {user?.isRegistered ? (
               <button onClick={onLogout} className="block w-full text-left text-base font-medium text-red-400 hover:text-red-300 py-2">Sign Out</button>
            ) : (
               <button onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }} className="block w-full text-center py-3 bg-indigo-600 rounded-lg text-white font-bold">Sign In</button>
            )}
        </div>
      )}
    </nav>
  );
};
