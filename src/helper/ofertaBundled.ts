// SS-DEV (2026-10-04): platformaga xos fayllar — ofertaBundled.ios.ts / ofertaBundled.android.ts.
// Bu fayl faqat TypeScript (va boshqa platformalar) uchun.
import type { OfertaDocLang } from './ofertaPdf';

export const bundledOfertaSource = (lang: OfertaDocLang): any => ({
  uri: `bundle-assets://oferta/oferta_${lang}.pdf`,
});
