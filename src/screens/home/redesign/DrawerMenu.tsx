/**
 * DrawerMenu.tsx — Burger menyu (RD/Menyu) redizayni.
 * Figma: ZeroX Mobile App — UI/UX (node 390:622).
 *
 * Real ma'lumot: state.HomeReducer.user (ism, telefon, balans).
 * Har menyu tugmasi tegishli ekranga o'tadi; "Chiqish" — tizimdan chiqadi.
 */
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { t } from 'i18next';
import { getVersion } from 'react-native-device-info';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useDispatch, useSelector } from 'react-redux';
import { showModal } from '../../../store/reducers/HomeReducer';
import { storage } from '../../../store/api/token/getToken';
import { rd, rs } from '../../../theme/rd';
import { sortText } from '../../components/StatisticCard';
import {
  CoinIcon,
  GridIcon,
  HelpIcon,
  HomeIcon,
  IconProps,
  LogOutIcon,
  MessageIcon,
  PlusIcon,
  SearchIcon,
  SunSettingsIcon,
  TransferIcon,
} from './icons';

type Item = {
  key: string;
  label: string;
  Icon: (p: IconProps) => JSX.Element;
  route?: string;
  params?: object; // oddiy navigatsiya uchun qo'shimcha parametrlar
  tab?: string; // pastki tab'ga o'tish (BottomTabNavigator ichidagi ekran)
  gated?: boolean; // is_active tekshiruvi + {user} param (aks holda modal)
  needsUser?: boolean; // {user} param kerak, lekin is_active gate'siz (har doim ochiladi)
  active?: boolean;
  soon?: boolean; // "Tez kunda" — bosilmaydi, o'ngda badge
};

// Web sayt sidebar'iga mos menyu (aynan shu tartib + ikonalar):
//  - tab: BottomTabNavigator ichidagi ekran (Home)
//  - needsUser: {user} param (UserScreen), gate'siz
//  - soon: "Tez kunda" — disabled, o'ngda badge
//  - aks holda: param-free ekran (route bo'yicha navigatsiya)
const MENU: Item[] = [
  { key: 'home', label: 'Bosh sahifa', Icon: HomeIcon, tab: 'Home', active: true },
  { key: 'qarz-shartnoma', label: 'Qarz shartnomasi', Icon: TransferIcon, route: 'QarzShartnomasi' },
  { key: 'qarz-daftari', label: 'Qarz daftari', Icon: GridIcon, route: 'QarzDaftari' },
  { key: 'moliya', label: 'Shaxsiy moliya', Icon: CoinIcon, route: 'ShaxsiyMoliya' },
  { key: 'qr', label: 'QR-kod', Icon: SearchIcon, route: 'QrCode' },
  { key: 'yoriqnoma', label: "Foydalanish yo'riqnomasi", Icon: HelpIcon, route: 'UseTerm' },
  { key: 'support', label: "Qo'llab-quvvatlash xizmati", Icon: MessageIcon, route: 'Support' },
  { key: 'tariflar', label: 'Tariflar', Icon: CoinIcon, soon: true },
];

// Mobil'ga xos qo'shimcha (web'da yo'q, pastda alohida).
const SETTINGS: Item = { key: 'settings', label: 'Sozlamalar', Icon: SunSettingsIcon, route: 'UserScreen', needsUser: true };

const HeaderGradient = () => (
  <Svg style={StyleSheet.absoluteFill}>
    <Defs>
      <LinearGradient id="drawerGrad" x1="0.05" y1="0" x2="0.85" y2="1">
        <Stop offset="0" stopColor={rd.color.gradient[0]} />
        <Stop offset="1" stopColor={rd.color.gradient[1]} />
      </LinearGradient>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" fill="url(#drawerGrad)" />
  </Svg>
);

const DrawerMenu = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.HomeReducer);
  const data = user?.data;

  const fullName =
    [data?.first_name, data?.last_name].filter(Boolean).join(' ') || 'Foydalanuvchi';
  const phone = data?.phone ? String(data.phone) : '';
  const balance = data?.balance != null ? sortText(data.balance) : '0';

  const close = () => navigation.closeDrawer?.();

  const go = (item: Item) => {
    close();
    // Pastki tab (masalan Statistika) — BottomTabNavigator ichidagi ekranga o'tamiz.
    if (item.tab) {
      navigation.navigate('BottomTabNavigator', { screen: item.tab });
      return;
    }
    if (!item.route) return;
    // gated ekranlar user param kutadi + faqat aktiv foydalanuvchiga (aks holda modal).
    if (item.gated) {
      if (data?.is_active === 1) {
        navigation.navigate(item.route, { user: data });
      } else {
        dispatch(showModal({ show: true }));
      }
    } else if (item.needsUser) {
      // {user} param kutadigan ekran (gate'siz) — masalan Sozlamalar.
      navigation.navigate(item.route, { user: data });
    } else {
      navigation.navigate(item.route, item.params);
    }
  };

  const doLogout = () => {
    storage.clearAll();
    navigation.reset({ index: 0, routes: [{ name: 'SelectLanguageScreen' }] });
  };

  const logout = () => {
    // Avval menyuni yopamiz, so'ng tasdiq so'raymiz — foydalanuvchi tasodifan
    // chiqib ketmasin (oldin so'ramasdan darhol chiqarardi).
    close();
    Alert.alert(
      t('Chiqish'),
      t('Profildan chiqmoqchimisiz?'),
      [
        { text: t('Bekor qilish'), style: 'cancel' },
        { text: t('Chiqish'), style: 'destructive', onPress: doLogout },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={styles.panel}>
      {/* Profil sarlavhasi (gradient) */}
      <View style={styles.header}>
        <HeaderGradient />
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(data?.first_name?.[0] ?? 'U') + (data?.last_name?.[0] ?? 'J')}
          </Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>{fullName}</Text>
        {phone ? <Text style={styles.phone}>{phone}</Text> : null}
      </View>

      {/* Mobil hisob */}
      <View style={styles.accountWrap}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.accountCard}
          onPress={() => go({ key: 'acc', label: '', Icon: CoinIcon, route: 'UserMoneyResult', gated: true })}
        >
          <View style={styles.coinChip}>
            <CoinIcon size={rs(20)} color={rd.color.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.accountLabel}>Mobil hisob</Text>
            <Text style={styles.accountValue}>{balance} so‘m</Text>
          </View>
          <View style={styles.topup}>
            <PlusIcon size={rs(16)} color={rd.color.onPrimary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Menyu ro'yxati */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.menuList} showsVerticalScrollIndicator={false}>
        {MENU.map(item => {
          const active = !!item.active;
          const soon = !!item.soon;
          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={soon ? 1 : 0.8}
              disabled={soon}
              style={[styles.row, active && styles.rowActive]}
              onPress={() => (active ? close() : go(item))}
            >
              <View style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}>
                <item.Icon size={rs(22)} color={active ? rd.color.onPrimary : soon ? rd.color.textTertiary : rd.color.textSecondary} />
              </View>
              <Text style={[styles.rowLabel, active && styles.rowLabelActive, soon && styles.rowLabelSoon]}>{item.label}</Text>
              {soon ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Tez kunda</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Pastki blok: Sozlamalar + Chiqish + versiya */}
      <View style={styles.bottom}>
        <View style={styles.divider} />
        <TouchableOpacity activeOpacity={0.8} style={styles.row} onPress={() => go(SETTINGS)}>
          <View style={[styles.chip, styles.chipInactive]}>
            <SETTINGS.Icon size={rs(22)} color={rd.color.textSecondary} />
          </View>
          <Text style={styles.rowLabel}>{SETTINGS.label}</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} style={styles.row} onPress={logout}>
          <View style={[styles.chip, { backgroundColor: rd.color.errorBg }]}>
            <LogOutIcon size={rs(22)} color={rd.color.error} />
          </View>
          <Text style={[styles.rowLabel, { color: rd.color.error }]}>Chiqish</Text>
        </TouchableOpacity>
        <Text style={styles.version}>ZeroX · {getVersion()}</Text>
      </View>
    </View>
  );
};

export default DrawerMenu;

const styles = StyleSheet.create({
  panel: { flex: 1, backgroundColor: rd.color.surface, overflow: 'hidden' },

  // Profil sarlavha
  header: { paddingHorizontal: rs(22), paddingTop: rs(22), paddingBottom: rs(22), gap: rs(12), overflow: 'hidden' },
  avatar: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    backgroundColor: rd.color.primaryStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: rd.font.bold, fontSize: rs(20), color: rd.color.onPrimary },
  name: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.onPrimary },
  phone: { fontFamily: rd.font.regular, fontSize: rs(13), color: 'rgba(255,255,255,0.8)' },

  // Mobil hisob
  accountWrap: { paddingHorizontal: rs(14), paddingTop: rs(14) },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.primaryTint,
    borderRadius: rs(16),
    padding: rs(14),
  },
  coinChip: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountLabel: { fontFamily: rd.font.medium, fontSize: rs(11), color: rd.color.textSecondary },
  accountValue: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text, marginTop: 2 },
  topup: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Menyu
  menuList: { padding: rs(14), gap: rs(4) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(14),
    height: rs(50),
    paddingHorizontal: rs(12),
    borderRadius: rs(14),
  },
  rowActive: { backgroundColor: rd.color.primaryTint },
  chip: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: rd.color.primary },
  chipInactive: { backgroundColor: rd.color.surfaceAlt },
  rowLabel: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(15), color: rd.color.text },
  rowLabelActive: { fontFamily: rd.font.semibold, color: rd.color.primary },
  rowLabelSoon: { color: rd.color.textTertiary },
  badge: {
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
    borderRadius: rs(8),
    backgroundColor: rd.color.primaryTint,
  },
  badgeText: { fontFamily: rd.font.medium, fontSize: rs(10), color: rd.color.primary },

  // Pastki blok
  bottom: { paddingHorizontal: rs(14), paddingTop: rs(8), paddingBottom: rs(16), gap: rs(10) },
  divider: { height: 1, backgroundColor: rd.color.border },
  version: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary, paddingLeft: rs(12), paddingTop: rs(2) },
});
