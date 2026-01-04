# 🎯 Luxury Design System - Quick Reference

> Fast reference for luxury black & white design components

---

## 🎨 Color Palette

```css
/* Use only these */
--black: #000000
--white: #FFFFFF
--gray-50 through --gray-900 (for muted elements)
```

---

## 📏 Typography Classes

### Headings

```html
<!-- Massive hero title (80px) -->
<h1 class="heading-lg">Luxury Title</h1>

<!-- Large section title (56px) -->
<h2 class="heading-md">Section Title</h2>

<!-- Medium heading (40px) -->
<h3 class="heading-sm">Subsection</h3>
```

### Body Text

```html
<!-- Default body text is 18px with 2.0 line-height -->
<p>Highly readable body text with generous spacing.</p>

<!-- Muted text -->
<p class="text-gray-500">Secondary information</p>
```

---

## 🔘 Buttons

### Primary (Black)

```html
<button class="btn-primary">
  Get Started
</button>
```

**Style**: Black background, white text, no border, lifted shadow

### Secondary (Minimal)

```html
<button class="btn-secondary">
  Learn More
</button>
```

**Style**: Transparent, black text, light border, transforms to black on hover

### Ghost (Ultra Minimal)

```html
<button class="btn-ghost">
  Explore
</button>
```

**Style**: Transparent, barely-there border, transforms to black on hover

---

## 🎴 Cards

### Default Card

```html
<div class="card">
  <h3>Card Title</h3>
  <p>Card content with generous padding.</p>
</div>
```

**Style**: Borderless, 3rem padding, soft shadow, lifts 12px on hover

### Subtle Card

```html
<div class="card card-subtle">
  <p>Less dramatic hover effect</p>
</div>
```

**Style**: Lifts 4px instead of 12px on hover

---

## 📝 Forms

### Input Fields

```html
<input 
  type="text" 
  placeholder="Your name"
  class="w-full"
/>
```

**Style**: 
- Gray background
- Bottom border only
- Lifts on focus
- Large padding (1.25rem)
- 18px font size

### Textarea

```html
<textarea 
  placeholder="Your message"
  class="w-full"
  rows="5"
></textarea>
```

**Same styling as inputs**

---

## 🧭 Navigation

```html
<nav>
  <a href="/" class="nav-link active">Home</a>
  <a href="/about" class="nav-link">About</a>
  <a href="/contact" class="nav-link">Contact</a>
</nav>
```

**Style**:
- Generous padding (0.75rem 1.5rem)
- Centered underline animation (80% width)
- Ultra-clean glass background
- Minimal bottom border only

---

## 🏷️ Badges & Tags

```html
<span class="chip">New</span>
<span class="badge">Pro</span>
<span class="tag">Featured</span>
```

**Style**: Borderless, gray background, pill shape, generous padding

---

## 📐 Spacing Utilities

### Luxury Spacing (Sections)

```html
<!-- Large spacing (8rem padding) -->
<section class="luxury-spacing-lg">
  Content with maximum breathing room
</section>

<!-- Default spacing (6rem padding) -->
<section class="luxury-spacing">
  Standard luxury section
</section>

<!-- Small spacing (4rem padding) -->
<section class="luxury-spacing-sm">
  Compact luxury section
</section>
```

### Luxury Containers

```html
<div class="luxury-container">
  <!-- Max-width 1280px, centered, 2rem side padding -->
  Content
</div>
```

### Luxury Gaps (Flex/Grid)

```html
<!-- Large gap (4rem) -->
<div class="flex luxury-gap-lg">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Default gap (3rem) -->
<div class="flex luxury-gap">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Small gap (2rem) -->
<div class="flex luxury-gap-sm">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

## 🌫️ Glass Elements

```html
<div class="glass">
  Semi-transparent container with blur
</div>
```

**Style**: 
- 95% white opacity
- 16px blur
- Borderless
- Soft shadow
- 2rem padding

---

## 💫 Hover States

All interactive elements have luxury hover states:

- **Buttons**: Lift 2px + stronger shadow
- **Cards**: Lift 12px + dramatic shadow
- **Nav Links**: Centered underline grows to 80%
- **Inputs**: Lift 1px + black bottom border
- **Ghost Buttons**: Transform to black

---

## 🎯 Layout Patterns

### Hero Section

```html
<section class="luxury-spacing-lg">
  <div class="luxury-container">
    <h1 class="heading-lg">
      Your Luxury Title
    </h1>
    <p class="text-xl text-gray-500 mb-8">
      Subtitle with generous spacing
    </p>
    <button class="btn-primary">
      Get Started
    </button>
  </div>
</section>
```

### Feature Grid

```html
<section class="luxury-spacing">
  <div class="luxury-container">
    <h2 class="heading-md text-center mb-16">
      Features
    </h2>
    <div class="grid grid-cols-3 luxury-gap">
      <div class="card">
        <h3>Feature 1</h3>
        <p>Description</p>
      </div>
      <div class="card">
        <h3>Feature 2</h3>
        <p>Description</p>
      </div>
      <div class="card">
        <h3>Feature 3</h3>
        <p>Description</p>
      </div>
    </div>
  </div>
</section>
```

### CTA Section

```html
<section class="luxury-spacing bg-black text-white">
  <div class="luxury-container text-center">
    <h2 class="heading-md mb-8">
      Ready to Get Started?
    </h2>
    <div class="flex justify-center luxury-gap-sm">
      <button class="btn-primary">
        Start Now
      </button>
      <button class="btn-secondary">
        Learn More
      </button>
    </div>
  </div>
</section>
```

---

## 📱 Responsive Classes

All luxury utilities work with Tailwind responsive prefixes:

```html
<!-- Responsive luxury spacing -->
<section class="luxury-spacing-sm md:luxury-spacing lg:luxury-spacing-lg">
  Adapts spacing to screen size
</section>

<!-- Responsive gaps -->
<div class="flex luxury-gap-sm md:luxury-gap lg:luxury-gap-lg">
  Items with responsive spacing
</div>
```

---

## ✨ Animation Classes

```html
<!-- Fade in up (page load) -->
<div class="animate-fade-in-up">
  Content
</div>

<!-- Scale in (cards) -->
<div class="animate-scale-in">
  Card
</div>

<!-- Slide in from sides -->
<div class="animate-slide-in-left">Left content</div>
<div class="animate-slide-in-right">Right content</div>
```

---

## 🎨 Dark Mode

```html
<!-- Toggle dark mode -->
<body class="theme-dark">
  <!-- All colors automatically invert -->
</body>
```

Colors automatically switch:
- Background: white → black
- Text: black → white
- Borders: gray-200 → gray-800
- Shadows: adjusted for dark background

---

## ⚡ Performance Tips

1. **Use luxury classes sparingly** - They add generous spacing which increases page height
2. **Combine with responsive classes** - Reduce spacing on mobile
3. **Limit card hover animations** - Don't apply to every element
4. **Use appropriate heading levels** - Luxury scale is dramatic, use wisely

---

## 🚫 Common Mistakes

### ❌ Don't Do This

```html
<!-- Too much spacing -->
<section class="luxury-spacing-lg">
  <div class="luxury-spacing-lg">
    <div class="luxury-spacing-lg">
      <!-- Spacing overload! -->
    </div>
  </div>
</section>

<!-- Adding borders back -->
<div class="card border border-gray-200">
  <!-- Ruins luxury feel -->
</div>

<!-- Reducing button padding -->
<button class="btn-primary py-2 px-4">
  <!-- Too cramped -->
</button>
```

### ✅ Do This Instead

```html
<!-- Balanced spacing -->
<section class="luxury-spacing">
  <div class="luxury-container">
    <div class="flex luxury-gap">
      <!-- Clean hierarchy -->
    </div>
  </div>
</section>

<!-- Keep borderless -->
<div class="card">
  <!-- Perfect luxury feel -->
</div>

<!-- Use default button padding -->
<button class="btn-primary">
  <!-- Comfortable size -->
</button>
```

---

## 🎯 Design Checklist

Before deploying, verify:

- [ ] All headings use luxury scale (80px, 56px, 40px)
- [ ] Sections have 6-8rem spacing
- [ ] Buttons have 1.125rem 2.5rem padding
- [ ] Cards are borderless with shadows
- [ ] Forms have bottom-border-only style
- [ ] Navigation is minimal with centered underlines
- [ ] No colored accents (black/white/gray only)
- [ ] All interactions lift on hover
- [ ] Line-height is 2.0 for body text
- [ ] Font size is minimum 18px

---

## 📚 Resources

- **Full Design System**: [BLACK_WHITE_DESIGN_SYSTEM.md](BLACK_WHITE_DESIGN_SYSTEM.md)
- **Luxury Refinements**: [LUXURY_DESIGN_REFINEMENTS.md](LUXURY_DESIGN_REFINEMENTS.md)
- **Animations Guide**: [ANIMATIONS_GUIDE.md](ANIMATIONS_GUIDE.md)
- **Main Stylesheet**: [index.css](index.css)

---

## 🎉 Result

Following this guide produces:

✨ **Premium luxury aesthetic**  
✨ **Generous whitespace**  
✨ **Minimal borders**  
✨ **Dramatic typography**  
✨ **Smooth interactions**  
✨ **High-end SaaS feel**

**Simple. Elegant. Luxury.** 🖤🤍
