/**
 * DrawerMenu.tsx — Burger menyu (RD/Menyu) redizayni.
 * Figma: ZeroX Mobile App — UI/UX (node 390:622).
 *
 * Real ma'lumot: state.HomeReducer.user (ism, telefon, balans).
 * Har menyu tugmasi tegishli ekranga o'tadi. Tizimdan chiqish bu yerda EMAS —
 * u profil (avatar) sahifasida; menyu pastida esa ijtimoiy tarmoqlar turadi.
 */
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { t } from 'i18next';
import i18n from '../../../i18n';
import { Linking, Platform, Share } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { showModal } from '../../../store/reducers/HomeReducer';
import { rd, rs } from '../../../theme/rd';
import { sortText } from '../../components/StatisticCard';
// Eski ilovadagi logotip + shior — shior SVG'ning O'ZIDA, tilga qarab
// alohida aktiv. Alohida <Text> bilan yozilgan shior harf oralig'i va
// joylashuvi bo'yicha aslidan farq qilardi.
import LogoAndShior from '../../../images/LogoAndShior';
import LogoKR from '../../../images/drawer/KrLogo';
import LogoRU from '../../../images/drawer/RuLogo';
import Facebook from '../../../images/social/facebook.svg';
import Instagram from '../../../images/social/instagram.svg';
import Telegram from '../../../images/social/telegram.svg';
import Youtube from '../../../images/social/youtube.svg';
import TwitterIcon from '../../../images/twitter';
import {
  CoinIcon,
  HelpIcon,
  IconProps,
  InfoIcon,
  MessageIcon,
  QrIcon,
  ShareIcon,
  WalletIcon,
} from './icons';

/**
 * Ijtimoiy tarmoqlar — havolalar eski ilovaning drawer ekranidan 1:1 olindi
 * (o'ylab topilmagan). X/Twitter ikonasi yagona monoxrom shakl bo'lgani uchun
 * brend rangli doira ichida beriladi, qolganlari o'z rangida.
 */
const SOCIALS: {
  key: string;
  url: string;
  Icon: any;
  filled?: boolean;
}[] = [
  { key: 'fb', url: 'https://m.facebook.com/ZeroxUZ/?wtsid=rdr_0l15a0hwRSQsgzZtE', Icon: Facebook },
  { key: 'ig', url: 'https://www.instagram.com/zeroxuz', Icon: Instagram },
  { key: 'tg', url: 'https://t.me/zeroxuz', Icon: Telegram },
  { key: 'x', url: 'https://x.com/zeroxuz', Icon: TwitterIcon, filled: true },
  { key: 'yt', url: 'https://www.youtube.com/@zeroxuz', Icon: Youtube },
];

/** Logotip + shior — interfeys tiliga mos aktiv (eski ilovadagi kabi). */
const BrandMark = () => {
  const lang = i18n.language;
  if (lang === 'kr') return <LogoKR width={rs(150)} height={rs(140)} />;
  if (lang === 'ru') return <LogoRU width={rs(150)} height={rs(140)} />;
  return <LogoAndShior width={rs(126)} height={rs(116)} />;
};

type Item = {
  key: string;
  label: string;
  Icon: (p: IconProps) => JSX.Element;
  route?: string;
  params?: object; // oddiy navigatsiya uchun qo'shimcha parametrlar
  tab?: string; // pastki tab'ga o'tish (BottomTabNavigator ichidagi ekran)
  gated?: boolean; // is_active tekshiruvi + {user} param (aks holda modal)
  needsUser?: boolean; // {user} param kerak, lekin is_active gate'siz (har doim ochiladi)
  action?: 'share'; // navigatsiya emas, amal (masalan ilovani ulashish)
  active?: boolean;
  soon?: boolean; // "Tez kunda" — bosilmaydi, o'ngda badge
};

// Web sayt sidebar'iga mos menyu (aynan shu tartib + ikonalar):
//  - tab: BottomTabNavigator ichidagi ekran (Home)
//  - needsUser: {user} param (UserScreen), gate'siz
//  - soon: "Tez kunda" — disabled, o'ngda badge
//  - aks holda: param-free ekran (route bo'yicha navigatsiya)
// ESKI ILOVA MENYUSIGA MOSLANDI. Qarz shartnomasi / Qarz daftari / Shaxsiy
// moliya / Bosh sahifa endi PASTKI PANELDA — shuning uchun menyudan olib
// tashlandi. Menyuda faqat yordamchi bo'limlar qoladi (eski ilovadagidek).
const MENU: Item[] = [
  { key: 'qr', label: 'QR-kod', Icon: QrIcon, route: 'QrCode' },
  { key: 'yoriqnoma', label: "Foydalanish yo'riqnomasi", Icon: HelpIcon, route: 'UseTerm' },
  { key: 'share', label: 'Ilovani ulashish', Icon: ShareIcon, action: 'share' },
  { key: 'support', label: "Qo'llab-quvvatlash xizmati", Icon: MessageIcon, route: 'Support' },
  // Tariflar `Types` ekrani tarif PDF'ini (pdf.zerox.uz/tarif_<til>.pdf) ochadi.
  { key: 'tariflar', label: 'Tariflar', Icon: CoinIcon, route: 'Types' },
  { key: 'about', label: 'Ilova haqida', Icon: InfoIcon, route: 'AboutMe' },
];

// SOZLAMALAR menyudan olib tashlandi — uning barcha funksiyalari endi bosh
// sahifadagi avatar bosilganda ochiladigan sahifada (UserScreen). Shu sababli
// bu yerda alohida band ham, pastki blokdagi qatori ham yo'q.

// HeaderGradient olib tashlandi — sarlavha endi och fonli brend bloki
// (rasmiy logotip och fon uchun mo'ljallangan, gradient ustida ko'rinmasdi).

const DrawerMenu = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.HomeReducer);
  const data = user?.data;

  // fullName / phone olib tashlandi — sarlavhada endi foydalanuvchi ismi emas,
  // rasmiy logotip turadi (profil ma'lumotlari Sozlamalar sahifasida).
  const balance = data?.balance != null ? sortText(data.balance) : '0';

  const close = () => navigation.closeDrawer?.();

  // Ilovani ulashish — havolalar eski ilovadan (o'ylab topilmagan).
  const onShare = async () => {
    try {
      const link =
        Platform.OS === 'android'
          ? 'https://play.google.com/store/apps/details?id=com.zeroxuz'
          : 'https://apps.apple.com/uz/app/zerox/id6446497826';
      await Share.share({ message: link, url: link, title: 'Ishonch kafolati' });
    } catch (e) {
      // ulashish bekor qilindi — jim o'tamiz.
    }
  };

  const go = (item: Item) => {
    close();
    // Amal (navigatsiya emas) — masalan ilovani ulashish.
    if (item.action === 'share') {
      onShare();
      return;
    }
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



  return (
    <View style={styles.panel}>
      {/* Brend sarlavhasi — "JQ" avatar + ism/telefon o'rniga RASMIY logotip.
          Fon och (ilgari ko'k gradient edi): logo.svg trademark ranglari
          (#2D62B6 ko'k, #FE5E58 marjon) och fon uchun mo'ljallangan — ko'k
          gradient ustida logotipning ko'k qismi yo'qolib ketardi. Ilovaning
          barcha auth ekranlarida ham logotip aynan och fonda ko'rsatiladi,
          shuning uchun brend ko'rinishi bir xil bo'ladi. */}
      <View style={styles.brandHeader}>
        <BrandMark />
      </View>

      {/* Mobil hisob */}
      <View style={styles.accountWrap}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.accountCard}
          onPress={() => go({ key: 'acc', label: '', Icon: CoinIcon, route: 'UserMoneyResult', gated: true })}
        >
          <View style={styles.coinChip}>
            <WalletIcon size={rs(20)} color={rd.color.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.accountLabel}>Mobil hisob</Text>
            {/* "so'm" -> "UZS"; shrift kichraytirildi (juda katta edi). */}
            <Text style={styles.accountValue}>{balance} UZS</Text>
          </View>
          {/* "+" (to'ldirish) ikonasi OLIB TASHLANDI (so'rov bo'yicha). */}
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
                {/* Ikonalar ham KO'K (matn bilan bir xil) — so'rov bo'yicha. */}
                <item.Icon size={rs(22)} color={active ? rd.color.onPrimary : soon ? rd.color.textTertiary : rd.color.primary} />
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

      {/*
        Pastki blok: FAQAT ijtimoiy tarmoqlar (versiya matni olib tashlandi).
        "Chiqish" bu yerdan olib tashlangan — u profil (avatar) sahifasida bor.
      */}
      <View style={styles.bottom}>
        {/* Ijtimoiy ikonalar ustidagi ajratuvchi chiziq OLIB TASHLANDI. */}
        <View style={styles.socialRow}>
          {SOCIALS.map(item => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.8}
              style={[styles.socialBtn, item.filled && styles.socialBtnFilled]}
              onPress={() => Linking.openURL(item.url)}
            >
              <item.Icon width={rs(item.filled ? 22 : 38)} height={rs(item.filled ? 22 : 38)} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

export default DrawerMenu;

const styles = StyleSheet.create({
  panel: { flex: 1, backgroundColor: rd.color.surface, overflow: 'hidden' },

  // Brend sarlavha — och fon (rasmiy logotip aynan shunday fonda to'g'ri
  // ko'rinadi; eski gradient + avatar + ism/telefon bloki olib tashlandi).
  // Logotip ostidagi ajratuvchi chiziq OLIB TASHLANDI (so'rov bo'yicha).
  brandHeader: {
    paddingHorizontal: rs(22),
    paddingTop: rs(26),
    paddingBottom: rs(18),
    alignItems: 'center',
    gap: rs(4),
    backgroundColor: rd.color.surface,
  },
  // Ijtimoiy ikonalar KATTAROQ va zichroq — ular orasidagi katta bo'shliq yo'qoladi.
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: rs(10),
    paddingVertical: rs(10),
  },
  socialBtn: { alignItems: 'center', justifyContent: 'center' },
  // X (Twitter) doirasi qolgan 4 ta ikona bilan BIR XIL ko'k (#4e91d2) —
  // ilgari brend ko'ki (primary) edi va farq qilib turardi.
  socialBtnFilled: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: '#4e91d2',
  },
  brandTagline: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
  },

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
  accountValue: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text, marginTop: 2 },
  topup: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Menyu — bandlar orasi kattaroq, butun bo'sh joyni to'ldiradi (flexGrow +
  // space-between): mobil hisob va socials orasida ortiqcha bo'shliq qolmaydi.
  menuList: {
    paddingHorizontal: rs(14),
    paddingVertical: rs(16),
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(14),
    height: rs(54),
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
  // Matn KO'K (so'rov bo'yicha). Shrift biroz kichraytirildi — "Qo'llab-
  // quvvatlash xizmati" so'z o'rtasidan sinmasdan, so'z chegarasida yopishsin.
  rowLabel: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(14), color: rd.color.primary },
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
