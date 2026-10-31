import {
  AppState,
  Image,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {rd, rs} from '../../../theme/rd';
import Toast from 'react-native-toast-message';
import {useNavigation, useRoute, StackActions } from '@react-navigation/native';
import ClickIcon from '../../../images/pay/ClickIcon';
import {useDispatch, useSelector} from 'react-redux';
import RdHeader from '../../home/redesign/RdHeader';
import {t} from 'i18next';
import {textInputPlace} from '../../../helper/index';

import {getMe} from '../../../store/api/home';
import PaymeIcon from '../../../images/Payme';
import {URL} from '../../constants';
import {storage} from '../../../store/api/token/getToken';
import Loading from '../../components/Loading';
import { beginExternalFlow } from '../../../helper/externalFlow';
import {withRequiredParams} from '../../../helper/withRequiredParams';
import {
  buildClickUrl,
  buildPaymeUrl,
  digitsOnly,
  isPaymentCredited,
  validatePayAmount,
} from '../../../helper/payAmount';

// To'lovni kuzatish: 2s oraliq (dastlabki 5 urinish), keyin 5s; jami 10 daqiqadan keyin to'xtaydi.
const POLL_FAST_MS = 2000;
const POLL_SLOW_MS = 5000;
const POLL_FAST_TICKS = 5;
const POLL_MAX_MS = 10 * 60 * 1000;

type PendingPayment = {baseline: number; amount: number; startedAt: number};

const PayInner = () => {
  const navigation = useNavigation();
  const {type, title} = (useRoute().params ?? {}) as any;
  // SS-PERF (2026-09-25): aniq selektor (butun slice emas — ortiqcha re-render yo'q).
  const user = useSelector(state => state.HomeReducer.user);

  const [isLoading, setIsLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const dispatch = useDispatch();
  const [amount, setAmount] = useState('');
  // Kutilayotgan to'lov: boshlang'ich balans va kiritilgan summa (store yangilansa ham o'zgarmaydi).
  const pendingRef = useRef<PendingPayment | null>(null);
  // Tugmani ikki marta bosishdan himoya.
  const payingRef = useRef(false);

  const showError = (desc: string) =>
    Toast.show({
      autoHide: true,
      position: 'bottom',
      props: {desc},
      type: 'error2',
      visibilityTime: 3000,
    });

  const PayUser = () => {
    if (payingRef.current) return;
    payingRef.current = true;
    try {
      const res = validatePayAmount(amount);
      if (!res.ok) {
        showError(
          res.reason === 'max'
            ? t('Summa juda katta. Maksimal miqdor — 100 000 000 UZS.')
            : t('828'),
        );
        return;
      }
      const uid = user?.data?.uid;
      if (uid == null) return;
      if (type !== 0 && type !== 1) return;
      pendingRef.current = {
        baseline: Number(user?.data?.balance),
        amount: res.amount,
        startedAt: Date.now(),
      };
      // SS-DEV (2026-10-06, 06.10 1(b)): to'lov brauzeridan qaytishda PIN qulfi yo'q.
      beginExternalFlow();
      Linking.openURL(
        type === 0
          ? buildClickUrl(res.amount, uid)
          : buildPaymeUrl(res.amount, uid, btoa),
      ).catch(() => {
        pendingRef.current = null;
        showError(t('Xatolik'));
      });
    } catch (error) {
      console.error('Err', error);
    } finally {
      // Brauzer ochilgach foydalanuvchi qaytadi — qisqa kechikishdan keyin tugma yana faol.
      setTimeout(() => {
        payingRef.current = false;
      }, 1500);
    }
  };

  // Ilova orqa fonga o'tsa kuzatuv to'xtaydi; qaytganda (kutilayotgan to'lov bo'lsa) davom etadi.
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        if (pendingRef.current) {
          setIsLoading(true);
          setPolling(true);
        }
      } else {
        setPolling(false);
        setIsLoading(false);
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!polling) return;
    let stopped = false;
    let inFlight = false;
    let ticks = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const finish = () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      setPolling(false);
      setIsLoading(false);
    };
    const schedule = () => {
      if (stopped) return;
      timer = setTimeout(tick, ticks < POLL_FAST_TICKS ? POLL_FAST_MS : POLL_SLOW_MS);
    };
    const tick = async () => {
      const pending = pendingRef.current;
      if (stopped) return;
      if (!pending || !storage.getString('token')) {
        finish();
        return;
      }
      if (Date.now() - pending.startedAt > POLL_MAX_MS) {
        pendingRef.current = null;
        finish();
        showError(t('To‘lov hali tasdiqlanmadi. Balansni keyinroq tekshiring.'));
        return;
      }
      if (inFlight) {
        schedule();
        return;
      }
      inFlight = true;
      ticks += 1;
      try {
        const userData = await dispatch(getMe()).unwrap();
        if (stopped) return;
        if (
          isPaymentCredited(
            pending.baseline,
            userData?.user?.data?.balance,
            pending.amount,
          )
        ) {
          pendingRef.current = null;
          finish();
          // NAV-FIX: to'lov TUGADI. `replace` — natija ekranidan orqaga bosilganda
          // to'lov sahifasiga qaytmasin (to'lovni takrorlash xavfi). Param YO'Q:
          // natija ekrani balansni serverdan o'zi oladi.
          navigation.dispatch(StackActions.replace('UserMoneyResult'));
          return;
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        inFlight = false;
      }
      schedule();
    };
    tick();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [polling, navigation, dispatch]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <RdHeader title={title} />
      <View style={styles.main}>
        {/* TEPA YARIM — KATTA logo (so'rov bo'yicha kattaroq hajmda, 1-yarimda). */}
        <View style={styles.topHalf}>
          <View style={styles.logoCard}>
            {type === 0 ? (
              <ClickIcon width={rs(170)} height={rs(48)} color={rd.color.primary} />
            ) : type === 1 ? (
              <PaymeIcon width={rs(180)} height={rs(58)} />
            ) : (
              <Image source={require('../../../images/paynet.png')} />
            )}
          </View>
        </View>

        {/* PASTKI YARIM — summa maydoni + Davom etish. "Summani kiriting" LABEL
            OLIB TASHLANDI (so'rov bo'yicha) — input placeholder'ining o'zi yetarli. */}
        <View style={styles.bottomHalf}>
          <TextInput
            value={textInputPlace(amount)}
            placeholder={t('276')}
            placeholderTextColor={rd.color.textTertiary}
            keyboardType="numeric"
            onChangeText={val => {
              // Faqat raqamlar; 10 xonadan ortiq kiritilmaydi.
              setAmount(digitsOnly(val).slice(0, 10));
            }}
            maxLength={14}
            style={styles.input}
            allowFontScaling={false}
          />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={PayUser}
            style={styles.payButton}>
            <Text style={styles.payButtonText} allowFontScaling={false}>
              {t('45')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const Pay = withRequiredParams(PayInner, ['type']);

export default Pay;

const styles = StyleSheet.create({
  container: {
    backgroundColor: rd.color.page,
    flex: 1,
  },
  main: {
    flex: 1,
    paddingHorizontal: rs(16),
    paddingTop: rs(10),
    paddingBottom: rs(16),
  },
  // Ekran ikkiga bo'linadi: logo tepa yarmda (markazda, katta), forma pastki yarmda.
  topHalf: { flex: 1, justifyContent: 'center' },
  bottomHalf: { flex: 1, paddingTop: rs(8) },
  logoCard: {
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    paddingVertical: rs(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    height: rs(56),
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    paddingHorizontal: rs(16),
    fontFamily: rd.font.semibold,
    fontSize: rs(18),
    color: rd.color.text,
  },
  payButton: {
    marginTop: rs(22),
    width: '100%',
    height: rs(54),
    backgroundColor: rd.color.primary,
    borderRadius: rd.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
});
