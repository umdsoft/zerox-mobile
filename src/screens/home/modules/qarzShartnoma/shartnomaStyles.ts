import { StyleSheet } from 'react-native';
import { rd, rs } from '../../../../theme/rd';
import { GRAD_BRAND } from './shartnomaLogic';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  content: { padding: rs(16), gap: rs(16), paddingBottom: rs(28) },

  // Hero
  // KICHRAYTIRILDI: hero ilgari kichik ekranlarda sahifaning yarmidan ko'pini
  // egallardi. Barcha o'lchamlar rs() orqali — ya'ni har qanday ekranda
  // proporsional kichrayadi, kichik telefonlarda ham mos tushadi.
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

  // Blok sarlavhasi
  blockTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(13.5),
    color: rd.color.text,
    marginBottom: rs(-6),
  },

  // Statistika kartasi
  statCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(20),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  statTitle: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  statBody: { flexDirection: 'row', alignItems: 'center', gap: rs(16), marginTop: rs(12) },
  legend: { flex: 1, gap: rs(10) },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  dot: { width: rs(9), height: rs(9), borderRadius: rs(4.5) },
  legendLabel: { flex: 1, fontFamily: rd.font.regular, fontSize: rs(13), color: rd.color.textSecondary },
  legendCount: { fontFamily: rd.font.bold, fontSize: rs(12.5), color: rd.color.text },

  // Birlashgan diagramma kartasi (Debitor + Kreditor yonma-yon).
  statPair: { flexDirection: 'row', marginTop: rs(4) },
  statCol: { flex: 1, alignItems: 'center', paddingHorizontal: rs(4) },
  statColTitle: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.text,
    textAlign: 'center',
    marginBottom: rs(10),
    minHeight: rs(36),
  },
  // Sonlar bloki — bosilганда chiqadi; joy tebranmasligi uchun doim shu balandlik.
  revealBox: {
    minHeight: rs(74),
    marginTop: rs(10),
    gap: rs(6),
    alignSelf: 'stretch',
    paddingHorizontal: rs(10),
    justifyContent: 'center',
  },
  revealRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  revealCount: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.text },
  // Umumiy legend — sonsiz, gorizontal, markazда.
  sharedLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: rs(14),
    marginTop: rs(14),
    paddingTop: rs(12),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  sharedLegendItem: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  sLegendLabel: { fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.textSecondary },

  // Qarzdorlik kartalari
  // 2×2 GRID (so'rov): yuqori qatorда Berilgan | Olingan (yonma-yon), past
  // qatorда Muddati o'tgan (ber.) | Muddati o'tgan (ol.). Har muddati-o'tgan
  // o'z qarz-turi TAGIDA (bir ustunда). JSX tartibi: Berilgan, Olingan,
  // Muddati-ber, Muddati-ol -> qator-wrap shu grid'ni beradi.
  debtGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(12) },
  // Muddati oz qolgan
  nearCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(20),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  // "Barchasini ko'rish" pastki qatori — kartaning bosiladiganini bildiradi.
  nearMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(4),
    marginTop: rs(12),
    paddingTop: rs(10),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  nearMoreText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: rd.color.primary,
  },
  nearHead: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  nearTitle: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  segment: {
    flexDirection: 'row',
    backgroundColor: rd.color.page,
    borderRadius: rd.radius.pill,
    padding: rs(3),
  },
  segmentBtn: {
    paddingHorizontal: rs(12),
    paddingVertical: rs(5),
    borderRadius: rd.radius.pill,
  },
  segmentBtnActive: { backgroundColor: rd.color.primary },
  segmentText: { fontFamily: rd.font.semibold, fontSize: rs(11.5), color: rd.color.textSecondary },
  segmentTextActive: { color: rd.color.onPrimary },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: rs(14),
    paddingBottom: rs(8),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  tableHeadCol: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textTertiary },
  tableRight: { textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(10),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
    gap: rs(10),
  },
  dueBadge: { paddingHorizontal: rs(9), paddingVertical: rs(4), borderRadius: rd.radius.pill },
  dueBadgeText: { fontFamily: rd.font.semibold, fontSize: rs(11) },
  tableAmount: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(12.5), color: rd.color.text },

  // Hisobot kartasi
  // 02.10: "Tugallangan qarz shartnomalari" bo'limi (sarlavha + izoh + 2 karta).
  // 03.10: sarlavha + (i) bir qatorda; izoh (ochilganda) — FinanceDebts `finishedInfo` uslubi.
  reportSection: { gap: rs(12) },
  reportSectionHead: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  reportSectionTitle: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  reportSectionInfo: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    lineHeight: rs(17),
    color: rd.color.textSecondary,
    backgroundColor: rd.color.primaryTint,
    borderRadius: rd.radius.md,
    paddingHorizontal: rs(12),
    paddingVertical: rs(8),
  },
  reportRow: { flexDirection: 'row', gap: rs(12) },
  reportCard: {
    flex: 1,
    alignItems: 'center',
    gap: rs(10),
    borderRadius: rs(16),
    borderWidth: 1,
    paddingVertical: rs(16),
    // So'rov SS7.2: "hisoboti" so'zi to'liq sig'sin — yon-padding kamaytirildi.
    paddingHorizontal: rs(8),
  },
  reportIcon: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: rd.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportLabel: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: rd.color.text,
    textAlign: 'center',
  },
});
