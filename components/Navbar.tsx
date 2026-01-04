import React from 'react';
import { Menu, X, User as UserIcon, LogOut, Settings, Home, Compass, MessageSquare, Sparkles, Video, Mic2, ImageIcon, CreditCard, Zap, Shield } from 'lucide-react';
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
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [dropdownPosition, setDropdownPosition] = React.useState<'below' | 'above'>('below');
  const menuRef = React.useRef<HTMLDivElement>(null);
  const creditRef = React.useRef<HTMLDivElement>(null);
    const [dropdownAlign, setDropdownAlign] = React.useState<'right' | 'left'>('right');

  // Detect dropdown position to avoid viewport overflow
  React.useEffect(() => {
    if (isCreditDropdownOpen && creditRef.current) {
      const button = creditRef.current.querySelector('button');
      if (button) {
        const rect = button.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropdownHeight = 280; // Estimated height of credit dropdown
          const dropdownWidth = 280; // Width of credit dropdown
        
          // Check vertical positioning
        if (spaceBelow < dropdownHeight) {
          setDropdownPosition('above');
        } else {
          setDropdownPosition('below');
        }
        
          // Check horizontal positioning - prevent overflow on right edge
          const spaceOnRight = window.innerWidth - rect.right;
          if (spaceOnRight < dropdownWidth + 16) {
            // Not enough space on right, align to left instead
            setDropdownAlign('left');
          } else {
            setDropdownAlign('right');
          }
      }
    }
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
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (creditRef.current && !creditRef.current.contains(event.target as Node)) {
        setIsCreditDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle navigation
  const handleNavClick = (page: string) => {
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
          <NavLink label="Home" page="home" icon={<Home size={16} strokeWidth={2} />} />
          <NavLink label="Explore" page="explore" icon={<Compass size={16} strokeWidth={2} />} />
          <NavLink label="AI Chat" page="chat-landing" icon={<MessageSquare size={16} strokeWidth={2} />} />
          <NavLink label="AI Image" page="dashboard" icon={<Sparkles size={16} strokeWidth={2} />} />

          {user?.isRegistered && (
            <>
              <NavLink label="AI Video" page="video-generator" icon={<Video size={16} strokeWidth={2} />} />
              <NavLink label="AI Voice" page="tts-generator" icon={<Mic2 size={16} strokeWidth={2} />} />
              <NavLink label="Gallery" page="gallery" icon={<ImageIcon size={16} strokeWidth={2} />} />
            </>
          )}

          {user?.role === 'admin' && <NavLink label="Admin" page="admin" icon={<Shield size={16} strokeWidth={2} />} />}

          {customMenu.map(item => (
            <NavLink
              key={item.id}
              label={item.label}
              page={item.url}
            />
          ))}

          <div className="nav-divider" />

          <NavLink label="Pricing" page="pricing" />
        </div>

        {/* === RIGHT ACTIONS === */}
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
                  title="No credits available. Click to upgrade."
                >
                  <Zap size={16} strokeWidth={2.5} />
                  Upgrade
                </button>
              ) : (
                <div ref={creditRef} style={{ position: 'relative', zIndex: 10000 }}>
                  <button
                    onClick={() => setIsCreditDropdownOpen(!isCreditDropdownOpen)}
                    className="btn-secondary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                    title={user.plan === 'premium' ? 'Unlimited credits' : `${user.credits} credits available`}
                  >
                    <CreditCard size={16} strokeWidth={2} />
                    {user.plan === 'premium' ? '∞' : `${user.credits}`}
                  </button>

                  {/* Credit Dropdown Menu */}
                  {isCreditDropdownOpen && (
                    <div className="dropdown-menu" style={{
                      padding: '1rem',
                      zIndex: 99999,
                      top: dropdownPosition === 'above' ? 'auto' : 'calc(100% + 8px)',
                      bottom: dropdownPosition === 'above' ? 'calc(100% + 8px)' : 'auto',
                        right: dropdownAlign === 'right' ? '0' : 'auto',
                        left: dropdownAlign === 'left' ? '0' : 'auto',
                    }}>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: '#666666',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '0.5rem',
                        }}>
                          Credits
                        </div>
                        <div style={{
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          color: '#000000',
                        }}>
                          {user.plan === 'premium' ? 'Unlimited' : user.credits}
                        </div>
                        <div style={{
                          fontSize: '0.85rem',
                          color: '#888888',
                          marginTop: '0.25rem',
                        }}>
                          {user.plan === 'premium' ? 'Premium Plan' : 'Available credits'}
                        </div>
                      </div>

                      <div style={{
                        height: '1px',
                        background: '#E5E5E5',
                        margin: '0.75rem 0',
                      }} />

                      <button
                        onClick={() => {
                          onNavigate('pricing');
                          setIsCreditDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.625rem 0.75rem',
                          background: user.plan === 'premium' ? '#F5F5F5' : '#000000',
                          color: user.plan === 'premium' ? '#000000' : '#FFFFFF',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-out',
                        }}
                        onMouseEnter={(e) => {
                          if (user.plan === 'premium') {
                            e.currentTarget.style.background = '#E5E5E5';
                          } else {
                            e.currentTarget.style.background = '#222222';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = user.plan === 'premium' ? '#F5F5F5' : '#000000';
                        }}
                      >
                        {user.plan === 'premium' ? 'View Plans' : 'Buy Credits'}
                      </button>
                    </div>
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
                      Settings & Profile
                    </button>

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
                          Upgrade to Premium
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
                      Sign Out
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

      {/* === MOBILE MENU === */}
      {isMobileMenuOpen && (
        <div className="mobile-menu open">
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

          {user?.role === 'admin' && (
            <button onClick={() => handleNavClick('admin')} className="mobile-link">Admin</button>
          )}

          <button onClick={() => handleNavClick('pricing')} className="mobile-link">Pricing</button>

          {!user?.isRegistered && (
            <>
              <div style={{ borderTop: '1px solid #E5E5E5', margin: '1rem 0' }} />
              <button
                onClick={onLoginClick}
                className="mobile-link"
                style={{ fontWeight: '600' }}
              >
                Sign In
              </button>
              <button
                onClick={() => handleNavClick('signup')}
                className="btn-primary-cta"
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                Get Started
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
