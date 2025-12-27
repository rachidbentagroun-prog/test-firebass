
import React from 'react';
import { Sparkles, Zap, Shield, User as UserIcon, Image as ImageIcon, Menu, X, Video, Compass, Home, Mic2, Bell, CreditCard, ChevronDown, Info, Rocket, Settings, Clock, Inbox, Sun, Moon, LogOut } from 'lucide-react';
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
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenInbox?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onLoginClick, onNavigate, currentPage, customMenu, logoUrl, onUpgradeClick, theme = 'dark', onToggleTheme, onOpenInbox }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCreditDropdownOpen, setIsCreditDropdownOpen] = React.useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);
  const creditDropdownRef = React.useRef<HTMLDivElement>(null);
  const profileDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (creditDropdownRef.current && !creditDropdownRef.current.contains(event.target as Node)) {
        setIsCreditDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    onNavigate('dashboard');
    setIsMobileMenuOpen(false);
  };

  const handleAIVideoClick = () => {
    if (user?.isRegistered) {
      onNavigate('video-generator');
      setIsMobileMenuOpen(false);
      return;
    }

    onLoginClick();
    setIsMobileMenuOpen(false);
  };

  const handleAIVoiceClick = () => {
    if (user?.isRegistered) {
      onNavigate('tts-generator');
      setIsMobileMenuOpen(false);
      return;
    }

    onLoginClick();
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
              onClick={() => onNavigate('explore')}
              className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${currentPage === 'explore' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
              <Compass className="w-4 h-4" />
              Explore
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
                  onClick={handleAIVideoClick}
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${currentPage === 'video-generator' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
                >
                  <Video className="w-4 h-4" />
                  Ai Video
                </button>
                <button 
                  onClick={handleAIVoiceClick}
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${currentPage === 'tts-generator' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
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
                    onClick={() => onLoginClick()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all text-gray-400 hover:text-white hover:bg-white/5`}
                  >
                    <Video className="w-4 h-4" />
                    Ai Video
                  </button>
                  <button
                    onClick={() => onLoginClick()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all text-gray-400 hover:text-white hover:bg-white/5`}
                  >
                    <Mic2 className="w-4 h-4" />
                    Ai Voice & Audio
                  </button>
                </>
              )}

              {user?.isRegistered ? (
                <div className="flex items-center gap-4">
                  {/* Credit Dropdown Button */}
                  <div className="relative" ref={creditDropdownRef}>
                    <button 
                      onClick={() => setIsCreditDropdownOpen(!isCreditDropdownOpen)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
                        isOutOfCredits 
                          ? 'bg-red-600/10 border-red-500/30 text-red-500 hover:bg-red-600/20 shadow-lg shadow-red-600/20 animate-pulse' 
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-indigo-500/50'
                      }`}
                    >
                      <CreditCard className={`w-4 h-4 ${isOutOfCredits ? 'text-red-500' : 'text-indigo-400'}`} />
                      <span className="text-xs font-black uppercase tracking-wider">
                        {user.plan === 'premium' ? 'UNLIMITED' : `${user.credits} CREDITS`}
                      </span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${isCreditDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Credit Dropdown Menu */}
                    {isCreditDropdownOpen && (
                      <div className="absolute top-full right-0 mt-2 w-80 bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-in z-[100]">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-black text-white uppercase tracking-wider">Credit Balance</h4>
                            <div className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                              user.plan === 'premium' 
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                              : user.plan === 'basic' 
                              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                              : 'bg-gray-600/20 text-gray-400 border border-gray-500/30'
                            }`}>
                              {user.plan || 'Free'}
                            </div>
                          </div>
                          
                          <div className={`p-5 rounded-xl mb-4 ${
                            isOutOfCredits 
                            ? 'bg-red-600/10 border border-red-500/30' 
                            : 'bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-400 uppercase tracking-wider">Available Credits</span>
                              <Info className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className={`text-4xl font-black mb-1 ${
                              isOutOfCredits ? 'text-red-500' : 'text-white'
                            }`}>
                              {user.plan === 'premium' ? '∞' : user.credits}
                            </div>
                            <div className="text-xs text-gray-400">
                              {user.plan === 'premium' 
                                ? 'Unlimited generations' 
                                : isOutOfCredits
                                ? 'Out of credits - Upgrade to continue'
                                : `Each generation costs 1 credit`
                              }
                            </div>
                          </div>
                          
                          {user.plan !== 'premium' && (
                            <div className="space-y-2 mb-4 p-4 bg-white/5 rounded-xl">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">Used this month</span>
                                <span className="text-white font-bold">{user.plan === 'basic' ? Math.max(0, 16 - user.credits) : Math.max(0, 3 - user.credits)}</span>
                              </div>
                              <div className="w-full bg-dark-950 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    isOutOfCredits 
                                    ? 'bg-red-500' 
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                                  }`}
                                  style={{ width: `${user.plan === 'basic' ? ((16 - user.credits) / 16) * 100 : ((3 - user.credits) / 3) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          <button
                            onClick={() => {
                              setIsCreditDropdownOpen(false);
                              onNavigate('upgrade');
                            }}
                            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-indigo-500/50 flex items-center justify-center gap-2 group"
                          >
                            <Rocket className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform" />
                            Upgrade Now
                          </button>
                          
                          {user.plan !== 'premium' && (
                            <p className="text-center text-xs text-gray-500 mt-3">
                              Get unlimited generations with Premium
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative pl-4 border-l border-white/10" ref={profileDropdownRef}>
                    <button 
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
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

                    {/* Profile Dropdown Menu */}
                    {isProfileDropdownOpen && (
                      <div className="absolute right-0 mt-3 w-64 bg-dark-900/95 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
                        {/* Header with gradient background */}
                        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900/40 to-purple-900/40 px-4 py-5 border-b border-white/10">
                          <div className="flex items-start gap-3">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-400/50 shadow-lg" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white border-2 border-indigo-400/50 shadow-lg">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-black text-sm truncate">{user.name}</p>
                              <p className="text-gray-400 text-xs truncate">{user.email}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                  user.plan === 'premium' 
                                    ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300' 
                                    : 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'
                                }`}>
                                  <Zap className="w-3 h-3" />
                                  {user.plan === 'premium' ? 'PREMIUM' : 'BASIC'}
                                </span>
                                <span className="text-[9px] text-gray-500 font-medium">
                                  {user.plan === 'premium' ? '∞ Credits' : `${user.credits} Credits`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items - Primary Actions */}
                        <div className="py-2">
                          <button
                            onClick={() => { onNavigate('profile'); setIsProfileDropdownOpen(false); }}
                            className="w-full px-4 py-3 text-left text-gray-300 hover:bg-indigo-500/10 hover:text-white flex items-center gap-3 transition-all group"
                          >
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-indigo-500/20 transition-all">
                              <UserIcon className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                              <span className="text-sm font-medium block">Profile</span>
                              <span className="text-xs text-gray-500">View & edit profile</span>
                            </div>
                          </button>

                          <button
                            onClick={() => { onNavigate('profile'); setIsProfileDropdownOpen(false); }}
                            className="w-full px-4 py-3 text-left text-gray-300 hover:bg-indigo-500/10 hover:text-white flex items-center gap-3 transition-all group"
                          >
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-indigo-500/20 transition-all">
                              <Settings className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                              <span className="text-sm font-medium block">Settings</span>
                              <span className="text-xs text-gray-500">Preferences & options</span>
                            </div>
                          </button>

                          <button
                            onClick={() => { onNavigate('gallery'); setIsProfileDropdownOpen(false); }}
                            className="w-full px-4 py-3 text-left text-gray-300 hover:bg-purple-500/10 hover:text-white flex items-center gap-3 transition-all group"
                          >
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-purple-500/20 transition-all">
                              <Clock className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                              <span className="text-sm font-medium block">Recent Created</span>
                              <span className="text-xs text-gray-500">Your generations</span>
                            </div>
                          </button>

                          <button
                            onClick={() => { onOpenInbox?.(); onNavigate('profile'); setIsProfileDropdownOpen(false); }}
                            className="w-full px-4 py-3 text-left text-gray-300 hover:bg-red-500/10 hover:text-white flex items-center gap-3 transition-all group relative"
                          >
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-red-500/20 transition-all">
                              <Bell className="w-4 h-4 text-red-400" />
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium block">Inbox</span>
                              <span className="text-xs text-gray-500">Messages & updates</span>
                            </div>
                            {unreadCount > 0 && (
                              <span className="px-2.5 py-1 bg-red-500 text-white text-[10px] font-black rounded-lg shadow-lg shadow-red-500/50">
                                {unreadCount}
                              </span>
                            )}
                          </button>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-white/5 my-2" />

                        {/* Secondary Actions */}
                        <div className="py-2">
                          <button
                            onClick={() => { onToggleTheme?.(); setIsProfileDropdownOpen(false); }}
                            className="w-full px-4 py-3 text-left text-gray-300 hover:bg-amber-500/10 hover:text-white flex items-center gap-3 transition-all group"
                          >
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-amber-500/20 transition-all">
                              {theme === 'dark' ? (
                                <Sun className="w-4 h-4 text-amber-400" />
                              ) : (
                                <Moon className="w-4 h-4 text-amber-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium block">{theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
                              <span className="text-xs text-gray-500">Theme preference</span>
                            </div>
                          </button>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-white/5 my-2" />

                        {/* Upgrade & Logout */}
                        <div className="py-2">
                          {user.plan !== 'premium' && (
                            <button
                              onClick={() => { onUpgradeClick(); setIsProfileDropdownOpen(false); }}
                              className="w-full px-4 py-3 mx-0.5 my-1 text-left bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:border-amber-500/50 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 rounded-lg flex items-center gap-3 transition-all group font-medium"
                            >
                              <div className="p-2 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 transition-all">
                                <Zap className="w-4 h-4 text-amber-400" />
                              </div>
                              <div>
                                <span className="text-sm font-black uppercase tracking-wider">Upgrade Now</span>
                                <span className="text-xs text-amber-200/70 block">Unlock premium features</span>
                              </div>
                            </button>
                          )}

                          <button
                            onClick={() => { onLogout(); setIsProfileDropdownOpen(false); }}
                            className="w-full px-4 py-3 text-left text-gray-300 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-3 transition-all group"
                          >
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-red-500/20 transition-all">
                              <LogOut className="w-4 h-4 text-red-400" />
                            </div>
                            <div>
                              <span className="text-sm font-medium block">Logout</span>
                              <span className="text-xs text-gray-500">Sign out of account</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
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
                    Login
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
           <button onClick={() => handleNavClick('explore')} className="block w-full text-left text-base font-bold text-gray-400 hover:text-white py-2 flex items-center gap-2"><Compass className="w-5 h-5" /> Explore</button>
           <button onClick={handleAIImageClick} className="block w-full text-left text-base font-bold text-gray-400 hover:text-white py-2 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-400" /> Ai Image</button>
           {!user?.isRegistered && (
              <>
                <button onClick={onLoginClick} className="block w-full text-left text-base font-bold text-indigo-400 py-2 flex items-center gap-2"><Video className="w-5 h-5" /> Ai Video</button>
                <button onClick={onLoginClick} className="block w-full text-left text-base font-bold text-indigo-400 py-2 flex items-center gap-2"><Mic2 className="w-5 h-5" /> Ai Voice & Audio</button>
              </>
           )}
           {user?.isRegistered && (
               <>
                <button onClick={isOutOfCredits ? onUpgradeClick : () => handleNavClick('dashboard')} className={`block w-full text-left text-base font-black py-2 flex items-center gap-2 ${isOutOfCredits ? 'text-amber-500' : 'text-gray-400'}`}>
                   <Zap className="w-5 h-5" /> {isOutOfCredits ? 'Upgrade (0 Credits)' : `${user.credits} Credits Available`}
                </button>
                <button onClick={handleAIVideoClick} className="block w-full text-left text-base font-medium text-indigo-400 py-2 flex items-center gap-2"><Video className="w-5 h-5" /> Ai Video</button>
                <button onClick={handleAIVoiceClick} className="block w-full text-left text-base font-medium text-indigo-400 py-2 flex items-center gap-2"><Mic2 className="w-5 h-5" /> Ai Voice & Audio</button>
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
               <button onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }} className="block w-full text-center py-3 bg-indigo-600 rounded-lg text-white font-bold">Login</button>
            )}
        </div>
      )}
    </nav>
  );
};
