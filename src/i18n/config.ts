import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import psTranslations from './locales/ps.json';
import prsTranslations from './locales/prs.json';

export const LANGUAGE_CONFIG = {
  en: { name: 'English', dir: 'ltr' },
  ps: { name: 'پشتو', dir: 'rtl' },
  prs: { name: 'دری', dir: 'rtl' },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      ps: {
        translation: psTranslations,
      },
      prs: {
        translation: prsTranslations,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
