import { StyleSheet } from 'react-native';
import { rd, rs } from '../../../../theme/rd';
import { AMBER, BLUE, GRAD_BRAND } from './qarzDaftariLogic';

// ---------- Uslublar ----------
export const styles = StyleSheet.create({
  notSaved: { marginHorizontal: 0, marginTop: 0 },
  // SS11-1/2: "Barcha do‘konlar" cardi + do‘konlar modali
  allShopsCard: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1, borderColor: rd.color.border,
    paddingHorizontal: rs(14), paddingVertical: rs(12),
    marginTop: rs(12),
  },
  allShopsIcon: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  allShopsTitle: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },
  allShopsSub: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary, marginTop: rs(2) },

  shopModalRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: rs(22), backgroundColor: 'rgba(11,18,32,0.6)' },
  shopModalCard: {
    width: '100%', maxHeight: '72%',
    backgroundColor: rd.color.surface,
    borderRadius: rs(24),
    paddingTop: rs(16), paddingBottom: rs(14), paddingHorizontal: rs(16),
    elevation: 12,
  },
  shopModalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(10) },
  shopModalTitle: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },
  shopModalClose: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.textTertiary, paddingHorizontal: rs(4) },
  shopSep: { height: 1, backgroundColor: rd.color.border, marginHorizontal: rs(6) },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), paddingVertical: rs(12), paddingHorizontal: rs(6) },
  // SS13: tanlangan do'kon qatori ajralib tursin.
  shopRowOn: { backgroundColor: '#EFF6FF', borderRadius: rs(12) },
  // SS5: "Barcha do'konlar" — doimiy ochiq ko'k fon; tanlanganda esa qo'shimcha
  // ko'k kontur bilan tanlov holati baribir ajralib turadi.
  shopRowAll: { backgroundColor: '#EAF2FE', borderRadius: rs(12) },
  shopRowAllOn: { backgroundColor: '#DCE9FD', borderWidth: 1.5, borderColor: '#A9C8FA' },
  // Qator oxiridagi TAHRIRLASH tugmasi — doira fonli, bosiladigani ko'rinib tursin.
  shopEditBtn: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rd.color.surfaceAlt,
  },
  shopRowIcon: {
    width: rs(34), height: rs(34), borderRadius: rs(17),
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  shopRowName: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  shopRowSub: { fontFamily: rd.font.medium, fontSize: rs(11), color: '#7c3aed', marginTop: rs(2) },
  shopEmpty: { fontFamily: rd.font.regular, fontSize: rs(13), color: rd.color.textTertiary, textAlign: 'center', paddingVertical: rs(20) },
  shopAddBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8),
    marginTop: rs(10), paddingVertical: rs(12),
    borderRadius: rd.radius.lg,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: BLUE + '66',
    backgroundColor: BLUE + '0D',
  },
  shopAddText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: BLUE },
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(24),
    gap: rs(14),
  },

  // Xodim rejimi banneri (impersonation) — binafsha, web bilan bir semantika.
  xodimBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#d8b4fe',
    borderRadius: rs(14),
    paddingVertical: rs(10),
    paddingHorizontal: rs(14),
  },
  xodimBarTitle: { fontFamily: rd.font.bold, fontSize: rs(13), color: '#6b21a8' },
  xodimBarSub: { fontFamily: rd.font.medium, fontSize: rs(12), color: '#7c3aed', marginTop: rs(1) },
  xodimBarBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: rs(9),
    paddingVertical: rs(7),
    paddingHorizontal: rs(14),
  },
  xodimBarBtnText: { fontFamily: rd.font.bold, fontSize: rs(12.5), color: '#fff' },

  blockTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(13.5),
    color: rd.color.text,
    marginTop: rs(4),
    marginBottom: rs(-4),
  },

  // Hero — o'lcham/shrift QARZ SHARTNOMASI hero'si bilan BIR XIL (so'rov bo'yicha).
  hero: {
    borderRadius: rs(18),
    overflow: 'hidden',
    padding: rs(16),
    shadowColor: GRAD_BRAND[1],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTitle: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.onPrimary },
  heroSub: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: 'rgba(255,255,255,0.9)',
    marginTop: rs(4),
    lineHeight: rs(17),
  },
  heroBtns: { flexDirection: 'row', gap: rs(8), marginTop: rs(12) },
  heroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(5),
    borderRadius: rs(12),
    paddingVertical: rs(10),
  },
  heroBtnLight: { backgroundColor: rd.color.surface },
  heroBtnText: { fontFamily: rd.font.semibold, fontSize: rs(12.5) },
  // 21.10: FinanceDebts heroLink bilan bir xil
  heroLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: rs(6),
    marginTop: rs(12),
    paddingVertical: rs(4),
  },
  heroLinkText: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.onPrimary,
    textDecorationLine: 'underline',
  },

  // Generic card
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },

  // Overview / chart
  ovHead: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  ovTitle: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },
  ovSubtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(1),
  },
  ovTotalLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textSecondary,
    marginTop: rs(14),
  },
  ovTotal: {
    fontFamily: rd.font.bold,
    fontSize: rs(24),
    color: rd.color.text,
    marginTop: rs(2),
  },
  ovRate: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(4),
  },

  // Ratio bar
  barTrack: {
    flexDirection: 'row',
    height: rs(10),
    borderRadius: rd.radius.pill,
    overflow: 'hidden',
    backgroundColor: rd.color.surfaceAlt,
  },
  barFill: { height: '100%' },
  barLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(12), marginTop: rs(8) },
  barLegendItem: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  barDot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  barLegendText: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textSecondary,
  },

  // (Overview sub-cards va Action cards stillar OLIB TASHLANDI — mos komponentlar
  //  so'rov bo'yicha olib tashlangani uchun.)

  // 2×2 GRID (so'rov): yuqori qatorda Berilgan | Olingan (yonma-yon), past
  // qatorda Muddati o'tgan (ber.) | Muddati o'tgan (ol.) — har biri o'z turi
  // TAGIDA (bir ustunda). JSX tartibi: Berilgan, Olingan, Muddati-ber, Muddati-ol.
  sumGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(12) },
  sumCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    overflow: 'hidden',
  },
  metricAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: rs(4) },
  sumHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(10),
    marginTop: rs(2),
  },
  pill: {
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
  },
  pillText: { fontFamily: rd.font.semibold, fontSize: rs(9.5) },
  sumLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(10.5),
    color: rd.color.textSecondary,
    minHeight: rs(32),
  },
  sumUzs: {
    fontFamily: rd.font.bold,
    fontSize: rs(13),
    color: rd.color.text,
    marginTop: rs(4),
  },
  sumUsd: {
    fontFamily: rd.font.semibold,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },

  // Due table
  tableHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(12),
  },
  tableTitle: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(13), marginRight: rs(8) },
  toggle: {
    flexDirection: 'row',
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.pill,
    padding: rs(3),
  },
  toggleBtn: {
    paddingHorizontal: rs(12),
    paddingVertical: rs(5),
    borderRadius: rd.radius.pill,
  },
  toggleBtnActive: { backgroundColor: rd.color.surface },
  toggleText: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
  },
  toggleTextActive: { fontFamily: rd.font.semibold, color: rd.color.primary },

  trHead: {
    flexDirection: 'row',
    paddingBottom: rs(8),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  thText: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textTertiary },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rs(11),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  colName: { flex: 1.4 },
  colDate: { flex: 1, alignItems: 'center' },
  // 2-ustunli ko'rinish (Mijozsiz): "Qolgan vaqt" chapga tekislangan.
  colDate2: { flex: 1, alignItems: 'flex-start' },
  colAmt: { flex: 1.2, textAlign: 'right' },
  tdName: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },
  tdAmt: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },
  dayPill: {
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
  },
  dayPillText: { fontFamily: rd.font.semibold, fontSize: rs(10.5) },

  // Warning banner
  warnBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: rs(16),
    padding: rs(14),
    gap: rs(8),
    marginTop: rs(4),
  },
  warnText: {
    // SS5-2 (2026-09-21): ogohlantirish matni kichraytirildi.
    // SS-DEV (2026-09-24): yana kichikroq (11 -> 10) — so'rov bo'yicha.
    fontFamily: rd.font.regular,
    fontSize: rs(10),
    color: '#92400E',
    lineHeight: rs(14.5),
  },
  warnClose: {
    alignSelf: 'flex-start',
    backgroundColor: AMBER,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(12),
    paddingVertical: rs(5),
    marginTop: rs(2),
  },
  // SS-DEV (2026-09-24): "Tushundim" ham kichikroq (12 -> 10.5).
  warnCloseText: { fontFamily: rd.font.semibold, fontSize: rs(10.5), color: '#fff' },

  // Empty
  emptyBox: { alignItems: 'center', gap: rs(8), paddingVertical: rs(24) },
  emptyText: {
    // SS5-1 (2026-09-21): bo'sh holat matni juda yirik ko'rinardi.
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    textAlign: 'center',
  },
});
