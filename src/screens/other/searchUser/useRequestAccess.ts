import { useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { t } from 'i18next';
import { URL } from '../../constants';
import { storage } from '../../../store/api/token/getToken';

/** Topilgan foydalanuvchidan "ma'lumotlarini ko'rishga ruxsat" so'rash (POST /notification/reqquest). */
export function useRequestAccess(user: any, navigation: any) {
  const userInfo = useSelector((state: any) => state.HomeReducer);

  const [active, setActive] = useState(false);
  const [first, setFirst] = useState(false);

  const [resolve, setResolve] = useState(false);
  const [reject, setReject] = useState(false);
  const [, setCheck] = useState(true);

  const startTimer = async () => {
    const token = storage.getString('token');
    const obj = {
      creditor: userInfo?.user?.data?.id,
      debitor: userInfo?.user?.data?.id,
      reciver: user?.id,
    };
    setActive(true);
    setFirst(true);
    setCheck(false);
    setReject(false);
    setResolve(false);

    try {
      const { status } = await axios.post(URL + '/notification/reqquest', obj, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Toast.show({
        autoHide: true,
        position: 'bottom',
        visibilityTime: 2000,
        type: 'omad',
        // "Muvaffaqiyatli bajarildi" sarlavhasi OLIB TASHLANDI — desc bold chiqadi.
        props: { desc: t('228') },
      });
      if (status === 201) {
        setTimeout(() => {
          navigation.reset({
            routes: [{ name: 'BottomTabNavigator' }],
            index: 0,
          });
        }, 2000);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return { active, resolve, reject, requestDisabled: active && first, startTimer };
}
