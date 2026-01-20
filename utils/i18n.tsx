import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';

// Import translation files
import enTranslations from '../locales/en.json';
import arTranslations from '../locales/ar.json';
import frTranslations from '../locales/fr.json';

export type Language = 'en' | 'ar' | 'fr';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'site_language';
const COOKIE_KEY = 'NEXT_LOCALE';

// Translation dictionary mapping
const TRANSLATIONS: Record<Language, any> = {
  en: enTranslations,
  ar: arTranslations,
  fr: frTranslations,
};

// Helper function to get nested translation
const getNestedTranslation = (obj: any, path: string): string => {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // Return the key if not found
    }
  }
  return typeof result === 'string' ? result : path;
};

// Legacy DICTS for backward compatibility with existing code
const DICTS: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.login': 'Login',
    'nav.signup': 'Sign Up',
    'nav.profile': 'Profile',
    'nav.logout': 'Logout',
    // Profile
    'profile.title': 'Creator Profile',
    'profile.edit': 'Edit Profile',
    'profile.save': 'Save',
    'profile.cancel': 'Cancel',
    'profile.email': 'Email',
    'profile.language': 'Language',
    'profile.contactUs': 'Contact Us',
    'profile.viewPlans': 'View Plans',
    'profile.credits': 'Credits Remaining',
    'profile.plan': 'Assigned Protocol',
    'profile.status': 'Status',
    'profile.joined': 'Joined Protocol',
    'profile.archiveSize': 'Archive Size',
    'profile.assets': 'Assets',
    'profile.active': 'Active',
    'profile.backToStation': 'Back to Station',
    // Tabs
    'tabs.profile': 'Creator Profile',
    'tabs.history': 'Generation History',
    'tabs.inbox': 'Inbox',
    // History
    'history.title': 'ALL YOUR AUDIO AND VIDEO AND AUDIOS GENERATIONS',
    'history.empty': 'Vault Empty',
    'history.emptyDesc': 'Initialize production to populate your creation archive',
    // Messages
    'messages.title': 'System Transmits',
    'messages.from': 'From',
    'messages.empty': 'No active transmits in buffer',
    'messages.supportSessions': 'Support Sessions',
    'messages.session': 'Session',
    'messages.open': 'Open',
    'messages.reply': 'Type a reply...',
    'messages.send': 'Send',
    'messages.noMessages': 'No messages yet.',
    'messages.noSupport': 'No support activity yet.',
    // Contact
    'contact.title': 'Contact Admin',
    'contact.subject': 'Subject (optional)',
    'contact.subjectPlaceholder': 'How can we help?',
    'contact.message': 'Message',
    'contact.messagePlaceholder': 'Describe your issue or request...',
    'contact.cancel': 'Cancel',
    'contact.send': 'Send',
    'contact.sending': 'Sending...',
    // Plans
    'plans.basic': 'Basic Creator',
    'plans.premium': 'Premium',
    'plans.free': 'Free',
    'plans.getStarted': 'Get Started',
    'plans.upgrade': 'Upgrade',
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.delete': 'Delete',
    'common.download': 'Download',
    'common.close': 'Close',
  },
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.features': 'الميزات',
    'nav.pricing': 'الأسعار',
    'nav.login': 'تسجيل الدخول',
    'nav.signup': 'إنشاء حساب',
    'nav.profile': 'الملف الشخصي',
    'nav.logout': 'تسجيل الخروج',
    // Profile
    'profile.title': 'ملف المنشئ',
    'profile.edit': 'تعديل الملف',
    'profile.save': 'حفظ',
    'profile.cancel': 'إلغاء',
    'profile.email': 'البريد الإلكتروني',
    'profile.language': 'اللغة',
    'profile.contactUs': 'اتصل بنا',
    'profile.viewPlans': 'عرض الخطط',
    'profile.credits': 'الأرصدة المتبقية',
    'profile.plan': 'البروتوكول المعين',
    'profile.status': 'الحالة',
    'profile.joined': 'انضم إلى البروتوكول',
    'profile.archiveSize': 'حجم الأرشيف',
    'profile.assets': 'الأصول',
    'profile.active': 'نشط',
    'profile.backToStation': 'العودة إلى المحطة',
    // Tabs
    'tabs.profile': 'ملف المنشئ',
    'tabs.history': 'تاريخ التوليد',
    'tabs.inbox': 'صندوق الوارد',
    // History
    'history.title': 'جميع الصوت والفيديو والصوتيات الخاصة بك',
    'history.empty': 'المخزن فارغ',
    'history.emptyDesc': 'ابدأ الإنتاج لملء أرشيف الإبداع الخاص بك',
    // Messages
    'messages.title': 'رسائل النظام',
    'messages.from': 'من',
    'messages.empty': 'لا توجد رسائل نشطة في المخزن المؤقت',
    'messages.supportSessions': 'جلسات الدعم',
    'messages.session': 'جلسة',
    'messages.open': 'فتح',
    'messages.reply': 'اكتب ردا...',
    'messages.send': 'إرسال',
    'messages.noMessages': 'لا توجد رسائل بعد.',
    'messages.noSupport': 'لا يوجد نشاط دعم بعد.',
    // Contact
    'contact.title': 'اتصل بالمسؤول',
    'contact.subject': 'الموضوع (اختياري)',
    'contact.subjectPlaceholder': 'كيف يمكننا المساعدة؟',
    'contact.message': 'الرسالة',
    'contact.messagePlaceholder': 'وصف مشكلتك أو طلبك...',
    'contact.cancel': 'إلغاء',
    'contact.send': 'إرسال',
    'contact.sending': 'جارٍ الإرسال...',
    // Plans
    'plans.basic': 'منشئ أساسي',
    'plans.premium': 'بريميوم',
    'plans.free': 'مجاني',
    'plans.getStarted': 'ابدأ',
    'plans.upgrade': 'ترقية',
    // Common
    'common.loading': 'جارٍ التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجاح',
    'common.delete': 'حذف',
    'common.download': 'تحميل',
    'common.close': 'إغلاق',
    // HomeLanding Quick Inspiration
    'homeLanding.quickInspiration': 'إلهام سريع ✨ يوجهك تلقائيًا للأداة المناسبة',
    'homeLanding.idea1': 'رسم توضيحي لأفق مدينة مستقبلية',
    'homeLanding.idea2': 'لقطة درون سينمائية للجبال',
    'homeLanding.idea3': 'مقدمة بودكاست احترافية بالصوت',
    'homeLanding.ugcTitle': 'فيديوهات منتجات بأسلوب UGC من Sora',
  },
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.features': 'Fonctionnalités',
    'nav.pricing': 'Tarifs',
    'nav.login': 'Connexion',
    'nav.signup': 'S\'inscrire',
    'nav.profile': 'Profil',
    'nav.logout': 'Déconnexion',
    // Profile
    'profile.title': 'Profil Créateur',
    'profile.edit': 'Modifier le Profil',
    'profile.save': 'Enregistrer',
    'profile.cancel': 'Annuler',
    'profile.email': 'Email',
    'profile.language': 'Langue',
    'profile.contactUs': 'Nous Contacter',
    'profile.viewPlans': 'Voir les Plans',
    'profile.credits': 'Crédits Restants',
    'profile.plan': 'Protocole Attribué',
    'profile.status': 'Statut',
    'profile.joined': 'Protocole Rejoint',
    'profile.archiveSize': 'Taille de l\'Archive',
    'profile.assets': 'Ressources',
    'profile.active': 'Actif',
    'profile.backToStation': 'Retour à la Station',
    // Tabs
    'tabs.profile': 'Profil Créateur',
    'tabs.history': 'Historique de Génération',
    'tabs.inbox': 'Boîte de Réception',
    // History
    'history.title': 'TOUTES VOS GÉNÉRATIONS AUDIO ET VIDÉO',
    'history.empty': 'Coffre Vide',
    'history.emptyDesc': 'Initialisez la production pour remplir votre archive de création',
    // Messages
    'messages.title': 'Transmissions Système',
    'messages.from': 'De',
    'messages.empty': 'Aucune transmission active dans le tampon',
    'messages.supportSessions': 'Sessions de Support',
    'messages.session': 'Session',
    'messages.open': 'Ouvrir',
    'messages.reply': 'Tapez une réponse...',
    'messages.send': 'Envoyer',
    'messages.noMessages': 'Pas encore de messages.',
    'messages.noSupport': 'Aucune activité de support pour le moment.',
    // Contact
    'contact.title': 'Contacter l\'Admin',
    'contact.subject': 'Sujet (optionnel)',
    'contact.subjectPlaceholder': 'Comment pouvons-nous vous aider?',
    'contact.message': 'Message',
    'contact.messagePlaceholder': 'Décrivez votre problème ou demande...',
    'contact.cancel': 'Annuler',
    'contact.send': 'Envoyer',
    'contact.sending': 'Envoi en cours...',
    // Plans
    'plans.basic': 'Créateur Basique',
    'plans.premium': 'Premium',
    'plans.free': 'Gratuit',
    'plans.getStarted': 'Commencer',
    'plans.upgrade': 'Mettre à Niveau',
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.delete': 'Supprimer',
    'common.download': 'Télécharger',
    'common.close': 'Fermer',
  },
};


export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Force Arabic as the only language, always
  const [language, setLanguageState] = useState<Language>('ar');

  // Ignore all setLanguage calls and always force Arabic
  const setLanguage = (_lang: Language) => {
    setLanguageState('ar');
    try { Cookies.set(COOKIE_KEY, 'ar', { expires: 30, path: '/' }); } catch {}
    try { localStorage.setItem(STORAGE_KEY, 'ar'); } catch {}
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const pathLang = currentPath.split('/')[1];
      if (!['ar'].includes(pathLang)) {
        let newPath = currentPath;
        if (['en', 'fr'].includes(pathLang)) {
          newPath = currentPath.substring(3);
        }
        newPath = `/ar${newPath || '/'}`;
        window.history.replaceState({}, '', newPath);
      }
    }
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language;
      
      // Handle RTL for Arabic
      if (language === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
        document.body.style.direction = 'rtl';
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.body.style.direction = 'ltr';
      }
    } catch {}
  }, [language]);

  const t = useMemo(() => {
    return (key: string) => {
      // Try new translation system first
      const translation = getNestedTranslation(TRANSLATIONS[language], key);
      if (translation !== key) {
        return translation;
      }
      
      // Fallback to legacy DICTS
      const dict = DICTS[language] || {};
      return dict[key] ?? key;
    };
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
