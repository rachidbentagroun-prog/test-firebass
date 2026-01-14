# 📚 Adding Translations to Your Components - Examples

## Example 1: Simple Component with Translations

```tsx
import React from 'react';
import { useLanguage } from '../utils/i18n';

export const WelcomeMessage: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      <p>{t('welcome.description')}</p>
      <button>{t('welcome.getStarted')}</button>
    </div>
  );
};
```

**Add to translation files:**

```json
// locales/en.json
{
  "welcome": {
    "title": "Welcome to ImaginAI",
    "description": "Create amazing AI-powered content",
    "getStarted": "Get Started"
  }
}

// locales/ar.json
{
  "welcome": {
    "title": "مرحبا بك في ImaginAI",
    "description": "أنشئ محتوى مذهلاً مدعوماً بالذكاء الاصطناعي",
    "getStarted": "ابدأ الآن"
  }
}

// locales/fr.json
{
  "welcome": {
    "title": "Bienvenue sur ImaginAI",
    "description": "Créez du contenu incroyable propulsé par l'IA",
    "getStarted": "Commencer"
  }
}
```

---

## Example 2: Component with Dynamic Content

```tsx
import React from 'react';
import { useLanguage } from '../utils/i18n';

export const UserGreeting: React.FC<{ userName: string }> = ({ userName }) => {
  const { t, language } = useLanguage();
  
  // Format greeting based on language
  const greeting = language === 'ar' 
    ? `${t('greeting.hello')} ${userName}` 
    : `${t('greeting.hello')}, ${userName}!`;
  
  return (
    <div>
      <h2>{greeting}</h2>
      <p>{t('greeting.lastSeen')}</p>
    </div>
  );
};
```

**Translation files:**

```json
// locales/en.json
{
  "greeting": {
    "hello": "Hello",
    "lastSeen": "Last seen today"
  }
}

// locales/ar.json
{
  "greeting": {
    "hello": "مرحباً",
    "lastSeen": "آخر ظهور اليوم"
  }
}

// locales/fr.json
{
  "greeting": {
    "hello": "Bonjour",
    "lastSeen": "Vu aujourd'hui"
  }
}
```

---

## Example 3: Form Component with Translations

```tsx
import React, { useState } from 'react';
import { useLanguage } from '../utils/i18n';

export const ContactForm: React.FC = () => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  
  return (
    <form>
      <h2>{t('contact.title')}</h2>
      
      <label>{t('contact.nameLabel')}</label>
      <input 
        type="text" 
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('contact.namePlaceholder')}
      />
      
      <label>{t('contact.emailLabel')}</label>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('contact.emailPlaceholder')}
      />
      
      <label>{t('contact.messageLabel')}</label>
      <textarea 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t('contact.messagePlaceholder')}
      />
      
      <button type="submit">
        {t('contact.send')}
      </button>
    </form>
  );
};
```

**Translation files:**

```json
// locales/en.json
{
  "contact": {
    "title": "Contact Us",
    "nameLabel": "Name",
    "namePlaceholder": "Enter your name",
    "emailLabel": "Email",
    "emailPlaceholder": "Enter your email",
    "messageLabel": "Message",
    "messagePlaceholder": "Type your message here...",
    "send": "Send Message"
  }
}

// locales/ar.json
{
  "contact": {
    "title": "اتصل بنا",
    "nameLabel": "الاسم",
    "namePlaceholder": "أدخل اسمك",
    "emailLabel": "البريد الإلكتروني",
    "emailPlaceholder": "أدخل بريدك الإلكتروني",
    "messageLabel": "الرسالة",
    "messagePlaceholder": "اكتب رسالتك هنا...",
    "send": "إرسال الرسالة"
  }
}

// locales/fr.json
{
  "contact": {
    "title": "Contactez-nous",
    "nameLabel": "Nom",
    "namePlaceholder": "Entrez votre nom",
    "emailLabel": "Email",
    "emailPlaceholder": "Entrez votre email",
    "messageLabel": "Message",
    "messagePlaceholder": "Tapez votre message ici...",
    "send": "Envoyer le message"
  }
}
```

---

## Example 4: Conditional Rendering Based on Language

```tsx
import React from 'react';
import { useLanguage } from '../utils/i18n';

export const PricingCard: React.FC<{ price: number }> = ({ price }) => {
  const { t, language } = useLanguage();
  
  // Format price based on language
  const formattedPrice = language === 'ar' 
    ? `${price} دولار` 
    : language === 'fr'
    ? `${price} $`
    : `$${price}`;
  
  return (
    <div>
      <h3>{t('pricing.planName')}</h3>
      <div className="price">{formattedPrice}</div>
      <ul>
        <li>{t('pricing.feature1')}</li>
        <li>{t('pricing.feature2')}</li>
        <li>{t('pricing.feature3')}</li>
      </ul>
      <button>{t('pricing.subscribe')}</button>
    </div>
  );
};
```

---

## Example 5: Using Language in Hooks

```tsx
import { useEffect } from 'react';
import { useLanguage } from '../utils/i18n';

export const useDocumentTitle = (titleKey: string) => {
  const { t, language } = useLanguage();
  
  useEffect(() => {
    document.title = t(titleKey);
  }, [t, titleKey, language]);
};

// Usage in component:
export const HomePage = () => {
  useDocumentTitle('pages.home.title');
  
  return <div>Home Content</div>;
};
```

**Translation files:**

```json
// locales/en.json
{
  "pages": {
    "home": {
      "title": "Home - ImaginAI"
    }
  }
}

// locales/ar.json
{
  "pages": {
    "home": {
      "title": "الرئيسية - ImaginAI"
    }
  }
}

// locales/fr.json
{
  "pages": {
    "home": {
      "title": "Accueil - ImaginAI"
    }
  }
}
```

---

## 🎨 Best Practices

### 1. **Organize Translation Keys**
Use namespaces for better organization:
```json
{
  "nav": { ... },
  "hero": { ... },
  "forms": { ... },
  "errors": { ... }
}
```

### 2. **Keep Translations Professional**
- **English**: Clear, concise, professional
- **Arabic**: Modern Standard Arabic (MSA), not dialect
- **French**: Business/professional level, not casual

### 3. **Handle Pluralization**
```tsx
const itemCount = 5;
const message = itemCount === 1 
  ? t('items.singular') 
  : t('items.plural').replace('{count}', itemCount.toString());
```

### 4. **Test RTL for Arabic**
Always check:
- Text alignment
- Icon positions
- Menu directions
- Form layouts

### 5. **Use Fallbacks**
The translation function automatically falls back to the key if translation is missing:
```tsx
// If 'new.feature' doesn't exist, it returns 'new.feature'
<p>{t('new.feature')}</p>
```

---

## 🚀 Common Patterns

### Button with Icon
```tsx
<button>
  <Icon />
  {t('button.label')}
</button>
```

### Error Messages
```tsx
{error && <div className="error">{t('errors.generic')}</div>}
```

### Loading States
```tsx
{loading ? t('common.loading') : t('button.submit')}
```

### Success Messages
```tsx
{success && <div className="success">{t('common.success')}</div>}
```

---

## 📊 Translation File Structure

```json
{
  "section": {
    "subsection": {
      "key": "Translation"
    }
  }
}
```

**Access**: `t('section.subsection.key')`

---

## ✨ Tips

1. **Keep keys descriptive**: `user.profile.edit` not `u.p.e`
2. **Avoid hardcoded strings**: Always use `t()` for user-facing text
3. **Test all languages**: Switch and verify UI
4. **Update all files**: EN, AR, FR must have same keys
5. **Check RTL carefully**: Arabic needs special attention

---

**Happy Translating! 🌍**
