/**
 * Modern CSS Animations & Micro-Interactions Helper
 * 
 * Enables:
 * - Intersection Observer for scroll animations
 * - Navbar scroll effect
 * - Form validation animations
 * - Smooth page transitions
 * 
 * No heavy dependencies - pure JavaScript
 */

// ========================================
// Scroll Animation Observer
// ========================================

/**
 * Initialize Intersection Observer for scroll animations
 * Applies 'in-view' class when elements enter viewport
 */
export function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        // Optional: unobserve after animation to save performance
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all elements with scroll animation classes
  const elementsToObserve = document.querySelectorAll(
    '.scroll-animate, [data-scroll], .fade-on-scroll, .slide-on-scroll, section'
  );

  elementsToObserve.forEach(el => {
    observer.observe(el);
  });

  return observer;
}

// ========================================
// Navbar Scroll Effect
// ========================================

/**
 * Add glassmorphism effect to navbar on scroll
 * Adds 'scrolled' class when user scrolls down
 */
export function initNavbarScroll() {
  const navbar = document.querySelector('nav, .navbar');
  if (!navbar) return;

  const scrollThreshold = 10;
  let lastScrollY = 0;

  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > scrollThreshold) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    lastScrollY = currentScrollY;
  };

  // Use passive listener for better scroll performance
  window.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}

// ========================================
// Form Validation Animations
// ========================================

/**
 * Add animation feedback for form validation
 * Shows error/success states with smooth animations
 */
export function initFormAnimations() {
  const inputs = document.querySelectorAll('input, textarea, select');

  inputs.forEach(input => {
    // Blur event for validation feedback
    input.addEventListener('blur', function() {
      validateInput(this);
    });

    // Real-time validation for better UX
    input.addEventListener('input', function() {
      if (this.classList.contains('input-error')) {
        validateInput(this);
      }
    });
  });

  return () => {
    inputs.forEach(input => {
      input.removeEventListener('blur', validateInput);
      input.removeEventListener('input', validateInput);
    });
  };
}

/**
 * Validate individual input and apply animation
 */
function validateInput(input) {
  const isValid = input.checkValidity();

  if (!isValid && input.value.trim()) {
    input.classList.add('input-error');
    input.classList.remove('input-success');
  } else if (isValid && input.value.trim()) {
    input.classList.remove('input-error');
    input.classList.add('input-success');
  } else {
    input.classList.remove('input-error', 'input-success');
  }
}

// ========================================
// Smooth Page Transitions
// ========================================

/**
 * Add fade-out animation before page navigation
 * Enhances perceived performance with smooth transitions
 */
export function initPageTransitions() {
  const links = document.querySelectorAll('a[href^="/"], a[href^="./"]');

  links.forEach(link => {
    link.addEventListener('click', function(e) {
      // Only animate internal links, not anchors or external
      const href = this.getAttribute('href');
      if (href.startsWith('#') || this.target === '_blank') {
        return;
      }

      e.preventDefault();
      
      const fadeOut = document.createElement('div');
      fadeOut.className = 'page-transition-overlay';
      fadeOut.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--surface);
        opacity: 0;
        animation: fadeIn 0.3s ease-out forwards;
        pointer-events: none;
        z-index: 9999;
      `;

      document.body.appendChild(fadeOut);

      setTimeout(() => {
        window.location.href = href;
      }, 300);
    });
  });
}

// ========================================
// Button Ripple Effect (Optional Enhanced Interaction)
// ========================================

/**
 * Add subtle ripple effect on button click
 * Creates visual feedback similar to Material Design
 */
export function initButtonRipples() {
  const buttons = document.querySelectorAll('button, [role="button"], .btn');

  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      // Only show ripple if not disabled
      if (this.disabled || this.getAttribute('aria-disabled') === 'true') {
        return;
      }

      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        animation: rippleExpand 0.6s cubic-bezier(0, 0, 0.2, 1) forwards;
      `;

      // Ensure button has position relative
      if (getComputedStyle(this).position === 'static') {
        this.style.position = 'relative';
      }

      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });
}

// Add ripple animation keyframe dynamically
function addRippleAnimation() {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes rippleExpand {
      from {
        transform: scale(0);
        opacity: 0.8;
      }
      to {
        transform: scale(1);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}

// ========================================
// Initialize All Animations on DOM Ready
// ========================================

/**
 * Master initialization function
 * Call this once when the app loads
 */
export function initAllAnimations() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    console.log('🎬 Initializing modern CSS animations...');
    
    addRippleAnimation();
    initScrollAnimations();
    initNavbarScroll();
    initFormAnimations();
    initButtonRipples();
    
    console.log('✅ Animations initialized successfully');
  }
}

// Auto-initialize if used as a module
if (typeof window !== 'undefined') {
  window.AnimationsAPI = {
    initScrollAnimations,
    initNavbarScroll,
    initFormAnimations,
    initButtonRipples,
    initPageTransitions,
    initAllAnimations
  };
}
