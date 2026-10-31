import { Dimensions, StyleSheet } from 'react-native';
import { rd, rs } from '../../../theme/rd';
import { normalize } from '../../../theme/style';

const { width, height } = Dimensions.get('screen');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: rd.color.page,
  },

  mainInside: {
    marginTop: normalize(8),
  },
  btn: {
    position: 'absolute',
    // backgroundColor: 'red',
    right: 0,
  },
  // Holat ikonasi doira-badge (zamonaviy success/cancel ko'rinishi).
  statusBadge: {
    width: normalize(76),
    height: normalize(76),
    borderRadius: normalize(38),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sum: {
    fontFamily: rd.font.bold,
    fontSize: rs(22),
    color: rd.color.success,
    marginTop: normalize(12),
  },
  downloadButton: {
    backgroundColor: rd.color.primary,
    width: '100%',
    paddingVertical: normalize(13),
    borderRadius: rd.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: normalize(18),
  },
  info: {
    marginTop: normalize(3),
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
  },
  main: {
    marginTop: normalize(10),
  },
  infoTitle: {
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.text,
    opacity: 0.5,
  },
  title: {
    fontFamily: rd.font.medium,
    fontSize: rs(16),
    color: rd.color.text,
    textAlign: 'center',
  },
  iconSuccess: {
    alignSelf: 'center',
    marginTop: normalize(15),
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: rs(80),
  },
  emptyText: {
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.textTertiary,
  },
  modalHeader: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    alignItems: 'center',
  },
  modal: {
    // backgroundColor: '#fff',
    borderRadius: 12,
    width: width - normalize(40),
    alignSelf: 'center',
    marginLeft: (width - (width - normalize(40))) / 2,
    padding: 15,
    // Qattiq height: normalize(400) OLIB TASHLANDI — redizayndan so'ng kontent
    // balandroq bo'lib, "Yuklab olish" tugmasi 400px chegaradan pastга tushib
    // KESILARDI. Endi modal kontentга moslashadi (auto), maxHeight faqat juda
    // kichik ekranда oshib ketmasligi uchun. react-native-paper Modal o'zi
    // vertikal markazlashtiradi (marginTop kerak emas).
    maxHeight: height - normalize(120),
  },
  modalCotainer: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: normalize(24),
    padding: normalize(18),
  },
  number2: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.text,
  },
  topbar: { flex: 1, marginTop: rs(6) },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    paddingVertical: rs(12),
    paddingHorizontal: rs(14),
    marginTop: rs(10),
  },
  cardBody: {
    flex: 1,
    marginLeft: rs(12),
  },
  cardName: {
    marginBottom: rs(4),
  },
  cardSub: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
  },
  cardAmount: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    marginLeft: rs(8),
  },
  icon: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  flat: {
    paddingHorizontal: rs(16),
    paddingBottom: rs(24),
    flexGrow: 1,
  },
  name: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.text,
  },
});
