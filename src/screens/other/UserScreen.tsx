import {
  ActivityIndicator,
  Image,
  Modal as RNModal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import React, {useCallback, useState} from 'react';
import {normalize, style} from '../../theme/style';
import {rd, rs} from '../../theme/rd';
import {
  UserIcon,
  ChevronRight,
  ShieldIcon,
  HelpIcon,
  LogOutIcon,
  CoinIcon,
  ManIcon,
  WomanIcon,
  CheckIcon,
} from '../home/redesign/icons';

// O'zbek ismidan jinsni taxmin qilish (profil avatari uchun).
const isFemaleUser = (name?: string) => {
  const n = (name || '').toLowerCase();
  if (/qizi/.test(n)) return true;
  if (/o.?g.?li|ug.?li/.test(n)) return false;
  return /(ova|eva|yeva)(\s|$)/.test(n);
};
import messaging from '@react-native-firebase/messaging';
import {useNavigation, useRoute} from '@react-navigation/native';
import {storage} from '../../store/api/token/getToken';
import ProfileIcon from '../../images/Profile';
import ContractIcon from '../../images/Contract';
import SecurityIcon from '../../images/Security';
import LanguageIcon from '../../images/Language';
import ExitIcon from '../../images/Exit';
import Person from '../../images/home/person';
import Juridic from '../../images/home/juridic';
import ScreenLayout from '../components/ScreenLayout';
import RdHeader from '../home/redesign/RdHeader';
import {useDispatch, useSelector} from 'react-redux';
import {
  checkUpdate,
  setEmptyUser,
  setNotification,
  showModal,
} from '../../store/reducers/HomeReducer';
import Famale from '../../images/Famale';
import MainText from '../components/MainText';
import {colors} from '../../theme/colors';
import {fontSize} from '../../theme/font';
// import {t} from 'i18next';
import {useTranslation} from 'react-i18next';
import {URL} from '../constants';
import notifee from '@notifee/react-native';
import {NotificationBadgeModule} from '../../nativemodule/notificationBadge';
import socketService from '../../helper/socketService';
import Main from '../home/Main';
import {expire_passport_check} from '../../helper/timeChecker';

const UserScreen = () => {
  const route = useRoute();
  const {user: routeUser} = route.params || {};
  // Redux — ishonchli manba (asosiy sahifada foydalanuvchi allaqachon yuklangan).
  const reduxUser = useSelector((state: any) => state.HomeReducer?.user);
  // SHAKL NORMALIZATSIYASI. Bu ekran `user = {data: {...}}` shaklini kutadi,
  // lekin chaqiruvchilar turlicha uzatadi:
  //   - Header: {data:{...}}  (to'g'ri)
  //   - Asosiy sahifa: storeUser.data = {...}  (ICHKI data — .data yo'q edi ->
  //     ism/ma'lumot bo'sh chiqardi)
  //   - ChangeEmail/ChangePasswordRetry: umuman uzatmaydi
  // Barchasini bitta ko'rinishga keltiramiz (aks holda redux'dan olamiz).
  const user = routeUser?.data
    ? routeUser
    : routeUser
    ? {data: routeUser}
    : reduxUser;
  const dispatch = useDispatch();
  const {t} = useTranslation();
  const [hide, setHide] = useState(false);
  const navigation = useNavigation();
  const navigateScreen = useCallback(
    name => {
      navigation.navigate(name);
    },
    [navigation],
  );

  const onCheckIsActive = useCallback(() => {
    if (user.data.is_active === 1) {
      navigateScreen('UserDetails');
    } else {
      dispatch(showModal({show: true}));
    }
  }, [navigateScreen, user]);

  // console.log(
  //   `https://pdf.zerox.uz/oferta.php?id=${user.data.uid}&lang=uz&download=0`,
  // );

  // const onLastTime = useCallback(async () => {
  //   const device_id = await getUniqueId();
  //   // dispatch(onListTimePostAction({device_id}));
  // }, []);

  const deleteToken = useCallback(async () => {
    // await dispatch(setNotification({notification: []}));
    dispatch(checkUpdate({update: false}));
    socketService.disconnect();
    await messaging().deleteToken();
  }, []);

  const isIndividual = user?.data?.type === 2;
  const displayName = isIndividual
    ? `${user?.data?.first_name || ''} ${user?.data?.last_name || ''}`.trim()
    : user?.data?.company || user?.data?.director || '';
  const displaySub = isIndividual
    ? user?.data?.middle_name || user?.data?.phone || ''
    : user?.data?.director || '';
  const initials = (() => {
    if (isIndividual) {
      const a = (user?.data?.first_name || '')[0] || '';
      const b = (user?.data?.last_name || '')[0] || '';
      return (a + b).toUpperCase() || 'U';
    }
    return ((user?.data?.company || 'Z')[0] || 'Z').toUpperCase();
  })();
  const showPassportCta =
    user?.data?.is_active !== 0 &&
    expire_passport_check(user?.data?.expiry_date);

  const Row = ({icon, label, onPress, last}: any) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.row, last && styles.rowLast]}>
      <View style={styles.rowIconWrap}>{icon}</View>
      <Text style={styles.rowLabel} numberOfLines={1}>
        {label}
      </Text>
      <ChevronRight size={rs(20)} color={rd.color.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('807')} />
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}>
        {/* Profile header card */}
        <View style={styles.profileCard}>
          {/* "Z" bosh harfi O'RNIGA — jinsga mos odam avatari (ism qo'shimchasi:
              "qizi"->ayol, "o'g'li"->erkak, "-ova/eva"->ayol; aks holda erkak). */}
          <View style={styles.avatar}>
            {isFemaleUser(
              `${displayName} ${user?.data?.middle_name || ''}`,
            ) ? (
              <WomanIcon size={rs(48)} color={rd.color.primary} />
            ) : (
              <ManIcon size={rs(48)} color={rd.color.primary} />
            )}
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName} numberOfLines={1}>
              {displayName}
            </Text>
            {/* OTCHESTVA (middle_name) O'RNIGA — tasdiq holati belgisi:
                identifikatsiyadan o'tgan (is_active === 1) bo'lsa YASHIL
                "Tasdiqlangan foydalanuvchi" (galochka bilan), aks holda sariq
                "Tasdiqlanmagan foydalanuvchi". */}
            {user?.data?.is_active === 1 ? (
              <View style={[styles.verifyChip, styles.verifyChipOk]}>
                <View style={styles.verifyDot}>
                  <CheckIcon size={rs(11)} color={rd.color.onPrimary} />
                </View>
                <Text style={[styles.verifyText, styles.verifyTextOk]} numberOfLines={1}>
                  {t('Tasdiqlangan foydalanuvchi')}
                </Text>
              </View>
            ) : (
              <View style={[styles.verifyChip, styles.verifyChipWarn]}>
                <Text style={[styles.verifyText, styles.verifyTextWarn]} numberOfLines={1}>
                  {t('Tasdiqlanmagan foydalanuvchi')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Unverified user CTA (preserves ScanFaceMyId flow) */}
        {user?.data?.is_active === 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              navigateScreen('ScanFaceMyId');
            }}
            style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>{t('747')}</Text>
          </TouchableOpacity>
        )}

        {/* Passport re-check CTA (preserves ChangePassportData flow) */}
        {showPassportCta && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              navigateScreen('ChangePassportData');
            }}
            style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>{t('747')}</Text>
          </TouchableOpacity>
        )}

        {/* Menu */}
        <View style={styles.menuCard}>
          <Row
            icon={<UserIcon size={rs(20)} color={rd.color.primary} />}
            label={t('810')}
            onPress={onCheckIsActive}
          />
          <View style={styles.divider} />
          <Row
            icon={<CoinIcon size={rs(20)} color={rd.color.primary} />}
            label={t('681')}
            onPress={() => {
              let lang = storage.getString('lang');
              navigation.navigate('Contract', {
                url: `https://pdf.zerox.uz/oferta.php?id=${user.data.uid}&lang=${lang}&download=0`,
                title: t('681'),
              });
            }}
          />
          <View style={styles.divider} />
          <Row
            icon={<HelpIcon size={rs(20)} color={rd.color.primary} />}
            label={t('til')}
            onPress={() => {
              navigateScreen('Language');
            }}
          />
          <View style={styles.divider} />
          <Row
            icon={<ShieldIcon size={rs(20)} color={rd.color.primary} />}
            label={t('816')}
            onPress={() => {
              navigateScreen('Security');
            }}
            last
          />
        </View>

        {/* Logout */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setHide(true);
            }}
            style={[styles.row, styles.rowLast]}>
            <View style={styles.rowIconWrapError}>
              <LogOutIcon size={rs(20)} color={rd.color.error} />
            </View>
            <Text style={[styles.rowLabel, styles.rowLabelError]}>
              {t('672')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <ExitModal
        hide={hide}
        setHide={setHide}
        navigation={navigation}
        deleteToken={deleteToken}
      />
    </View>
  );
};

const ExitModal = ({hide, setHide, navigation, deleteToken}) => {
  const {t} = useTranslation();
  const [loading, setLoading] = useState(false);

  const onLogOut = useCallback(async () => {
    try {
      setLoading(true);
      deleteToken()
        .then(async () => {
          if (Platform.OS === 'ios') {
            notifee.setBadgeCount(0).then(() => {});
          } else {
            NotificationBadgeModule.setBadgeOnlyNumber(0);
          }
          storage.clearAll();
          navigation.reset({
            routes: [{name: 'SelectLanguageScreen'}],
            index: 0,
          });
          setHide(false);
          setLoading(false);
        })
        .catch((error: any) => {
          // storage.clearAll();
          console.error('Error deleting token:', error);
          setHide(false);
          setLoading(false);
        });
      // await onLastTime();
    } catch (error) {
      // storage.clearAll();
      setLoading(false);
      console.error('Error during logout:', error);
    }
  }, [deleteToken, navigation, setHide]);

  return (
    <RNModal
      visible={hide}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setHide(false)}>
      {/* Qorong'i (xira) backdrop — orqa fon aniq ko'rinmasin. Tashqariga bosilsa yopiladi. */}
      <TouchableWithoutFeedback onPress={() => setHide(false)}>
        <View style={styles.exitBackdrop}>
          {/* Ichki bosishlar backdrop'ni yopmasin. */}
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.exitCard}>
              <View style={styles.exitIcon}>
                <LogOutIcon size={rs(26)} color={rd.color.error} />
              </View>
              <Text allowFontScaling={false} style={styles.exitTitle}>
                {t('672')}
              </Text>
              <Text allowFontScaling={false} style={styles.exitDesc}>
                {t('675')}
              </Text>
              <View style={styles.exitBtns}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setHide(false)}
                  style={styles.exitCancelBtn}>
                  <Text allowFontScaling={false} style={styles.exitCancelText}>
                    {t('21')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={loading}
                  activeOpacity={0.85}
                  onPress={onLogOut}
                  style={[
                    styles.exitConfirmBtn,
                    loading && styles.exitConfirmBtnDisabled,
                  ]}>
                  {loading ? (
                    <ActivityIndicator size="small" color={rd.color.onPrimary} />
                  ) : (
                    <Text allowFontScaling={false} style={styles.exitConfirmText}>
                      {t('672')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

export default UserScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: rd.color.page,
  },
  page: {
    flex: 1,
    backgroundColor: rd.color.page,
  },
  pageContent: {
    paddingHorizontal: rs(16),
    paddingTop: rs(12),
    paddingBottom: rs(28),
  },
  // VERTIKAL: avatar TEPADA (katta, markazda), ism/tasdiq PASTDA.
  profileCard: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingVertical: rs(22),
    paddingHorizontal: rs(16),
    marginBottom: rs(16),
  },
  avatar: {
    width: rs(92),
    height: rs(92),
    borderRadius: rs(46),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: rd.font.bold,
    fontSize: rs(30),
    color: rd.color.primary,
  },
  profileMeta: {
    alignItems: 'center',
    marginTop: rs(14),
  },
  // Ism KICHIKROQ (ilgari rs(18) — uzun FISH sig'masdi).
  profileName: {
    fontFamily: rd.font.bold,
    fontSize: rs(15.5),
    color: rd.color.text,
    textAlign: 'center',
  },
  profileSub: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    marginTop: rs(3),
  },
  // Tasdiq holati belgisi (yashil = tasdiqlangan, sariq = tasdiqlanmagan).
  verifyChip: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    marginTop: rs(9),
    borderRadius: rd.radius.pill,
    paddingLeft: rs(5),
    paddingRight: rs(12),
    paddingVertical: rs(4),
  },
  verifyChipOk: { backgroundColor: rd.color.successBg },
  verifyChipWarn: {
    backgroundColor: rd.color.warningBg,
    paddingLeft: rs(12),
  },
  verifyDot: {
    width: rs(18),
    height: rs(18),
    borderRadius: rs(9),
    backgroundColor: rd.color.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyText: { fontFamily: rd.font.semibold, fontSize: rs(11) },
  verifyTextOk: { color: rd.color.success },
  verifyTextWarn: { color: rd.color.warning },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: rs(8),
    backgroundColor: rd.color.warningBg,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
  },
  statusChipText: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.warning,
  },
  ctaButton: {
    backgroundColor: rd.color.primary,
    borderRadius: rd.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(13),
    marginBottom: rs(16),
  },
  ctaButtonText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14.5),
    color: rd.color.onPrimary,
  },
  menuCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    marginBottom: rs(16),
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: rs(56),
    paddingHorizontal: rs(14),
  },
  rowLast: {},
  rowIconWrap: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconWrapError: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    marginLeft: rs(12),
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
  },
  rowLabelError: {
    color: rd.color.error,
    fontFamily: rd.font.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: rd.color.border,
    marginLeft: rs(14) + rs(40) + rs(12),
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    height: normalize(40),
    backgroundColor: style.blue,
    borderRadius: 12,
  },
  brnCn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 20,
  },
  titlex: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
  },
  modal: {
    width: '90%',
    backgroundColor: '#fff',
    alignSelf: 'center',
    borderRadius: 12,
    padding: 10,

    // height: normalize(110),
    // maxHeight: normalize(110),
  },
  // ── Chiqish (logout) modali — professional, xira backdrop.
  exitBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9,14,26,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(28),
  },
  exitCard: {
    width: '100%',
    maxWidth: rs(360),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.xxl,
    paddingHorizontal: rs(22),
    paddingTop: rs(24),
    paddingBottom: rs(20),
    alignItems: 'center',
    shadowColor: '#0b1220',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 12,
  },
  exitIcon: {
    width: rs(58),
    height: rs(58),
    borderRadius: rs(29),
    backgroundColor: rd.color.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(16),
  },
  exitTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    color: rd.color.text,
    marginBottom: rs(6),
  },
  exitDesc: {
    fontFamily: rd.font.regular,
    fontSize: rs(14),
    color: rd.color.textSecondary,
    textAlign: 'center',
    lineHeight: rs(20),
    marginBottom: rs(22),
  },
  exitBtns: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: rs(12),
  },
  exitCancelBtn: {
    flex: 1,
    height: rs(52),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.surfaceAlt,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitCancelText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.textSecondary,
  },
  exitConfirmBtn: {
    flex: 1,
    height: rs(52),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.error,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: rd.color.error,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  exitConfirmBtnDisabled: {
    opacity: 0.6,
  },
  exitConfirmText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.onPrimary,
  },
  active: {
    backgroundColor: style.blue,
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 8,
    marginTop: 12,
  },
  TouchableOpacity: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    marginTop: 5,
  },
  optionTx: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xa + 3,
    color: '#000',
    marginLeft: 5,
  },
  name: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xa + 3,
    color: '#000',
  },
  info: {
    marginTop: 5,
    maxWidth: '100%',
  },
  title: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xa + 1,
    color: style.blue,
  },
  userImageContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  aboutUsContainer: {
    backgroundColor: '#EAF2FB',

    borderRadius: 15,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    padding: 10,
    paddingBottom: 20,
    marginBottom: 5,
  },
});
