import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const RTL_LANGUAGES = ['ps', 'prs', 'ar', 'he', 'fa'];

export const useRTL = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const isRTL = RTL_LANGUAGES.includes(i18n.language);
    const htmlElement = document.documentElement;

    if (isRTL) {
      htmlElement.setAttribute('dir', 'rtl');
      htmlElement.setAttribute('lang', i18n.language);
    } else {
      htmlElement.setAttribute('dir', 'ltr');
      htmlElement.setAttribute('lang', i18n.language);
    }
  }, [i18n.language]);

  return RTL_LANGUAGES.includes(i18n.language);
};
