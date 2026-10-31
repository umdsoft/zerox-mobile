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
import { getCreditorDataAndDebitorData, HomeApi } from '../../../store/api/home';

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
          const { data } = await axios.put(
            URL + `/notification/success/${item.id}`,
            obj,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

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
          Toast.show({
            autoHide: true,
            position: 'bottom',
            props: {
              desc: t('294'),
            },
            type: 'error2',
            visibilityTime: 3000,
          });
          // SS-AUDIT (2026-09-25): to'liq axios xatosi (config.headers.Authorization —
          // token!) logga yozilmasin, faqat xabar.
          console.error('notification ask error:', error?.message);
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
  }, { key: item.id }), [user, dispatch, runCard]);
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
          Toast.show({
            autoHide: true,
            position: 'bottom',
            props: { desc: t('Xatolik sodir bo‘ldi') },
            type: 'error2',
            visibilityTime: 3000,
          });
        }
      }, { key: item.id }),
    [user, dispatch, runCard],
  );
  const onQismanQaytarilgan = (item, status) =>
    runCard(async () => {
      const token = storage.getString('token');

      try {
        const { data } = await axios.post(
          URL + `/notification/qisman-qaytarish/${item.id}`,
          {
            act: item.act,
            contract: item.contract,
            creditor: item.creditor,
            debitor: item.debitor,
            reciver: item.reciver === item.debitor ? item.creditor : item.debitor,
            stype: status,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
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
        Toast.show({
          autoHide: true,
          position: 'bottom',
          props: { desc: t('Xatolik sodir bo‘ldi') },
          type: 'error2',
          visibilityTime: 3000,
        });
      }
    }, { key: item.id });
  const onToliqQaytgan = (item, status) =>
    runCard(async () => {
      const token = storage.getString('token');

      try {
        const { data } = await axios.post(
          URL + `/notification/toliq-qaytarish/${item.id}`,
          {
            act: item.act,
            contract: item.contract,
            creditor: item.creditor,
            debitor: item.debitor,
            reciver: item.reciver === item.debitor ? item.creditor : item.debitor,
            stype: status,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

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
        Toast.show({
          autoHide: true,
          position: 'bottom',
          props: { desc: t('Xatolik sodir bo‘ldi') },
          type: 'error2',
          visibilityTime: 3000,
        });
      }
    }, { key: item.id });
  const onQarzMuddatUzaytirish = (item, status) =>
    runCard(async () => {
      const token = storage.getString('token');

      try {
        const info = await axios.post(
          URL + `/notification/time/${item.id}`,
          {
            debitor: item.debitor,
            creditor: item.creditor,
            contract: item.contract,
            stype: status,
            act: item.act,
            reciver: item.reciver !== item.debitor ? item.debitor : item.creditor,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

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
        Toast.show({
          autoHide: true,
          position: 'bottom',
          props: { desc: t('Xatolik sodir bo‘ldi') },
          type: 'error2',
          visibilityTime: 3000,
        });
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

  return { okay, onReject, onSuccessG, onToliqQaytganG, onQismanQaytarilganG, onQarzMuddatUzaytirishG };
}
