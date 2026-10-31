import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { t } from 'i18next';
import { URL } from '../../constants';
import { storage } from '../../../store/api/token/getToken';
import { birthPickerDefault } from '../../../helper/birthDate';
import { checkExpire } from '../../../store/reducers/HomeReducer';
import { expire_passport_check } from '../../../helper/timeChecker';
import { ACCENT_GIVE, ACCENT_TAKE, formatDate } from './searchUserLogic';

const TOAST_BASE = { autoHide: true, position: 'bottom' as const, visibilityTime: 3000, type: 'error2' };
// "Xatolik" sarlavhasi olib tashlandi -> desc bold (descStrong).
const showError = (desc: string) => Toast.show({ ...TOAST_BASE, props: { desc } });

/** SearchUserScreen holati: ID + tug'ilgan sana formasi, sana tanlagichni ochish, foydalanuvchini qidirish. */
export function useSearchUser() {
  // params yo'q holatda ham ishlasin (paramssiz navigatsiya crash bermasin). Default type: 1 (qarz berish tarmog'i).
  const { type = 1 } = (useRoute().params as { type?: number }) || {};
  // SS-PERF (2026-09-25): aniq selektor (butun slice emas — ortiqcha re-render yo'q).
  const user = useSelector((state: any) => state.HomeReducer.user);
  const navigation = useNavigation();
  const [data, setData] = useState<any>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchForm, setSearchForm] = useState(true);
  const [userID, setUserID] = useState('');
  const [open, setOpen] = useState(false);
  /**
   * SS-DEV (2026-10-06): tanlanmagan sana holati `null` (maydonda "kk.oo.yyyy"), tanlagich 18 yil oldingi sanadan
   * ochiladi. Backend'da yosh cheklovi yo'q — maksimum = bugun.
   */
  const [date, setDate] = useState<Date | null>(null);
  const pickerDefault = useMemo(() => birthPickerDefault(), []);
  const dispatch = useDispatch();
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
    },
    [],
  );
  /**
   * SS-DEV (2026-10-06, 06.10 2-band): ILDIZ — ID maydoni fokusda (klaviatura OCHIQ) turib sana maydoni bosilsa,
   * native dialog IME'ni yopib oynani kattalashtirar, dialog yopilgach fokus ID'ga qaytib klaviatura qayta ochilar
   * va kontent ikki marta sakrardi. Endi avval klaviatura yopiladi (Keyboard.dismiss), layout barqarorlashgach
   * (keyboardDidHide yoki 300 ms zaxira) tanlagich ochiladi.
   */
  const openDatePicker = useCallback(() => {
    if (openTimerRef.current) return;
    if (!Keyboard.isVisible()) {
      Keyboard.dismiss();
      setOpen(true);
      return;
    }
    let sub: { remove: () => void } | null = null;
    const go = () => {
      sub?.remove();
      sub = null;
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
      setOpen(true);
    };
    sub = Keyboard.addListener('keyboardDidHide', go);
    openTimerRef.current = setTimeout(go, 300);
    Keyboard.dismiss();
  }, []);
  // SS-DEV (2026-10-05): ID maydoni fokus holati (chegara rangi) va yo'nalish rangi — berish: ko'k, olish: yashil.
  const [focused, setFocused] = useState(false);
  const accent = type === 1 ? ACCENT_GIVE : ACCENT_TAKE;

  // Foydalanuvchini qidirish
  const searchUser = async () => {
    try {
      if (expire_passport_check(user.data.expiry_date)) {
        dispatch(checkExpire({ expire: true }));
        return;
      }

      if (user.data.uid === userID.replace('/', '')) {
        showError(t('Foydalanuvchi ma’lumotlari to‘g‘ri kelmadi'));
      } else {
        setLoading(true);
        setError(false);
        const { data: res } = await axios.post(
          URL + '/user/search',
          {
            id: userID.replace('/', ''),
            brithday: formatDate(date ?? new Date()),
            type: 1,
          },
          { headers: { Authorization: `Bearer ${storage.getString('token')}` } },
        );

        if (res.success) {
          setError(false);
          setLoading(false);
          setData(res);
          setSearchForm(false);
          return;
        }
        if (res.success === false) {
          // ID tizimда BOR-yo'qligini aniqlaymiz: candidate-search topmasa -> "mavjud emas"; topsa (lekin qidiruv
          // fail = tug'ilgan sana mos emas) -> "Foydalanuvchi ma'lumotlari to'g'ri kelmadi".
          let exists = false;
          try {
            const cs = await axios.get(URL + `/user/candidate-search/${userID.replace('/', '')}`, {
              headers: { Authorization: `Bearer ${storage.getString('token')}` },
            });
            exists = !!(cs?.data?.success && cs?.data?.data);
          } catch {}
          showError(exists ? t('825') : t('Ushbu ID raqamli foydalanuvchi mavjud emas'));
          setError(false);
          setLoading(false);
          return;
        }
      }
    } catch {
      showError(t('825'));
    }
    setLoading(false);
  };

  return {
    type,
    navigation,
    data,
    error,
    loading,
    searchForm,
    userID,
    setUserID,
    open,
    setOpen,
    date,
    setDate,
    pickerDefault,
    openDatePicker,
    focused,
    setFocused,
    accent,
    searchUser,
    disabled: userID.length !== 9,
  };
}
