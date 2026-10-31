/**
 * useOfertaSource.ts — oferta PDF manbai: server nusxasi (prefetch / yuklab olish) → ilova ichidagi zaxira → xato +
 * "Qayta urinish" (ContractModal.tsx dan ko'chirilgan, xulq o'zgarmagan). Tarix: SS-DEV (2026-10-04, 2026-10-06 1(a)).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { PDF_OFERTA_URL } from '../../../constants';
import { bundledOfertaSource } from '../../../../helper/ofertaBundled';
import {
  downloadOfertaPdf, ofertaDocLang, ofertaPdfUrl, removeOfertaFile, takePrefetchedOferta,
} from '../../../../helper/ofertaPdf';
import { storage } from '../../../../store/api/token/getToken';
import { canSwapToRemote, DocSource, FALLBACK_MS, nowMs } from './ofertaLogic';
import type { OfertaReadGate } from './useOfertaReadGate';

export const useOfertaSource = (
  contract: boolean,
  uid: any,
  gate: OfertaReadGate,
  setPdfErr: (v: boolean) => void,
) => {
  const { check, resetGate, clearTimers, loadedAtRef, maxPageRef, reachedRef, fallbackTimerRef } = gate;
  const [reloadKey, setReloadKey] = useState(0);
  // SS-DEV (2026-10-04): hujjat manbai (server → zaxira) va uning sinxron nusxasi.
  const [docSrc, setDocSrc] = useState<DocSource>({ kind: 'loading' });
  const docSrcRef = useRef<DocSource>({ kind: 'loading' });
  const loadSeqRef = useRef(0);
  const dlTaskRef = useRef<any>(null);
  const setSource = useCallback((s: DocSource) => {
    docSrcRef.current = s;
    setDocSrc(s);
  }, []);

  /**
   * SS-DEV (2026-10-04): server nusxasi ochilmasa (buzuq fayl / native xato / hodisa kelmadi) — ilova ichidagi
   * zaxira PDF. Zaxira ham ochilmasa — oxirgi chora sifatida xato + "Qayta urinish".
   */
  const onDocFailed = useCallback(() => {
    const cur = docSrcRef.current;
    if (cur.kind === 'remote') {
      removeOfertaFile(cur.path);
      setSource({ kind: 'bundled' });
      return;
    }
    if (cur.kind === 'bundled') setPdfErr(true);
  }, [setSource, setPdfErr]);

  /**
   * 27.09 (1-band): "hodisa yo'q" kuzatuvchisi. FALLBACK_MS davomida onLoadComplete/onPageChanged kelmasa —
   * darvoza OCHILMAYDI: server nusxasi → zaxira (onDocFailed); zaxira ham bo'lmasa xato oynasi.
   */
  const armNoEventTimer = useCallback(() => {
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = setTimeout(() => {
      fallbackTimerRef.current = null;
      if (loadedAtRef.current) return;
      onDocFailed();
    }, FALLBACK_MS);
  }, [onDocFailed, fallbackTimerRef, loadedAtRef]);

  // Hujjat tili sayt bilan bir xil (en/kaa → uz). uid hali yo'q bo'lsa (`id=undefined` → 404) — darhol zaxira.
  const docLang = ofertaDocLang(storage.getString('lang'));
  const uidRef = useRef(uid);
  uidRef.current = uid;
  // SS-DEV (2026-10-06): rozilik belgisining sinxron nusxasi — server nusxasi kech kelganda zaxirani
  // almashtirish mumkinmi (foydalanuvchi hali o'qishni boshlamagan).
  const checkRef = useRef(false);
  checkRef.current = check;

  /**
   * SS-DEV (2026-10-04, 04.10 (1) 1-band): oyna ochilganda / "Qayta urinish"da hujjat (qayta) yuklanadi:
   * server (timeout 15 s, 2 qayta urinish, backoff) → bo'lmasa ilova ichidagi zaxira PDF.
   * SS-DEV (2026-10-06, 06.10 1(a)): prefetch TAYYOR bo'lsa darhol server nusxasi; aks holda DARHOL zaxira va
   * server nusxasi kelganda (hali 1-sahifada, belgisiz) almashtiriladi.
   */
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
          // 08.10: "oxirigacha o'qildi" holatiga yetilgan bo'lsa — almashtirilmaydi (almashtirish darvozani nollaydi).
          const untouched = canSwapToRemote({
            kind: docSrcRef.current.kind,
            maxPage: maxPageRef.current,
            reached: reachedRef.current,
            checked: checkRef.current,
          });
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
  }, [contract, reloadKey, docLang, resetGate, setSource, setPdfErr, maxPageRef, reachedRef]);

  // Manba tayyor bo'lganda: darvoza nollanadi va "hodisa yo'q" kuzatuvchisi ishga tushadi (chizish bosqichi).
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

  const retry = () => {
    setPdfErr(false);
    // SS-DEV (2026-09-24): reloadKey o'zgarishi useEffect orqali darvozani to'liq nollaydi (server → zaxira qaytadan).
    setReloadKey(k => k + 1);
  };

  return { reloadKey, docSrc, pdfSource, onDocFailed, retry };
};
export type OfertaSource = ReturnType<typeof useOfertaSource>;
