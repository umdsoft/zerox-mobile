import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import kr from './new/kr.json';
import uz from './new/uz.json';
import ru from './new/ru.json';
import {storage} from '../store/api/token/getToken';
let lang = storage.getString('lang');
i18n.use(initReactI18next).init({
  lng: lang || 'uz',
  fallbackLng: 'uz',
  compatibilityJSON: 'v3',
  resources: {
    uz: uz,
    ru: ru,
    kr: kr,
  },
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
  react: {
    useSuspense: true,
  },
  detection: {
    order: ['localStorage'],
    lookupLocalStorage: 'language',
    caches: ['localStorage'],
  },
});
export default i18n;
