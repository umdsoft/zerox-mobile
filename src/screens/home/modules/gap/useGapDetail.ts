/**
 * useGapDetail.ts — FinanceGapDetail ma'lumot yuklash + barcha amallar (endpoint, payload, toast va
 * navigatsiya FinanceGapDetail.tsx dagi bilan AYNAN bir xil). Mantiqiy hisob-kitoblar gapDetailLogic.ts da.
 *
 * ⚠️ Barcha hook'lar bu yerda — `g` yo'q (yuklanayotgan) renderda ham chaqiriladi; komponent erta-return'ni
 * FAQAT shu hook'dan KEYIN qiladi (ilgari "Rendered more hooks" → oq ekran, 2026-09-19).
 */
import { safeOpenURL } from '@helper/safeOpenURL';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clipboard } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import Toast from 'react-native-toast-message';
import { useFetch } from '../../../../hooks/useFetch';
import { apiErrorMessage, useApiAction } from '../../../../hooks/useApiAction';
import { phoneDigits9 } from '../../../../helper/phone';
import { storage } from '../../../../store/api/token/getToken';
import { URL } from '../../../constants';
import { financeApi } from '../financeApi';
import { amountToRaw, num } from '../financeMoney';
import {
  buildSettingsBody,
  buildVenueBody,
  effectiveMemberOrder,
  isRoundOverdue,
  isVenueAddressMissing,
  locationUrl,
  moveInList,
  settingsFormFor,
  toggleRoundOpen,
  validateNewMember,
  venueFormFor,
  VenueMode,
} from './gapDetailLogic';

type Json = Record<string, any>;
const errMsg = (e: unknown) => apiErrorMessage(e);

export const useGapDetail = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { id } = (useRoute().params as any) || {};
  const detailFetch = useFetch({ url: `${URL}/finance/gap/${id}`, method: 'GET' });
  const refresh = detailFetch.onRefresh;
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) { firstFocus.current = false; return; }
      refresh({});
    }, [refresh]),
  );

  const g: Json | null = (detailFetch.data as any)?.data || null;

  // Forma / UI holati
  const [addName, setAddName] = React.useState('');
  const [addPhone, setAddPhone] = React.useState('');
  const [addAmount, setAddAmount] = React.useState('');
  const [showDel, setShowDel] = React.useState(false);
  const [delMember, setDelMember] = React.useState<any>(null); // SS12: a'zoni o'chirish tasdig'i
  const [openRounds, setOpenRounds] = React.useState<Record<string, boolean>>({});
  const [membersOpen, setMembersOpen] = React.useState(true); // R17: akkordeon
  const [venueForm, setVenueForm] = React.useState<any>(null);
  const [sendingRounds, setSendingRounds] = React.useState<Record<string, boolean>>({}); // SS4: davra id -> yuborilmoqda
  const [coOrg, setCoOrg] = React.useState<{ member: any; add: boolean } | null>(null); // SS6
  const [showMap, setShowMap] = React.useState(false); // img8
  const [orderMode, setOrderMode] = React.useState<'random' | 'manual'>('random'); // SS11
  const [manualOrder, setManualOrder] = React.useState<any[]>([]);
  const [settings, setSettings] = React.useState<any>(null); // SS11: faqat boshlanmasdan oldin

  // Har bir "band" bayrog'i alohida spinner/disabled'ni boshqaradi (eski busy/savingVenue/savingSet/pdfBusy).
  const busyAction = useApiAction();
  const venueAction = useApiAction();
  const settingsAction = useApiAction();
  const pdfAction = useApiAction();
  const inviteAction = useApiAction();
  const busy = busyAction.loading;

  const effectiveOrder: any[] = React.useMemo(
    () => effectiveMemberOrder(g?.members || [], manualOrder),
    [manualOrder, g],
  );

  const members: any[] = g?.members || [];
  const rounds: any[] = g?.rounds || [];
  const isOrganizer = !!g?.is_organizer;
  const isDraft = g?.status === 'draft';

  const toggleRound = (k: string, isOpen: boolean) => setOpenRounds(s => toggleRoundOpen(s, k, isOpen));
  const moveMember = (idx: number, dir: -1 | 1) => {
    const next = moveInList(effectiveOrder, idx, dir);
    if (next) setManualOrder(next);
  };
  const onAddPhoneChange = (txt: string) => setAddPhone(phoneDigits9(txt)); // SS14

  const openVenueForm = (mode: VenueMode, r: Json) => setVenueForm(venueFormFor(mode, r));
  const openVenue = (r: Json) => openVenueForm('venue', r);
  const openCard = (r: Json) => openVenueForm('card', r);
  const openSettings = () => g && setSettings(settingsFormFor(g));
  const openLocation = (loc?: string) => {
    if (!loc) return;
    safeOpenURL(locationUrl(loc)); // SS-SEC (2026-09-25): faqat https/tel/sms/tg
  };
  const copyCard = (cardNo?: string) => {
    const digits = String(cardNo || '').replace(/\s/g, '');
    if (!digits) return;
    try { Clipboard.setString(digits); Toast.show({ type: 'omad', props: { desc: t('Karta raqami nusxalandi') } }); } catch (_) {}
  };

  const saveVenue = async () => {
    if (venueAction.loading || !venueForm) return;
    if (isVenueAddressMissing(venueForm)) {
      Toast.show({ type: 'error2', props: { desc: 'Manzilni kiriting' } });
      return;
    }
    await venueAction.run(
      async () => {
        await financeApi.setGapRoundVenue(id, venueForm.roundId, buildVenueBody(venueForm));
        setVenueForm(null);
        refresh({});
      },
      { success: 'Ma’lumot saqlandi', error: errMsg },
    );
  };

  // SS4: "Taklif yuborish" — ma'lumot saqlangach a'zolarga Telegram taklifini YUBORADI.
  const sendInvite = async (r: Json) => {
    if (!r || sendingRounds[String(r.id)]) return;
    const key = String(r.id);
    const mark = (on: boolean) => setSendingRounds(s => ({ ...s, [key]: on }));
    // 01.11: "yuborilmoqda" faqat amal HAQIQATAN boshlangan davra uchun (run ichida) yoqiladi/o'chadi —
    // boshqa davradagi tezkor 2-bosish birinchisining belgisini o'chirmaydi (ilgari umumiy null edi).
    await inviteAction.run(
      async () => {
        mark(true);
        try {
          return await financeApi.notifyGapRound(id, r.id);
        } finally {
          mark(false);
        }
      },
      {
        // SS-DEV (2026-09-24): muddati o'tgan davrada bu "to'lov haqida ogohlantirish" (ishtirok so'ralmaydi).
        success: () =>
          isRoundOverdue(r)
            ? t('Ogohlantirish yuborildi (muddat o‘tgan — ishtirok so‘ralmaydi)')
            : 'Yuborildi',
        error: e =>
          String(
            (e as any)?.response?.data?.code === 'round_expired'
              ? t('Bu davraning muddati o‘tgan — server hozircha ogohlantirish yuborishga ruxsat bermadi. To‘lovni qo‘lda eslatishingiz mumkin.')
              : apiErrorMessage(e),
          ),
        errorVisibilityTime: 5000,
      },
    );
  };

  const saveSettings = async () => {
    if (settingsAction.loading || !settings) return;
    if (!String(settings.name || '').trim()) {
      Toast.show({ type: 'error2', props: { desc: 'Gap nomini kiriting' } });
      return;
    }
    await settingsAction.run(
      async () => {
        await financeApi.updateGap(id, buildSettingsBody(settings));
        setSettings(null);
        refresh({});
      },
      { success: 'Sozlamalar saqlandi', error: errMsg },
    );
  };

  /**
   * SS6: gap PDF — serverdan yuklab olinadi va tizim ulashish oynasiga beriladi.
   * ⚠️ Fayl KESH papkasiga saqlanadi: `react-native-share` boshqa papkalardan ulasha olmaydi.
   */
  const sharePdf = async () => {
    await pdfAction.run(async () => {
      const dest = `${RNBlobUtil.fs.dirs.CacheDir}/gap_${id}.pdf`;
      try {
        if (await RNBlobUtil.fs.exists(dest)) await RNBlobUtil.fs.unlink(dest);
        const res = await RNBlobUtil.config({ path: dest }).fetch('GET', `${URL}/finance/gap/${id}/pdf`, {
          Authorization: `Bearer ${storage.getString('token')}`,
        });
        const status = res.info().status;
        if (status !== 200) throw new Error('pdf ' + status);
        await Share.open({ url: `file://${dest}`, type: 'application/pdf', title: 'Gap', failOnCancel: false });
      } catch (e: any) {
        if (!/cancel/i.test(String(e && e.message))) {
          Toast.show({ type: 'error2', props: { desc: 'PDF tayyorlanmadi' } });
        }
      } finally {
        try { if (await RNBlobUtil.fs.exists(dest)) await RNBlobUtil.fs.unlink(dest); } catch (_) {}
      }
    });
  };

  /** SS6: qo'shimcha tashkilotchini tayinlash yoki olib tashlash. */
  const applyCoOrg = async () => {
    if (!coOrg || busy) return;
    const { member, add } = coOrg;
    await busyAction.run(
      async () => {
        if (add) await financeApi.setGapCoOrganizer(id, member.id);
        else await financeApi.removeGapCoOrganizer(id);
        setCoOrg(null);
        refresh({});
      },
      { success: add ? t('Tashkilotchi qo‘shildi') : t('Tashkilotchilik olib tashlandi'), error: errMsg },
    );
  };

  /** SS3: "To'landi" yanglishib bosilsa — 24 SOAT ichida qaytarish. */
  const unpay = async (pid: any) => {
    if (busy) return;
    await busyAction.run(
      async () => {
        await financeApi.unpayGap(id, pid);
        refresh({});
      },
      { success: 'To‘lov bekor qilindi', error: errMsg },
    );
  };

  const addMember = async () => {
    if (busy) return;
    const invalid = validateNewMember(addName, addPhone);
    if (invalid) { Toast.show({ type: 'error2', props: { desc: invalid } }); return; }
    await busyAction.run(
      async () => {
        await financeApi.addGapMember(id, { name: addName.trim(), phone: `+998${addPhone}`, amount: num(amountToRaw(addAmount)) || null });
        setAddName(''); setAddPhone(''); setAddAmount('');
        refresh({});
      },
      { success: 'A‘zo qo‘shildi', error: errMsg },
    );
  };

  // SS12: a'zoni o'chirish avval tasdiq so'raydi.
  const removeMember = async () => {
    if (busy || !delMember) return;
    await busyAction.run(
      async () => {
        await financeApi.deleteGapMember(id, delMember.id);
        setDelMember(null);
        refresh({});
      },
      { success: 'A‘zo o‘chirildi', error: errMsg },
    );
  };

  const start = async () => {
    if (busy) return;
    if (members.length < 2) { Toast.show({ type: 'error2', props: { desc: t('Kamida 2 a‘zo kerak') } }); return; }
    await busyAction.run(
      async () => {
        // SS11: qo'lda rejimda navbat tartibi yuboriladi; tasodifiyda backend aralashtiradi.
        const order = orderMode === 'manual' ? effectiveOrder.map((m: any) => m.id) : null;
        await financeApi.shuffleGap(id, order ? { order } : {});
        refresh({});
      },
      { success: 'Gap boshlandi', error: errMsg },
    );
  };

  const pay = async (pid: any) => {
    if (busy) return;
    await busyAction.run(
      async () => {
        await financeApi.payGap(id, pid);
        refresh({});
      },
      { success: 'To‘lov belgilandi', error: 'Xatolik yuz berdi' }, // server xabari ISHLATILMAYDI (eski xulq)
    );
  };

  // SS-AUDIT (2026-09-25): busy-guard — ikki marta bosishda ikkita DELETE ketmasin.
  const doDelete = async () => {
    if (busy) return;
    await busyAction.run(
      async () => {
        await financeApi.deleteGap(id);
        setShowDel(false);
      },
      { success: 'O‘chirildi', error: errMsg, onSuccess: () => navigation.goBack() },
    );
  };

  return {
    g, id, members, rounds, isOrganizer, isDraft,
    // forma
    addName, setAddName, addPhone, onAddPhoneChange, addAmount, setAddAmount,
    // holat
    busy, pdfBusy: pdfAction.loading, savingVenue: venueAction.loading, savingSet: settingsAction.loading, sendingRounds,
    showDel, setShowDel, delMember, setDelMember, coOrg, setCoOrg,
    membersOpen, setMembersOpen, openRounds, toggleRound,
    venueForm, setVenueForm, showMap, setShowMap, settings, setSettings,
    orderMode, setOrderMode, effectiveOrder, moveMember,
    // amallar
    openVenue, openCard, openSettings, openLocation, copyCard, saveVenue, sendInvite, saveSettings, sharePdf,
    applyCoOrg, unpay, addMember, removeMember, start, pay, doDelete,
  };
};

export type GapDetail = ReturnType<typeof useGapDetail>;
