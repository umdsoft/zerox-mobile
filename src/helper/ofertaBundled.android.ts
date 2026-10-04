// SS-DEV (2026-10-04): ilova ichiga joylangan (bundle) oferta PDF zaxirasi — Android.
// Fayllar `android/app/src/main/assets/oferta/` da (APK assets). Metro `require`
// Android'da PDF'ni `res/raw` resursiga aylantiradi — react-native-pdf uni ocha
// olmaydi, shu bois `bundle-assets://` sxemasi ishlatiladi.
import type { OfertaDocLang } from './ofertaPdf';

export const bundledOfertaSource = (lang: OfertaDocLang): any => ({
  uri: `bundle-assets://oferta/oferta_${lang}.pdf`,
});
