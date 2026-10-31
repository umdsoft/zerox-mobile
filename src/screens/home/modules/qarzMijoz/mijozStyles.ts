import { StyleSheet } from 'react-native';
import { rd, rs } from '../../../../theme/rd';
import { RED } from './mijozLogic';

export const styles = StyleSheet.create({
  partialNote: { marginHorizontal: rs(16), marginTop: rs(6) },
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(28),
    gap: rs(14),
  },

  // SS8-1: FISH yonidagi tahrirlash tugmasi (34px doira — barmoq uchun yetarli
  // hitSlop bilan birga ~58px effektiv nishon).
  editBtn: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    alignItems: 'center',
    justifyContent: 'center',
  },

  // SS19-1: "Amaliyotlar tarixi" / "Kvitansiya" — ikkita ALOHIDA karta.
  // SS9-2: yagona, KATTAROQ "Amaliyotlar tarixi" kartasi.
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(9),
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1.5,
    // SS6 (2026-09-18): karta va matn BIROZ kichraytirildi (so'rov).
    // 2026-09-28: yana ixchamroq — to'liq kenglik emas (yon chekinish) va
    // pastroq balandlik.
    marginHorizontal: rs(28),
    paddingVertical: rs(9),
    paddingHorizontal: rs(12),
  },
  historyText: { fontFamily: rd.font.bold, fontSize: rs(13) },
  linkRow: { flexDirection: 'row', gap: rs(10) },
  linkCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // SS-B1 (2026-09-16): "Amaliyotlar tarixi" karta ichiga ERKIN sig'sin —
    // shrift biroz kichraytirildi, ikonka oralig'i va yon to'ldirish qisqardi.
    gap: rs(6),
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1.5,
    paddingVertical: rs(13),
    paddingHorizontal: rs(6),
  },
  linkBtnOff: { opacity: 0.45 },
  linkText: { fontFamily: rd.font.semibold, fontSize: rs(11.5) },

  // 03.10: amal tugmalari (Shaxsiy qarz FinanceDebtGroup bilan bir xil o'lchamlar).
  actDivider: { height: 1, backgroundColor: rd.color.border, marginTop: rs(14) },
  actGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8), marginTop: rs(12) },

  // Generic card
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },

  // Client card
  clientHead: { flexDirection: 'row', alignItems: 'center', gap: rs(14) },
  clientName: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text },
  clientDivider: {
    height: 1,
    backgroundColor: rd.color.border,
    marginVertical: rs(14),
  },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  clientPhone: {
    flex: 1,
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
  },


  // Telefon qatoridagi qo'ng'iroq (yashil) + SMS (ko'k) tugmalari.
  phoneActions: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  smsBtn: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: rd.color.success,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Statistika grid
  sumGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(12) },
  sumCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    paddingTop: rs(16),
    overflow: 'hidden',
  },
  metricAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: rs(4) },
  sumLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textSecondary,
    minHeight: rs(32),
  },
  sumValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    color: rd.color.text,
    marginTop: rs(4),
  },
  sumValueSub: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginTop: rs(2),
  },

  qRight: { flexDirection: 'row', alignItems: 'center', gap: rs(4) },
  qAmount: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },

  // 2026-09-28: "Aktiv qarzlar" ro'yxati.
  aqSection: { gap: rs(8) },
  aqTitle: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  aqEmpty: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.textTertiary,
    textAlign: 'center',
    paddingVertical: rs(14),
  },
  aqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingVertical: rs(11),
    paddingRight: rs(12),
    paddingLeft: rs(14),
    overflow: 'hidden',
  },
  aqBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: rs(4) },
  aqBody: { flex: 1, gap: rs(3) },
  aqTop: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  aqAmount: {
    flexShrink: 1,
    fontFamily: rd.font.bold,
    fontSize: rs(14),
    color: rd.color.text,
  },
  aqChip: {
    paddingHorizontal: rs(7),
    paddingVertical: rs(2),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.warningBg,
  },
  aqChipText: { fontFamily: rd.font.semibold, fontSize: rs(10), color: rd.color.warning },
  aqQoldiq: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12),
    color: rd.color.textSecondary,
  },
  aqMetaRow: { flexDirection: 'row', alignItems: 'center', gap: rs(4) },
  aqMeta: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginRight: rs(8),
  },
  aqOverdue: { color: RED },
});
