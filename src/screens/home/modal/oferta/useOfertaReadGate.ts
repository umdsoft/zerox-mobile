/**
 * useOfertaReadGate.ts — "Oferta oxirigacha o'qilmaguncha tasdiqlab bo'lmasin" darvozasi (ContractModal.tsx dan
 * ko'chirilgan, xulq o'zgarmagan). Tarix: SS-DEV (2026-09-24, 3-tuzatish), 27.09 (1-band), 08.10 (5-band) ILDIZ —
 * vaqt-fallback YO'Q, ketma-ketlik sharti YO'Q, oxirgi sahifa ko'rinishi (har qanday yo'l bilan) + 3 s = o'qildi.
 */
import { useCallback, useRef, useState } from 'react';
import { isReachedLast, isReadToEnd, MIN_READ_MS, readFallbackSatisfied, SETTLE_MS } from './ofertaLogic';

export const useOfertaReadGate = (pdfErr: boolean) => {
  const [check, setCheck] = useState(false);
  const [allPage, setAllPage] = useState(0);
  // SS5 (2026-09-20): eng uzoq borilgan sahifa (joriy sahifa emas: foydalanuvchi oxirga yetib, orqaga qaytishi mumkin).
  const [maxPage, setMaxPage] = useState(1);
  // SS-DEV (2026-09-24): hujjat yuklangach eng kam o'qish vaqti o'tdimi.
  const [readTimerDone, setReadTimerDone] = useState(false);
  // "oxirigacha o'qildi" — BIR MARTA yetilsa QAYTA NOLLANMAYDI (faqat yangi ochilish / hujjat almashishi / "Qayta urinish").
  const [reached, setReached] = useState(false);
  const [fallbackOk, setFallbackOk] = useState(false);
  const loadedAtRef = useRef<number | null>(null);
  const maxPageRef = useRef(1); // sinxron nusxa
  const readTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reachedRef = useRef(false);
  const allPageRef = useRef(0);
  const gesturesRef = useRef(0); // yuklangandan keyingi teginishlar (varaqlash imo-ishoralari) soni
  const gesturesAtMaxRef = useRef(0); // maxPage oxirgi marta oshgandagi teginishlar soni
  const pageEventsRef = useRef(0); // hisobga olingan (p > 1) sahifa hodisalari soni

  const reachedLast = isReachedLast(allPage, reached, maxPage);
  const readToEnd = isReadToEnd({ pdfErr, allPage, readTimerDone, reachedLast, fallbackOk });
  const needRead = !pdfErr && !readToEnd;

  const clearTimers = useCallback(() => {
    if (readTimerRef.current) {
      clearTimeout(readTimerRef.current);
      readTimerRef.current = null;
    }
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const resetGate = useCallback(() => {
    clearTimers();
    loadedAtRef.current = null;
    maxPageRef.current = 1;
    // 08.10: yangi holat maydonlari ham shu yerda (va faqat shu yerda) nollanadi.
    allPageRef.current = 0;
    reachedRef.current = false;
    gesturesRef.current = 0;
    gesturesAtMaxRef.current = 0;
    pageEventsRef.current = 0;
    setReached(false);
    setFallbackOk(false);
    setCheck(false);
    setMaxPage(1);
    setAllPage(0);
    setReadTimerDone(false);
  }, [clearTimers]);

  // Hujjat yuklandi — o'qish taymerini boshlaymiz, fallback O'CHIRILADI.
  const markLoaded = useCallback((numberOfPages: number) => {
    if (loadedAtRef.current) return;
    loadedAtRef.current = Date.now();
    // SS-DEV (2026-09-24, 3-tuzatish): yuklangan hujjat uchun vaqt-fallback yo'q — faqat sahifa darvozasi.
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    const n = Math.max(1, Number(numberOfPages) || 1);
    if (Number(numberOfPages) > 0) allPageRef.current = n;
    if (readTimerRef.current) clearTimeout(readTimerRef.current);
    // 03.10 (1-band): ekranga to'liq sig'adigan (1 sahifali) hujjat yuklanishi bilan "oxirigacha ko'rilgan".
    if (n === 1) {
      setReadTimerDone(true);
      return;
    }
    // 08.10: ilgari max(3 s, (n-1)×1.5 s). Endi 3 s.
    readTimerRef.current = setTimeout(() => setReadTimerDone(true), MIN_READ_MS);
  }, []);

  /**
   * 08.10 (5-band): sahifa hodisasi (onPageChanged / onPageSingleTap). Ketma-ketlik shart EMAS — eng uzoq sahifa
   * saqlanadi; p === n bo'lsa "o'qildi" (bir marta). SETTLE_MS ichida faqat foydalanuvchi PDF'ga TEGINGAN bo'lsa
   * hisoblanadi (Android'dagi o'lchov paytidagi soxta "oxirgi sahifa" hodisasi).
   */
  const notePage = useCallback((p: number, numberOfPages?: number) => {
    const loadedAt = loadedAtRef.current;
    if (!loadedAt) return;
    const n = Number(numberOfPages) > 0 ? Number(numberOfPages) : allPageRef.current;
    if (!(p >= 1) || (n > 0 && p > n)) return;
    if (gesturesRef.current === 0 && Date.now() - loadedAt < SETTLE_MS) return;
    if (p > 1) pageEventsRef.current += 1;
    if (p > maxPageRef.current) {
      maxPageRef.current = p;
      gesturesAtMaxRef.current = gesturesRef.current;
      setMaxPage(p);
    }
    if (n > 0 && p >= n && !reachedRef.current) {
      reachedRef.current = true;
      setReached(true);
    }
  }, []);

  /** 08.10 (5-band): zaxira — ko'ruvchi sahifalarni xabar qilmasa teginishlar soni + vaqt bo'yicha. */
  const checkReadFallback = useCallback((): boolean => {
    const loadedAt = loadedAtRef.current;
    if (!loadedAt) return false;
    const ok = readFallbackSatisfied({
      n: allPageRef.current,
      elapsedMs: Date.now() - loadedAt,
      gestures: gesturesRef.current,
      pageEvents: pageEventsRef.current,
      maxPage: maxPageRef.current,
      gesturesAtMax: gesturesAtMaxRef.current,
    });
    if (ok) setFallbackOk(true);
    return ok;
  }, []);

  // 08.10: PDF ustidagi teginishlar (onTouchStart — JS responder tizimi native PDF ko'ruvchi ustida ham chaqiradi).
  const onPdfTouchStart = useCallback(() => {
    if (loadedAtRef.current) gesturesRef.current += 1;
  }, []);
  const onPdfTouchEnd = useCallback(() => {
    checkReadFallback();
  }, [checkReadFallback]);

  return {
    check, setCheck, allPage, setAllPage, maxPage, reached, needRead,
    loadedAtRef, maxPageRef, reachedRef, allPageRef, fallbackTimerRef,
    clearTimers, resetGate, markLoaded, notePage, checkReadFallback, onPdfTouchStart, onPdfTouchEnd,
  };
};
export type OfertaReadGate = ReturnType<typeof useOfertaReadGate>;
