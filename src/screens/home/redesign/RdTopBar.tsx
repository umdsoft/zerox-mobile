/**
 * RdTopBar.tsx — 5 ta ASOSIY bo'lim uchun YAGONA yuqori panel.
 *
 * SS7 (2026-09-18): ilgari faqat BOSH SAHIFAda chap tomonda menyu tugmasi va
 * o'ngda qo'ng'iroq + avatar bor edi; qolgan 4 bo'lim (Qarz shartnomasi, Qarz
 * daftari, Shaxsiy qarz, Shaxsiy moliya) esa oddiy sarlavha bilan ochilardi.
 * Natijada foydalanuvchi bildirishnomaga yoki shaxsiy kabinetga o'tish uchun
 * har safar Bosh sahifaga qaytishga majbur bo'lardi.
 *
 * Endi beshala bo'lim bir xil panelga ega:
 *   [☰ menyu]   ZeroX (faqat Bosh sahifada) / bo'lim nomi   [🔔 badge] [avatar]
 *
 * ⚠️ Sarlavha o'lchami EKRANGA moslashadi (`rs()` masshtabi + tor ekranda
 * `adjustsFontSizeToFit`), shuning uchun katta ekranda yirik, kichik telefonda
 * ixcham ko'rinadi — barcha bo'limlarda BIR XIL qoida.
 */
import { DrawerActions, useNavigation } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { rd, rs } from '../../../theme/rd';
import ZeroXWordmark from '../../../images/TextAndLogo';
import { BellIcon, MenuIcon, UserIcon } from './icons';

const GradientBg = () => (
  <Svg style={StyleSheet.absoluteFill as any}>
    <Defs>
      <LinearGradient id="rdTopAv" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#2f6fed" />
        <Stop offset="1" stopColor="#7c5cff" />
      </LinearGradient>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" rx="999" fill="url(#rdTopAv)" />
  </Svg>
);

type Props = {
  /** Bo'lim nomi. Berilmasa — Bosh sahifadagi "ZeroX" logotipi chiziladi. */
  title?: string;
  /** O'qilmagan bildirishnomalar soni. Berilmasa — do'kondan O'ZI o'qiydi. */
  badge?: number;
};

const RdTopBar = ({ title, badge }: Props) => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  // Bildirishnoma soni Bosh sahifadagi bilan AYNAN bir manbadan olinadi
  // (`HomeReducer.notification.bild`) — har bo'lim uni alohida uzatmasligi uchun.
  const storeBadge = useSelector(
    (st: any) => st?.HomeReducer?.notification?.bild?.length || 0,
  );
  const count = typeof badge === 'number' ? badge : storeBadge;

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.menuBtn}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          accessibilityLabel={t('Menyu')}>
          <MenuIcon color={rd.color.text} size={rs(24)} />
        </TouchableOpacity>
        {title ? (
          <Text
            style={styles.title}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}>
            {title}
          </Text>
        ) : (
          <ZeroXWordmark
            width={rs(90)}
            height={rs(30)}
            viewBox="0 250 4000 1300"
            fill="#0063B6"
            color="#FF2D2D"
          />
        )}
      </View>

      <View style={styles.right}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.iconBtn}
          onPress={() => navigation.navigate('Notification')}
          accessibilityLabel={t('Bildirishnomalar')}>
          <BellIcon color={rd.color.text} size={rs(24)} />
          {count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText} allowFontScaling={false} numberOfLines={1}>
                {count > 99 ? '99+' : count}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.avatar}
          onPress={() => navigation.navigate('UserScreen')}
          accessibilityLabel={t('Shaxsiy kabinet')}>
          <GradientBg />
          <UserIcon color={rd.color.onPrimary} size={rs(20)} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RdTopBar;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(16),
    paddingTop: rs(8),
    paddingBottom: rs(10),
    backgroundColor: rd.color.page,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: rs(10), flex: 1, minWidth: 0 },
  menuBtn: { width: rs(32), height: rs(32), alignItems: 'center', justifyContent: 'center' },
  // SS7: sarlavha o'lchami barcha bo'limlarda BIR XIL.
  title: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(18), color: rd.color.text },
  right: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  iconBtn: { width: rs(34), height: rs(34), alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: rs(1),
    right: rs(1),
    minWidth: rs(16),
    height: rs(16),
    borderRadius: rs(8),
    paddingHorizontal: rs(3),
    backgroundColor: rd.color.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: rd.font.bold, fontSize: rs(9), color: '#fff' },
  avatar: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
