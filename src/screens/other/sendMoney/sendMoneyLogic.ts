import { t } from 'i18next';

// type=4 (mobil hisob amaliyoti) — `pay` bo'yicha ajratiladi (so'rov SS12/14):
//   pay='Balance'    -> tarif balansdan sotib olindi (chiqim)
//   pay='BalanceSms' -> SMS paket balansdan sotib olindi (chiqim)
//   aks holda        -> "Mobil hisobni to'ldirish" (kirim, t('602'))
export const isType4Tariff = (item: any) =>
  ['Balance', 'BalanceSms'].includes(String(item?.pay || ''));
// Ro'yxat yorlig'i (Kirim-chiqim satrida).
export const type4ListLabel = (item: any) => {
  const pay = String(item?.pay || '');
  if (pay === 'Balance') return t('Yangi tarifga ulanish');
  if (pay === 'BalanceSms') return t('SMS paket xarid qilish');
  return t('602');
};
// Modal sarlavhasi (tafsilot oynasida).
export const type4Title = (item: any) => {
  const pay = String(item?.pay || '');
  if (pay === 'Balance') return t('Tarifga ulanish');
  if (pay === 'BalanceSms') return t('SMS paket xaridi');
  return t('602');
};

// SS-PERF (2026-09-25): barqaror kalit (ilgari `Math.round(Math.random)` = NaN edi).
export const keyExtractor = (item: any, index: number) => item?.id?.toString() ?? String(index);

/** PDF fayl nomi (kengaytmasiz): tur bo'yicha, til (uz / kr / boshqa=ru) bo'yicha. */
export function receiptBaseName(lang: string, type: any, id: any): string {
  const sid = String(id);
  const pick = (uz: string, kr: string, ru: string) => (lang === 'uz' ? uz : lang === 'kr' ? kr : ru);
  switch (type) {
    case 2:
    case 3:
      return pick(`O‘tkazma_${sid}`, `Ўтказма_${sid}`, `Перевод_${sid}`);
    case 4:
      return pick(`Hisobni to‘ldirish_${sid}`, `Хисобни тўлдириш_${sid}`, `Пополнение счет_${sid}`);
    case 5:
      return pick(`Bekor_qilingan_to‘lov_${sid}`, `Бекор қилинган тўлов_${sid}`, `Отмененный платеж_${sid}`);
    default:
      return pick(`Komissiya_${sid}`, `Комиссия_${sid}`, `Комиссия_${sid}`);
  }
}

/** Tafsilot oynasi sarlavhasi. */
export const receiptTitle = (data: any): string => {
  switch (data?.type) {
    case 2:
      return t('642');
    case 3:
      return t('642');
    case 4:
      return type4Title(data); // tarif/SMS balansdan -> "Tarifga ulanish"/"SMS paket xaridi"
    case 1:
      return t('654');
    case 5:
      return t('876');
    default:
      return t('654');
  }
};
