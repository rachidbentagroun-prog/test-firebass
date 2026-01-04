/**
 * Animation Configuration Template
 * 
 * Easily customize all animation timings, colors, and easing
 * Edit these variables to change animations site-wide
 */

export const AnimationConfig = {
  // ========================================
  // TIMING (in milliseconds)
  // ========================================
  timing: {
    pageLoad: {
      section: 600,        // Section fade-in duration
      element: 400,        // Element animations
      staggerDelay: 100,   // Delay between staggered items
    },
    
    interactions: {
      buttonHover: 250,    // Button hover animation
      cardHover: 300,      // Card lift animation
      linkHover: 300,      // Navigation link animation
      inputFocus: 200,     // Input focus glow
      scrollAnimation: 600, // Scroll fade-in duration
    },
    
    loading: {
      shimmer: 2000,       // Skeleton shimmer speed
      pulse: 2000,         // Pulse fade duration
    }
  },

  // ========================================
  // EASING FUNCTIONS
  // ========================================
  easing: {
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',     // Default smooth
    fast: 'cubic-bezier(0.34, 1.56, 0.64, 1)',  // Bouncy
    gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Gentle
  },

  // ========================================
  // COLORS & VARIABLES - MONOCHROME SYSTEM
  // ========================================
  colors: {
    primary: '#000000',              // Black
    primaryHover: '#262626',         // Dark gray hover
    primaryDark: '#171717',          // Near-black
    accent: '#000000',               // Black accent
    error: '#000000',                // Black (errors shown via bold)
    success: '#404040',              // Dark gray (success shown via contrast)
    
    // Grayscale palette
    white: '#FFFFFF',
    nearWhite: '#FAFAFA',
    gray50: '#F9F9F9',
    gray100: '#F5F5F5',
    gray200: '#E5E5E5',
    gray300: '#D4D4D4',
    gray400: '#A3A3A3',
    gray500: '#737373',
    gray600: '#525252',
    gray700: '#404040',
    gray800: '#262626',
    gray900: '#171717',
    black: '#000000',
    nearBlack: '#0F0F0F',
  },

  // ========================================
  // TRANSFORM EFFECTS
  // ========================================
  transforms: {
    buttons: {
      hoverScale: 1.03,          // Scale on hover
      hoverLift: '-2px',         // Y translation on hover
      activePress: '-0px',       // Y translation on active
    },
    
    cards: {
      hoverLift: '-8px',         // Y translation on hover
      subtleLift: '-4px',        // Lighter lift effect
      imageZoom: 1.05,           // Image zoom on hover
    },
    
    inputs: {
      focusScale: 1,             // Scale remains 1 (no scale)
      glowSpread: '0 0 0 3px',   // Glow size
    }
  },

  // ========================================
  // SHADOWS
  // ========================================
  shadows: {
    soft: '0 10px 25px rgba(0, 0, 0, 0.1)',
    medium: '0 15px 35px rgba(0, 0, 0, 0.12)',
    elevated: '0 20px 48px rgba(0, 0, 0, 0.15)',
    hover: '0 12px 24px rgba(0, 0, 0, 0.15)',
  },

  // ========================================
  // SCROLL ANIMATION CONFIG
  // ========================================
  scroll: {
    observerThreshold: 0.1,      // When to trigger (0-1)
    rootMargin: '0px 0px -50px 0px', // Margin around viewport
    staggerDelay: 50,            // Delay between items (ms)
  },

  // ========================================
  // FEATURE FLAGS
  // ========================================
  features: {
    enableScrollAnimations: true,    // Intersection Observer
    enableNavbarGlass: true,         // Navbar blur on scroll
    enableFormValidation: true,      // Form error/success feedback
    enableButtonRipples: true,       // Ripple click effect
    enablePageTransitions: false,    // Fade on navigation
    enableReducedMotion: true,       // Respect prefers-reduced-motion
  },

  // ========================================
  // ACCESSIBILITY - MONOCHROME
  // ========================================
  accessibility: {
    focusOutlineWidth: '2px',
    focusOutlineColor: '#000000',    // Black outline
    focusOutlineOffset: '2px',
    minTouchTarget: '44px',          // WCAG AA recommendation
  },

  // ========================================
  // RESPONSIVE ADJUSTMENTS
  // ========================================
  responsive: {
    mobileBreakpoint: 640,           // px
    mobileSectionDuration: 400,      // Faster animations on mobile
    disableScrollAnimationsOnMobile: false,
  },

  // ========================================
  // PERFORMANCE SETTINGS
  // ========================================
  performance: {
    useGPU: true,                    // Use transform/opacity
    maxStaggeredItems: 5,            // Max items to stagger
    unobserveAfterScroll: true,      // Remove observers after animation
    debounceScroll: false,           // Debounce scroll events
  }
};

/**
 * Usage Example: Customize animations
 */
export function customizeAnimations() {
  // Access config anywhere in your app
  const config = AnimationConfig;

  // Example: Change primary color across all animations
  const root = document.documentElement;
  root.style.setProperty('--accent-500', config.colors.primary);
  root.style.setProperty('--accent-600', config.colors.primaryDark);

  // Example: Change animation durations
  const style = document.createElement('style');
  style.textContent = `
    /* Custom timings based on config */
    section {
      animation-duration: ${config.timing.pageLoad.section}ms;
    }
    
    .btn:hover {
      transition-duration: ${config.timing.interactions.buttonHover}ms;
    }
    
    .card:hover {
      transition-duration: ${config.timing.interactions.cardHover}ms;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Export for use with optional CSS-in-JS
 */
export const cssVariables = {
  '--animation-fast': `${AnimationConfig.timing.interactions.buttonHover}ms`,
  '--animation-normal': `${AnimationConfig.timing.interactions.cardHover}ms`,
  '--animation-slow': '350ms',
  '--easing-smooth': AnimationConfig.easing.smooth,
  '--color-primary': '#000000',
  '--color-error': '#000000',
  '--color-success': '#404040',
};

// Auto-export for global access if needed
if (typeof window !== 'undefined') {
  window.AnimationConfig = AnimationConfig;
}

export default AnimationConfig;
