import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'en' | 'ar' | 'fr' | 'de' | 'es';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'site_language';

// Comprehensive translation dictionaries
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
  de: {
    // Navigation
    'nav.home': 'Startseite',
    'nav.features': 'Funktionen',
    'nav.pricing': 'Preise',
    'nav.login': 'Anmelden',
    'nav.signup': 'Registrieren',
    'nav.profile': 'Profil',
    'nav.logout': 'Abmelden',
    // Profile
    'profile.title': 'Ersteller-Profil',
    'profile.edit': 'Profil Bearbeiten',
    'profile.save': 'Speichern',
    'profile.cancel': 'Abbrechen',
    'profile.email': 'E-Mail',
    'profile.language': 'Sprache',
    'profile.contactUs': 'Kontaktieren Sie Uns',
    'profile.viewPlans': 'Pläne Anzeigen',
    'profile.credits': 'Verbleibende Credits',
    'profile.plan': 'Zugewiesenes Protokoll',
    'profile.status': 'Status',
    'profile.joined': 'Protokoll Beigetreten',
    'profile.archiveSize': 'Archivgröße',
    'profile.assets': 'Assets',
    'profile.active': 'Aktiv',
    'profile.backToStation': 'Zurück zur Station',
    // Tabs
    'tabs.profile': 'Ersteller-Profil',
    'tabs.history': 'Generierungsverlauf',
    'tabs.inbox': 'Posteingang',
    // History
    'history.title': 'ALLE IHRE AUDIO- UND VIDEOGENERIERUNGEN',
    'history.empty': 'Tresor Leer',
    'history.emptyDesc': 'Initialisieren Sie die Produktion, um Ihr Kreationsarchiv zu füllen',
    // Messages
    'messages.title': 'Systemübertragungen',
    'messages.from': 'Von',
    'messages.empty': 'Keine aktiven Übertragungen im Puffer',
    'messages.supportSessions': 'Support-Sitzungen',
    'messages.session': 'Sitzung',
    'messages.open': 'Öffnen',
    'messages.reply': 'Eine Antwort eingeben...',
    'messages.send': 'Senden',
    'messages.noMessages': 'Noch keine Nachrichten.',
    'messages.noSupport': 'Noch keine Support-Aktivität.',
    // Contact
    'contact.title': 'Admin Kontaktieren',
    'contact.subject': 'Betreff (optional)',
    'contact.subjectPlaceholder': 'Wie können wir helfen?',
    'contact.message': 'Nachricht',
    'contact.messagePlaceholder': 'Beschreiben Sie Ihr Problem oder Ihre Anfrage...',
    'contact.cancel': 'Abbrechen',
    'contact.send': 'Senden',
    'contact.sending': 'Senden...',
    // Plans
    'plans.basic': 'Basis-Ersteller',
    'plans.premium': 'Premium',
    'plans.free': 'Kostenlos',
    'plans.getStarted': 'Loslegen',
    'plans.upgrade': 'Upgrade',
    // Common
    'common.loading': 'Laden...',
    'common.error': 'Fehler',
    'common.success': 'Erfolg',
    'common.delete': 'Löschen',
    'common.download': 'Herunterladen',
    'common.close': 'Schließen',
  },
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.features': 'Características',
    'nav.pricing': 'Precios',
    'nav.login': 'Iniciar Sesión',
    'nav.signup': 'Registrarse',
    'nav.profile': 'Perfil',
    'nav.logout': 'Cerrar Sesión',
    // Profile
    'profile.title': 'Perfil del Creador',
    'profile.edit': 'Editar Perfil',
    'profile.save': 'Guardar',
    'profile.cancel': 'Cancelar',
    'profile.email': 'Email',
    'profile.language': 'Idioma',
    'profile.contactUs': 'Contáctenos',
    'profile.viewPlans': 'Ver Planes',
    'profile.credits': 'Créditos Restantes',
    'profile.plan': 'Protocolo Asignado',
    'profile.status': 'Estado',
    'profile.joined': 'Protocolo Unido',
    'profile.archiveSize': 'Tamaño del Archivo',
    'profile.assets': 'Activos',
    'profile.active': 'Activo',
    'profile.backToStation': 'Volver a la Estación',
    // Tabs
    'tabs.profile': 'Perfil del Creador',
    'tabs.history': 'Historial de Generación',
    'tabs.inbox': 'Bandeja de Entrada',
    // History
    'history.title': 'TODAS TUS GENERACIONES DE AUDIO Y VIDEO',
    'history.empty': 'Bóveda Vacía',
    'history.emptyDesc': 'Inicialice la producción para llenar su archivo de creación',
    // Messages
    'messages.title': 'Transmisiones del Sistema',
    'messages.from': 'De',
    'messages.empty': 'No hay transmisiones activas en el búfer',
    'messages.supportSessions': 'Sesiones de Soporte',
    'messages.session': 'Sesión',
    'messages.open': 'Abrir',
    'messages.reply': 'Escribe una respuesta...',
    'messages.send': 'Enviar',
    'messages.noMessages': 'Aún no hay mensajes.',
    'messages.noSupport': 'Aún no hay actividad de soporte.',
    // Contact
    'contact.title': 'Contactar Admin',
    'contact.subject': 'Asunto (opcional)',
    'contact.subjectPlaceholder': '¿Cómo podemos ayudar?',
    'contact.message': 'Mensaje',
    'contact.messagePlaceholder': 'Describe tu problema o solicitud...',
    'contact.cancel': 'Cancelar',
    'contact.send': 'Enviar',
    'contact.sending': 'Enviando...',
    // Plans
    'plans.basic': 'Creador Básico',
    'plans.premium': 'Premium',
    'plans.free': 'Gratis',
    'plans.getStarted': 'Comenzar',
    'plans.upgrade': 'Mejorar',
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.delete': 'Eliminar',
    'common.download': 'Descargar',
    'common.close': 'Cerrar',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      return saved && ['en','ar','fr','de','es'].includes(saved) ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language;
      // Handle RTL for Arabic
      if (language === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
      }
    } catch {}
  }, [language]);

  const t = useMemo(() => {
    const dict = DICTS[language] || {};
    return (key: string) => dict[key] ?? key;
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
