import React from 'react';
import axios from 'axios';
import { URL } from '../../../constants';
import { storage } from '../../../../store/api/token/getToken';
import { isOnline } from '../../../../offline/netStatus';
import { Kun } from './kalendarLogic';

/** Kalendar oyi: GET /qarz-daftari/kalendar, oy/valyuta/kun tanlovi, oy/hafta/kun jamlari. */
export function useKalendarData() {
  const now = React.useMemo(() => new Date(), []);
  const [m, setM] = React.useState(now.getMonth() + 1);
  const [y, setY] = React.useState(now.getFullYear());
  const [cur, setCur] = React.useState<'UZS' | 'USD'>('UZS');
  const [selDay, setSelDay] = React.useState<number | null>(null);
  const [rows, setRows] = React.useState<Kun[]>([]);
  // 24.10: kalendar onlayn-only (keshlanmaydi) — oflaynda bo'sh oy EMAS, aniq izoh.
  const [offlineErr, setOfflineErr] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await axios.get(
          `${URL}/qarz-daftari/kalendar?year=${y}&month=${m}&valyuta=${cur}`,
          { headers: { Authorization: `Bearer ${storage.getString('token')}` } },
        );
        if (alive && Array.isArray(data?.data?.daily)) setRows(data.data.daily);
        else if (alive) setRows([]);
        if (alive) setOfflineErr(false);
      } catch (e: any) {
        // Kalendar yuklanmasa sahifaning qolgani ishlayveradi.
        if (alive) {
          setRows([]);
          // Javobsiz yiqildi (tarmoq yo'q) — oflayn izohi.
          setOfflineErr(!e?.response || !isOnline());
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [y, m, cur]);

  const changeMonth = (delta: number) => {
    let nm = m + delta;
    let ny = y;
    if (nm < 1) {
      nm = 12;
      ny -= 1;
    } else if (nm > 12) {
      nm = 1;
      ny += 1;
    }
    setSelDay(null);
    setM(nm);
    setY(ny);
  };

  const daysInMonth = new Date(y, m, 0).getDate();
  /** kun -> qiymatlar (bo'sh kunlar 0). */
  const byDay = React.useMemo(() => {
    const map: Record<number, Kun> = {};
    for (const r of rows) map[r.kun] = r;
    return map;
  }, [rows]);

  const maxBer = Math.max(
    1,
    ...Array.from({ length: daysInMonth }, (_, i) => byDay[i + 1]?.berilgan || 0),
  );
  const firstDow = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Dushanba = 0
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const totBer = rows.reduce((s, r) => s + r.berilgan, 0);
  const totUnd = rows.reduce((s, r) => s + r.undirilgan, 0);

  /**
   * 1 HAFTA: tanlangan kun (yoki bugun) tushgan Du–Ya oralig'i.
   * So'rovda "1 kunda, 1 haftada va 1 oyda" deyilgan — uchalasi ham chiqadi.
   */
  const bazaKun =
    selDay != null
      ? selDay
      : y === now.getFullYear() && m === now.getMonth() + 1
      ? now.getDate()
      : 1;
  const dow = (new Date(y, m - 1, bazaKun).getDay() + 6) % 7;
  const haftaBosh = Math.max(1, bazaKun - dow);
  const haftaOxir = Math.min(daysInMonth, haftaBosh + 6);
  let haftaBer = 0;
  let haftaUnd = 0;
  for (let d = haftaBosh; d <= haftaOxir; d++) {
    haftaBer += byDay[d]?.berilgan || 0;
    haftaUnd += byDay[d]?.undirilgan || 0;
  }

  const kunBer = byDay[bazaKun]?.berilgan || 0;
  const kunUnd = byDay[bazaKun]?.undirilgan || 0;

  return {
    m, y, cur, setCur, selDay, setSelDay, offlineErr, changeMonth, daysInMonth, byDay, maxBer, cells,
    totBer, totUnd, bazaKun, haftaBosh, haftaOxir, haftaBer, haftaUnd, kunBer, kunUnd,
  };
}
