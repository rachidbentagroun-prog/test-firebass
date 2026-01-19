import React from 'react';
import { createPortal } from 'react-dom';
import { Menu, X, User as UserIcon, LogOut, Settings, Home, Compass, MessageSquare, Sparkles, Video, Mic2, ImageIcon, CreditCard, Zap, Shield, Globe } from 'lucide-react';
import { User, NavItem } from '../types';
import { useLanguage, Language } from '../utils/i18n';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onLoginClick: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  customMenu: NavItem[];
  logoUrl?: string;
  onUpgradeClick: () => void;
  onOpenInbox?: () => void;
}

const isAdminRole = (role?: User['role']) => role === 'admin' || role === 'super_admin' || role === 'super-admin';

/**
 * Modern SaaS Navigation Bar
 * 
 * Clean, minimal design inspired by Vercel, Notion, and Linear.
 * Features:
 * - Professional monochrome color scheme (black & white)
 * - Smooth hover animations and transitions
 * - Responsive mobile menu with hamburger icon
 * - User dropdown with profile menu
 * - Credits display
 * - Active link indicators with underline animation
 */
export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onLoginClick,
  onNavigate,
  currentPage,
  customMenu,
  logoUrl,
  onUpgradeClick,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isCreditDropdownOpen, setIsCreditDropdownOpen] = React.useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [dropdownPosition, setDropdownPosition] = React.useState<'below' | 'above'>('below');
  const [creditMenuPosition, setCreditMenuPosition] = React.useState<{ top: number; left: number; width: number } | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const creditRef = React.useRef<HTMLDivElement>(null);
  const creditButtonRef = React.useRef<HTMLButtonElement>(null);
  const creditPortalRef = React.useRef<HTMLDivElement>(null);
  const languageRef = React.useRef<HTMLDivElement>(null);
  const [dropdownAlign, setDropdownAlign] = React.useState<'right' | 'left'>('right');
  
  // Language context
  const { language, setLanguage, t } = useLanguage();

  // Position credit dropdown portal to match button
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isCreditDropdownOpen) return;

    const updatePosition = () => {
      if (!creditButtonRef.current) return;
      const rect = creditButtonRef.current.getBoundingClientRect();
      const margin = 8;
      const width = 280; // Credit dropdown width
      const maxLeft = window.innerWidth - width - margin;
      const left = Math.max(margin, Math.min(rect.left, maxLeft));
      setCreditMenuPosition({ top: rect.bottom + margin, left, width });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isCreditDropdownOpen]);

  // Track scroll position for subtle shadow effect
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close mobile menu on any click outside navbar
      if (isMobileMenuOpen) {
        const navbar = document.querySelector('.navbar-modern');
        if (navbar && !navbar.contains(event.target as Node)) {
          setIsMobileMenuOpen(false);
        }
      }
      
      // Close language dropdown on outside click
      if (isLanguageDropdownOpen && languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
      
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (creditRef.current && !creditRef.current.contains(event.target as Node) && (!creditPortalRef.current || !creditPortalRef.current.contains(event.target as Node))) {
        setIsCreditDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Handle navigation
  const handleNavClick = (page: string) => {
    if (page === 'pricing') {
      onNavigate('pricing');
      setIsMobileMenuOpen(false);
      return;
    }
    if (page.startsWith('http')) {
      window.open(page, '_blank');
    } else {
      onNavigate(page);
    }
    setIsMobileMenuOpen(false);
  };

  const isActive = (page: string) => currentPage === page;

  // Reusable nav link component
  const NavLink: React.FC<{ label: string; page: string; icon?: React.ReactNode; disabled?: boolean }> = ({
    label,
    page,
    icon,
    disabled = false,
  }) => (
    <button
      onClick={() => !disabled && handleNavClick(page)}
      className={`nav-link ${isActive(page) ? 'active' : ''}`}
      style={{
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      disabled={disabled}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );

  const unreadCount = user?.messages?.filter(m => !m.isRead).length || 0;
  const isOutOfCredits = user && user.plan !== 'premium' && user.credits <= 0;

  return (
    <nav className={`navbar-modern ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* === LOGO & BRAND === */}
        <div
          className="logo-brand"
          onClick={() => onNavigate('home')}
        >
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ height: '32px', width: 'auto' }} />
          ) : (
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '0.375rem',
              background: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={18} color="#FFFFFF" strokeWidth={2.5} />
            </div>
          )}
          <span className="logo-text">ImaginAI</span>
        </div>

        {/* === DESKTOP NAVIGATION LINKS === */}
        <div className="nav-links">
          <NavLink label={t('nav.home')} page="home" icon={<Home size={16} strokeWidth={2} />} />
          <NavLink label={t('nav.explore')} page="explore" icon={<Compass size={16} strokeWidth={2} />} />
          <NavLink label={t('nav.aiChat')} page="chat-landing" icon={<MessageSquare size={16} strokeWidth={2} />} />
          <NavLink label={t('nav.aiImage')} page="aiimage" icon={<Sparkles size={16} strokeWidth={2} />} />
          <NavLink label={t('nav.aiVideo')} page="aivideo" icon={<Video size={16} strokeWidth={2} />} />
          <NavLink label={t('nav.aiVoice')} page="aivoice" icon={<Mic2 size={16} strokeWidth={2} />} />

          {/* Join Community link */}
          <NavLink label={t('nav.joinCommunity') || 'Join Community'} page="https://www.facebook.com/share/g/1GCDRidxur/" icon={<Globe size={16} strokeWidth={2} />} />

          {user?.isRegistered && (
            <>
              <NavLink label={t('nav.gallery')} page="gallery" icon={<ImageIcon size={16} strokeWidth={2} />} />
            </>
          )}

          {isAdminRole(user?.role) && <NavLink label={t('nav.admin')} page="admin" icon={<Shield size={16} strokeWidth={2} />} />}

          {customMenu.map(item => (
            <NavLink
              key={item.id}
              label={item.label}
              page={item.url}
            />
          ))}

          <div className="nav-divider" />

          <NavLink label={t('nav.pricing')} page="pricing" />
        </div>

        {/* === RIGHT ACTIONS === */}
        <div className="nav-actions">
          {/* Language Selector - Always visible */}
          <div ref={languageRef} style={{ position: 'relative' }} className="desktop-language-selector">
            <button
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minWidth: '44px',
                justifyContent: 'center',
              }}
              title="Switch Language / تبديل اللغة / Changer de langue"
            >
              <Globe size={18} strokeWidth={2.5} />
              <span className="language-code" style={{ 
                fontSize: '0.75rem', 
                fontWeight: '700',
                textTransform: 'uppercase',
              }}>
                {language}
              </span>
            </button>
            
            {/* Language Dropdown */}
            {isLanguageDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  backgroundColor: '#000',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  minWidth: '160px',
                  zIndex: 2147483648,
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => {
                    setLanguage('en');
                    setIsLanguageDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    backgroundColor: language === 'en' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    color: language === 'en' ? '#818CF8' : '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: language === 'en' ? '600' : '400',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (language !== 'en') {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (language !== 'en') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🇬🇧</span>
                  <span>English</span>
                </button>
                
                <button
                  onClick={() => {
                    setLanguage('ar');
                    setIsLanguageDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    backgroundColor: language === 'ar' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    color: language === 'ar' ? '#818CF8' : '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: language === 'ar' ? '600' : '400',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (language !== 'ar') {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (language !== 'ar') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🇸🇦</span>
                  <span>العربية</span>
                </button>
                
                <button
                  onClick={() => {
                    setLanguage('fr');
                    setIsLanguageDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    backgroundColor: language === 'fr' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    color: language === 'fr' ? '#818CF8' : '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: language === 'fr' ? '600' : '400',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (language !== 'fr') {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (language !== 'fr') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🇫🇷</span>
                  <span>Français</span>
                </button>
              </div>
            )}
          </div>

          {!user?.isRegistered ? (
            <>
              <button
                onClick={onLoginClick}
                className="btn-secondary"
              >
                {t('nav.signIn')}
              </button>
              <button
                onClick={() => handleNavClick('signup')}
                className="btn-primary-cta"
              >
                {t('nav.getStarted')}
              </button>
            </>
          ) : (
            <>
              {/* Credits or Upgrade Button */}
              {isOutOfCredits ? (
                <button
                  onClick={onUpgradeClick}
                  className="btn-primary-cta"
                  style={{
                    background: '#DC2626',
                    borderColor: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                  title={t('credits.noCredits')}
                >
                  <Zap size={16} strokeWidth={2.5} />
                  {t('plans.upgrade')}
                </button>
              ) : (
                <div ref={creditRef} style={{ position: 'relative' }}>
                  <button
                    ref={creditButtonRef}
                    onClick={() => setIsCreditDropdownOpen(!isCreditDropdownOpen)}
                    className="btn-secondary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                    title={user.plan === 'premium' ? t('profile.unlimited') : `${user.credits} ${t('credits.available')}`}
                  >
                    <CreditCard size={16} strokeWidth={2} />
                    {user.plan === 'premium' ? '∞' : `${user.credits}`}
                  </button>

                  {/* Credit Dropdown Portal */}
                  {isCreditDropdownOpen && creditMenuPosition && typeof document !== 'undefined' && createPortal(
                    <div
                      ref={creditPortalRef}
                      style={{
                        position: 'fixed',
                        top: creditMenuPosition.top,
                        left: creditMenuPosition.left,
                        width: creditMenuPosition.width,
                        maxWidth: 'calc(100vw - 16px)',
                        zIndex: 99999,
                        padding: '1rem',
                        background: '#FFFFFF',
                        border: '1px solid #E5E5E5',
                        borderRadius: '0.75rem',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: '#666666',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '0.5rem',
                        }}>
                          {t('credits.title')}
                        </div>
                        <div style={{
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          color: '#000000',
                        }}>
                          {user.plan === 'premium' ? t('profile.unlimited') : user.credits}
                        </div>
                        <div style={{
                          fontSize: '0.85rem',
                          color: '#888888',
                          marginTop: '0.25rem',
                        }}>
                          {user.plan === 'premium' ? t('profile.premiumPlan') : t('profile.availableCredits')}
                        </div>
                      </div>

                      <div style={{
                        height: '1px',
                        background: '#E5E5E5',
                        margin: '0.75rem 0',
                      }} />

                      <button
                        onClick={() => {
                          if (user.plan === 'premium') {
                            onNavigate('pricing');
                          } else {
                            // Open WhatsApp to buy credits
                            const phoneNumber = '212630961392';
                            const message = encodeURIComponent(`Hi! I would like to purchase credits for my ImaginAI account.\n\nEmail: ${user.email}\nCurrent Credits: ${user.credits}`);
                            window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
                          }
                          setIsCreditDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.625rem 0.75rem',
                          background: user.plan === 'premium' ? '#F5F5F5' : '#25D366',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-out',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                        }}
                        onMouseEnter={(e) => {
                          if (user.plan === 'premium') {
                            e.currentTarget.style.background = '#E5E5E5';
                          } else {
                            e.currentTarget.style.background = '#22C55E';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = user.plan === 'premium' ? '#F5F5F5' : '#25D366';
                        }}
                      >
                        {user.plan === 'premium' ? (
                          t('plans.viewPlans')
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            {t('plans.buyCredits')}
                          </>
                        )}
                      </button>
                    </div>,
                    document.body
                  )}
                </div>
              )}

              <div className="nav-divider" />

              {/* === USER AVATAR DROPDOWN === */}
              <div ref={menuRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', zIndex: 10000 }}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="user-avatar"
                  title={user.name}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }} />
                  ) : (
                    <UserIcon size={18} strokeWidth={2} style={{ color: 'currentColor' }} />
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className="dropdown-menu" style={{
                    zIndex: 99999,
                  }}>
                    {/* Profile Header */}
                    <div style={{ padding: '1rem' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: '700', color: '#000000', margin: 0 }}>
                        {user.name}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#5A5A5A', margin: '0.25rem 0 0' }}>
                        {user.email}
                      </p>
                      {user.plan && (
                        <span style={{
                          display: 'inline-block',
                          marginTop: '0.5rem',
                          padding: '0.25rem 0.75rem',
                          background: user.plan === 'premium' ? '#FEF3C7' : '#DBEAFE',
                          color: user.plan === 'premium' ? '#92400E' : '#1E40AF',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          {user.plan === 'premium' ? '⭐ Premium' : '👤 ' + (user.plan || 'Free')}
                        </span>
                      )}
                    </div>

                    <div className="dropdown-divider" style={{ margin: '0.5rem 0' }} />

                    {/* Settings */}
                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setIsUserMenuOpen(false);
                      }}
                      className="dropdown-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        width: '100%',
                        textAlign: 'left',
                      }}
                    >
                      <Settings size={16} strokeWidth={2} />
                      {t('nav.settings')}
                    </button>

                    {/* Language Switcher */}
                    <div className="dropdown-divider" style={{ margin: '0.5rem 0' }} />
                    <div style={{ padding: '0.5rem 1rem' }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#888888',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.5rem',
                      }}>
                        {t('profile.language')}
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '0.5rem',
                      }}>
                        {[
                          { code: 'en' as Language, label: 'EN', name: 'English' },
                          { code: 'ar' as Language, label: 'AR', name: 'العربية' },
                          { code: 'fr' as Language, label: 'FR', name: 'Français' },
                        ].map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setLanguage(lang.code);
                              // Keep menu open to see the language change
                            }}
                            style={{
                              padding: '0.5rem',
                              background: language === lang.code ? '#000000' : '#F5F5F5',
                              color: language === lang.code ? '#FFFFFF' : '#000000',
                              border: 'none',
                              borderRadius: '0.5rem',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease-out',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                            onMouseEnter={(e) => {
                              if (language !== lang.code) {
                                e.currentTarget.style.background = '#E5E5E5';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (language !== lang.code) {
                                e.currentTarget.style.background = '#F5F5F5';
                              }
                            }}
                            title={lang.name}
                          >
                            <Globe size={14} strokeWidth={2} />
                            <span>{lang.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Upgrade */}
                    {user.plan !== 'premium' && (
                      <>
                        <div className="dropdown-divider" style={{ margin: '0.5rem 0' }} />
                        <button
                          onClick={() => {
                            onUpgradeClick();
                            setIsUserMenuOpen(false);
                          }}
                          className="dropdown-item"
                          style={{
                            fontWeight: '700',
                            color: '#DC2626',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                          }}
                        >
                          <Zap size={16} strokeWidth={2.5} />
                          {t('nav.upgrade')}
                        </button>
                      </>
                    )}

                    <div className="dropdown-divider" style={{ margin: '0.5rem 0' }} />

                    {/* Logout */}
                    <button
                      onClick={() => {
                        onLogout();
                        setIsUserMenuOpen(false);
                      }}
                      className="dropdown-item"
                      style={{
                        color: '#DC2626',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <LogOut size={16} strokeWidth={2} />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* === MOBILE MENU BUTTON === */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`mobile-menu-btn ${isMobileMenuOpen ? 'open' : ''}`}
            aria-label="Toggle mobile menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* === MOBILE MENU BACKDROP === */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-backdrop open" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* === MOBILE MENU === */}
      {isMobileMenuOpen && (

        <div className="mobile-menu open">
          <button onClick={() => handleNavClick('home')} className="mobile-link">{t('nav.home')}</button>
          <button onClick={() => handleNavClick('explore')} className="mobile-link">{t('nav.explore')}</button>
          <button onClick={() => handleNavClick('chat-landing')} className="mobile-link">{t('nav.aiChat')}</button>
          <button onClick={() => handleNavClick('aiimage')} className="mobile-link">{t('nav.aiImage')}</button>
          <button onClick={() => handleNavClick('aivideo')} className="mobile-link">{t('nav.aiVideo')}</button>
          <button onClick={() => handleNavClick('aivoice')} className="mobile-link">{t('nav.aiVoice')}</button>

          {/* Join Community link for mobile */}
          <button onClick={() => handleNavClick('https://www.facebook.com/share/g/1GCDRidxur/')} className="mobile-link">{t('nav.joinCommunity') || 'Join Community'}</button>

          {user?.isRegistered && (
            <>
              <button onClick={() => handleNavClick('gallery')} className="mobile-link">{t('nav.gallery')}</button>
            </>
          )}

          {user?.role === 'admin' && (
            <button onClick={() => handleNavClick('admin')} className="mobile-link">{t('nav.admin')}</button>
          )}

          <button onClick={() => handleNavClick('pricing')} className="mobile-link">{t('nav.pricing')}</button>

          {/* Language Switcher in Mobile Menu */}
          <div style={{ borderTop: '1px solid #E5E5E5', margin: '1rem 0', paddingTop: '1rem' }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#888888',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.75rem',
              paddingLeft: '1rem',
            }}>
              {t('profile.language')}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              padding: '0 1rem',
            }}>
              {[
                { code: 'en' as Language, label: 'English', flag: '🇬🇧' },
                { code: 'ar' as Language, label: 'العربية', flag: '🇸🇦' },
                { code: 'fr' as Language, label: 'Français', flag: '🇫🇷' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    padding: '0.75rem 0.5rem',
                    background: language === lang.code ? '#000000' : '#F5F5F5',
                    color: language === lang.code ? '#FFFFFF' : '#000000',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-out',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          {!user?.isRegistered && (
            <>
              <div style={{ borderTop: '1px solid #E5E5E5', margin: '1rem 0' }} />
              <button
                onClick={onLoginClick}
                className="mobile-link"
                style={{ fontWeight: '600' }}
              >
                {t('nav.signIn')}
              </button>
              <button
                onClick={() => handleNavClick('signup')}
                className="btn-primary-cta"
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                {t('nav.getStarted')}
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
