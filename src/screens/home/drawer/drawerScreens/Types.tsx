import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useTranslation } from 'react-i18next';

import { rd, rs } from '../../../../theme/rd';
import { URL } from '../../../constants';
import { useFetch } from '../../../../hooks/useFetch';
import apiClient from '../../../../store/api/apiClient';
import { groupDigits } from '../../../../helper/money';
import RdHeader from '../../redesign/RdHeader';
import {
  ContractIcon,
  LedgerIcon,
  CoinIcon,
  CheckIcon,
  CloseIcon,
  WalletIcon,
  ChevronRight,
  StarIcon,
  MessageIcon,
} from '../../redesign/icons';

// Qarz daftari uslubidagi ikkilamchi (binafsha) urg'u — Premium karta uchun.
const VIOLET = '#6d5ae6';
const VIOLET_TINT = '#efe9fd';

// ── Qarz daftari obuna tariflari (saytdagi tariflar sahifasi bilan bir xil). ──
const DAFTARI_TARIFFS = [
  {
    key: 'free',
    badge: 'FREE',
    price: '0',
    sms: '100 SMS kiritilgan',
    accent: rd.color.textTertiary,
    tint: rd.color.surfaceAlt,
    current: true,
    features: [
      { label: 'Qarz qo‘shish', on: true },
      { label: 'To‘lovlarni qayd etish', on: true },
      { label: 'Ro‘yxatga olish SMS (tizim)', on: true },
      { label: 'Avtomatik SMS eslatma', on: false },
      { label: 'Qo‘lda SMS yuborish', on: false },
      { label: 'SMS tarixi va statistika', on: false },
    ],
  },
  {
    key: 'start',
    badge: 'OMMABOP',
    price: '99 000',
    sms: '500 SMS kiritilgan',
    accent: rd.color.primary,
    tint: rd.color.primaryTint,
    highlight: true,
    features: [
      { label: 'Qarz qo‘shish', on: true },
      { label: 'To‘lovlarni qayd etish', on: true },
      { label: 'Ro‘yxatga olish SMS (tizim)', on: true },
      { label: 'Avtomatik SMS eslatma', on: true },
      { label: 'Qo‘lda SMS yuborish', on: true },
      { label: 'SMS tarixi va statistika', on: true },
    ],
  },
  {
    key: 'premium',
    badge: 'PREMIUM',
    price: '199 000',
    sms: '1 100 SMS kiritilgan',
    accent: VIOLET,
    tint: VIOLET_TINT,
    features: [
      { label: 'Qarz qo‘shish', on: true },
      { label: 'To‘lovlarni qayd etish', on: true },
      { label: 'Ro‘yxatga olish SMS (tizim)', on: true },
      { label: 'Avtomatik SMS eslatma', on: true },
      { label: 'Qo‘lda SMS yuborish', on: true },
      { label: 'SMS tarixi va statistika', on: true },
    ],
  },
];

// ── Qo'shimcha SMS paketlar (name — backend ADDON_SMS_PACKAGES bilan bir xil). ──
const SMS_PACKETS = [
  { name: 'small', sms: '100', price: '21 000', amount: 21000 },
  { name: 'medium', sms: '200', price: '40 000', amount: 40000 },
  { name: 'large', sms: '300', price: '57 000', amount: 57000 },
];

// Tarif narxlari (UZS, son) — tasdiqlash matni va balans-tekshiruvi uchun.
const PLAN_AMOUNT: Record<string, number> = { start: 99000, premium: 199000 };

const Types = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.HomeReducer);

  // Mobil hisob balansi — REAL (/user/me). Redux'dagi qiymat zaxira sifatida.
  const me = useFetch({ method: 'GET', url: URL + '/user/me' });
  const balance =
    Number((me.data as any)?.data?.balance ?? user?.data?.balance ?? 0) || 0;

  // Joriy obuna (tarif) — REAL. Qaysi karta "Joriy tarif" ekanini shu belgilaydi.
  const subRes = useFetch({ method: 'GET', url: URL + '/finance/subscription/' });
  const currentPlan: string =
    (subRes.data as any)?.data?.subscription?.plan || 'free';

  // Sotib olish jarayoni — bosilgan tugma kaliti (ikki marta bosishdan himoya + spinner).
  const [busy, setBusy] = React.useState<string | null>(null);
  // Tarif/SMS xarid MODALI holati (so'rov SS11 — sayt kabi balans-breakdown oynasi).
  const [payModal, setPayModal] = React.useState<any>(null);

  // SMS balansi — REAL (/qarz-daftari/sms-balance). Free tarifda 100 SMS grant.
  const smsRes = useFetch({ method: 'GET', url: URL + '/qarz-daftari/sms-balance' });
  const smsB: any = (smsRes.data as any)?.data || {};
  const smsTotal = Number(smsB.total || 0);
  const smsRemaining = Number(smsB.remaining || 0);
  const smsSent = Number(smsB.sent || 0);
  const smsUsed = Number(smsB.used ?? Math.max(smsTotal - smsRemaining, 0));
  const smsBarPct = smsTotal > 0 ? Math.min(100, Math.round((smsUsed / smsTotal) * 100)) : 0;

  // Sotib olgandan keyin balans, SMS va obunani qayta yuklaymiz.
  const refetchAll = () => {
    me.onRefresh({});
    smsRes.onRefresh({});
    subRes.onRefresh({});
  };
  const toastOk = (desc: string) =>
    Toast.show({
      autoHide: true, visibilityTime: 2400, position: 'bottom', type: 'omad',
      props: { desc },
    });
  const toastErr = (desc: string) =>
    Toast.show({
      autoHide: true, visibilityTime: 2600, position: 'bottom', type: 'error2',
      props: { desc },
    });

  // ── Tarif/SMS xarid MODALI (so'rov SS11) — balans yetsa "Tasdiqlash", aks holda
  //    "Mobil hisobni to'ldirish". Modal balans-breakdown ko'rsatadi. ──
  const closePay = () => setPayModal(null);
  const confirmPay = async () => {
    if (!payModal || busy) return;
    setBusy(payModal.key);
    try {
      await apiClient.post(payModal.path, payModal.body);
      toastOk(payModal.successText);
      refetchAll();
      closePay();
    } catch (e: any) {
      const r = e?.response;
      closePay();
      if (r?.status === 402 && r?.data?.code === 'insufficient-balance') {
        toastErr(t('Mobil hisobda mablag‘ yetarli emas'));
      } else {
        toastErr(t('Amalni bajarib bo‘lmadi. Birozdan so‘ng urinib ko‘ring'));
      }
    } finally {
      setBusy(null);
    }
  };

  // Tarifga ulanish — modal ochadi (balansdan yechim tasdiq oynasида).
  const purchasePlan = (planKey: string, badge: string) => {
    setPayModal({
      key: 'plan-' + planKey,
      title: t('Tarifga ulanish'),
      tarif: badge,
      price: PLAN_AMOUNT[planKey] || 0,
      path: '/finance/subscription/purchase-from-balance',
      body: { plan: planKey },
      successText: t('Tarif muvaffaqiyatli ulandi'),
    });
  };

  // Qo'shimcha SMS paket sotib olish — shu modal.
  const purchaseAddon = (pkg: { name: string; sms: string; amount: number }) => {
    setPayModal({
      key: 'sms-' + pkg.name,
      title: t('SMS paket sotib olish'),
      tarif: `${pkg.sms} SMS`,
      price: pkg.amount,
      path: '/finance/subscription/purchase-addon-from-balance',
      body: { package_name: pkg.name },
      successText: t('SMS paket qo‘shildi'),
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('117')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <Text allowFontScaling={false} style={styles.subtitle}>
          {t('Qarz daftari va qarz shartnomasi bo‘yicha narxlar')}
        </Text>

        {/* ══ SMS balans (ENG TEPADA — saytdagidek) ══ */}
        <View style={styles.smsCard}>
          <View style={styles.smsTop}>
            <View style={styles.smsStar}>
              <StarIcon size={rs(16)} color="#f5a623" />
            </View>
            <View style={{ flex: 1 }}>
              <Text allowFontScaling={false} style={styles.smsLabel}>
                {t('SMS balansingiz')}
              </Text>
              <Text allowFontScaling={false} style={styles.smsPlan}>
                {/* Balans bilan izchil: sarflangan = jami - qoldiq (paketdan yechilgan).
                    sms_history soni (sent) ba'zan kamroq bo'ladi (eski loglanmagan
                    yozuvlar) — shu bois "sarflangan" ko'rsatkichi ishlatiladi. */}
                {t('Jami {{n}} ta SMS yuborilgan', { n: smsUsed })}
              </Text>
            </View>
            <View style={styles.smsCountWrap}>
              <Text allowFontScaling={false} style={styles.smsCount}>
                {`${smsRemaining} / ${smsTotal}`}
              </Text>
              <Text allowFontScaling={false} style={styles.smsCountLabel}>
                {t('SMS qoldi')}
              </Text>
            </View>
          </View>
          <View style={styles.smsBarTrack}>
            <View style={[styles.smsBarFill, { width: `${smsBarPct}%` }]} />
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SmsHistory')}
            style={styles.smsHistoryBtn}>
            <MessageIcon size={rs(15)} color={rd.color.primary} />
            <Text allowFontScaling={false} style={styles.smsHistoryText}>
              {t('SMS xabarlar tarixi')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ══ Qarz daftari tariflari (obuna) ══ */}
        <View style={styles.sectionHead}>
          <View style={styles.headIcon}>
            <LedgerIcon size={rs(20)} color={VIOLET} />
          </View>
          <View style={{ flex: 1 }}>
            <Text allowFontScaling={false} style={styles.sectionTitle}>
              {t('Qarz daftari tariflari')}
            </Text>
            <Text allowFontScaling={false} style={styles.cardSub}>
              {t('Obuna asosida · SMS bildirishnomalar bilan')}
            </Text>
          </View>
        </View>

        {DAFTARI_TARIFFS.map(tar => (
          <View
            key={tar.key}
            style={[
              styles.tariffCard,
              tar.highlight && { borderColor: tar.accent, borderWidth: 1.5 },
            ]}>
            <View style={styles.tariffTop}>
              <View style={[styles.badge, { backgroundColor: tar.tint }]}>
                <Text
                  allowFontScaling={false}
                  style={[styles.badgeText, { color: tar.accent }]}>
                  {tar.badge}
                </Text>
              </View>
              <View style={styles.priceWrap}>
                <Text allowFontScaling={false} style={styles.tariffPrice}>
                  {tar.price}
                </Text>
                <Text allowFontScaling={false} style={styles.tariffUnit}>
                  UZS
                </Text>
              </View>
            </View>
            <Text allowFontScaling={false} style={styles.tariffSms}>
              {t(tar.sms)}
            </Text>

            <View style={styles.features}>
              {tar.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View
                    style={[
                      styles.featureIcon,
                      { backgroundColor: f.on ? rd.color.successBg : rd.color.surfaceAlt },
                    ]}>
                    {f.on ? (
                      <CheckIcon size={rs(12)} color={rd.color.success} />
                    ) : (
                      <CloseIcon size={rs(12)} color={rd.color.textTertiary} />
                    )}
                  </View>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.featureText,
                      !f.on && { color: rd.color.textTertiary },
                    ]}>
                    {t(f.label)}
                  </Text>
                </View>
              ))}
            </View>

            {currentPlan === tar.key ? (
              <View style={styles.currentBtn}>
                <Text allowFontScaling={false} style={styles.currentText}>
                  {t('Joriy tarif')}
                </Text>
              </View>
            ) : tar.key === 'free' ? (
              <View style={styles.currentBtn}>
                <Text allowFontScaling={false} style={styles.currentText}>
                  {t('Bepul tarif')}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={!!busy}
                onPress={() => purchasePlan(tar.key, tar.badge)}
                style={[
                  styles.joinBtn,
                  { backgroundColor: tar.accent },
                  busy === 'plan-' + tar.key && { opacity: 0.75 },
                ]}>
                {busy === 'plan-' + tar.key ? (
                  <ActivityIndicator color={rd.color.onPrimary} size="small" />
                ) : (
                  <Text allowFontScaling={false} style={styles.joinText}>
                    {t('Ulanish')}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* ══ Qo'shimcha SMS paketlar ══ */}
        <View style={styles.sectionHead}>
          <View style={styles.headIcon}>
            <CoinIcon size={rs(20)} color={rd.color.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text allowFontScaling={false} style={styles.sectionTitle}>
              {t('Qo‘shimcha SMS paketlar')}
            </Text>
            <Text allowFontScaling={false} style={styles.cardSub}>
              {t('SMS tugasa, tarifni o‘zgartirmasdan qo‘shimcha oling')}
            </Text>
          </View>
        </View>

        <View style={styles.packetRow}>
          {SMS_PACKETS.map(p => (
            <View key={p.sms} style={styles.packet}>
              <Text allowFontScaling={false} style={styles.packetSms}>
                {p.sms}
              </Text>
              <Text allowFontScaling={false} style={styles.packetSmsLabel}>
                SMS
              </Text>
              <Text allowFontScaling={false} style={styles.packetPrice}>
                {p.price}
              </Text>
              <Text allowFontScaling={false} style={styles.packetUnit}>
                UZS
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={!!busy}
                onPress={() => purchaseAddon(p)}
                style={[
                  styles.packetBtn,
                  busy === 'sms-' + p.name && { opacity: 0.75 },
                ]}>
                {busy === 'sms-' + p.name ? (
                  <ActivityIndicator color={rd.color.primary} size="small" />
                ) : (
                  <Text allowFontScaling={false} style={styles.packetBtnText}>
                    {t('Sotib olish')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ══ Qarz shartnomasi tariflari (ENG PASTDA — subtitle OLIB TASHLANDI) ══ */}
        <View style={[styles.card, { marginTop: rs(18) }]}>
          <View style={styles.cardHead}>
            <View style={styles.headIcon}>
              <ContractIcon size={rs(20)} color={rd.color.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text allowFontScaling={false} style={styles.cardTitle}>
                {t('Qarz shartnomasi tariflari')}
              </Text>
            </View>
          </View>

          <View style={styles.contractRow}>
            <View style={styles.contractDot}>
              <CheckIcon size={rs(15)} color={rd.color.success} />
            </View>
            <View style={{ flex: 1 }}>
              {/* "Bepul shartnomalar" sarlavhasi olib tashlandi (so'rov). */}
              <Text
                allowFontScaling={false}
                style={[styles.contractValue, { color: rd.color.success }]}>
                {t('Mutlaqo bepul')}
              </Text>
              <Text allowFontScaling={false} style={styles.contractNote}>
                {t('Barcha foydalanuvchilarga qarz berishda')}
              </Text>
            </View>
          </View>

          <View style={styles.contractRow}>
            <View style={[styles.contractDot, { backgroundColor: rd.color.primaryTint }]}>
              <CoinIcon size={rs(15)} color={rd.color.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text allowFontScaling={false} style={styles.contractLabel}>
                {t('Shartnoma narxi')}
              </Text>
              <View style={styles.priceLine}>
                <Text allowFontScaling={false} style={styles.priceTerm}>
                  {t('1 mln so‘mgacha')}
                </Text>
                <Text allowFontScaling={false} style={styles.priceVal}>
                  1 000 UZS
                </Text>
              </View>
              <View style={styles.priceLine}>
                <Text allowFontScaling={false} style={styles.priceTerm}>
                  {t('1 mln – 100 mln so‘m')}
                </Text>
                <Text allowFontScaling={false} style={styles.priceVal}>
                  0.1%
                </Text>
              </View>
              <View style={styles.priceLine}>
                <Text allowFontScaling={false} style={styles.priceTerm}>
                  {t('100 mln so‘mdan ortiq')}
                </Text>
                <Text allowFontScaling={false} style={styles.priceVal}>
                  100 000 UZS
                </Text>
              </View>
            </View>
          </View>

          {/* Mobil hisob balansi (REAL) + to'ldirish. */}
          <View style={styles.balanceBar}>
            <View style={styles.balanceLeft}>
              <WalletIcon size={rs(18)} color={rd.color.primary} />
              <View style={{ marginLeft: rs(10) }}>
                <Text allowFontScaling={false} style={styles.balanceLabel}>
                  {t('Mobil hisob balansingiz')}
                </Text>
                <Text allowFontScaling={false} style={styles.balanceValue}>
                  {t('{{amount}} so‘m', { amount: groupDigits(balance) })}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('PayScreen')}
              style={styles.topUpBtn}>
              <Text allowFontScaling={false} style={styles.topUpText}>
                {t('To‘ldirish')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── Tarif/SMS xarid MODALI (so'rov SS11) — balans-breakdown + tasdiq/to'ldirish ── */}
      <Modal
        visible={!!payModal}
        transparent
        animationType="fade"
        onRequestClose={closePay}>
        <View style={styles.payOverlay}>
          <View style={styles.payCard}>
            <View style={styles.payHead}>
              <View style={{ flex: 1 }}>
                <Text allowFontScaling={false} style={styles.payTitle}>
                  {payModal?.title}
                </Text>
                <Text allowFontScaling={false} style={styles.paySub}>
                  {t('Tarif')}: {payModal?.tarif}
                </Text>
              </View>
              <TouchableOpacity
                onPress={closePay}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <CloseIcon size={rs(20)} color={rd.color.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.payRows}>
              <View style={styles.payRow}>
                <Text allowFontScaling={false} style={styles.payRowLabel}>
                  {t('Joriy balans')}
                </Text>
                <Text allowFontScaling={false} style={styles.payRowVal}>
                  {groupDigits(balance)} UZS
                </Text>
              </View>
              <View style={styles.payRow}>
                <Text allowFontScaling={false} style={styles.payRowLabel}>
                  {t('Tarif qiymati')}
                </Text>
                <Text allowFontScaling={false} style={styles.payRowVal}>
                  {groupDigits(payModal?.price || 0)} UZS
                </Text>
              </View>
              <View style={[styles.payRow, styles.payRowLast]}>
                {balance >= (payModal?.price || 0) ? (
                  <>
                    <Text allowFontScaling={false} style={styles.payRowLabel}>
                      {t('Ulanishdan keyin balans')}
                    </Text>
                    <Text allowFontScaling={false} style={[styles.payRowVal, { color: '#16a34a' }]}>
                      {groupDigits(balance - (payModal?.price || 0))} UZS
                    </Text>
                  </>
                ) : (
                  <>
                    <Text allowFontScaling={false} style={styles.payRowLabel}>
                      {t('Yetishmayotgan mablag‘')}
                    </Text>
                    <Text allowFontScaling={false} style={[styles.payRowVal, { color: '#dc2626' }]}>
                      {groupDigits((payModal?.price || 0) - balance)} UZS
                    </Text>
                  </>
                )}
              </View>
            </View>

            <Text
              allowFontScaling={false}
              style={[
                styles.payNote,
                balance < (payModal?.price || 0) && { color: '#dc2626' },
              ]}>
              {balance >= (payModal?.price || 0)
                ? t('Tasdiqlasangiz, ko‘rsatilgan summa Mobil hisobingizdan yechib olinadi va tarif faollashadi.')
                : t('Mobil hisobda mablag‘ yetarli emas. Avval to‘ldirib oling.')}
            </Text>

            <View style={styles.payBtns}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.payCancel}
                onPress={closePay}>
                <Text allowFontScaling={false} style={styles.payCancelText}>
                  {t('Bekor qilish')}
                </Text>
              </TouchableOpacity>
              {balance >= (payModal?.price || 0) ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={!!busy}
                  style={[styles.payConfirm, !!busy && { opacity: 0.7 }]}
                  onPress={confirmPay}>
                  {busy ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text allowFontScaling={false} style={styles.payConfirmText}>
                      {t('Tasdiqlash')}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.payConfirm}
                  onPress={() => {
                    closePay();
                    navigation.navigate('PayScreen');
                  }}>
                  <Text allowFontScaling={false} style={styles.payConfirmText}>
                    {t('Mobil hisobni to‘ldirish')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Types;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: {
    paddingHorizontal: rs(16),
    paddingTop: rs(6),
    paddingBottom: rs(28),
  },
  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginBottom: rs(14),
  },

  // ── SMS balans kartasi (eng tepada, saytdagidek).
  smsCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
    marginBottom: rs(18),
  },
  smsTop: { flexDirection: 'row', alignItems: 'center' },
  smsStar: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(12),
    backgroundColor: '#fdf2df',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
  },
  smsLabel: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
  },
  smsPlan: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
    marginTop: rs(1),
  },
  smsCountWrap: { alignItems: 'flex-end' },
  smsCount: {
    fontFamily: rd.font.bold,
    fontSize: rs(15.5),
    color: rd.color.primary,
  },
  smsCountLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(10.5),
    color: rd.color.textTertiary,
    marginTop: -rs(2),
  },
  smsBarTrack: {
    height: rs(7),
    borderRadius: rs(4),
    backgroundColor: rd.color.surfaceAlt,
    marginTop: rs(14),
    overflow: 'hidden',
  },
  smsBarFill: {
    height: '100%',
    width: '100%',
    borderRadius: rs(4),
    backgroundColor: rd.color.primary,
  },
  smsHint: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(10),
  },
  smsHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    marginTop: rs(12),
    alignSelf: 'flex-start',
  },
  smsHistoryText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: rd.color.primary,
  },

  // Umumiy karta
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
    marginBottom: rs(18),
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(14),
  },
  headIcon: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(12),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
  },
  cardTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(15.5),
    color: rd.color.text,
  },
  cardSub: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },

  // Shartnoma tarif qatorlari
  contractRow: {
    flexDirection: 'row',
    paddingTop: rs(12),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
    marginTop: rs(4),
  },
  contractDot: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(15),
    backgroundColor: rd.color.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
  },
  contractLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
  },
  contractValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    marginTop: rs(2),
  },
  contractNote: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
  priceLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: rs(6),
  },
  priceTerm: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    flex: 1,
  },
  priceVal: {
    fontFamily: rd.font.bold,
    fontSize: rs(13),
    color: rd.color.text,
    marginLeft: rs(8),
  },

  balanceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.md,
    padding: rs(12),
    marginTop: rs(14),
  },
  balanceLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  balanceLabel: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
  },
  balanceValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(15),
    color: rd.color.text,
    marginTop: rs(1),
  },
  topUpBtn: {
    backgroundColor: rd.color.primary,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(16),
    paddingVertical: rs(9),
    marginLeft: rs(10),
  },
  topUpText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: rd.color.onPrimary,
  },

  // Bo'lim sarlavhasi
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(12),
    marginTop: rs(4),
  },
  sectionTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
  },

  // Obuna tarif kartasi
  tariffCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
    marginBottom: rs(12),
  },
  tariffTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(12),
    paddingVertical: rs(5),
  },
  badgeText: {
    fontFamily: rd.font.bold,
    fontSize: rs(11.5),
    letterSpacing: 0.5,
  },
  priceWrap: { flexDirection: 'row', alignItems: 'baseline' },
  tariffPrice: {
    fontFamily: rd.font.bold,
    fontSize: rs(22),
    color: rd.color.text,
  },
  tariffUnit: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginLeft: rs(4),
  },
  tariffSms: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    marginTop: rs(4),
  },
  features: {
    marginTop: rs(14),
    gap: rs(9),
  },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  featureIcon: {
    width: rs(20),
    height: rs(20),
    borderRadius: rs(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(10),
  },
  featureText: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.text,
    flex: 1,
  },
  currentBtn: {
    marginTop: rs(16),
    height: rs(46),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.surfaceAlt,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.textSecondary,
  },
  joinBtn: {
    marginTop: rs(16),
    height: rs(46),
    borderRadius: rd.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.onPrimary,
  },

  // SMS paketlar
  packetRow: {
    flexDirection: 'row',
    gap: rs(10),
  },
  packet: {
    flex: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingVertical: rs(14),
    paddingHorizontal: rs(8),
    alignItems: 'center',
  },
  packetSms: {
    fontFamily: rd.font.bold,
    fontSize: rs(20),
    color: rd.color.primary,
  },
  packetSmsLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(11),
    color: rd.color.textTertiary,
    marginTop: -rs(2),
  },
  packetPrice: {
    fontFamily: rd.font.bold,
    fontSize: rs(14),
    color: rd.color.text,
    marginTop: rs(8),
  },
  packetUnit: {
    fontFamily: rd.font.regular,
    fontSize: rs(10.5),
    color: rd.color.textTertiary,
  },
  packetBtn: {
    marginTop: rs(10),
    alignSelf: 'stretch',
    height: rs(34),
    borderRadius: rd.radius.sm,
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packetBtnText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(11.5),
    color: rd.color.primary,
  },

  // ── Xarid modali (SS11) — orqa fon qorong'ilashadi (blur-effekt), oq karta ──
  payOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(22),
  },
  payCard: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.xl ?? rs(22),
    padding: rs(18),
  },
  payHead: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(10) },
  payTitle: { fontFamily: rd.font.bold, fontSize: rs(16.5), color: rd.color.text },
  paySub: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
  payRows: {
    marginTop: rs(16),
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.md,
    paddingHorizontal: rs(14),
  },
  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: rs(12),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  payRowLast: { borderBottomWidth: 0 },
  payRowLabel: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textSecondary },
  payRowVal: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  payNote: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    lineHeight: rs(17),
    marginTop: rs(12),
  },
  payBtns: { flexDirection: 'row', gap: rs(10), marginTop: rs(18) },
  payCancel: {
    flex: 1,
    height: rs(48),
    borderRadius: rd.radius.md,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payCancelText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.textSecondary },
  payConfirm: {
    flex: 1.4,
    height: rs(48),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payConfirmText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.onPrimary },
});
