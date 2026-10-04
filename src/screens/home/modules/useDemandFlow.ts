/**
 * useDemandFlow.ts — 03.10: "Talab qilish" (qaytarishni talab qilish SMS) YAGONA oqimi.
 *
 * Egasining hujjati (03.10, 5-rasm): talab tugmasi bosilganda SMS DARHOL ketmasin:
 *   1) tarif qulfi (02.10, planGate) — Free / muddati tugagan tarif → markazdagi "Tarif
 *      cheklovi" oynasi (PlanLimitModal: sabab matni + "Tariflarni ko'rish"). ILDIZ (03.10):
 *      ilgari toast + darhol Tariflar ('Types') sahifasiga o'tilardi; navigatsiya toastni
 *      yopib yuborgani uchun foydalanuvchi sababni ko'rmay, tepasida "SMS balansingiz /
 *      SMS xabarlar tarixi" turgan sahifaga "tushib qolardi" — "SMS tarixi ochildi" deb qabul qilindi;
 *   2) plastik karta KIRITILMAGAN → avval karta oynasi; saqlab qaytilgach tasdiq oynasi
 *      O'ZI ochiladi (fokusda kartani qayta o'qiymiz);
 *   3) karta bor → markazdagi "Talab SMS yuborilsinmi?" oynasi (DemandConfirmModal):
 *      OK — SMS yuboriladi, X / Bekor — HECH NARSA yuborilmaydi,
 *      "Kartani o'zgartirish" — karta oynasi, qaytilgach tasdiq oynasi yangi karta bilan.
 * Ishlatiladi: Shaxsiy qarz (useDebtGroupActions.useFinanceDemand) va Qarz daftari
 * (qarzTalab.useQarzTalab) — modullar faqat karta manbasi va yuborish so'rovini beradi.
 */
import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

/** Tasdiq oynasida ko'rsatiladigan karta rekvizitlari. */
export type DemandCard = {
  number: string;
  holder?: string;
  telegramPhone?: string;
};

export type DemandFlowOptions<T> = {
  /** Tarif qulfi — `true` bo'lsa karta so'ralmaydi, "Tarif cheklovi" oynasi ochiladi. */
  locked: boolean;
  /** Tarif cheklovi matni (planGate.planRequiredText). */
  lockedText: () => string;
  /** "Tariflarni ko'rish" — Tariflar sahifasi. */
  onUpgrade: () => void;
  /** Joriy karta (har safar YANGI o'qiladi). `null` — karta kiritilmagan. */
  loadCard: (target: T) => Promise<DemandCard | null>;
  /** Karta kiritish/tahrirlash ekrani. `null` — bu foydalanuvchi kartani o'zgartira olmaydi. */
  openCardScreen: ((target: T) => void) | null;
  /** Karta YO'Q bo'lsa ham yuborish mumkinmi (masalan xodim — umumiy matn ketadi). */
  allowWithoutCard?: boolean;
  /** Karta yo'q va kiritish ekrani ochilayotganda ko'rsatiladigan matn. */
  noCardText: string;
  /** SMS matni ko'rinishi (ixtiyoriy). `loadPreview` bo'lsa — faqat zaxira (tarmoq xatosida). */
  buildPreview?: (target: T, card: DemandCard | null) => string | undefined;
  /**
   * SS-DEV (2026-10-04): SMS matni SERVERDAN (backend yuboradigan matn bilan aynan bir xil).
   * Bo'sh/xato bo'lsa `buildPreview` zaxirasi ko'rsatiladi.
   */
  loadPreview?: (target: T, card: DemandCard | null) => Promise<string | undefined>;
  /** SMS yuborish — muvaffaqiyat/xato toastlari shu funksiya ichida. */
  send: (target: T) => Promise<void>;
};

export type DemandPlanPrompt = {
  visible: boolean;
  message: string;
  onClose: () => void;
  onUpgrade: () => void;
};

export type DemandModalState = {
  visible: boolean;
  busy: boolean;
  card: DemandCard | null;
  preview?: string;
  /** SS-DEV (2026-10-04): server matni yuklanmoqda. */
  previewLoading?: boolean;
  canChangeCard: boolean;
  onConfirm: () => void;
  onClose: () => void;
  onChangeCard: () => void;
  /** Tarif cheklovi oynasi (Free / muddati tugagan tarif). */
  plan: DemandPlanPrompt;
};

export const useDemandFlow = <T>(opts: DemandFlowOptions<T>) => {
  const [visible, setVisible] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [card, setCard] = React.useState<DemandCard | null>(null);
  const [preview, setPreview] = React.useState<string | undefined>(undefined);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const previewSeq = React.useRef(0);
  const [planMsg, setPlanMsg] = React.useState('');
  const targetRef = React.useRef<T | null>(null);
  // 03.10: karta oynasiga talab UCHUN o'tildi — qaytganda tasdiq oynasini qayta ochamiz.
  const pendingRef = React.useRef(false);
  // Har renderda eng so'nggi opts (yopilgan qiymatlar eskirmasin).
  const optsRef = React.useRef(opts);
  optsRef.current = opts;

  const showConfirm = (target: T, c: DemandCard | null) => {
    const o = optsRef.current;
    setCard(c);
    const fallback = o.buildPreview ? o.buildPreview(target, c) : undefined;
    const seq = ++previewSeq.current;
    if (o.loadPreview) {
      // SS-DEV (2026-10-04): matn bitta manbadan — backend (talab-preview).
      setPreview(undefined);
      setPreviewLoading(true);
      o.loadPreview(target, c)
        .then(text => {
          if (seq !== previewSeq.current) return;
          setPreview(text && text.trim() ? text : fallback);
        })
        .catch(() => {
          if (seq === previewSeq.current) setPreview(fallback);
        })
        .finally(() => {
          if (seq === previewSeq.current) setPreviewLoading(false);
        });
    } else {
      setPreviewLoading(false);
      setPreview(fallback);
    }
    setVisible(true);
  };

  const goCardScreen = (target: T) => {
    const open = optsRef.current.openCardScreen;
    if (!open) return;
    pendingRef.current = true;
    open(target);
  };

  /** Kartani o'qib, tasdiq oynasini ochadi yoki karta oynasiga yo'naltiradi. */
  const resolveAndShow = async (target: T, fromCardScreen: boolean) => {
    const o = optsRef.current;
    let c: DemandCard | null = null;
    try {
      c = await o.loadCard(target);
    } catch {
      // 03.10: karta o'qilmadi (tarmoq) — tasdiq oynasi baribir ochiladi; server o'zi tekshiradi.
      c = null;
      if (!fromCardScreen) {
        showConfirm(target, null);
        return;
      }
    }
    if (c || o.allowWithoutCard || !o.openCardScreen) {
      if (c || !fromCardScreen) showConfirm(target, c);
      return;
    }
    // Karta oynasidan saqlamasdan qaytildi — qayta yo'naltirmaymiz (aylanma bo'lmasin).
    if (fromCardScreen) return;
    Toast.show({
      type: 'error2',
      visibilityTime: 4000,
      props: { desc: o.noCardText },
    });
    goCardScreen(target);
  };

  /** "Talab qilish" bosildi. */
  const start = async (target: T) => {
    if (!target || busy || checking) return;
    const o = optsRef.current;
    if (o.locked) {
      setPlanMsg(o.lockedText());
      return;
    }
    targetRef.current = target;
    setChecking(true);
    try {
      await resolveAndShow(target, false);
    } finally {
      setChecking(false);
    }
  };

  // Karta oynasidan qaytildi — karta endi bor bo'lsa tasdiq oynasi o'zi ochiladi.
  useFocusEffect(
    React.useCallback(() => {
      if (!pendingRef.current || !targetRef.current) return;
      pendingRef.current = false;
      resolveAndShow(targetRef.current, true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const onConfirm = async () => {
    const target = targetRef.current;
    if (!target || busy) return;
    setBusy(true);
    try {
      await optsRef.current.send(target);
    } finally {
      setBusy(false);
      setVisible(false);
    }
  };

  const onClose = () => {
    // 03.10: X / Bekor qilish — SMS YUBORILMAYDI.
    if (busy) return;
    setVisible(false);
  };

  const onChangeCard = () => {
    const target = targetRef.current;
    if (!target || busy) return;
    setVisible(false);
    goCardScreen(target);
  };

  const modal: DemandModalState = {
    visible,
    busy,
    card,
    preview,
    previewLoading,
    canChangeCard: !!opts.openCardScreen,
    onConfirm,
    onClose,
    onChangeCard,
    plan: {
      visible: !!planMsg,
      message: planMsg,
      onClose: () => setPlanMsg(''),
      onUpgrade: () => {
        setPlanMsg('');
        optsRef.current.onUpgrade();
      },
    },
  };

  return { start, demanding: busy || checking, modal };
};
