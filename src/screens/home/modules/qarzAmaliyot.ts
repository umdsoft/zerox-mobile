/**
 * qarzAmaliyot.ts — "Amaliyot tafsiloti" (QarzDaftariAmaliyot) ekrani uchun
 * `{ tx, qarz }` parametrlarini tayyorlash.
 *
 * 28.09 (2/3-band): kalendar varag'idagi amaliyot va mijoz sahifasidagi
 * "Aktiv qarzlar" qatori endi "Qarz tafsiloti" (QarzDaftariQarz) EMAS, amaliyot
 * turiga mos "Amaliyot tafsiloti" ni ochadi: Qarz berildi / Qarz qaytarildi /
 * Qarzdan voz kechildi.
 */
import axios from 'axios';
import { URL } from '../../constants';
import { storage } from '../../../store/api/token/getToken';

type AnyObj = Record<string, any>;
export type AmaliyotParams = { tx: AnyObj; qarz: AnyObj };

const byTime = (a: AnyObj, b: AnyObj) =>
  String(a?.created_at || '').localeCompare(String(b?.created_at || '')) ||
  Number(a?.id || 0) - Number(b?.id || 0);

/** Qarz obyektidan "Qarz berildi" amaliyotini tuzish (qarzning JAMI summasi). */
const txFromQarz = (qarz: AnyObj, base?: AnyObj, turi: 'berish' | 'olish' = 'berish'): AnyObj => ({
  id: base?.id,
  qarz_id: qarz?.id,
  turi,
  summa: qarz?.miqdor,
  valyuta: qarz?.valyuta,
  created_at: base?.created_at || qarz?.created_at,
  berilgan_sana: qarz?.berilgan_sana,
  qaytarish_sanasi: qarz?.qaytarish_sanasi,
  izoh: qarz?.mahsulot_nomi || null,
  bajaruvchi_telefon: base?.bajaruvchi_telefon || qarz?.registrar_telefon || null,
});

/**
 * Aktiv qarz → uning "Qarz berildi" amaliyoti.
 *
 * - Qarzda bitta 'berish' amaliyoti bo'lsa — AYNAN o'sha (summa, sana, kim
 *   bajargan — hammasi haqiqiy yozuvdan).
 * - Bir nechta bo'lsa (muddati o'tgan qarzlar KONSOLIDATSIYA qilinib, bitta
 *   qarzga qo'shilgan) yoki umuman bo'lmasa (juda eski yozuv) — qarzning o'zidan
 *   tuziladi: summa = qarzning JAMI miqdori, ya'ni ro'yxatdagi kartada
 *   ko'rinadigan summa bilan bir xil; sana va bajaruvchi — birinchi amaliyotdan.
 */
export const creationParams = (
  qarz: AnyObj,
  tranzaksiyalar: AnyObj[],
  // 03.10: standart 'berish' — mavjud chaqiruvchilar (mijoz sahifasi) o'zgarmaydi.
  turi: 'berish' | 'olish' = 'berish',
): AmaliyotParams => {
  const own = (Array.isArray(tranzaksiyalar) ? tranzaksiyalar : [])
    .filter(t => Number(t?.qarz_id) === Number(qarz?.id) && t?.turi === turi)
    .sort(byTime);
  const tx = own.length === 1 ? own[0] : txFromQarz(qarz, own[0], turi);
  return { tx, qarz };
};

/**
 * 03.10 (1-band): bildirishnomadagi "Qarz bo'yicha shikoyat" -> "Qarzga o'tish".
 * Bildirishnomada faqat QARZ id (`sh_qarz_id`) bor, amaliyot id yo'q. Shu bois
 * qarz tafsiloti (tranzaksiyalari, mijozi va do'koni bilan) so'raladi va
 * qarzni YARATGAN amaliyot ("Qarz berildi" / olingan qarzda "Qarz olindi")
 * tanlanadi — `creationParams` bilan AYNAN bir xil qoida.
 * Qarz topilmasa / so'rov yiqilsa — null (chaqiruvchi xabar ko'rsatadi).
 */
export const fetchCreationParams = async (
  qarzId: number | string,
): Promise<(AmaliyotParams & { mijoz?: AnyObj }) | null> => {
  if (!qarzId) return null;
  try {
    const { data } = await axios.get(`${URL}/qarz-daftari/qarz/${qarzId}`, {
      headers: { Authorization: `Bearer ${storage.getString('token')}` },
    });
    const full: AnyObj = data?.data || {};
    const { tranzaksiyalar, tolovlar, ...qarz } = full;
    if (!qarz?.id) return null;
    const turi = qarz?.turi === 'olish' ? 'olish' : 'berish';
    return { ...creationParams(qarz, tranzaksiyalar, turi), mijoz: qarz?.mijoz || undefined };
  } catch (e) {
    return null;
  }
};

/**
 * Kalendar varag'idagi amaliyot (faqat id/qarz_id/turi/summa/vaqt bor) →
 * to'liq `{ tx, qarz }`. Qarz tafsiloti (tranzaksiyalari va "kim bajargan"
 * telefoni bilan) so'raladi. So'rov yiqilsa ham ekran ochiladi — varaqdagi
 * ma'lumotning o'zi bilan (asosiy qiymatlar: tur, summa, sana).
 */
export const fetchTxParams = async (row: AnyObj): Promise<AmaliyotParams> => {
  const fallback: AmaliyotParams = {
    tx: {
      id: row?.id,
      qarz_id: row?.qarz_id,
      turi: row?.turi,
      summa: row?.summa,
      valyuta: row?.valyuta,
      izoh: row?.izoh || null,
      created_at: row?.vaqt,
    },
    qarz: {
      id: row?.qarz_id,
      status: row?.qarz_status,
      qoldiq: row?.qoldiq,
      valyuta: row?.valyuta,
    },
  };
  try {
    const { data } = await axios.get(`${URL}/qarz-daftari/qarz/${row?.qarz_id}`, {
      headers: { Authorization: `Bearer ${storage.getString('token')}` },
    });
    const full: AnyObj = data?.data || {};
    const { tranzaksiyalar, tolovlar, ...qarz } = full;
    const tx = (Array.isArray(tranzaksiyalar) ? tranzaksiyalar : []).find(
      (t: AnyObj) => Number(t?.id) === Number(row?.id),
    );
    if (!tx || !qarz?.id) return fallback;
    return { tx, qarz };
  } catch (e) {
    return fallback;
  }
};
