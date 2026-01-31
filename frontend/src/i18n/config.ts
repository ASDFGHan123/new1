import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import psTranslations from './locales/ps.json';
import prsTranslations from './locales/prs.json';

import enReportTranslations from './locales/en-reports.json';
import psReportTranslations from './locales/ps-reports.json';
import prsReportTranslations from './locales/prs-reports.json';

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === 'object' && !Array.isArray(value);
};

const deepMerge = <T extends Record<string, unknown>, U extends Record<string, unknown>>(
  base: T,
  extra: U
): T & U => {
  const result: Record<string, unknown> = { ...base };
  for (const [key, extraValue] of Object.entries(extra)) {
    const baseValue = result[key];
    if (isPlainObject(baseValue) && isPlainObject(extraValue)) {
      result[key] = deepMerge(baseValue, extraValue);
    } else {
      result[key] = extraValue;
    }
  }
  return result as T & U;
};

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
        translation: {
          ...deepMerge(enTranslations as any, enReportTranslations as any),
        },
      },
      ps: {
        translation: {
          ...deepMerge(psTranslations as any, psReportTranslations as any),
        },
      },
      prs: {
        translation: {
          ...deepMerge(prsTranslations as any, prsReportTranslations as any),
        },
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
