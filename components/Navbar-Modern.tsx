import React from 'react';
import { Menu, X, User as UserIcon, LogOut, Settings, Home, Compass, MessageSquare, Sparkles, Video, Mic2, ImageIcon, CreditCard, ChevronDown, Zap, Shield } from 'lucide-react';
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

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onLoginClick,
  onNavigate,
  currentPage,
  customMenu,
  logoUrl,
  onUpgradeClick,
  theme = 'light',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (page: string) => {
    if (page.startsWith('http')) {
      window.open(page, '_blank');
    } else {
      onNavigate(page);
    }
    setIsMobileMenuOpen(false);
  };

  const isActive = (page: string) => currentPage === page;

  const NavLink: React.FC<{ label: string; page: string; icon?: React.ReactNode; disabled?: boolean }> = ({
    label,
    page,
    icon,
    disabled = false,
  }) => (
    <button
      onClick={() => !disabled && handleNavClick(page)}
      className={`nav-link ${isActive(page) ? 'active' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        {/* Logo */}
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
              <Sparkles size={18} color="#FFFFFF" />
            </div>
          )}
          <span className="logo-text">ImaginAI</span>
        </div>

        {/* Desktop Navigation Links */}
        <div className="nav-links" style={{ display: 'none' }}>
          <NavLink label="Home" page="home" icon={<Home size={16} />} />
          <NavLink label="Explore" page="explore" icon={<Compass size={16} />} />
          <NavLink label="AI Chat" page="chat-landing" icon={<MessageSquare size={16} />} />
          <NavLink label="AI Image" page="dashboard" icon={<Sparkles size={16} />} />

          {user?.isRegistered && (
            <>
              <NavLink label="AI Video" page="video-generator" icon={<Video size={16} />} />
              <NavLink label="AI Voice" page="tts-generator" icon={<Mic2 size={16} />} />
              <NavLink label="Gallery" page="gallery" icon={<ImageIcon size={16} />} />
            </>
          )}

          {user?.role === 'admin' && <NavLink label="Admin" page="admin" icon={<Shield size={16} />} />}

          {customMenu.map(item => (
            <NavLink
              key={item.id}
              label={item.label}
              page={item.url}
            />
          ))}

          <NavLink label="Pricing" page="pricing" />
        </div>

        {/* Right Actions */}
        <div className="nav-actions">
          {!user?.isRegistered ? (
            <>
              <button
                onClick={onLoginClick}
                className="btn-secondary"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="btn-primary-cta"
              >
                Get Started
              </button>
            </>
          ) : (
            <>
              {/* Credits Display */}
              {isOutOfCredits && (
                <button
                  onClick={onUpgradeClick}
                  className="btn-primary-cta"
                  style={{
                    background: '#C91C1C',
                    borderColor: '#C91C1C',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Zap size={16} />
                  Upgrade
                </button>
              )}

              {!isOutOfCredits && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1rem',
                  background: '#F5F5F5',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#000000',
                }}>
                  <CreditCard size={16} />
                  {user.plan === 'premium' ? '∞' : user.credits}
                </div>
              )}

              {/* User Avatar Dropdown */}
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '1px solid #D4D4D4',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }} />
                  ) : (
                    <UserIcon size={18} color="#000000" />
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className="dropdown-menu" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    minWidth: '240px',
                    background: '#FFFFFF',
                    border: '1px solid #E5E5E5',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    zIndex: 10000,
                  }}>
                    <div style={{ padding: '1rem' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: '700', color: '#000000', margin: 0 }}>
                          {user.name}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: '#5A5A5A', margin: '0.25rem 0 0' }}>
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="dropdown-divider" />

                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setIsUserMenuOpen(false);
                      }}
                      className="dropdown-item"
                    >
                      <Settings size={16} style={{ marginRight: '0.5rem' }} />
                      Settings
                    </button>

                    {user.plan !== 'premium' && (
                      <>
                        <div className="dropdown-divider" />
                        <button
                          onClick={() => {
                            onUpgradeClick();
                            setIsUserMenuOpen(false);
                          }}
                          className="dropdown-item"
                          style={{
                            fontWeight: '600',
                            color: '#C91C1C',
                          }}
                        >
                          <Zap size={16} style={{ marginRight: '0.5rem' }} />
                          Upgrade to Premium
                        </button>
                      </>
                    )}

                    <div className="dropdown-divider" />

                    <button
                      onClick={() => {
                        onLogout();
                        setIsUserMenuOpen(false);
                      }}
                      className="dropdown-item"
                      style={{ color: '#C91C1C' }}
                    >
                      <LogOut size={16} style={{ marginRight: '0.5rem' }} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-menu-btn"
            style={{
              display: 'none',
              '@media (max-width: 768px)': {
                display: 'flex',
              },
            }}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu" style={{
          position: 'absolute',
          top: '72px',
          left: 0,
          right: 0,
          background: '#FFFFFF',
          borderBottom: '1px solid #E5E5E5',
          padding: '1.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          animation: 'slideDown 0.3s ease-out',
        }}>
          <button onClick={() => handleNavClick('home')} className="mobile-link">Home</button>
          <button onClick={() => handleNavClick('explore')} className="mobile-link">Explore</button>
          <button onClick={() => handleNavClick('chat-landing')} className="mobile-link">AI Chat</button>
          <button onClick={() => handleNavClick('dashboard')} className="mobile-link">AI Image</button>

          {user?.isRegistered && (
            <>
              <button onClick={() => handleNavClick('video-generator')} className="mobile-link">AI Video</button>
              <button onClick={() => handleNavClick('tts-generator')} className="mobile-link">AI Voice</button>
              <button onClick={() => handleNavClick('gallery')} className="mobile-link">Gallery</button>
            </>
          )}

          {user?.role === 'admin' && <button onClick={() => handleNavClick('admin')} className="mobile-link">Admin</button>}

          <button onClick={() => handleNavClick('pricing')} className="mobile-link">Pricing</button>

          {!user?.isRegistered && (
            <>
              <div style={{ borderTop: '1px solid #E5E5E5', marginTop: '1rem', paddingTop: '1rem' }} />
              <button onClick={onLoginClick} className="mobile-link">Sign In</button>
              <button onClick={() => handleNavClick('signup')} className="btn-primary-cta" style={{ width: '100%' }}>
                Get Started
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
