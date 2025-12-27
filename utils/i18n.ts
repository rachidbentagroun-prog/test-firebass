// Proxy exports to the TSX implementation to avoid JSX in .ts file
import * as I18N from './i18n.tsx';

export type Language = I18N.Language;
export const LanguageProvider = I18N.LanguageProvider;
export const useLanguage = I18N.useLanguage;
