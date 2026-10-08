import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from 'react-native-paper';
import { rd, rs } from '../../../theme/rd';
import { useDispatch, useSelector } from 'react-redux';
import { contractModalShow } from '../../../store/reducers/HomeReducer';
import { getMe } from '../../../store/api/home';

import Pdf from 'react-native-pdf';
import axios from 'axios';
import { URL, PDF_OFERTA_URL } from '../../constants';
import { storage } from '../../../store/api/token/getToken';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import Loading from '../../components/Loading';
import CheckBox from '@react-native-community/checkbox';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from '../redesign/icons';
import {
  clearPendingOfertaAction,
  needsOferta,
  openOferta,
  runPendingOfertaAction,
  setOfertaOpener,
} from '../../../helper/ofertaGate';
import {
  OFERTA_WAIT_ROUTES,
  consumeOfertaAfterIdentification,
  hasOfertaAfterIdentification,
} from '../../../helper/ofertaAfterId';
import { navigationRef } from '../../../navigation/NavigationRef';
import {
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  downloadOfertaPdf,
  ofertaDocLang,
  ofertaPdfUrl,
  removeOfertaFile,
  takePrefetchedOferta,
} from '../../../helper/ofertaPdf';
import { bundledOfertaSource } from '../../../helper/ofertaBundled';

// SS-DEV (2026-10-04): hujjat manbai — serverdan yuklangan fayl yoki ilova ichidagi zaxira.
type DocSource =
  | { kind: 'loading' }
  | { kind: 'remote'; path: string }
  | { kind: 'bundled' };
// 03.10: identifikatsiyadan keyingi oyna — ekran o'tish animatsiyasi tugagach.
// SS-DEV (2026-10-06, 06.10 1(a)): 800 → 250 ms (popTo animatsiyasi ~350 ms; Paper
// Modal navigator USTIDA chiziladi — to'liq tugashini kutish shart emas).
const OFERTA_AFTER_ID_DELAY_MS = 250;
const nowMs = () =>
  (globalThis as any).performance?.now ? (globalThis as any).performance.now() : Date.now();
// 08.10 (5-band): server javobidagi odam o'qiy oladigan xabar (`message`, yoki bo'shliqli
// `msg`); "error" / "unauthorized" kabi texnik kodlar ko'rsatilmaydi.
const serverMsg = (body: any): string => {
  const m = body?.message;
  if (typeof m === 'string' && m.trim()) return m.trim();
  const s = body?.msg;
  if (typeof s === 'string' && s.trim().includes(' ')) return s.trim();
  return '';
};
// SS-DEV (2026-09-24, 3-tuzatish): oferta o'qish darvozasi sozlamalari.
const MIN_READ_MS = 3000; // yuklangandan keyin eng kam o'qish vaqti (03.10: 1 sahifali hujjatga — 0)
// 08.10: (n-1)*1.5 s endi FAQAT zaxira yo'li uchun (ko'ruvchi sahifa hodisasini
// bermasa) — oxirgi sahifa ko'ringanda MIN_READ_MS yetarli.
const PER_PAGE_MS = 1500;
const SETTLE_MS = 1000; // yuklangandan keyingi "spurious" sahifa hodisalari oynasi (teginishsiz)
// Hujjat UMUMAN yuklanmasa (onLoadComplete ham, onPageChanged ham kelmasa) —
// foydalanuvchi abadiy qamalib qolmasin. YUKLANGAN hujjat uchun bu taymer
// ISHLAMAYDI (pastga qarang). 27.09 (1-band): taymer endi darvozani OCHMAYDI —
// avval PDF bir marta avtomatik qayta yuklanadi, keyin xato + "Qayta urinish".
// SS-DEV (2026-10-04): yuklash endi helper/ofertaPdf.ts da (timeout + 2 qayta
// urinish); bu taymer faqat FAYLNI CHIZISH bosqichini kuzatadi — hodisa kelmasa
// server nusxasidan ilova ichidagi zaxiraga o'tiladi.
const FALLBACK_MS = 20000;

const ContractModal = () => {
  const dispatch = useDispatch();

  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [check, setCheck] = useState(false);
  const { contract, user } = useSelector(state => state.HomeReducer);
  const [allPage, setAllPage] = useState(0);
  // SS5 (2026-09-20): eng uzoq borilgan sahifa — "oxirigacha o'qildi"
  // shartini shu orqali aniqlaymiz (joriy sahifa emas: foydalanuvchi
  // oxirga yetib, keyin orqaga qaytishi mumkin).
  const [maxPage, setMaxPage] = useState(1);
  // So'rov SS5: PDF yuklanmasa foydalanuvchi bo'sh oynada QAMALIB qolmasin
  // (dismissable=false). Xato bo'lsa xabar + "Qayta urinish" ko'rsatiladi.
  const [pdfErr, setPdfErr] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // SS-DEV (2026-09-24): hujjat yuklangach eng kam o'qish vaqti o'tdimi.
  const [readTimerDone, setReadTimerDone] = useState(false);
  // 27.09 (1-band): ilgari native hodisalar 60 s kelmasa `eventsFallback`
  // darvozani VAQT bo'yicha ochib yuborardi — foydalanuvchi 1-sahifada turib
  // tasdiqlay olardi (skrinshotdagi holat: hint yo'q, checkbox belgilangan).
  // Endi vaqtning o'zi HECH QACHON darvozani ochmaydi (pastda armNoEventTimer).
  // SS-DEV (2026-10-04): hujjat manbai (server → zaxira) va uning sinxron nusxasi.
  const [docSrc, setDocSrc] = useState<DocSource>({ kind: 'loading' });
  const docSrcRef = useRef<DocSource>({ kind: 'loading' });
  const loadSeqRef = useRef(0);
  const dlTaskRef = useRef<any>(null);
  const setSource = useCallback((s: DocSource) => {
    docSrcRef.current = s;
    setDocSrc(s);
  }, []);
  const loadedAtRef = useRef<number | null>(null);
  // Sinxron nusxa — eng uzoq borilgan sahifa.
  const maxPageRef = useRef(1);
  const readTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * 08.10 (5-band): "oxirigacha o'qildi" holati — BIR MARTA yetilsa QAYTA
   * NOLLANMAYDI (faqat yangi ochilish / hujjat almashishi / "Qayta urinish"da).
   *  - reached: oxirgi sahifa ko'rindi (onPageChanged / onPageSingleTap: p === n);
   *  - fallbackOk: ko'ruvchi sahifa hodisalarini bermadi, lekin foydalanuvchi
   *    hujjatni varaqlab chiqdi (teginishlar soni + vaqt) — pastda checkReadFallback.
   */
  const [reached, setReached] = useState(false);
  const reachedRef = useRef(false);
  const [fallbackOk, setFallbackOk] = useState(false);
  const allPageRef = useRef(0);
  // Yuklangandan keyingi teginishlar (varaqlash imo-ishoralari) soni.
  const gesturesRef = useRef(0);
  // maxPage oxirgi marta oshgandagi teginishlar soni.
  const gesturesAtMaxRef = useRef(0);
  // Hisobga olingan (p > 1) sahifa hodisalari soni.
  const pageEventsRef = useRef(0);

  /**
   * SS-DEV (2026-09-24, 3-tuzatish): "Oferta oxirigacha o'qilmaguncha
   * tasdiqlab bo'lmasin" — darvoza QAYTA MUSTAHKAMLANDI.
   *
   * Skrinshotdagi holat (1-sahifa, checkbox belgilangan, Tasdiqlash ko'k)
   * QANDAY yuzaga kelgan (2-tuzatishdan keyingi kod bo'yicha):
   *  1) 60 s FALLBACK — modal ochilganda VA yuklanganda 60 s taymer
   *     boshlanardi; u faqat HAQIQIY sahifa hodisasi kelganda o'chirilardi.
   *     Foydalanuvchi 1-sahifani 1 daqiqa o'qib tursa (yoki shunchaki ochiq
   *     qoldirsa) — sahifa o'zgarmagani uchun hodisa yo'q → 60 s da
   *     `eventsFallback=true` → darvoza JIMGINA ochilar, hint yo'qolar,
   *     checkbox belgilanar edi. Bu talabga zid: yuklangan hujjat uchun
   *     vaqt-fallback endi UMUMAN YO'Q.
   *  2) Android'da (barteksc PDFView) `jumpTo`/havola (link) orqali sahifa
   *     SAKRAB o'zgarsa `onPageChanged(oxirgi)` bir zumda kelar, `maxPage`
   *     darhol `allPage` bo'lardi — endi faqat KETMA-KET (p === maxPage+1)
   *     siljish hisobga olinadi va oxirgi sahifaga yetish yetarli emas:
   *     yuklangandan keyin kamida (n-1)×1.5 s o'tishi ham shart.
   *  3) Yoga o'lchov paytidagi (h=0) soxta hodisa — SETTLE_MS oynasi.
   *
   * Yangi darvoza (BARCHA shartlar birga):
   *  a) hujjat yuklangan (allPage > 0, onLoadComplete/onPageChanged kelgan);
   *  b) yuklangandan keyin kamida max(3 s, (n-1)×1.5 s) o'tgan;
   *  c) ko'p sahifali hujjatda OXIRGI sahifaga KETMA-KET yetilgan.
   * 27.09 (1-band): VAQT-fallback olib tashlandi — hujjat hodisalari kelmasa
   * darvoza ochilmaydi; PDF avtomatik qayta yuklanadi, so'ng xato oynasi.
   * Har ochilishda holat NOLLANADI (useEffect quyida); `check` darvoza
   * yopiq bo'lsa hech qachon true bo'lolmaydi (pastdagi effekt).
   */
  /**
   * 08.10 (5-band) ILDIZ: foydalanuvchi ofertani OXIRIGACHA o'qidi (oxirgi sahifa
   * ekranda), lekin belgini qo'ya olmadi — "oxirigacha o'qing" toast'i chiqaverdi.
   * Eski darvozada "oxirgi sahifaga yetildi" faqat QAT'IY KETMA-KET hodisalar
   * (p === maxPage + 1) bilan hisoblanardi VA yuklangandan keyingi 1 s ichidagi
   * hodisalar TASHLAB yuborilardi. Bitta hodisa tushib qolsa (hujjat tayyor/prefetch
   * bo'lib, foydalanuvchi darhol varaqlasa — 2-sahifa hodisasi SETTLE oynasiga
   * tushadi; tez varaqlashda sahifa "sakrasa"; zaxira → server nusxasi almashgan
   * payt), keyingi har bir hodisa p ≠ maxPage + 1 bo'lib, maxPage ABADIY qotib
   * qolardi — oxirgi sahifada ham darvoza ochilmasdi. Ustiga (n-1)×1.5 s
   * (8 sahifa → 10.5 s) o'qish vaqti ham talab qilinardi.
   * Endi: oxirgi sahifa ko'rinishi (p === n, har qanday yo'l bilan) yoki eng uzoq
   * sahifa ≥ n — "o'qildi" (bir marta yetilsa saqlanadi) + yuklangandan 3 s;
   * ko'ruvchi sahifa hodisasini bermasa — zaxira (checkReadFallback).
   */
  const reachedLast =
    allPage > 0 && (allPage === 1 || reached || maxPage >= allPage);
  const readToEnd =
    !pdfErr && allPage > 0 && ((readTimerDone && reachedLast) || fallbackOk);
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

  /**
   * SS-DEV (2026-10-04): server nusxasi ochilmasa (buzuq fayl / native xato /
   * hodisa kelmadi) — ilova ichidagi zaxira PDF. Zaxira ham ochilmasa (amalda
   * bo'lmasligi kerak) — oxirgi chora sifatida xato + "Qayta urinish".
   */
  const onDocFailed = useCallback(() => {
    const cur = docSrcRef.current;
    if (cur.kind === 'remote') {
      removeOfertaFile(cur.path);
      setSource({ kind: 'bundled' });
      return;
    }
    if (cur.kind === 'bundled') setPdfErr(true);
  }, [setSource]);

  /**
   * 27.09 (1-band): "hodisa yo'q" kuzatuvchisi. FALLBACK_MS davomida
   * onLoadComplete/onPageChanged kelmasa — darvoza OCHILMAYDI.
   * SS-DEV (2026-10-04): fayl endi oldindan yuklab olinadi (helper/ofertaPdf.ts),
   * taymer faqat chizish bosqichini kuzatadi: server nusxasi → ilova ichidagi
   * zaxira PDF; zaxira ham bo'lmasa xato oynasi ("Qayta urinish").
   */
  const armNoEventTimer = useCallback(() => {
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = setTimeout(() => {
      fallbackTimerRef.current = null;
      if (loadedAtRef.current) return;
      onDocFailed();
    }, FALLBACK_MS);
  }, [onDocFailed]);

  // Hujjat yuklandi — o'qish taymerini boshlaymiz, fallback O'CHIRILADI.
  const markLoaded = useCallback((numberOfPages: number) => {
    if (loadedAtRef.current) return;
    loadedAtRef.current = Date.now();
    // SS-DEV (2026-09-24, 3-tuzatish): yuklangan hujjat uchun vaqt-fallback
    // yo'q — faqat sahifa darvozasi.
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    const n = Math.max(1, Number(numberOfPages) || 1);
    if (Number(numberOfPages) > 0) allPageRef.current = n;
    if (readTimerRef.current) clearTimeout(readTimerRef.current);
    // 03.10 (mobil hujjat, 1-band): ekranga to'liq sig'adigan (1 sahifali) hujjat
    // yuklanishi bilan "oxirigacha ko'rilgan" hisoblanadi — aylantiradigan joy yo'q.
    if (n === 1) {
      setReadTimerDone(true);
      return;
    }
    // 08.10: ilgari max(3 s, (n-1)×1.5 s) — oxirgi sahifaga tez yetgan foydalanuvchi
    // 10 s gacha "oxirigacha o'qing" toast'ini ko'rardi. Endi 3 s.
    readTimerRef.current = setTimeout(() => setReadTimerDone(true), MIN_READ_MS);
  }, []);

  /**
   * 08.10 (5-band): sahifa hodisasi (onPageChanged / onPageSingleTap). Ketma-ketlik
   * shart EMAS — eng uzoq sahifa saqlanadi; p === n bo'lsa "o'qildi" (bir marta).
   * Yuklangandan keyingi SETTLE_MS ichida faqat foydalanuvchi PDF'ga TEGINGAN bo'lsa
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

  /**
   * 08.10 (5-band): zaxira — ko'ruvchi sahifalarni xabar qilmasa (hech bir p > 1
   * hodisasi yo'q, lekin foydalanuvchi ≥ n-1 marta varaqladi) yoki oxirgi sahifa
   * hodisasi kelmasa (n-1 sahifaga yetilgan va undan keyin yana varaqlangan) —
   * yuklangandan keyin max(3 s, (n-1)×1.5 s) o'tgach "o'qildi" hisoblanadi.
   * Belgi / "Tasdiqlash" bosilganda va har teginish oxirida tekshiriladi.
   */
  const checkReadFallback = useCallback((): boolean => {
    const loadedAt = loadedAtRef.current;
    const n = allPageRef.current;
    if (!loadedAt || n <= 1) return false;
    if (Date.now() - loadedAt < Math.max(MIN_READ_MS, (n - 1) * PER_PAGE_MS)) {
      return false;
    }
    const g = gesturesRef.current;
    const noPageReports = pageEventsRef.current === 0 && g >= n - 1;
    const lastNotReported =
      maxPageRef.current >= n - 1 && g > gesturesAtMaxRef.current;
    if (!noPageReports && !lastNotReported) return false;
    setFallbackOk(true);
    return true;
  }, []);

  // 08.10: PDF ustidagi teginishlar (onTouchStart — JS responder tizimi native
  // PDF ko'ruvchi ustida ham chaqiradi; varaqlashni o'g'irlamaydi).
  const onPdfTouchStart = useCallback(() => {
    if (loadedAtRef.current) gesturesRef.current += 1;
  }, []);
  const onPdfTouchEnd = useCallback(() => {
    checkReadFallback();
  }, [checkReadFallback]);

  /**
   * SS-DEV (2026-09-29, 29.09 doc2 3-rasm): oyna endi bosh sahifada MAJBURAN
   * ochilmaydi — faqat "Qarz shartnomasi" AMALIDA (helper/ofertaGate.ts:
   * guardOferta / backend 403 OFERTA_REQUIRED). Ochuvchi shu yerda ro'yxatdan
   * o'tadi (ofertaGate Redux store'ni import qilmaydi).
   */
  useEffect(() => {
    setOfertaOpener(() => dispatch(contractModalShow({ show: true })));
    return () => setOfertaOpener(null);
  }, [dispatch]);

  /**
   * 03.10 (mobil hujjat, 1-band): identifikatsiyadan KEYIN oferta sahifasi
   * (ILDIZ va navbat: helper/ofertaAfterId.ts). Navbat foydalanuvchi qulf /
   * identifikatsiya ekranidan chiqib ilovaning oddiy ekraniga tushganda
   * (navigatsiya 'state' hodisasi) yoki /user/me yangilanganda iste'mol
   * qilinadi — bir marta. Taymer faqat unmount'da tozalanadi: user ob'ekti
   * almashsa (HomeApi) navbat iste'mol qilingan oyna yo'qolib qolmasin.
   */
  const userData = user?.data;
  const userDataRef = useRef<any>(userData);
  const contractRef = useRef<boolean>(!!contract);
  useEffect(() => {
    contractRef.current = !!contract;
  }, [contract]);
  const afterIdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // SS-DEV (2026-10-04): oyna ochiq turganda ilova QULFLANSA (PIN ekrani) — oyna
  // vaqtincha yashiriladi va qulf ochilgach QAYTA ko'rsatiladi (pastga qarang).
  const hiddenByLockRef = useRef(false);
  const currentRouteName = (): string | undefined => {
    const nav: any = navigationRef.current;
    return nav?.getCurrentRoute?.()?.name;
  };
  const tryOpenAfterId = useCallback(() => {
    const routeName = currentRouteName();
    const waiting = !routeName || OFERTA_WAIT_ROUTES.has(routeName);
    /**
     * SS-DEV (2026-10-04, 04.10 hujjat 1-band): ILDIZ (2-qism) — Android'da MyID
     * alohida Activity; javob (`isactivate` → getMe → popTo) qulfdan OLDIN kelsa,
     * oyna bosh sahifada ochilib, 1-2 soniyadan keyin AppState qulfi stekni PIN
     * ekraniga reset qilardi. ContractModal navigatordan TASHQARIDA (App ildizida)
     * chiziladi — oyna PIN ekrani USTIDA qolardi yoki foydalanuvchi uni PIN deb
     * o'ylab orqaga bosib yopib yuborardi; navbat esa allaqachon iste'mol qilingan
     * bo'lgani uchun qulf ochilgach oyna QAYTA chiqmasdi. Endi: qulf/kirish ekraniga
     * o'tilganda ochiq oyna yashiriladi (eslab qolingan amal SAQLANADI) va oddiy
     * ekranga qaytilganda yana ko'rsatiladi.
     */
    if (waiting) {
      if (contractRef.current) {
        dispatch(contractModalShow({ show: false }));
        if (routeName === 'SetLocalPassword' && storage.getBoolean('appLocked')) {
          hiddenByLockRef.current = true;
        } else {
          // Chiqish (logout) / kirish ekrani — oyna va eslab qolingan amal bekor.
          hiddenByLockRef.current = false;
          clearPendingOfertaAction();
        }
      }
      return;
    }
    if (hiddenByLockRef.current) {
      hiddenByLockRef.current = false;
      if (!contractRef.current && needsOferta({ ...(userDataRef.current || {}), is_active: 1 })) {
        dispatch(contractModalShow({ show: true }));
      } else {
        clearPendingOfertaAction();
      }
      return;
    }
    if (afterIdTimerRef.current || !hasOfertaAfterIdentification()) return;
    if (!consumeOfertaAfterIdentification(userDataRef.current)) return;
    afterIdTimerRef.current = setTimeout(() => {
      afterIdTimerRef.current = null;
      const r = currentRouteName();
      if (!r || OFERTA_WAIT_ROUTES.has(r)) {
        // Shu 0.8 s ichida ilova qulflandi — qulf ochilgach ko'rsatamiz.
        if (r === 'SetLocalPassword') hiddenByLockRef.current = true;
        return;
      }
      // Oyna allaqachon ochiq (masalan "Qarz berish" darvozasi) — eslab qolingan
      // amalni o'chirib yubormaslik uchun qayta ochmaymiz.
      if (!contractRef.current) openOferta();
    }, OFERTA_AFTER_ID_DELAY_MS);
  }, [dispatch]);

  useEffect(() => {
    const nav: any = navigationRef.current;
    const unsub = nav?.addListener?.('state', tryOpenAfterId);
    return () => {
      unsub?.();
      if (afterIdTimerRef.current) clearTimeout(afterIdTimerRef.current);
      afterIdTimerRef.current = null;
    };
  }, [tryOpenAfterId]);

  useEffect(() => {
    userDataRef.current = userData;
    tryOpenAfterId();
  }, [userData, tryOpenAfterId]);

  /**
   * Foydalanuvchi ofertani tasdiqlashni ISTAMASA — oynani yopadi va ilovaning
   * qolgan bo'limlaridan foydalanishda davom etadi; eslab qolingan shartnoma
   * amali bekor qilinadi (keyingi urinishda oyna yana ochiladi).
   */
  const onDecline = useCallback(() => {
    if (loading) return;
    hiddenByLockRef.current = false;
    clearPendingOfertaAction();
    dispatch(contractModalShow({ show: false }));
  }, [dispatch, loading]);

  /**
   * SS-DEV (2026-10-04, 04.10 (1) 1-band): oyna ochilganda / "Qayta urinish"da
   * hujjat (qayta) yuklanadi: server (timeout 15 s, 2 qayta urinish, backoff) →
   * bo'lmasa ilova ichidagi zaxira PDF. Hujjat tili sayt bilan bir xil
   * (en/kaa → uz). uid hali yo'q bo'lsa (`id=undefined` → 404) — darhol zaxira.
   */
  const docLang = ofertaDocLang(storage.getString('lang'));
  const uid = user?.data?.uid;
  const uidRef = useRef(uid);
  uidRef.current = uid;
  // SS-DEV (2026-10-06): rozilik belgisining sinxron nusxasi — server nusxasi kech
  // kelganda zaxirani almashtirish mumkinmi (foydalanuvchi hali o'qishni boshlamagan).
  const checkRef = useRef(false);
  checkRef.current = check;
  useEffect(() => {
    if (!contract) return;
    const seq = ++loadSeqRef.current;
    const cancelled = () => seq !== loadSeqRef.current;
    const prev = docSrcRef.current;
    if (prev.kind === 'remote') removeOfertaFile(prev.path);
    setPdfErr(false);
    resetGate();
    const t0 = nowMs();
    const id = uidRef.current;
    if (!id) {
      setSource({ kind: 'bundled' });
    } else {
      /**
       * SS-DEV (2026-10-06, 06.10 1(a)): ILGARI `docSrc='loading'` (katta spinner)
       * server PDF to'liq yuklanguncha turardi (skrinshot: 5–6 s). Endi:
       *  - identifikatsiyadan keyin boshlangan prefetch TAYYOR bo'lsa — darhol server nusxasi;
       *  - aks holda DARHOL ilova ichidagi zaxira; server nusxasi kelganda foydalanuvchi
       *    hali 1-sahifada va rozilik belgilanmagan bo'lsa — almashtiriladi.
       */
      const url = ofertaPdfUrl(PDF_OFERTA_URL, id, docLang);
      const pre = takePrefetchedOferta(url);
      if (pre?.done && pre.path) {
        setSource({ kind: 'remote', path: pre.path });
        if (__DEV__) console.log(`[oferta] server PDF (prefetch) ${Math.round(nowMs() - t0)} ms`);
      } else {
        setSource({ kind: 'bundled' });
        if (__DEV__) console.log(`[oferta] zaxira PDF darhol ${Math.round(nowMs() - t0)} ms`);
        const p = pre
          ? pre.promise
          : downloadOfertaPdf(url, cancelled, task => {
              dlTaskRef.current = task;
            });
        p.then(path => {
          dlTaskRef.current = null;
          if (!path) return;
          // 08.10: "oxirigacha o'qildi" holatiga yetilgan bo'lsa — almashtirilmaydi
          // (almashtirish darvozani nollaydi).
          const untouched =
            docSrcRef.current.kind === 'bundled' &&
            maxPageRef.current <= 1 &&
            !reachedRef.current &&
            !checkRef.current;
          if (cancelled() || !untouched) {
            removeOfertaFile(path);
            return;
          }
          if (__DEV__) console.log(`[oferta] server PDF almashtirildi ${Math.round(nowMs() - t0)} ms`);
          setSource({ kind: 'remote', path });
        });
      }
    }
    return () => {
      loadSeqRef.current += 1;
      try {
        dlTaskRef.current?.cancel?.();
      } catch (_) {}
      dlTaskRef.current = null;
    };
  }, [contract, reloadKey, docLang, resetGate, setSource]);

  // Manba tayyor bo'lganda: darvoza nollanadi va "hodisa yo'q" kuzatuvchisi
  // ishga tushadi (chizish bosqichi). Taymer otganda hujjat yuklangan bo'lsa —
  // HECH NARSA qilinmaydi; aks holda server nusxasi → zaxira (onDocFailed).
  useEffect(() => {
    if (contract && docSrc.kind !== 'loading') {
      resetGate();
      armNoEventTimer();
    } else {
      clearTimers();
    }
    return clearTimers;
  }, [contract, docSrc, resetGate, clearTimers, armNoEventTimer]);

  const pdfSource =
    docSrc.kind === 'remote'
      ? { uri: `file://${docSrc.path}`, cache: false }
      : docSrc.kind === 'bundled'
      ? bundledOfertaSource(docLang)
      : null;

  // SS-DEV (2026-10-04): xavfsiz maydon. ILDIZ (orqaga tugmasi status bar ostida
  // kesilardi): oyna `height: Dimensions('screen')` bilan chizilar va Paper Modal
  // uni ota (SafeAreaView ichidagi, ekrandan KICHIK) maydonda MARKAZLARDI — ortiqcha
  // balandlik tepadan va pastdan teng kesilardi. Endi oyna ota maydonni AYNAN
  // to'ldiradi (flex:1) va ota inset'larni qoplamagan qismi (status bar / notch,
  // home indicator / Android nav bar) o'lchab olinib padding qilinadi.
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  const mainRef = useRef<View>(null);
  const [pad, setPad] = useState({ top: 0, bottom: 0 });
  const measureInsets = useCallback(() => {
    mainRef.current?.measureInWindow((_x, y, _w, h) => {
      if (!h) return;
      const top = Math.max(0, Math.round(insets.top - (y - frame.y)));
      const bottom = Math.max(
        0,
        Math.round(insets.bottom - (frame.y + frame.height - (y + h))),
      );
      setPad(p => (p.top === top && p.bottom === bottom ? p : { top, bottom }));
    });
  }, [insets.top, insets.bottom, frame.y, frame.height]);
  useEffect(() => {
    if (contract) measureInsets();
  }, [contract, measureInsets]);

  // Darvoza yopiq bo'lsa rozilik belgisi hech qachon true qolmasin
  // (masalan qayta yuklash / holat o'zgarishi paytida).
  useEffect(() => {
    if (needRead && check) setCheck(false);
  }, [needRead, check]);

  // SS-DEV (2026-10-04, 04.10 (1) 1-band): ogohlantirish sahifa PASTIDA —
  // rozilik qatori ustida (Tasdiqlash tugmasini yopmaydi).
  const warn = useCallback(
    (desc: string) => {
      Toast.show({
        autoHide: true,
        visibilityTime: 3500,
        position: 'bottom',
        bottomOffset: insets.bottom + rs(130),
        type: 'error2',
        props: { desc },
      });
    },
    [insets.bottom],
  );
  // SS-DEV (2026-10-04): oferta oxirigacha o'qilmay turib "tanishdim" belgisini
  // qo'ymoqchi bo'lsa — aynan shu matn (5 tilda, i18n/new/*.json).
  const warnRead = useCallback(() => {
    warn(t('Iltimos, ommaviy ofertani oxirigacha o‘qib chiqing va tasdiqlang.'));
  }, [t, warn]);
  // O'qib bo'lingan, lekin "tanishdim" belgilanmagan holda "Tasdiqlash" bosildi.
  const warnCheck = useCallback(() => {
    warn(t('Iltimos, ommaviy oferta bilan tanishganingizni belgilang.'));
  }, [t, warn]);

  const onClose = useCallback(async () => {
    // Tugma FAQAT `check` (rozilik belgilangan)да yoqiladi. Ilgari bu yerda ham
    // `page === allPage` sharti bor edi — u ishonchsiz bo'lib, tugma bosilса jim
    // o'tib ketardi (tasdiqlanmasdi). Endi rozilik belgisiga tayanamiz.
    if (check) {
      const token = storage.getString('token');
      try {
        setLoading(true);
        const { data } = await axios.put(
          URL + '/user/edit_contract',
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (data.success) {
          // is_contract=1 bo'ldi — redux `user`ni YANGILAB BO'LGACH yopamiz. Aks holda
          // Main.tsx re-trigger effekti (is_contract hali 0) modalni QAYTA ochadi (flicker/loop).
          await dispatch(getMe());
          dispatch(contractModalShow({ show: false }));
          // SS-DEV (2026-09-29): oferta so'ralgan shartnoma amali (masalan "Qarz
          // berish") tasdiqlangach AVTOMATIK davom etadi — oyna yopilgandan keyin.
          setTimeout(runPendingOfertaAction, 350);
        }

        if (data.success === false && data.msg === 'is_contract_true') {
          Toast.show({
            autoHide: true,
            visibilityTime: 3000,
            position: 'bottom',
            type: 'error2',
            props: {
              desc: t('Siz ommaviy ofertani boshqa qurilmada tasdiqlagansiz'),
            },
          });
          await dispatch(getMe());
          dispatch(contractModalShow({ show: false }));
          setTimeout(runPendingOfertaAction, 350);
        }

        // 08.10 (5-band): boshqa `success:false` javobi ilgari JIM o'tib ketardi
        // (oyna ochiq qolar, hech narsa bo'lmasdi) — endi server xabari ko'rsatiladi.
        if (data?.success === false && data?.msg !== 'is_contract_true') {
          warn(serverMsg(data) || t('Ofertani tasdiqlab bo‘lmadi. Qayta urinib ko‘ring.'));
        }

        setLoading(false);
      } catch (error: any) {
        setLoading(false);
        // 08.10 (5-band): ilgari qattiq yozilgan "Amalga oxshirib bo'lmadi" — endi
        // server xabari (403/401/400 javobidagi message/msg), bo'lmasa umumiy matn.
        warn(
          serverMsg(error?.response?.data) ||
            t('Ofertani tasdiqlab bo‘lmadi. Qayta urinib ko‘ring.'),
        );
      }
    }
    // SS-AUDIT (2026-09-25): bo'sh `else { console.log('red') }` olib tashlandi.
  }, [check, dispatch, t, warn]);

  return (
    <Modal
      visible={contract}
      dismissable={false}
      // SS-DEV (2026-09-29): Android "orqaga" — oynani yopadi (majburiy emas).
      dismissableBackButton
      onDismiss={onDecline}
      // SS-DEV (2026-10-04): Paper wrapper'ning o'z inset margin'lari va markazlash
      // o'chiriladi — oyna ota maydonni to'liq egallaydi, inset'lar `pad` orqali.
      style={styles.modalWrapper}
      contentContainerStyle={styles.modalContent}>
      <View
        ref={mainRef}
        onLayout={measureInsets}
        style={[
          styles.main,
          { paddingTop: pad.top + rs(8), paddingBottom: pad.bottom },
        ]}>
        {/* SS-DEV (2026-09-29): oferta endi majburiy emas (faqat Qarz shartnomasi
            amallari uchun shart). 01.10 (mobil hujjat, 4-band): chiqish — ilovadagi
            barcha ekranlar kabi chap tomondagi "ORQAGA" tugmasi (RdHeader uslubi);
            Android'ning tizim "orqaga" tugmasi ham oynani yopadi (dismissableBackButton). */}
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onDecline}
            disabled={loading}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('21')}
            style={styles.backBtn}>
            <ChevronLeft size={rs(22)} color={rd.color.onPrimary} />
          </TouchableOpacity>
          <Text style={styles.topTitle} allowFontScaling={false} numberOfLines={1}>
            {t('Ommaviy oferta')}
          </Text>
          <View style={styles.topSide} />
        </View>
        {loading ? (
          <Loading />
        ) : (
          <>
            {pdfErr ? (
              <View style={styles.errBox}>
                <Text style={styles.errText} allowFontScaling={false}>
                  {t(
                    'Oferta hujjatini yuklab bo‘lmadi. Internet aloqasini tekshirib, qayta urinib ko‘ring.',
                  )}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setPdfErr(false);
                    // SS-DEV (2026-09-24): reloadKey o'zgarishi useEffect orqali
                    // darvozani to'liq nollaydi (2026-10-04: server → zaxira qaytadan).
                    setReloadKey(k => k + 1);
                  }}
                  style={styles.retryBtn}
                >
                  <Text style={styles.retryText} allowFontScaling={false}>
                    {t('Qayta urinish')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : !pdfSource ? (
              // SS-DEV (2026-10-04): serverdan yuklanmoqda (timeout + qayta urinishlar).
              <View style={styles.errBox}>
                <ActivityIndicator size="large" color={rd.color.primary} />
              </View>
            ) : (
              // 08.10 (5-band): teginishlarni sanash uchun o'rov (varaqlashga xalaqit
              // bermaydi — faqat kuzatadi). Zaxira yo'li: checkReadFallback.
              <View
                style={styles.pdfWrap}
                onTouchStart={onPdfTouchStart}
                onTouchEnd={onPdfTouchEnd}
                onTouchCancel={onPdfTouchEnd}>
              <Pdf
                key={`${reloadKey}-${docSrc.kind}`}
                trustAllCerts={false}
                // SS-DEV (2026-09-24): sahifa-sahifa VERTIKAL scroll (pageSnap +
                // pageFling) — onPageChanged har sahifada ketma-ket keladi.
                enablePaging={true}
                horizontal={false}
                page={1}
                // SS-DEV (2026-10-04): server nusxasi ochilmasa — ilova ichidagi zaxira.
                onError={() => {
                  if (!loadedAtRef.current) onDocFailed();
                }}
                renderActivityIndicator={() => (
                  <ActivityIndicator
                    size="small"
                    color={rd.color.primary}
                    style={styles.indicator}
                  />
                )}
                source={pdfSource}
                onLoadComplete={(numberOfPages: number) => {
                  setLoading(false);
                  // So'rov: checkbox `page===allPage`да yoqiladi. Ilgari `allPage` FAQAT
                  // onPageChanged'дан kelardi — u esa BIRINCHI sahifада (yoki 1-sahifали
                  // PDF'да) ishga tushmasligi mumkin → allPage=0 → checkbox HECH QACHON
                  // yoqilmaydi → tasdiqlab bo'lmaydi. Endi yuklanganда umumiy sahifa
                  // soni to'g'ridan-to'g'ri o'rnatiladi (ishonchli gate).
                  if (numberOfPages > 0) {
                    setAllPage(numberOfPages);
                  }
                  // SS-DEV (2026-09-24): o'qish taymeri shu yerdan boshlanadi —
                  // muddati sahifa soniga bog'liq.
                  markLoaded(numberOfPages);
                }}
                onPageChanged={(p, allpage) => {
                  if (allpage > 0) {
                    allPageRef.current = allpage;
                    setAllPage(allpage);
                  }
                  // SS-DEV (2026-09-24): onLoadComplete kelmagan bo'lsa ham
                  // (ba'zi qurilmalarda faqat sahifa hodisasi keladi) yuklangan
                  // deb belgilaymiz — aks holda taymer hech qachon boshlanmaydi.
                  if (!loadedAtRef.current) {
                    markLoaded(allpage);
                    return;
                  }
                  // 08.10 (5-band): KETMA-KETLIK sharti va SETTLE oynasida hodisani
                  // butunlay tashlab yuborish olib tashlandi (ILDIZ — yuqorida).
                  // Orqaga qaytish maxPage'ni kamaytirmaydi.
                  notePage(p, allpage);
                }}
                // 08.10: sahifaga bosilganda ham joriy sahifa keladi (qo'shimcha signal).
                onPageSingleTap={(p: number) => notePage(p)}
                style={styles.pdf}
              />
              </View>
            )}
            <View style={styles.footer}>
              {/* So'rov: oferta TASDIQLASH ishlashi kerak. IKKI muammo bor edi:
                  (1) checkbox `page===allPage` gate'ига bog'liq edi — react-native-pdf
                  paginatsiyasida ISHONCHSIZ → hech qachon yoqilmasdi;
                  (2) CheckBox `TouchableWithoutFeedback` ichида edi — Androidда wrapper
                  bosishни "yutardi", native checkbox toggle bo'lmasdi.
                  YECHIM: butun qator TouchableOpacity — bosilса roziliкни toggle qiladi;
                  CheckBox esa FAQAT ko'rsatish uchun (pointerEvents:none). PDF xato
                  bo'lса (pdfErr) — roziliк belgilanmaydi. */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (pdfErr) return;
                  // 08.10: zaxira sharti shu zahoti tekshiriladi (ko'ruvchi sahifa
                  // hodisasini bermagan holat) — bajarilsa belgi darhol qo'yiladi.
                  if (needRead && !checkReadFallback()) {
                    warnRead();
                    return;
                  }
                  setCheck(c => !c);
                }}
              >
                <View style={styles.checkRow} pointerEvents="none">
                  <CheckBox
                    value={check}
                    tintColor={rd.color.border}
                    onTintColor={rd.color.primary}
                    tintColors={{
                      true: rd.color.primary,
                      false: rd.color.textTertiary,
                    }}
                    boxType="square"
                    style={styles.checkbox}
                  />
                  <Text style={styles.checkText} allowFontScaling={false}>
                    {t('ofertaaa')}
                  </Text>
                </View>
              </TouchableOpacity>
              {/* SS-DEV (2026-10-05): "Oxirigacha o'qing: x / y" yozuvi olib
                  tashlandi (so'rov). Darvoza mantig'i (needRead/warnRead) qoladi. */}
              {/* SS5: tugma BOSILADI (disabled emas) — aks holda sababini
                  tushuntiruvchi ogohlantirish umuman chiqmasdi. */}
              <TouchableOpacity
                onPress={() => {
                  if (needRead && !checkReadFallback()) {
                    warnRead();
                    return;
                  }
                  if (!check) {
                    warnCheck();
                    return;
                  }
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityState={{ disabled: !(check && !needRead) }}
                activeOpacity={0.85}
                style={[
                  styles.btn,
                  {
                    backgroundColor:
                      check && !needRead
                        ? rd.color.primary
                        : rd.color.textTertiary,
                  },
                  check && !needRead ? styles.btnActiveShadow : null,
                ]}
              >
                <Text style={styles.btnText} allowFontScaling={false}>
                  {t('93')}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

export default ContractModal;

const styles = StyleSheet.create({
  // SS-DEV (2026-10-04): Paper Modal wrapper — margin/markazlash yo'q (pastga qarang).
  modalWrapper: {
    marginTop: 0,
    marginBottom: 0,
    justifyContent: 'flex-start',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  // SS-DEV (2026-10-04): ilgari `height: Dimensions('screen')` — ota maydondan
  // katta bo'lib, markazlanganda tepasi (orqaga tugmasi) kesilardi. Endi flex:1.
  main: {
    flex: 1,
    width: '100%',
    backgroundColor: rd.color.surface,
    paddingHorizontal: rs(16),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: rs(4),
    paddingBottom: rs(8),
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
  },
  // RdHeader bilan bir xil: to'ldirilgan ko'k doira + oq chevron.
  backBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sarlavha markazda tursin — chapdagi tugma bilan teng o'ng bo'shliq.
  topSide: { width: rs(40) },
  // So'rov SS5: Pdf uchun aniq o'lcham — ilgari `styles.pdf` UNDEFINED edi,
  // shu bois PDF 0-balandlikда ("ko'rinmayapti") render bo'lishi mumkin edi.
  pdf: {
    flex: 1,
    width: '100%',
    backgroundColor: rd.color.surface,
  },
  // 08.10: PDF o'rovi (teginishlarni sanash) — PDF bilan bir xil maydon.
  pdfWrap: {
    flex: 1,
    width: '100%',
  },
  indicator: {
    flex: 1,
    justifyContent: 'center',
  },
  errBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(24),
  },
  errText: {
    fontFamily: rd.font.medium,
    fontSize: rs(14.5),
    lineHeight: rs(21),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginBottom: rs(18),
  },
  retryBtn: {
    paddingHorizontal: rs(24),
    paddingVertical: rs(12),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
  },
  retryText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14.5),
    color: rd.color.onPrimary,
  },
  footer: {
    backgroundColor: rd.color.surface,
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
    paddingTop: rs(8),
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rs(10),
  },
  checkbox: {
    height: rs(20),
    width: rs(20),
  },
  checkText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginLeft: rs(10),
    // SS-DEV (2026-10-05): matn bitta oqim — sig'masa tabiiy o'raladi.
    flex: 1,
    flexShrink: 1,
  },
  btn: {
    height: rs(52),
    paddingHorizontal: rs(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rd.radius.lg,
    alignSelf: 'center',
    width: '100%',
    marginBottom: rs(16),
  },
  btnActiveShadow: {
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  btnText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.onPrimary,
  },
});
