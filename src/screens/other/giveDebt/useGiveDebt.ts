import { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { t } from 'i18next';
import { storage } from '../../../store/api/token/getToken';
import { URL } from '../../constants';
import { getMe, HomeApi } from '../../../store/api/home';
import { signExistingUrl } from '../../../helper/pdfSign';
import { settingDate } from '../../../helper';
import { adaptAmountInputToCurrency, contractFee, parseAmount } from '../../../helper/money';
import { useApiAction } from '../../../hooks/useApiAction';
import {
  buildContractPayload,
  buildFreeContractUrl,
  CBU_RATES_URL,
  failMessage,
  GO_HOME_FADE_MS,
  GO_HOME_TOAST_MS,
  isBalanceInsufficient,
  minAmountError,
} from './giveDebtLogic';

const toastBase = { autoHide: true, position: 'bottom' as const };
const showError = (desc: string, visibilityTime: number) =>
  Toast.show({ ...toastBase, visibilityTime, type: 'error2', props: { desc } });
const showFail = (msg?: string) => showError(failMessage(msg), 2500);
const showSuccess = () =>
  Toast.show({ ...toastBase, visibilityTime: 2000, type: 'omad', props: { desc: t('285') } });

/** GiveDebtUser ekranining holati va amallari. */
export function useGiveDebt() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const { qarzoluvchi, type } = useRoute().params as any;
  // SS-PERF (2026-09-25): aniq selektor (butun slice emas — ortiqcha re-render yo'q).
  const user = useSelector((state: any) => state.HomeReducer.user);
  const [checked, setChecked] = useState(false);
  const [isUzs, setIsUzs] = useState(true);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [usdRate, setUsdRate] = useState('');
  // SS-DEV (2026-10-06): yagona double-submit himoyasi (bir kadrdagi ikki bosishni ham ushlaydi).
  // `loading` (Loading ekrani) tekshiruvdan keyin yoqiladi, shuning uchun hook'ning o'z loading'i ishlatilmaydi.
  const { run } = useApiAction();
  // API/hisob uchun son: USD — 2 xona (tsentlar), UZS — butun.
  const amountNum = parseAmount(amount, !isUzs);

  useEffect(() => {
    axios.get(CBU_RATES_URL, { headers: {} }).then(
      ({ data }) => {
        if (data) setUsdRate(data[0].Rate);
      },
      () => {},
    );
  }, []);

  // Amaldan keyin Home'ga SILLIQ qaytish (navigate — remount yo'q) + HomeApi refresh.
  const goHomeSoon = () => {
    setTimeout(() => {
      Toast.hide();
      dispatch(HomeApi({ page: 1 }));
      setTimeout(() => navigation.navigate('BottomTabNavigator'), GO_HOME_FADE_MS);
    }, GO_HOME_TOAST_MS);
  };

  const submitContract = async () => {
    try {
      const tooSmall = minAmountError(isUzs, amountNum);
      if (tooSmall) return showError(tooSmall, 3000);
      if (type === 0 && isBalanceInsufficient(user, amountNum, isUzs, usdRate)) {
        return showError(t('294'), 3000);
      }
      // Eski xulq: type 0 yoki 1 dan boshqasida hech narsa yuborilmaydi.
      if (type !== 0 && type !== 1) return;
      setLoading(true);
      const body = buildContractPayload(type, { amountNum, isUzs, date, user, qarzoluvchi });
      const { data } = await axios.post(URL + '/contract/create', body, {
        headers: { Authorization: 'Bearer ' + storage.getString('token') },
      });
      setLoading(false);
      if (type === 1 && data.msg === 'deb_expiry_date' && data.success === false) {
        return showError(t('expire_passport'), 2000);
      }
      if (!data.success) return showFail(data.msg);
      // type 0: avval toast, keyin getMe; type 1: avval getMe, keyin toast (eski tartib).
      if (type === 0) showSuccess();
      dispatch(getMe());
      if (type !== 0) showSuccess();
      goHomeSoon();
    } catch (error) {
      setLoading(false);
      // 503 rate-unavailable — aniq xabar; qolgan holatlar avvalgidek (jim).
      const msg = (error as any)?.response?.data?.msg;
      if (msg === 'rate-unavailable') showFail(msg);
    }
  };

  const submit = () => {
    run(submitContract);
  };

  const openContractPreview = async () => {
    const lang = storage.getString('lang');
    const unsignedUrl = buildFreeContractUrl({ type, user, qarzoluvchi, amountNum, isUzs, date, lang });
    // 31.10: imzolangan havola (xato/timeout bo'lsa eski imzosiz havola)
    const url = await signExistingUrl('free_contract', unsignedUrl);
    navigation.navigate('Contract', { url, title: t('306') });
  };

  const selectUzs = () => {
    setIsUzs(true);
    // USD -> UZS: tsentlar tashlanadi ("12.34" -> "12").
    setAmount(v => adaptAmountInputToCurrency(v, false));
  };

  const isPlaceholderDate = settingDate(date) === settingDate(new Date());
  return {
    type,
    qarzoluvchi,
    user,
    checked,
    toggleChecked: () => setChecked(c => !c),
    isUzs,
    selectUzs,
    selectUsd: () => setIsUzs(false),
    amount,
    setAmount,
    amountNum,
    fee: contractFee(amountNum, isUzs, usdRate),
    date,
    setDate,
    open,
    setOpen,
    loading,
    isDisabled: !(amountNum > 0 && checked) || isPlaceholderDate,
    isPlaceholderDate,
    submit,
    openContractPreview,
  };
}
