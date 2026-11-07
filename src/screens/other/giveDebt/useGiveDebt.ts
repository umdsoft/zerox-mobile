import { useEffect, useRef, useState } from 'react';
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
  feeApplies,
  failMessage,
  GO_HOME_FADE_MS,
  GO_HOME_TOAST_MS,
  isBalanceInsufficient,
  minAmountError,
} from './giveDebtLogic';

/** Yuborishda CBU kursini kutishning yuqori chegarasi. */
const RATE_WAIT_MS = 8000;
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
  const [cbuRate, setCbuRate] = useState('');
  const [rateFailed, setRateFailed] = useState(false);
  // Zaxira kurs: `HomeReducer.usd` — u ham CBU kursi (ilova ochilganda olingan nusxa), boshlang'ich qiymat 1 — kurs EMAS,
  // shuning uchun > 1 shart.
  const homeUsd = useSelector((state: any) => state.HomeReducer.usd);
  const fallbackRate = Number(homeUsd) > 1 ? String(homeUsd) : '';
  // Kurs manbalari tartibi: CBU -> HomeReducer.usd (zaxira) -> yo'q.
  const usdRate = cbuRate || fallbackRate;
  // await'dan keyin eng so'nggi qiymatni o'qish uchun ref; mountedRef — ekran yopilgan bo'lsa yuborilmaydi.
  const fallbackRef = useRef(fallbackRate);
  fallbackRef.current = fallbackRate;
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  // Kurs (xizmat haqi/balans hisobi) FAQAT shunda kerak: qarz olish va cnt === 0. Aks holda backend hal qiladi.
  const needsRate = feeApplies(type, user?.data?.cnt);
  // SS-DEV (2026-10-06): yagona double-submit himoyasi (bir kadrdagi ikki bosishni ham ushlaydi).
  // `loading` (Loading ekrani) tekshiruvdan keyin yoqiladi, shuning uchun hook'ning o'z loading'i ishlatilmaydi.
  const { run } = useApiAction();
  // API/hisob uchun son: USD — 2 xona (tsentlar), UZS — butun.
  const amountNum = parseAmount(amount, !isUzs);

  // CBU kursini olish. Hozir bajarilayotgan so'rov bo'lsa — SHU promise qaytariladi (yangisi emas).
  const ratePromise = useRef<Promise<string> | null>(null);
  const fetchRate = (): Promise<string> => {
    if (ratePromise.current) return ratePromise.current;
    const p: Promise<string> = axios
      .get(CBU_RATES_URL, { headers: {}, timeout: RATE_WAIT_MS })
      .then(({ data }) => {
        const rate = data?.[0]?.Rate;
        if (rate) {
          setCbuRate(rate);
          setRateFailed(false);
          return String(rate);
        }
        setRateFailed(true);
        return '';
      })
      .catch(() => {
        setRateFailed(true);
        return '';
      })
      .then(rate => {
        // Vaqti tugab almashtirilgan eski so'rov yangisini o'chirib yubormasin.
        if (ratePromise.current === p) ratePromise.current = null;
        return rate;
      });
    ratePromise.current = p;
    return p;
  };
  // Yuborishda kursni kutish (osilib qolmasligi uchun RATE_WAIT_MS bilan cheklangan; vaqt tugasa — kurs yo'q).
  const waitRate = (): Promise<string> =>
    new Promise<string>(resolve => {
      const timer = setTimeout(() => {
        // Osilib qolgan so'rov tashlanadi: keyingi bosish YANGI so'rov yuboradi.
        ratePromise.current = null;
        resolve('');
      }, RATE_WAIT_MS);
      fetchRate().then(rate => {
        clearTimeout(timer);
        resolve(rate);
      });
    });
  useEffect(() => {
    fetchRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CBU olinmadi, lekin zaxira kurs (HomeReducer.usd) bor: xizmat haqi taxminiy — ogohlantirish. Zaxira ham yo'q bo'lsa
  // bu matn CHIQMAYDI (yuborishda alohida "yuborib bo'lmaydi" xabari bor, ikkalasi zid kelmasin).
  // Ekran sessiyasida BIR marta (UZS<->USD almashtirganda takrorlanmaydi).
  const rateWarned = useRef(false);
  const rateMissingMsg = t('USD kursi olinmadi. Xizmat haqi hisobi aniq bo‘lmasligi mumkin.');
  useEffect(() => {
    if (needsRate && !isUzs && rateFailed && !cbuRate && fallbackRate && !rateWarned.current) {
      rateWarned.current = true;
      showError(rateMissingMsg, 3500);
    }
  }, [needsRate, isUzs, rateFailed, cbuRate, fallbackRate, rateMissingMsg, t]);

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
      // Faqat xizmat haqi/balans tekshiruvi qo'llanganda (type 0 va cnt === 0) USD kursi kerak. Kurs yo'q bo'lsa
      // bir marta qayta so'raymiz (so'rov ketayotgan bo'lsa — uni kutamiz); baribir yo'q bo'lsa to'sib qo'yamiz.
      // type 1 (qarz so'rash) hech qachon to'silmaydi.
      let rate = usdRate;
      if (needsRate && !isUzs && !rate) {
        setLoading(true);
        rate = (await waitRate()) || fallbackRef.current;
        if (!mountedRef.current) return; // ekran yopildi — shartnoma yuborilmaydi
        if (!rate) {
          setLoading(false);
          return showError(t('Dollar kursi olinmadi, shartnomani yuborib bo‘lmaydi. Internetni tekshirib, qayta urinib ko‘ring.'), 3500);
        }
        setLoading(false);
      }
      if (type === 0 && isBalanceInsufficient(user, amountNum, isUzs, rate)) {
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
