import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { t } from 'i18next';
import { storage } from '../../../store/api/token/getToken';
import { URL } from '../../constants';
import { toastMessage } from '../../../helper';
import socketService from '../../../helper/socketService';
import { useApiAction } from '../../../hooks/useApiAction';
import { useOfertaGuard } from '../../../hooks/useOfertaGuard';
import { filter_notification } from '../../../store/reducers/HomeReducer';
import { classifySmsResendError, SmsResendOutcome } from './smsResendError';
import { getCreditorDataAndDebitorData, getNotificationWithPage, HomeApi } from '../../../store/api/home';
import {
  classifyContractActionError,
  contractActionErrorToast,
} from '../../../helper/contractActionError';
import {
  signAndSend,
  signDate,
  signMoney,
  SignPayload,
  SignPurpose,
  SignSummary,
} from '../../../helper/sign/signFlow';
import ReturnName from '../../../helper/returnName';

/**
 * 07.11: tasdiqlash (stype 1) — elektron imzo (bir martalik kod) bilan; rad etish (stype 2) — kodsiz, avvalgidek.
 * `null` — foydalanuvchi imzo oynasini yopdi (yoki imzo yakuniy rad etildi): hech narsa qilinmaydi.
 */
const sendMaybeSigned = <T,>(
  signed: boolean,
  purpose: SignPurpose,
  item: any,
  summary: Omit<SignSummary, 'lender' | 'borrower' | 'number'>,
  send: (sign?: SignPayload) => Promise<T>,
): Promise<T | null> =>
  signed
    ? signAndSend({
        purpose,
        target: { contract: item?.contract, act: item?.act ?? undefined, notification: item?.id },
        summary: {
          number: item?.number,
          lender: ReturnName.returnDebitorName(item) || undefined,
          borrower: ReturnName.returnCreditorName(item) || undefined,
          ...summary,
        },
        send: sign => send(sign),
      })
    : send(undefined);
const withSign = (obj: any, sign?: SignPayload) => (sign ? { ...obj, sign } : obj);

type ObjType = {
  act: string;
  contract: string;
  creditor: string;
  debitor: string;
  reciver: string;
  stype: number;
  sender?: string;
  res?: string;
};

/** Bildirishnoma amallari: o'chirish (okay), shartnomani tasdiqlash/rad etish, qaytarish va muddat uzaytirish; oferta qo'riqchisi bilan. */
export function useNotificationActions() {
  const dispatch = useDispatch<any>();
  const user = useSelector((state: any) => state?.HomeReducer?.user);

  // BITTA umumiy runner, kalit = karta id: bir kartadagi barcha qarorlar (okay/tasdiq/rad/qaytarish/uzaytirish)
  // bir-birini istisno qiladi; boshqa karta bloklanmaydi.
  const { run: runCard } = useApiAction();

  /**
   * 07.11: shartnoma amali xatosi (rol: only-lender / creator-cannot-approve, 409 already-processed, akt/tur mos
   * emas ...) — aniq, tarjima qilingan toast. Bildirishnoma eskirgan bo'lsa karta olinadi va ro'yxat serverdan
   * yangilanadi; `resync` — karta optimistik olingan (rad etish) bo'lsa ham ro'yxat qayta tortiladi (karta qaytadi).
   */
  const failAction = useCallback(
    (item: any, error: unknown, fallbackKey: string, resync = false) => {
      const failure = classifyContractActionError(error, fallbackKey);
      const toast = contractActionErrorToast(failure, 3000);
      if (toast) Toast.show(toast);
      if (failure.stale) dispatch(filter_notification(item?.id));
      if (failure.stale || resync) dispatch((getNotificationWithPage as any)({ page: 1 }));
    },
    [dispatch],
  );

  // Notoficationni o'chirish
  const okay = useCallback(
    (idx, type) =>
      runCard(async () => {
        const token = storage.getString('token');
        try {
          dispatch(filter_notification(idx));
          const info = await axios.put(
            URL + `/notification/ok/${idx}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (info?.status === 200) {
            socketService.emit('notification', { userId: user?.data?.id });
            // socketService.on('notification', data => {
            //   console.log('socket in notifcation', data);
            //   dispatch(setNotification({notification: data.not}));
            //   // dispatch(getNotifications({page: 1}));
            // });

            Toast.show({
              autoHide: true,
              position: 'bottom',
              props: { desc: toastMessage(type) },
              type: 'omad',
              visibilityTime: 2000,
            });
          }
        } catch (error) {
          Toast.show({
            autoHide: true,
            position: 'bottom',
            props: { desc: t('Xatolik sodir bo‘ldi') },
            type: 'error2',
            visibilityTime: 2000,
          });
        }
      }, { key: idx }),
    // C-020: `user` qo'shildi — oldin `[dispatch]` edi, lekin user?.data?.id o'qiladi.
    // user yangilansa (login/meee) stale qiymat socketga yuborilardi.
    [user, dispatch, runCard],
  );
  const onSuccess = useCallback((item, status, type) => runCard(async () => {
      const token = storage.getString('token');

      const onAsk = async () => {
        const obj: ObjType = {
          act: '',
          contract: '',
          creditor: '',
          debitor: '',
          reciver: '',
          stype: 0,
        };

        if (type === 'creditor') {
          obj.act = item.act;
          obj.contract = item.contract;
          obj.creditor = item.creditor;
          obj.debitor = item.debitor;
          obj.reciver = item.creditor;
          obj.stype = status;
          obj.sender =
            user?.data?.id === item.debitor ? item.creditor : item.debitor;
          obj.res = user?.data?.id;
        } else {
          obj.act = item.act;
          obj.contract = item.contract;
          obj.creditor = item.creditor;
          obj.debitor = item.debitor;
          obj.reciver = item.debitor;
          obj.stype = status;
        }

        try {
          const res = await sendMaybeSigned(
            Number(status) === 1,
            'contract_approve',
            { ...item, act: undefined },
            {
              docType: t('Qarz shartnomasi'),
              amount: signMoney(item.amount),
              currency: item.currency,
              dueDate: signDate(item.end_date),
            },
            sign =>
              axios.put(URL + `/notification/success/${item.id}`, withSign(obj, sign), {
                headers: { Authorization: `Bearer ${token}` },
              }),
          );
          if (!res) return; // imzo oynasi yopildi
          const { data } = res;

          if (data.success) {
            Toast.show({
              autoHide: true,
              position: 'bottom',
              props: {
                desc: t('264'),
              },
              type: 'omad',
              visibilityTime: 3000,
            });

            // socketService.sendNotification({
            //   id: type === 'debitor' ? item.debitor : item.creditor,
            // });
            // socketService.on('notification', data => {
            //   dispatch(setNotification({notification: data.not}));
            //   dispatch(getMe());
            // });

            dispatch(getCreditorDataAndDebitorData());
            dispatch(filter_notification(item.id));
          }
        } catch (error) {
          // 07.11: creator-cannot-approve / notification-type-mismatch / already-processed — aniq matn.
          failAction(item, error, '294');
          // SS-AUDIT (2026-09-25): to'liq axios xatosi (config.headers.Authorization —
          // token!) logga yozilmasin, faqat xabar.
          console.error('notification ask error:', (error as any)?.message);
        }
      };

      try {
        await onAsk();
      } catch (error) {
        console.error('notification ask error:', (error as any)?.message);
        Toast.show({
          autoHide: true,
          position: 'bottom',
          props: {
            desc: t('294'),
          },
          type: 'error2',
          visibilityTime: 3000,
        });
      }
      // C-020: `user` qo'shildi — oldin `[]` edi, lekin onAsk ichida user?.data?.id
      // `sender`/`res` (moliyaviy) uchun o'qiladi. Stale user → noto'g'ri qarz amali.
  }, { key: item.id }), [user, dispatch, runCard, failAction]);
  const onReject = useCallback(
    (item, status, type) =>
      runCard(async () => {
        const token = storage.getString('token');
        dispatch(filter_notification(item.id));
        let obj;
        if (type === 1) {
          obj = {
            debitor: item.debitor,
            creditor: item.creditor,
            act: item.act,
            contract: item.contract,
            stype: status,
            reciver: item.creditor,
            sender: user.data.id == item.debitor ? item.creditor : item.debitor,
            res: user.data.id,
          };
        }
        if (type === 2) {
          obj = {
            debitor: item.debitor,
            creditor: item.creditor,
            act: item.act,
            contract: item.contract,
            stype: status,
            reciver: item.debitor,
          };
        }

        try {
          const { data } = await axios.put(
            URL + `/notification/success/${item.id}`,
            obj,
            // {
            //   // act: item.act,
            //   // contract: item.contract,
            //   // creditor: item.creditor,
            //   // debitor: item.debitor,
            //   // // reciver: type === 'creditor' ? item.creditor : item.debitor,
            //   // reciver: item.creditor,
            //   // stype: status,
            //   // sender:
            //   //   user?.data?.id === item.debitor ? item.creditor : item.debitor,
            //   // res: user?.data?.id,
            // },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (data.success) {
            Toast.show({
              autoHide: true,
              position: 'bottom',
              props: { desc: t('261') },
              type: 'error2',
              visibilityTime: 3000,
            });
          }
          // socketService.emit('notification', {userId: user?.data?.id});
          // socketService.sendNotification({
          //   id: type === 'creditor' ? item.creditor : item.debitor,
          // });
        } catch (error) {
          // Karta yuqorida optimistik olingan — rad muvaffaqiyatsiz bo'lsa ro'yxat serverdan qayta tortiladi.
          failAction(item, error, 'Xatolik sodir bo‘ldi', true);
        }
      }, { key: item.id }),
    [user, dispatch, runCard, failAction],
  );
  const onQismanQaytarilgan = (item, status) =>
    runCard(async () => {
      const token = storage.getString('token');

      try {
        const body = {
          act: item.act,
          contract: item.contract,
          creditor: item.creditor,
          debitor: item.debitor,
          reciver: item.reciver === item.debitor ? item.creditor : item.debitor,
          stype: status,
        };
        const res = await sendMaybeSigned(
          Number(status) === 1,
          'repayment_confirm',
          item,
          {
            docType: t('Qarzni qisman qaytarishni tasdiqlash'),
            amount: signMoney(item.refundable_amount),
            currency: item.currency,
          },
          sign =>
            axios.post(URL + `/notification/qisman-qaytarish/${item.id}`, withSign(body, sign), {
              headers: { Authorization: `Bearer ${token}` },
            }),
        );
        if (!res) return; // imzo oynasi yopildi
        const { data } = res;
        if (data.success) {
          Toast.show({
            autoHide: true,
            position: 'bottom',
            props: {
              desc: status === 1 ? t('264') : t('261'),
            },
            type: status === 1 ? 'omad' : 'error2',
            visibilityTime: 3000,
          });
          dispatch(filter_notification(item.id));
        }
        // socketService.sendNotification({
        //   id: item.reciver === item.debitor ? item.creditor : item.debitor,
        // });
      } catch (error) {
        // 07.11: only-lender / already-processed (409) / act-type-mismatch ... — aniq matn; eskirgan karta olinadi.
        failAction(item, error, 'Xatolik sodir bo‘ldi');
      }
    }, { key: item.id });
  const onToliqQaytgan = (item, status) =>
    runCard(async () => {
      const token = storage.getString('token');

      try {
        const body = {
          act: item.act,
          contract: item.contract,
          creditor: item.creditor,
          debitor: item.debitor,
          reciver: item.reciver === item.debitor ? item.creditor : item.debitor,
          stype: status,
        };
        const res = await sendMaybeSigned(
          Number(status) === 1,
          'repayment_confirm',
          item,
          {
            docType: t('Qarzni to‘liq qaytarishni tasdiqlash'),
            amount: signMoney(item.refundable_amount),
            currency: item.currency,
          },
          sign =>
            axios.post(URL + `/notification/toliq-qaytarish/${item.id}`, withSign(body, sign), {
              headers: { Authorization: `Bearer ${token}` },
            }),
        );
        if (!res) return; // imzo oynasi yopildi
        const { data } = res;

        if (data.success) {
          Toast.show({
            autoHide: true,
            position: 'bottom',
            props: {
              desc: status === 1 ? t('264') : t('261'),
            },
            type: status === 1 ? 'omad' : 'error2',
            visibilityTime: 3000,
          });
          dispatch(filter_notification(item.id));
          dispatch(HomeApi({ page: 1 }));
        }
        // socketService.sendNotification({
        //   id: item.reciver === item.debitor ? item.creditor : item.debitor,
        // });
      } catch (error) {
        // 07.11: only-lender / already-processed (409) / act-type-mismatch ... — aniq matn; eskirgan karta olinadi.
        failAction(item, error, 'Xatolik sodir bo‘ldi');
      }
    }, { key: item.id });
  const onQarzMuddatUzaytirish = (item, status) =>
    runCard(async () => {
      const token = storage.getString('token');

      try {
        const body = {
          debitor: item.debitor,
          creditor: item.creditor,
          contract: item.contract,
          stype: status,
          act: item.act,
          reciver: item.reciver !== item.debitor ? item.debitor : item.creditor,
        };
        const info = await sendMaybeSigned(
          Number(status) === 1,
          'time_confirm',
          item,
          {
            docType: t('Qarz muddatini uzaytirishni tasdiqlash'),
            amount: signMoney(item.residual_amount),
            currency: item.currency,
            dueDate: signDate(item.end_date),
          },
          sign =>
            axios.post(URL + `/notification/time/${item.id}`, withSign(body, sign), {
              headers: { Authorization: `Bearer ${token}` },
            }),
        );
        if (!info) return; // imzo oynasi yopildi

        if (info.data.success) {
          if (status == 1) {
            Toast.show({
              autoHide: true,
              position: 'bottom',
              props: { desc: t('264') },
              type: 'omad',
              visibilityTime: 3000,
            });
          }
          if (status == 2) {
            Toast.show({
              autoHide: true,
              position: 'bottom',
              props: { desc: t('261') },
              type: 'error2',
              visibilityTime: 3000,
            });
          }

          dispatch(filter_notification(item.id));
          dispatch(getCreditorDataAndDebitorData());

          // socketService.sendNotification({
          //   id: item.reciver !== item.debitor ? item.debitor : item.creditor,
          // });
          // socketService.emit('notification', user?.data?.id);
          // socketService.on('notification', data => {
          //   dispatch(setNotification({notification: data.not}));
          // });
        }
      } catch (error) {
        // 07.11: only-lender / already-processed (409) / act-type-mismatch ... — aniq matn; eskirgan karta olinadi.
        failAction(item, error, 'Xatolik sodir bo‘ldi');
      }
    }, { key: item.id });

  /**
   * SS-DEV (2026-09-29, 29.09 doc2 3-rasm): bildirishnomadagi QARZ SHARTNOMASI
   * amallari (shartnomani TASDIQLASH, qaytarishni qabul qilish, muddat
   * uzaytirish) — ommaviy oferta shart. Tasdiqlanmagan bo'lsa oferta oynasi
   * ochiladi, tasdiqlangach amal davom etadi. Rad etish / "Ok" — ochiq
   * (backend `requireOfertaWhen(stype===1)` bilan bir xil qoida).
   */
  const guardOferta = useOfertaGuard();
  const onSuccessG = (item: any, status: any, type: any) =>
    String(status) === '1'
      ? guardOferta(() => { onSuccess(item, status, type); })
      : onSuccess(item, status, type);
  const onToliqQaytganG = (item: any, status: any) =>
    guardOferta(() => { onToliqQaytgan(item, status); });
  const onQismanQaytarilganG = (item: any, status: any) =>
    guardOferta(() => { onQismanQaytarilgan(item, status); });
  const onQarzMuddatUzaytirishG = (item: any, status: any) =>
    guardOferta(() => { onQarzMuddatUzaytirish(item, status); });

  // 01.11: type 49 (SMS yetkazilmadi) — kartani ro'yxatdan olish + serverdan o'chirish (PUT /ok). Xato JIM:
  // navigatsiyani bloklamaydi, toast yo'q (server 15 kunda o'zi o'chiradi). runCard'siz — resend ichidan ham chaqiriladi.
  const markSmsUndeliveredSeen = useCallback(
    async (id: any) => {
      dispatch(filter_notification(id));
      try {
        const token = storage.getString('token');
        await axios.put(URL + `/notification/ok/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
        socketService.emit('notification', { userId: user?.data?.id });
      } catch {
        // jim
      }
    },
    [user, dispatch],
  );
  // «Qarzga o'tish» / qarz topilmadi: karta kaliti = id (boshqa kartalar bloklanmaydi).
  const smsUndeliveredSeen = useCallback(
    (id: any) => runCard(() => markSmsUndeliveredSeen(id), { key: id }),
    [runCard, markSmsUndeliveredSeen],
  );

  // 01.11: «Qayta yuborish» — POST /notification/sms-undelivered/:id/resend. Natija: 'done' (yuborildi yoki
  // yana yetkazilmadi — eski bildirishnoma serverda o'chdi) | 'removed' (karta olib tashlandi, xato) | 'kept'.
  const smsResend = useCallback(
    (id: any) =>
      runCard(async (): Promise<SmsResendOutcome> => {
        const token = storage.getString('token');
        try {
          const { data } = await axios.post(
            URL + `/notification/sms-undelivered/${id}/resend`,
            undefined,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          dispatch(filter_notification(id));
          Toast.show({
            autoHide: true,
            position: 'bottom',
            props: {
              desc: data?.renotified
                ? t('SMS qayta yuborildi, lekin yana yetkazilmadi')
                : t('SMS qayta yuborildi'),
            },
            type: 'omad',
            visibilityTime: 2000,
          });
          socketService.emit('notification', { userId: user?.data?.id });
          return 'done';
        } catch (error) {
          const failure = classifySmsResendError(error);
          // Bildirishnoma ma'nosiz (qarz yo'q/yopilgan, allaqachon yuborilgan): qurilmadan ham, serverdan ham o'chadi.
          if (failure.remove) void markSmsUndeliveredSeen(id);
          Toast.show({
            autoHide: true,
            position: 'bottom',
            props: { desc: failure.message },
            type: 'error2',
            visibilityTime: 2500,
          });
          return failure.remove ? 'removed' : 'kept';
        }
      }, { key: id }),
    [user, dispatch, runCard, markSmsUndeliveredSeen],
  );

  return {
    okay,
    onReject,
    onSuccessG,
    onToliqQaytganG,
    onQismanQaytarilganG,
    onQarzMuddatUzaytirishG,
    smsUndeliveredSeen,
    smsResend,
  };
}
