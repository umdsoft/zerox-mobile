import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
// Ishga tushish tezligi: faqat `uz` (fallback) + saqlangan til darhol yuklanadi; qolgan tillar
// (~1MB JSON) birinchi marta kerak bo'lganda (changeLanguage) sinxron require() qilinadi.
import uz from './new/uz.json';
import {prefsStorage} from '../store/api/token/getToken';
// `lang` maxfiy emas va shifrlangan `storage` async tayyor bo'lgani uchun bu yerda
// (modul-yuklanish paytida) SINXRON prefsStorage'dan o'qiymiz.
let lang = prefsStorage.getString('lang');

// Literal require() — Metro statik topishi uchun. Bundle'lar tilga birinchi o'tishda yuklanadi.
const lazyLocales: Record<string, () => any> = {
  ru: () => require('./new/ru.json'),
  kr: () => require('./new/kr.json'),
  en: () => require('./new/en.json'),
  kaa: () => require('./new/kaa.json'),
};

const loadedLocales = new Set<string>(['uz']);

const ensureLocale = (lng?: string) => {
  if (!lng || loadedLocales.has(lng) || !lazyLocales[lng]) {
    return;
  }
  const bundle = lazyLocales[lng]().translation;
  i18n.addResourceBundle(lng, 'translation', bundle, true, true);
  loadedLocales.add(lng);
};

const initialResources: Record<string, any> = {uz};
if (lang && lazyLocales[lang]) {
  initialResources[lang] = lazyLocales[lang]();
  loadedLocales.add(lang);
}
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
  // en/kaa — asosiy UI tarjima qilingan; qolgan kalitlar uz'ga fallback bo'ladi.
  resources: initialResources,
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
  react: {
    useSuspense: false,
  },
  detection: {
    order: ['localStorage'],
    lookupLocalStorage: 'language',
    caches: ['localStorage'],
  },
});

// changeLanguage: tilni almashtirishdan OLDIN uning JSON'i yuklanadi (API va qaytadigan Promise o'zgarmagan).
const originalChangeLanguage = i18n.changeLanguage.bind(i18n);
i18n.changeLanguage = ((lng?: string, ...rest: any[]) => {
  ensureLocale(lng);
  return (originalChangeLanguage as any)(lng, ...rest);
}) as typeof i18n.changeLanguage;

export default i18n;
