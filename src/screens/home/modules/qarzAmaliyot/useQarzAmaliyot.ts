/**
 * useQarzAmaliyot.ts — QarzDaftariAmaliyot ma'lumot + amallar (QarzDaftariAmaliyot.tsx dan ko'chirilgan, xulq
 * o'zgarmagan: __tests__/qarz_daftari_amaliyot.test.tsx): do'kon nomi, to'lov grafigi, bo'lakni to'langan deb
 * belgilash (oflayn navbat) va kvitansiyani PDF qilib ulashish. Amallar useApiAction ustida.
 */
import { useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { generatePDF } from 'react-native-html-to-pdf';
import RNBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import Toast from 'react-native-toast-message';
import { amountToInput, isUsd, parseAmount } from '../../../../helper/money';
import { useApiAction } from '../../../../hooks/useApiAction';
import { isOnline } from '../../../../offline/netStatus';
import { qarzGet } from '../../../../offline/qarzGet';
import { isUnsyncedId, submitQarzOp } from '../../../../offline/submit';
import { NewOp } from '../../../../offline/types';
import { outboxErrorText, showQueuedResult } from '../../../../offline/ui/queuedToast';
import { getQarzShop } from '../../../../store/api/token/qarzShop';
import { URL } from '../../../constants';
import { buildAmaliyotView, buildReceiptRows, receiptHtml, shopNameOf, sortSchedule } from './amaliyotLogic';

/**
 * 03.10 (3-band): "Do'kon" qatori uchun nom. Tartib: 1) route params ichidagi do'kon nomi; 2) tanlangan do'kon
 * (qarzShop) — id qarznikiga MOS bo'lsa; 3) aks holda qarz tafsiloti so'raladi; 4) so'rov yiqilsa — tanlangan do'kon nomi.
 */
const useDokonNomi = (tx: any, qarz: any, mijoz: any): string => {
  const direct = shopNameOf(tx) || shopNameOf(qarz) || shopNameOf(mijoz);
  const faoliyatId = Number(qarz?.savdo_faoliyat_id || mijoz?.savdo_faoliyat_id || tx?.savdo_faoliyat_id) || 0;
  const selected = getQarzShop();
  const selectedNomi = selected?.nomi && (!faoliyatId || selected.id === faoliyatId) ? selected.nomi : '';
  const qarzId = qarz?.id ?? tx?.qarz_id;
  const needFetch = !direct && !(faoliyatId && selectedNomi) && !!qarzId;
  const [fetched, setFetched] = React.useState('');
  React.useEffect(() => {
    if (!needFetch) return;
    let alive = true;
    // 23.10: oflaynda keshdan / lokal sintezdan (oflayn qarz).
    qarzGet(`${URL}/qarz-daftari/qarz/${qarzId}`)
      .then(data => {
        if (alive) setFetched(shopNameOf(data?.data));
      })
      .catch(() => {
        // Do'kon nomi ixtiyoriy — so'rov yiqilsa tanlangan do'kon nomi / '—' qoladi.
      });
    return () => {
      alive = false;
    };
  }, [needFetch, qarzId]);
  return direct || fetched || selectedNomi;
};

export const useQarzAmaliyot = () => {
  const route = useRoute<any>();
  const { t } = useTranslation();
  const tx: any = route.params?.tx || {};
  const qarz: any = route.params?.qarz || {};
  const mijozParam: any = route.params?.mijoz || {};
  const dokonNomi = useDokonNomi(tx, qarz, mijozParam);
  const view = buildAmaliyotView(tx, qarz);
  const { bolib } = view;
  const qarzId = qarz?.id ?? tx?.qarz_id;

  // ── SS4 (2026-09-20): MUDDATLI TO'LOV GRAFIGI — faqat bo'lib to'lash qarzida so'rov ketadi.
  const [grafik, setGrafik] = React.useState<any[]>([]);
  const [grafikLoading, setGrafikLoading] = React.useState(false);
  // 24.10: grafik olinmadi — oflayn (keshda yo'q) yoki xato. Ilgari jim bo'sh qolardi.
  const [grafikMissing, setGrafikMissing] = React.useState<'offline' | 'error' | null>(null);
  const loadGrafik = React.useCallback(async () => {
    if (!bolib || !qarzId) return;
    try {
      setGrafikLoading(true);
      // 23.10 (oflayn rejim): `tolovlar` — cache-first va navbatdagi bo'lak to'lovlari proyeksiyasi bilan.
      const data = await qarzGet(`${URL}/qarz-daftari/qarz/${qarzId}`);
      const rows = data?.data?.tolovlar;
      if (Array.isArray(rows)) {
        setGrafik(sortSchedule(rows));
        setGrafikMissing(null);
      } else {
        setGrafikMissing(isOnline() ? 'error' : 'offline');
      }
    } catch (e) {
      // Grafik yuklanmasa ekranning QOLGAN qismi baribir ishlaydi (izoh ko'rsatiladi).
      setGrafikMissing(isOnline() ? 'error' : 'offline');
    } finally {
      setGrafikLoading(false);
    }
  }, [bolib, qarzId]);
  React.useEffect(() => {
    loadGrafik();
  }, [loadGrafik]);

  // ── SS3 (2026-09-21): to'lovni belgilash oynasi.
  const [payRow, setPayRow] = React.useState<any>(null);
  const [payVal, setPayVal] = React.useState('');
  const payAction = useApiAction();
  const usd = isUsd(qarz?.valyuta);
  const openPay = (g: any) => {
    setPayRow(g);
    setPayVal(amountToInput(g?.summa, usd));
  };

  /**
   * SS3-2: bo'lakni to'langan deb belgilash. Summa TAHRIRLANADI — grafikdagidan ko'p kiritilsa, ortiqchasi backendda
   * keyingi bo'laklardan chegiriladi (sharshara).
   */
  const submitPay = async () => {
    if (payAction.loading || !payRow) return;
    const raw = parseAmount(payVal, usd);
    if (!isFinite(raw) || raw <= 0) {
      Toast.show({ type: 'error2', props: { desc: t('Summani kiriting') } });
      return;
    }
    // 23.10: oflayn yaratilgan qarzning bo'laklari serverda hali yo'q — sinxrondan keyin.
    const tolovId = Number(payRow.id);
    if (!Number.isFinite(tolovId) || tolovId <= 0 || isUnsyncedId(qarzId)) {
      Toast.show({
        type: 'error2',
        props: { desc: t('Qarz hali sinxronlanmagan — bo‘lakni keyin belgilang yoki «Qarzni yopish» orqali to‘lov qabul qiling') },
      });
      return;
    }
    await payAction.run(
      async () => {
        const out = await submitQarzOp({
          kind: 'tolov.tolandi',
          payload: { tolovId, qarzId: Number(qarzId), summa: raw },
          meta: {
            fish: qarz?.mijoz?.fish || mijozParam?.fish,
            qarzId: Number(qarzId),
            mijozId: Number(qarz?.mijoz_id) || undefined,
            turi: qarz?.turi,
            valyuta: qarz?.valyuta,
            summa: raw,
            faoliyatId: Number(qarz?.savdo_faoliyat_id) || undefined,
          },
        } as NewOp);
        setPayRow(null);
        await loadGrafik();
        return out;
      },
      {
        onSuccess: out => {
          if (out.status === 'queued') {
            // 24.10: blocked (shu mijozning oldingi amali xato) bo'lsa — ogohlantirish.
            showQueuedResult(out.op, t('To‘lov oflayn saqlandi — internet tiklanganda yuboriladi'), t, 0);
          } else {
            Toast.show({ type: 'omad', props: { desc: t('To‘lov qayd etildi') } });
          }
        },
        // 24.10: navbat to'lgan / qurilma xotirasiga yozilmadi — aniq xabar; aks holda server xabari.
        error: (e: any) => outboxErrorText(e, t) || t(e?.response?.data?.message || 'Xatolik yuz berdi'),
      },
    );
  };

  // ── SS13 (2026-09-17): KVITANSIYA va ULASHISH (qo'shimcha so'rov YO'Q: barcha ma'lumot allaqachon ekranda).
  const [showReceipt, setShowReceipt] = React.useState(false);
  const shareAction = useApiAction();
  const receiptRows = buildReceiptRows(tx, view, t);
  const shareReceipt = async () => {
    if (shareAction.loading) return;
    await shareAction.run(
      async () => {
        const name = `kvitansiya_${tx?.id || Date.now()}`;
        const file: any = await generatePDF({ html: receiptHtml(receiptRows, t), fileName: name, directory: 'Documents' });
        const src = file?.filePath || file?.path;
        if (!src) throw new Error('pdf');
        /**
         * ⚠️ `react-native-share` PDF ni to'g'ridan-to'g'ri `Documents` papkasidan ULASHA OLMAYDI (FileProvider
         * sozlamasida yo'q) — fayl avval KESH papkasiga ko'chiriladi va ulashgandan keyin o'chiriladi.
         */
        const dest = `${RNBlobUtil.fs.dirs.CacheDir}/${name}.pdf`;
        if (await RNBlobUtil.fs.exists(dest)) await RNBlobUtil.fs.unlink(dest);
        await RNBlobUtil.fs.cp(src, dest);
        try {
          await Share.open({ url: `file://${dest}`, type: 'application/pdf', title: t('Kvitansiya'), failOnCancel: false });
        } finally {
          if (await RNBlobUtil.fs.exists(dest)) await RNBlobUtil.fs.unlink(dest);
        }
      },
      {
        // Foydalanuvchi ulashishni BEKOR qilsa ham shu yerga tushadi — bu xato emas (bo'sh matn = toast yo'q).
        error: (e: any) => (/cancel/i.test(String(e && e.message)) ? '' : t('Kvitansiyani ulashib bo‘lmadi')),
      },
    );
  };

  return {
    t, tx, qarz, view, dokonNomi, grafik, grafikLoading, grafikMissing,
    payRow, payVal, setPayVal, setPayRow, paying: payAction.loading, openPay, submitPay,
    showReceipt, setShowReceipt, sharing: shareAction.loading, shareReceipt, receiptRows, usd,
  };
};
export type QarzAmaliyotState = ReturnType<typeof useQarzAmaliyot>;
