// SS-DEV (2026-10-04): ilova ichiga joylangan (bundle) oferta PDF zaxirasi — iOS.
// Metro `require` PDF'ni ilova paketiga qo'shadi; release'da `file://…/assets/…`
// yo'li bo'ladi (react-native-pdf uni to'g'ridan-to'g'ri ochadi).
// Matn manbasi: sayt `components/Offer{Uz,Ru,En}.vue` (logo + QR bilan PDF'ga
// chop etilgan) — server (pdf.zerox.uz) javob bermasa ko'rsatiladi.
import type { OfertaDocLang } from './ofertaPdf';

const SOURCES: Record<OfertaDocLang, any> = {
  uz: require('../../assets/oferta/oferta_uz.pdf'),
  ru: require('../../assets/oferta/oferta_ru.pdf'),
  kr: require('../../assets/oferta/oferta_kr.pdf'),
};

export const bundledOfertaSource = (lang: OfertaDocLang): any => SOURCES[lang] || SOURCES.uz;
