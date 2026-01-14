# 🌍 Multilingual System - Quick Reference

## 🚀 Quick Access

### Language Switcher Location
- **Desktop**: User Menu → Language Section (Grid of EN/AR/FR buttons)
- **Mobile**: Navigation Menu → Language Section (Flag buttons)
- **Guests**: Available in mobile menu

### Supported Languages
- 🇬🇧 **English (EN)** - `/en` - LTR
- 🇸🇦 **Arabic (AR)** - `/ar` - RTL (Right-to-Left)
- 🇫🇷 **French (FR)** - `/fr` - LTR

---

## 💻 Developer Quick Start

### Use translations in any component:
```tsx
import { useLanguage } from '../utils/i18n';

const { t, language, setLanguage } = useLanguage();

// Use translation
<h1>{t('nav.home')}</h1>

// Check current language
if (language === 'ar') { /* RTL specific */ }

// Change language
setLanguage('fr');
```

### Add new translations:
Edit `/locales/en.json`, `/locales/ar.json`, `/locales/fr.json`:
```json
{
  "myKey": "My Translation"
}
```

---

## 🎨 Available Translation Keys

### Navigation
- `nav.home`, `nav.explore`, `nav.pricing`
- `nav.aiChat`, `nav.aiImage`, `nav.aiVideo`, `nav.aiVoice`
- `nav.signIn`, `nav.getStarted`, `nav.logout`

### Hero Section
- `hero.title`, `hero.subtitle`, `hero.promptPlaceholder`
- `hero.generate`, `hero.synthesize`, `hero.tryFree`
- `hero.poweredBy`, `hero.quickIdeas`

### Profile & Credits
- `profile.title`, `profile.email`, `profile.language`
- `credits.title`, `credits.unlimited`, `credits.available`
- `plans.upgrade`, `plans.buyCredits`, `plans.viewPlans`

### Common
- `common.loading`, `common.error`, `common.success`
- `common.delete`, `common.download`, `common.close`

---

## 🔧 Key Features

✅ **Persistence**: Cookie + localStorage + URL
✅ **RTL Support**: Full Arabic RTL layout
✅ **SEO Ready**: Proper lang attributes
✅ **No Reload**: Instant language switching
✅ **Mobile Friendly**: Responsive design
✅ **Professional**: SaaS-quality translations

---

## 📦 Files Modified

```
/locales/en.json          # English translations
/locales/ar.json          # Arabic translations
/locales/fr.json          # French translations
/utils/i18n.tsx           # i18n system
/components/Navbar.tsx    # Language switcher
/components/Hero.tsx      # Translated hero
/index.css                # RTL styles
package.json              # Added js-cookie
```

---

## 🧪 Test Checklist

- [x] Switch between EN/AR/FR
- [x] Check URL updates (`/en`, `/ar`, `/fr`)
- [x] Refresh page - language persists
- [x] Test on mobile
- [x] Verify RTL for Arabic
- [x] Check dropdowns position
- [x] Test as guest user
- [x] Test as logged-in user
- [x] Build succeeds (`npm run build`)

---

## 🎯 Priority System

1. **URL** - `/ar` in URL → Arabic
2. **Cookie** - `NEXT_LOCALE=fr` → French
3. **localStorage** - `site_language=en` → English
4. **Browser** - `navigator.language=ar` → Arabic
5. **Default** - English

---

## 🚀 Deployment Ready

✅ All components translated
✅ RTL support implemented
✅ Cookie persistence active
✅ Build tested successfully
✅ Production-ready code

**Status**: Complete ✅

---

For full documentation, see: `MULTILINGUAL_SYSTEM_GUIDE.md`
