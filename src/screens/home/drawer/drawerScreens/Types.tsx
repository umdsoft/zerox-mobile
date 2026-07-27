import {
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
import { t } from 'i18next';

import { rd, rs } from '../../../../theme/rd';
import { URL } from '../../../constants';
import { useFetch } from '../../../../hooks/useFetch';
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

// ── Qo'shimcha SMS paketlar. ──
const SMS_PACKETS = [
  { sms: '100', price: '21 000' },
  { sms: '200', price: '40 000' },
  { sms: '300', price: '57 000' },
];

const Types = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.HomeReducer);

  // Mobil hisob balansi — REAL (/user/me). Redux'dagi qiymat zaxira sifatida.
  const me = useFetch({ method: 'GET', url: URL + '/user/me' });
  const balance =
    Number((me.data as any)?.data?.balance ?? user?.data?.balance ?? 0) || 0;

  // Obuna/paket sotib olish oqimi ilovada hali ulanmagan — halol "tez kunda".
  const soon = () =>
    Toast.show({
      autoHide: true,
      visibilityTime: 2200,
      position: 'bottom',
      type: 'omad',
      props: { title: 'Tez kunda', desc: 'To‘lov ilovaga tez kunda qo‘shiladi' },
    });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('117')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Qarz daftari va qarz shartnomasi bo‘yicha narxlar
        </Text>

        {/* ══ SMS balans (ENG TEPADA — saytdagidek) ══ */}
        <View style={styles.smsCard}>
          <View style={styles.smsTop}>
            <View style={styles.smsStar}>
              <StarIcon size={rs(16)} color="#f5a623" />
            </View>
            <View style={{ flex: 1 }}>
              <Text allowFontScaling={false} style={styles.smsLabel}>
                Joriy tarif
              </Text>
              <Text allowFontScaling={false} style={styles.smsPlan}>
                Free
              </Text>
            </View>
            <View style={styles.smsCountWrap}>
              <Text allowFontScaling={false} style={styles.smsCount}>
                100
              </Text>
              <Text allowFontScaling={false} style={styles.smsCountLabel}>
                SMS
              </Text>
            </View>
          </View>
          <View style={styles.smsBarTrack}>
            <View style={styles.smsBarFill} />
          </View>
          <Text allowFontScaling={false} style={styles.smsHint}>
            SMS bildirishnomalar uchun Start yoki Premium tarifni tanlang
          </Text>
          <TouchableOpacity activeOpacity={0.7} onPress={soon} style={styles.smsHistoryBtn}>
            <MessageIcon size={rs(15)} color={rd.color.primary} />
            <Text allowFontScaling={false} style={styles.smsHistoryText}>
              SMS xabarlar tarixi
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
              Qarz daftari tariflari
            </Text>
            <Text allowFontScaling={false} style={styles.cardSub}>
              Obuna asosida · SMS bildirishnomalar bilan
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
              {tar.sms}
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
                    {f.label}
                  </Text>
                </View>
              ))}
            </View>

            {tar.current ? (
              <View style={styles.currentBtn}>
                <Text allowFontScaling={false} style={styles.currentText}>
                  Joriy tarif
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={soon}
                style={[styles.joinBtn, { backgroundColor: tar.accent }]}>
                <Text allowFontScaling={false} style={styles.joinText}>
                  Ulanish
                </Text>
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
              Qo‘shimcha SMS paketlar
            </Text>
            <Text allowFontScaling={false} style={styles.cardSub}>
              SMS tugasa, tarifni o‘zgartirmasdan qo‘shimcha oling
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
                onPress={soon}
                style={styles.packetBtn}>
                <Text allowFontScaling={false} style={styles.packetBtnText}>
                  Sotib olish
                </Text>
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
                Qarz shartnomasi tariflari
              </Text>
            </View>
          </View>

          <View style={styles.contractRow}>
            <View style={styles.contractDot}>
              <CheckIcon size={rs(15)} color={rd.color.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text allowFontScaling={false} style={styles.contractLabel}>
                Bepul shartnomalar
              </Text>
              <Text
                allowFontScaling={false}
                style={[styles.contractValue, { color: rd.color.success }]}>
                Mutlaqo bepul
              </Text>
              <Text allowFontScaling={false} style={styles.contractNote}>
                Barcha foydalanuvchilarga qarz berishda
              </Text>
            </View>
          </View>

          <View style={styles.contractRow}>
            <View style={[styles.contractDot, { backgroundColor: rd.color.primaryTint }]}>
              <CoinIcon size={rs(15)} color={rd.color.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text allowFontScaling={false} style={styles.contractLabel}>
                Shartnoma narxi
              </Text>
              <View style={styles.priceLine}>
                <Text allowFontScaling={false} style={styles.priceTerm}>
                  1 mln so‘mgacha
                </Text>
                <Text allowFontScaling={false} style={styles.priceVal}>
                  1 000 UZS
                </Text>
              </View>
              <View style={styles.priceLine}>
                <Text allowFontScaling={false} style={styles.priceTerm}>
                  1 mln – 100 mln so‘m
                </Text>
                <Text allowFontScaling={false} style={styles.priceVal}>
                  0.1%
                </Text>
              </View>
              <View style={styles.priceLine}>
                <Text allowFontScaling={false} style={styles.priceTerm}>
                  100 mln so‘mdan ortiq
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
                  Mobil hisob balansingiz
                </Text>
                <Text allowFontScaling={false} style={styles.balanceValue}>
                  {groupDigits(balance)} so‘m
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('PayScreen')}
              style={styles.topUpBtn}>
              <Text allowFontScaling={false} style={styles.topUpText}>
                To‘ldirish
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    fontSize: rs(18),
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
});
