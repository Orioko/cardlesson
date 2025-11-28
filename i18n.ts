import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

const initI18n = async () => {
  try {
    await i18n
      .use(Backend)
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        fallbackLng: 'en',
        supportedLngs: ['ru', 'en', 'ko'],
        debug: false,

        interpolation: {
          escapeValue: false,
        },

        backend: {
          loadPath: (import.meta.env.BASE_URL || '/') + 'locales/{{lng}}/translation.json',
          requestOptions: {
            cache: 'default',
          },
          allowMultiLoading: false,
        },

        detection: {
          order: ['querystring', 'cookie', 'localStorage', 'navigator'],
          caches: ['localStorage', 'cookie'],
          lookupQuerystring: 'lang',
          lookupCookie: 'i18next',
          lookupLocalStorage: 'i18nextLng',
        },

        react: {
          useSuspense: false,
        },
      });
  } catch (error) {
    console.error('Ошибка инициализации i18n:', error);
  }
};

initI18n();

export default i18n;
