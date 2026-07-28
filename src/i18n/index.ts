import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import kr from './new/kr.json';
import uz from './new/uz.json';
import ru from './new/ru.json';
import en from './new/en.json';
import kaa from './new/kaa.json';
import {prefsStorage} from '../store/api/token/getToken';
// `lang` maxfiy emas va shifrlangan `storage` async tayyor bo'lgani uchun bu yerda
// (modul-yuklanish paytida) SINXRON prefsStorage'dan o'qiymiz.
let lang = prefsStorage.getString('lang');
i18n.use(initReactI18next).init({
  lng: lang || 'uz',
  fallbackLng: 'uz',
  compatibilityJSON: 'v3',
  // Redizayn ekranlarda "string-as-key" ishlatiladi: kalit = o'zbekcha matnning o'zi
  // (masalan t('Berilgan qarz')). Matn tarkibida '.' yoki ':' bo'lsa i18next uni
  // nested-key yoki namespace deb talqin qilmasligi uchun ajratgichlarni o'chiramiz.
  // Raqamli kalitlar ("117") va mavjud tarjimalarga ta'sir qilmaydi.
  keySeparator: false,
  nsSeparator: false,
  resources: {
    uz: uz,
    ru: ru,
    kr: kr,
    // en/kaa — asosiy UI tarjima qilingan; qolgan kalitlar uz'ga fallback bo'ladi.
    en: en,
    kaa: kaa,
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
