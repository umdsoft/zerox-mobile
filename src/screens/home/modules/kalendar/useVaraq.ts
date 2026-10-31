import React from 'react';
import axios from 'axios';
import { URL } from '../../../constants';
import { storage } from '../../../../store/api/token/getToken';
import { useApiAction } from '../../../../hooks/useApiAction';
import { fetchTxParams } from '../qarzAmaliyot';
import { dateKey, KunAmal, MONTHS, Varaq } from './kalendarLogic';

interface VaraqArgs {
  y: number;
  m: number;
  cur: 'UZS' | 'USD';
  bazaKun: number;
  haftaBosh: number;
  haftaOxir: number;
  t: (k: string) => string;
  navigation: any;
}

/** Kun / hafta tafsilot varag'i: /kalendar/kun so'rovlari (eski javob e'tiborsiz), amaliyot tafsilotiga o'tish. */
export function useVaraq({ y, m, cur, bazaKun, haftaBosh, haftaOxir, t, navigation }: VaraqArgs) {
  // SS-DEV (2026-09-24): kun/hafta tafsilot varag'i.
  const [varaq, setVaraq] = React.useState<Varaq | null>(null);
  const [varaqLoading, setVaraqLoading] = React.useState(false);
  const [varaqErr, setVaraqErr] = React.useState(false);
  const [varaqBer, setVaraqBer] = React.useState<KunAmal[]>([]);
  const [varaqUnd, setVaraqUnd] = React.useState<KunAmal[]>([]);
  const varaqReq = React.useRef(0);

  /**
   * SS-DEV (2026-09-24): kun/hafta varag'ini ochish — sanalar ro'yxati
   * bo'yicha /kalendar/kun parallel so'raladi, natija birlashtiriladi.
   * `varaqReq` — kech kelgan eski javob yangisini bosib ketmasin.
   */
  const openVaraq = React.useCallback(
    async (turi: 'kun' | 'hafta') => {
      const dates =
        turi === 'kun'
          ? [dateKey(y, m, bazaKun)]
          : Array.from({ length: haftaOxir - haftaBosh + 1 }, (_, i) =>
              dateKey(y, m, haftaBosh + i),
            );
      const title =
        turi === 'kun'
          ? `${bazaKun}-${t(MONTHS[m - 1])} ${y}`
          : `${t('Hafta')}: ${haftaBosh}–${haftaOxir} ${t(MONTHS[m - 1])} ${y}`;
      const reqId = ++varaqReq.current;
      setVaraq({ turi, title, dates });
      setVaraqBer([]);
      setVaraqUnd([]);
      setVaraqErr(false);
      setVaraqLoading(true);
      try {
        const token = storage.getString('token');
        const res = await Promise.all(
          dates.map(d =>
            axios.get(`${URL}/qarz-daftari/kalendar/kun?date=${d}&valyuta=${cur}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ),
        );
        if (reqId !== varaqReq.current) return;
        const ber: KunAmal[] = [];
        const und: KunAmal[] = [];
        res.forEach((r, i) => {
          const d = r?.data?.data || {};
          (Array.isArray(d.berilgan) ? d.berilgan : []).forEach((x: any) =>
            ber.push({ ...x, _date: dates[i] }),
          );
          (Array.isArray(d.qaytarilgan) ? d.qaytarilgan : []).forEach((x: any) =>
            und.push({ ...x, _date: dates[i] }),
          );
        });
        // Vaqt bo'yicha o'sish tartibida (hafta ichida kunlar ketma-ket).
        const byVaqt = (a: KunAmal, b: KunAmal) =>
          String(a.vaqt || a._date).localeCompare(String(b.vaqt || b._date));
        ber.sort(byVaqt);
        und.sort(byVaqt);
        setVaraqBer(ber);
        setVaraqUnd(und);
      } catch (e) {
        if (reqId === varaqReq.current) setVaraqErr(true);
      } finally {
        if (reqId === varaqReq.current) setVaraqLoading(false);
      }
    },
    [y, m, cur, bazaKun, haftaBosh, haftaOxir, t],
  );

  const closeVaraq = React.useCallback(() => {
    varaqReq.current++;
    setVaraq(null);
    setVaraqLoading(false);
  }, []);

  /**
   * 28.09 (2-band): qator bosilsa "Qarz tafsiloti" EMAS — amaliyot turiga mos
   * "Amaliyot tafsiloti" (Qarz berildi / Qarz qaytarildi / Qarzdan voz kechildi)
   * ochiladi. Varaqda faqat qisqa ma'lumot bor, shu bois to'liq amaliyot qarz
   * tafsilotidan olinadi. `opening` — ikki marta bosilib ikki ekran ochilmasin.
   */
  const [opening, setOpening] = React.useState<number | null>(null);
  const { run: runOpen } = useApiAction();
  const goAmaliyot = React.useCallback(
    (r: KunAmal) => {
      if (!r?.qarz_id || opening != null) return;
      return runOpen(async () => {
        setOpening(r.id);
        try {
          const params = await fetchTxParams(r);
          closeVaraq();
          navigation.navigate('QarzDaftariAmaliyot', params);
        } finally {
          setOpening(null);
        }
      });
    },
    [navigation, closeVaraq, opening, runOpen],
  );

  const varaqJamiBer = varaqBer.reduce((s, r) => s + (Number(r.summa) || 0), 0);
  const varaqJamiUnd = varaqUnd.reduce((s, r) => s + (Number(r.summa) || 0), 0);

  return {
    varaq, varaqLoading, varaqErr, varaqBer, varaqUnd, openVaraq, closeVaraq, goAmaliyot, opening,
    varaqJamiBer, varaqJamiUnd,
  };
}
