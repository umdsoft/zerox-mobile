import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../../../helper/socketService';
import apiClient from '../../../store/api/apiClient';
import { getNotificationWithPage } from '../../../store/api/home';

/** Bildirishnomalar ro'yxati: yangilash (pull-to-refresh / jimgina), realtime socket va talab dalolatnomasini "tanishdi" deb belgilash. */
export function useNotificationFeed() {
  const dispatch = useDispatch<any>();
  const user = useSelector((state: any) => state?.HomeReducer?.user);
  const notificationData = useSelector((state: any) => state?.HomeReducer?.notification);
  const [loading, setLoading] = useState(false);

  const onRefresh = useCallback(() => {
    // Oldin `page <= pagination?.totalPage` gate'i bor edi; backend /me javobida pagination yo'q → totalPage 0 →
    // `1 <= 0` false → refresh HECH QACHON ishlamasdi. Gate olib tashlandi; async thunk reject'ini .unwrap() bilan ushlaymiz.
    setLoading(true);
    dispatch(getNotificationWithPage({ page: 1 }))
      .unwrap()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dispatch]);

  // Spinner KO'RSATMAY yangilash — real-time push kelganda ro'yxatni jimgina yangilaydi.
  const silentRefresh = useCallback(() => {
    dispatch(getNotificationWithPage({ page: 1 }))
      .unwrap()
      .catch(() => {});
  }, [dispatch]);

  // ITEM 9 — REAL-TIME bildirishnomalar (web ↔ mobil, refresh-siz). Ekran-darajali listener `recive_notification` kelishi
  // bilan serverdan eng so'nggi ro'yxatni KAFOLATLI tortib oladi. Ekrandan chiqilganda tozalanadi.
  useEffect(() => {
    // Ekran ochilishida bir marta yangilaymiz (Redux eskirgan bo'lishi mumkin).
    silentRefresh();

    const onLive = () => silentRefresh();
    socketService.on('recive_notification', onLive);

    // Ekran ochiq — realtime shart. Socket uzilgan bo'lsa qayta ulanamiz.
    const s = socketService.getSocket();
    if (s && !s.connected) {
      s.connect();
    }

    return () => {
      socketService.off('recive_notification', onLive);
    };
  }, [silentRefresh]);

  /**
   * SS-DEV (2026-09-26): talab dalolatnomasi (type 17) bilan TANISHUV — sayt (`pages/notification/index.vue`
   * `_ackDemandActs`) bilan bir xil xulq. Qarz oluvchi ekranni OCHGANDA (fokusda) `act && !act_ack_at` bo'lsa
   * `POST /contract/act/{act}/ack` → backend `acts.ack_at` yozadi. Idempotent; 403 `not-creditor` va 4xx — jim;
   * tarmoq/5xx xatosida keyingi fokusda qayta uriniladi.
   */
  const isFocused = useIsFocused();
  const ackedActsRef = useRef<Set<string>>(new Set());
  const bild = notificationData?.bild;
  const myId = user?.data?.id;
  useEffect(() => {
    if (!isFocused || !myId || !Array.isArray(bild)) return;
    bild.forEach((n: any) => {
      if (!n || Number(n.type) !== 17 || !n.act || n.act_ack_at) return;
      if (n.reciver != null && Number(n.reciver) !== Number(myId)) return;
      const key = String(n.act);
      if (ackedActsRef.current.has(key)) return;
      ackedActsRef.current.add(key);
      apiClient
        .post(`/contract/act/${encodeURIComponent(key)}/ack`, {})
        .catch((e: any) => {
          const st = e?.response?.status;
          if (!st || st >= 500) ackedActsRef.current.delete(key);
        });
    });
  }, [isFocused, bild, myId]);

  return { loading, onRefresh, bild };
}
