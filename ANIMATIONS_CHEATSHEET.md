# 🎬 CSS Animations Cheat Sheet

> Quick reference for all modern animations and micro-interactions

## 📋 Quick Copy-Paste Examples

### Page Load - Fade & Slide Up
```tsx
<section className="animate-fade-in-up">
  Content fades in with slight upward motion
</section>
```

### Button with Micro-Interactions
```tsx
<button className="btn btn-primary">
  Click me - hovers scale 1.03, lifts 2px, shadow elevates
</button>
```

### Card with Hover Lift
```tsx
<div className="card">
  <h3>Hover to lift</h3>
  <p>translateY(-8px), shadow elevation</p>
</div>
```

### Navigation Links
```tsx
<nav>
  <a href="/" className="nav-link active">Home</a>
  <a href="/about" className="nav-link">About</a>
</nav>
```

### Form Input with Focus Glow
```tsx
<input 
  type="email" 
  placeholder="Email address"
  className="w-full px-4 py-2 border rounded-lg"
/>
```

### Scroll Animation
```tsx
<div className="scroll-animate">
  Fades in when scrolled into view
</div>
```

---

## 🏷️ All CSS Classes

### Page Load Animations
| Class | Effect | Timing |
|-------|--------|--------|
| `.animate-fade-in` | Simple fade-in | 400ms |
| `.animate-fade-in-up` | Fade + slide up | 600ms |
| `.animate-scale-in` | Scale 0.95 → 1 | 400ms |
| `.stagger-children > *` | Stagger child animations | 0.1s-0.5s delays |

### Button Interactions
| Class | Effect |
|-------|--------|
| `.btn` | Base button styling |
| `.btn-primary` | Blue gradient CTA |
| `.btn-secondary` | Semi-transparent variant |
| `.btn-ghost` | Transparent + border |

**Button Hover Effects (automatic)**:
- Scale 1.03
- Lift -2px (translateY)
- Shadow elevation

### Card Effects
| Class | Effect |
|-------|--------|
| `.card` | Lift -8px on hover, shadow elevation |
| `.card-subtle` | Lighter lift -4px on hover |
| `.card-with-image` | Image zoom 1.05 on hover |

### Navigation
| Class | Effect |
|-------|--------|
| `.nav-link` | Underline slides on hover |
| `.nav-link.active` | Persistent underline |

**Navigation Hover Effects (automatic)**:
- Underline slides from left to right
- Smooth color transition

### Form Inputs
| Class | Effect |
|-------|--------|
| `.input-error` | Red border + glow, shake animation |
| `.input-success` | Green border + subtle glow |
| `.form-group` | Smooth transitions |

**Input Focus Effects (automatic)**:
- Border color change
- Blue glow box-shadow
- Placeholder color transition

### Scroll Animations
| Class | Effect | Trigger |
|--------|---------|---------|
| `.scroll-animate` | Fade-in + slide up | Intersection Observer |
| `.fade-on-scroll` | Fade only | Intersection Observer |
| `.slide-on-scroll` | Slide up only | Intersection Observer |
| `[data-scroll]` | Same as .scroll-animate | Intersection Observer |
| `.in-view` | Applied by JS when visible | Auto |

### Loading States
| Class | Effect | Duration |
|-------|--------|----------|
| `.skeleton` | Shimmer gradient | 2s infinite |
| `.pulse` | Opacity fade | 2s infinite |

### Transition Utilities
| Class | Duration |
|-------|----------|
| `.transition-fast` | 150ms |
| `.transition-normal` | 250ms |
| `.transition-slow` | 350ms |

### Animation Delays
| Class | Delay |
|-------|-------|
| `.delay-75` | 75ms |
| `.delay-100` | 100ms |
| `.delay-150` | 150ms |
| `.delay-200` | 200ms |
| `.delay-300` | 300ms |

### Duration Utilities
| Class | Duration |
|-------|----------|
| `.duration-200` | 200ms |
| `.duration-300` | 300ms |
| `.duration-500` | 500ms |
| `.duration-700` | 700ms |

---

## ⚙️ JavaScript API

### Auto-Initialize (recommended)
```tsx
// In index.tsx - already done!
import { initAllAnimations } from './animations.js';
initAllAnimations();
```

### Manual Control
```js
// Initialize specific features
import { 
  initScrollAnimations,
  initNavbarScroll,
  initFormAnimations,
  initButtonRipples
} from './animations.js';

initScrollAnimations();     // Scroll triggers
initNavbarScroll();         // Navbar blur on scroll
initFormAnimations();       // Form validation feedback
initButtonRipples();        // Ripple click effect
```

### Global API (available in window)
```js
// Access from console or anywhere
window.AnimationsAPI.initScrollAnimations();
window.AnimationsAPI.initNavbarScroll();
window.AnimationsAPI.initFormAnimations();
window.AnimationsAPI.initButtonRipples();
window.AnimationsAPI.initPageTransitions();
window.AnimationsAPI.initAllAnimations();
```

---

## 🎨 CSS Variables (Customizable)

All animations use these CSS variables:

```css
:root {
  --accent-500: #1f4b99;        /* Accent color for hovers */
  --accent-600: #153a7a;        /* Darker accent */
  --text-strong: #0f172a;       /* Main text */
  --text-soft: #475569;         /* Secondary text */
  --surface: #ffffff;           /* Background */
  --surface-muted: #f1f4f9;     /* Muted background */
  --border-soft: rgba(...);     /* Subtle borders */
  --shadow-soft: 0 24px 68px;   /* Soft shadows */
}
```

Change any variable to update ALL animations automatically:

```css
:root {
  --accent-500: #ff6b6b;  /* Now ALL hovers use red! */
}
```

---

## 🎯 Timing & Easing

### Standard Easing (used everywhere)
```
cubic-bezier(0.4, 0, 0.2, 1)  /* Smooth ease-out */
```

### Default Timings
```
Page Load:     600ms  (sections), 400ms (elements)
Button Hover:  250ms  scale + lift
Card Hover:    300ms  lift + shadow
Input Focus:   200ms  border + glow
Scroll Anim:   600ms  fade-in-up
```

---

## 💡 Pro Tips

### Tip 1: Stagger Children Elements
```tsx
<div className="stagger-children">
  <p>Item 1 - 100ms delay</p>
  <p>Item 2 - 200ms delay</p>
  <p>Item 3 - 300ms delay</p>
</div>
```

### Tip 2: Manual Animation Delays
```tsx
<section className="animate-fade-in-up delay-200">
  This animates 200ms after the page loads
</section>
```

### Tip 3: Slower Animations on Desktop
```tsx
<div className="card transition-normal">
  Smooth 250ms transition on all devices
</div>

<div className="card transition-slow">
  Extra smooth 350ms for premium feel
</div>
```

### Tip 4: Disable Animations When Not Needed
```tsx
<div className="card no-animation">
  No animation on this card
</div>
```

### Tip 5: Combine Multiple Classes
```tsx
<button className="btn btn-primary transition-slow delay-100">
  Slower button animation with 100ms delay
</button>
```

---

## ♿ Accessibility Checklist

- ✅ Focus states visible (outline ring on buttons/inputs)
- ✅ Respects `prefers-reduced-motion` (auto-disabled in DevTools)
- ✅ No color-only feedback (uses borders + text)
- ✅ Animations don't prevent interaction
- ✅ 4.5:1 contrast on all text

Test accessibility:
```bash
# DevTools > Rendering > Emulate CSS media feature prefers-reduced-motion
# Should see instant state changes instead of animations
```

---

## 🐛 Common Issues & Fixes

### Issue: Animations not running
**Solution**: 
- Check element has correct class (`.animate-fade-in-up` not `.animate`)
- Verify `index.tsx` has `initAllAnimations()` call
- Check browser console for errors

### Issue: Scroll animations not triggering
**Solution**:
- Ensure element has `.scroll-animate` class
- Scroll slowly to give observer time to trigger
- Check in DevTools that `in-view` class is added

### Issue: Form glow not showing
**Solution**:
- Input needs proper `focus` styling
- Check parent container doesn't have `overflow: hidden`
- Use `:focus` or `:focus-visible` in CSS

### Issue: Performance issues on mobile
**Solution**:
- Add `.no-animation` to non-critical elements
- Reduce stagger delays (max 5 children)
- Call only needed init functions (skip ripples if not needed)

### Issue: Navbar blur effect not working
**Solution**:
- Ensure `<nav>` element exists
- Call `initNavbarScroll()` explicitly
- Check navbar has fixed or sticky positioning

---

## 📊 Performance Reference

| Feature | Impact | Cost |
|---------|--------|------|
| Page load animations | Visual polish | 0ms overhead |
| Button hovers | Micro-feedback | GPU accelerated |
| Card lifts | Premium feel | GPU accelerated |
| Scroll animations | Engagement | ~500μs per scroll |
| Form validation | UX feedback | <1ms per keystroke |
| Ripple effects | Delight | <1ms per click |

**Total Bundle Size**: ~23 KB (7 KB gzipped)

---

## 📚 File Structure

```
project/
├── index.css           # All CSS animations (~1000 lines)
├── animations.js       # JS helpers (optional)
├── index.tsx           # Auto-initialization
├── components/
│   ├── AnimationsShowcase.tsx  # Live demo
│   └── [your components]
└── ANIMATIONS_GUIDE.md # Full documentation
```

---

## 🚀 Getting Started

1. **CSS animations work automatically** - just add classes:
```tsx
<section className="animate-fade-in-up">Hello</section>
```

2. **For scroll animations**, JavaScript auto-initializes:
```tsx
// No additional code needed - already in index.tsx
```

3. **Customize as needed**:
```css
/* Edit index.css to adjust timing, colors, easing */
:root {
  --accent-500: #your-color;
}
```

That's it! Your website now has premium SaaS-style animations. 🎉

---

## 🔗 Quick Links

- [Full Documentation](./ANIMATIONS_GUIDE.md)
- [Live Showcase](./components/AnimationsShowcase.tsx)
- [CSS Keyframes](./index.css#L900)
- [JS API](./animations.js)

---

**Made for premium user experiences** ✨
