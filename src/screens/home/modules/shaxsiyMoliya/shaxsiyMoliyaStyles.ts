import { StyleSheet } from 'react-native';
import { rd, rs } from '../../../../theme/rd';
import { GRAD_BRAND } from './shaxsiyMoliyaLogic';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(16),
    paddingTop: rs(8),
    paddingBottom: rs(28),
    gap: rs(14),
  },
  // SS15: bo'lim sarlavhasi — rangli aksent chizig'i + matn.
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    marginTop: rs(6),
    marginBottom: rs(-6),
  },
  sectionBar: { width: rs(3), height: rs(15), borderRadius: rs(2) },
  blockTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(15),
    color: rd.color.text,
  },

  // Hero (SS21 gradient)
  fmHero: {
    borderRadius: rs(22),
    overflow: 'hidden',
    padding: rs(16),
    shadowColor: GRAD_BRAND[1],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
  // SS19: hero ichida holat va amallarni ajratuvchi nozik chiziq.
  fmHeroBtns: { flexDirection: 'row', gap: rs(10), marginTop: rs(12) },
  fmHeroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(6),
    borderRadius: rs(14),
    paddingVertical: rs(11),
    paddingHorizontal: rs(6),
  },
  fmHeroBtnLight: { backgroundColor: rd.color.onPrimary },
  fmHeroBtnText: { fontFamily: rd.font.semibold, fontSize: rs(13) },

  // Tezkor tugmalar
  quickRow: { flexDirection: 'row', gap: rs(8) },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    gap: rs(6),
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingVertical: rs(12),
    paddingHorizontal: rs(4),
  },
  quickLabel: {
    fontFamily: rd.font.semibold,
    fontSize: rs(11.5),
    color: rd.color.text,
    textAlign: 'center',
  },

  healthLabelRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  healthLabel: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: 'rgba(255,255,255,0.92)',
  },
  healthScoreRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: rs(6) },
  healthScore: { fontFamily: rd.font.bold, fontSize: rs(40), color: rd.color.onPrimary },
  healthScoreMax: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: 'rgba(255,255,255,0.8)',
    marginBottom: rs(7),
    marginLeft: rs(2),
  },
  healthStatus: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.onPrimary,
    marginTop: rs(2),
  },
  healthChips: { flexDirection: 'row', gap: rs(10), marginTop: rs(16) },
  healthChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: rs(14),
    padding: rs(12),
  },
  healthChipLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: 'rgba(255,255,255,0.85)',
  },
  healthChipValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(15),
    color: rd.color.onPrimary,
    marginTop: rs(4),
  },

  healthTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  healthAdviceBtn: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(15),
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  healthScoreInline: { flexDirection: 'row', alignItems: 'flex-end', flex: 1 },
  healthScore2: { fontFamily: rd.font.bold, fontSize: rs(26), color: rd.color.onPrimary },
  healthScoreMax2: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: 'rgba(255,255,255,0.8)',
    marginBottom: rs(3),
    marginLeft: rs(1),
  },
  healthStatusInline: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: 'rgba(255,255,255,0.9)',
    marginBottom: rs(4),
    flexShrink: 1,
  },
  healthQoldiq: { alignItems: 'flex-end', maxWidth: '46%' },
  // 21.10: sog'liq bali o'rnidagi shior (ko'k kartada)
  // 25.10: shrift Qarz daftari hero'sidagi heroSub bilan BIR XIL; karta TEPASIDA.
  // 27.10: allowFontScaling o'chirilgan edi — telefon shrift kattaligini hisobga olmay, Qarz daftaridan kichik chiqardi.
  fmHeroSlogan: {
    flex: 1,
    marginRight: rs(12),
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    lineHeight: rs(17),
    color: 'rgba(255,255,255,0.9)',
  },
  fmQoldiqHead: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  fmHeroAdvice: { width: rs(24), height: rs(24), borderRadius: rs(12) },
  healthQoldiqLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(11),
    color: 'rgba(255,255,255,0.85)',
  },
  healthQoldiqVal: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
    marginTop: rs(1),
  },

  // Metric grid
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10) },

  // Qo'shimcha menyu (Byudjet / Tavsiyalar / To'lovlar / Kutilayotgan daromad) — 2×2
  // N14 inline qarz-summary karta
  debtCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(16),
    paddingVertical: rs(14),
    gap: rs(12),
  },
  debtHead: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  debtTitle: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  debtMore: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.primary },
  debtRow: { flexDirection: 'row', alignItems: 'center' },
  debtCol: { flex: 1, alignItems: 'center', gap: rs(3) },
  debtDivider: { width: 1, alignSelf: 'stretch', backgroundColor: rd.color.border, marginVertical: rs(2) },
  debtLabel: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary },
  debtVal: { fontFamily: rd.font.bold, fontSize: rs(17) },
  debtNetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
    paddingTop: rs(10),
  },
  debtNetLabel: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  debtNetVal: { fontFamily: rd.font.bold, fontSize: rs(15) },
  debtBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  debtBadge: { borderRadius: rd.radius.pill, paddingHorizontal: rs(10), paddingVertical: rs(5) },
  debtBadgeText: { fontFamily: rd.font.semibold, fontSize: rs(11.5) },

  menuRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10), marginTop: rs(14) },
  menuCard: {
    width: '47.6%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingVertical: rs(13),
    paddingHorizontal: rs(12),
    minHeight: rs(62),
  },
  menuIcon: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
  // So'rov: uzun yorliq (masalan "Rejalashtirilgan to'lovlar") KESILMASDAN sig'ishi
  // uchun flex:1 + kichikroq shrift + qatorlar.
  menuLabel: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(12.5), lineHeight: rs(16), color: rd.color.text },
  // img1: zamonaviy "mahsulot kartalari" menyu
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10), marginTop: rs(14) },
  mCard: {
    width: '47.6%',
    flexGrow: 1,
    borderRadius: rs(18),
    borderWidth: 1,
    paddingVertical: rs(14),
    paddingHorizontal: rs(14),
    minHeight: rs(104),
  },
  mIcon: {
    width: rs(42),
    height: rs(42),
    borderRadius: rs(21),
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(12),
    shadowColor: '#0b1220',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  mTitle: { fontFamily: rd.font.bold, fontSize: rs(13.5), lineHeight: rs(17), color: rd.color.text },
  mSub: { fontFamily: rd.font.medium, fontSize: rs(11), marginTop: rs(3) },
  metric: {
    width: '31%',
    flexGrow: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(12),
    overflow: 'hidden',
  },
  metricAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: rs(4) },
  metricHead: { flexDirection: 'row', marginBottom: rs(8), marginTop: rs(2) },
  metricLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textSecondary,
    minHeight: rs(30),
  },
  metricValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(14),
    color: rd.color.text,
    marginTop: rs(3),
  },
  metricValueSm: { fontSize: rs(11.5), color: rd.color.textSecondary, marginTop: rs(1) },
  metricSub: {
    fontFamily: rd.font.medium,
    fontSize: rs(11),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },

  // Generic card
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(16),
    paddingVertical: rs(12),
  },
  cardTitle: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },

  // Budget
  budgetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(10),
  },
  budgetPct: { fontFamily: rd.font.bold, fontSize: rs(15) },
  budgetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  budgetMore: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.primary, marginTop: rs(4) },
  barTrack: {
    height: rs(10),
    borderRadius: rd.radius.pill,
    overflow: 'hidden',
    backgroundColor: rd.color.surfaceAlt,
  },
  barFill: { height: '100%', borderRadius: rd.radius.pill },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: rs(12),
  },
  budgetSmallLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
  },
  budgetSmallValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(13),
    color: rd.color.text,
    marginTop: rs(3),
  },

  // Daily chart
  chartHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(10),
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: rs(10) },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: rs(8), height: rs(8), borderRadius: rs(4), marginRight: rs(4) },
  legendText: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textSecondary },
  // SS4: Joriy oy / Oylar kesimida tablar
  flowTabs: {
    flexDirection: 'row',
    gap: rs(2),
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rs(9),
    padding: rs(2),
  },
  flowTab: { paddingHorizontal: rs(10), paddingVertical: rs(5), borderRadius: rs(7) },
  flowTabOn: {
    backgroundColor: rd.color.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  flowTabText: { fontFamily: rd.font.semibold, fontSize: rs(11), color: rd.color.textTertiary },
  flowTabTextOn: { color: rd.color.text },
  chartBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: rs(1),
  },
  chartCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 1,
    height: '100%',
  },
  chartBar: { width: rs(2.5), borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  chartAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: rs(6) },
  axisText: { fontFamily: rd.font.regular, fontSize: rs(10), color: rd.color.textTertiary },

  // Categories
  catRow: { paddingVertical: rs(9) },
  catTop: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  catDot: { width: rs(10), height: rs(10), borderRadius: rs(5) },
  catName: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  catAmount: { fontFamily: rd.font.bold, fontSize: rs(12.5), color: rd.color.text },
  catBarTrack: {
    height: rs(6),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surfaceAlt,
    marginTop: rs(6),
    overflow: 'hidden',
  },
  catBarFill: { height: '100%', borderRadius: rd.radius.pill },

  // Recent tx
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    paddingVertical: rs(11),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  txTitle: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },
  txMeta: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
  txAmount: { fontFamily: rd.font.bold, fontSize: rs(13) },

  // Empty
  emptyBox: { alignItems: 'center', gap: rs(8), paddingVertical: rs(20) },
  emptyText: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textTertiary },
});
