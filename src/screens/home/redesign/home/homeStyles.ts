/**
 * homeStyles.ts — HomeRedesign (bosh sahifa) uslublari; HomeRedesign.tsx dan ko'chirilgan, kalitlar o'zgarmagan.
 */
import { StyleSheet } from 'react-native';
import { rd, rs } from '../../../../theme/rd';
import { GRAD } from './homeLogic';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },

  // Header
  headerRow: {
    height: rs(64),
    paddingHorizontal: rs(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Avatar + qo'ng'iroq o'ng tomonda yonma-yon (ilgari chapda headerLeft edi).
  // gap rs(14): ZeroX wordmark menyu ikonasidan yetarlicha uzoqda — o'rta
  // tayoqchani to'smaydi (ilgari juda yaqin edi).
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(14) },
  // Menyu tugmasi — doirasiz, faqat teginish maydoni.
  menuBtn: {
    width: rs(40),
    height: rs(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  iconBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: rs(40), height: rs(40), borderRadius: rs(20), overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  // avatarText / greeting / userName olib tashlandi — sarlavhada endi matn yo'q
  // (salom + ism talab bo'yicha chiqarildi, avatar ichida odam ikonkasi turadi).
  // Kattaroq + raqam markazда to'liq sig'adi (allowFontScaling=false bilan birga).
  badge: {
    position: 'absolute',
    top: -6,
    right: -7,
    minWidth: rs(20),
    height: rs(20),
    paddingHorizontal: rs(4),
    borderRadius: rs(10),
    backgroundColor: rd.color.error,
    borderWidth: 1.5,
    borderColor: rd.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: rd.font.bold,
    fontSize: rs(10.5),
    lineHeight: rs(13),
    color: rd.color.onPrimary,
    textAlign: 'center',
  },

  // Content
  scroll: { flex: 1 },
  content: { paddingHorizontal: rs(20), paddingTop: rs(8), paddingBottom: rs(16), gap: rs(16) },

  // Hero banner
  // KICHRAYTIRILDI: hero kichik ekranlarda sahifaning yarmini egallardi.
  // Barcha qiymatlar rs() orqali -> har qanday ekran o'lchamida proporsional.
  hero: {
    borderRadius: rs(18),
    overflow: 'hidden',
    padding: rs(15),
    shadowColor: GRAD.brand[1],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTitle: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.onPrimary },
  heroSub: {
    fontFamily: rd.font.regular,
    // So'rov (SS1): butun card matni "1,7 mln" (metric summa) kabi KATTA bo'lsin.
    // 11.5→12.5→13.5→15.
    fontSize: rs(15),
    color: 'rgba(255,255,255,0.92)',
    marginTop: rs(5),
    lineHeight: rs(20),
  },
  heroChips: { flexDirection: 'row', gap: rs(8), marginTop: rs(11) },
  heroChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: rs(12),
    paddingVertical: rs(9),
    paddingHorizontal: rs(10),
    alignItems: 'center',
  },
  // SS1-3 (2026-09-21): QIYMAT (100 / A'lo) yorlig'idan KICHIK edi
  // (13.5 va 14.5) — teskari ierarxiya. Endi qiymat ustun.
  heroChipValue: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.onPrimary },
  heroChipLabel: {
    // Chip yorlig'i (Moliyaviy sog'liq / Holat) KATTAROQ (rs14.5; ilgari 10→12.5→13).
    fontFamily: rd.font.medium,
    fontSize: rs(14.5),
    color: 'rgba(255,255,255,0.92)',
    marginTop: rs(3),
  },


  // Asosiy ko'rsatkichlar
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(12) },
  metricCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    paddingTop: rs(14),
    paddingBottom: rs(14),
    overflow: 'hidden',
  },
  metricCardSoon: { opacity: 0.75 },
  // 21.10: tepadagi JAMI kartalar (modul kartalaridan ajralib tursin)
  totalCard: {
    backgroundColor: rd.color.primaryTint,
    borderWidth: 1,
    borderColor: '#cfdcf7',
    paddingTop: rs(8),
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  totalTitleCol: { flex: 1, marginLeft: rs(8), minWidth: 0 },
  totalLabel: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12),
    lineHeight: rs(15),
    color: rd.color.primaryStrong,
  },
  totalUzs: { color: rd.color.primaryStrong },
  totalUsd: { color: rd.color.primary },
  metricAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: rs(4),
  },
  metricHead: {
    flexDirection: 'row',
    alignItems: 'center',
    // SS1-1: yorliq ikonka yonida — `space-between` uni o'ng chekkaga
    // itarib yuborardi, shu bois chapga tekislanadi.
    justifyContent: 'flex-start',
    marginBottom: rs(8),
    marginTop: rs(2),
  },
  soonBadge: {
    backgroundColor: rd.color.primaryTint,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
  },
  soonText: { fontFamily: rd.font.semibold, fontSize: rs(10), color: rd.color.primary },
  metricLabel: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textSecondary },
  // SS1-1 (2026-09-21): ikonka YONIDAGI yorliq.
  metricLabelInline: {
    flex: 1,
    marginLeft: rs(8),
    fontFamily: rd.font.semibold,
    fontSize: rs(11.5),
    color: rd.color.textSecondary,
    lineHeight: rs(14),
  },
  // fontSize rs(15): uzun pul matnlari (`adjustsFontSizeToFit`) ~14.5'ga kichrayadi;
  // qisqa "37%" esa bazaда qolardi. Bazani 17→15 tushirib, foiz ham pul kartalari
  // bilan bir xil ko'rinadi (ilgari "37%" boshqa kartalardagi raqamdan katta edi).
  metricUzs: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.text, marginTop: rs(4) },
  metricUsd: { fontFamily: rd.font.semibold, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(2) },
  metricValueBig: { fontFamily: rd.font.bold, fontSize: rs(19), color: rd.color.text },
  // Summa hali tayyor emas — skeleton (metricUzs balandligiga mos, layout siljimaydi).
  metricSkeleton: {
    marginTop: rs(7),
    marginBottom: rs(1),
  },
  subSkel: { marginTop: rs(3), marginBottom: rs(3) },
  shimmerLight: { backgroundColor: '#e3e8f1' },
  shimmerDark: { backgroundColor: 'rgba(255,255,255,0.28)' },
  heroChipSkel: { marginBottom: rs(4) },

  // Modullar
  moduleCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  moduleSoonCard: { opacity: 0.8 },
  moduleHead: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  moduleTitle: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  // SS1: lampochka tugma + bo'lim izohi modal
  moduleInfoBtn: {
    width: rs(24),
    height: rs(24),
    borderRadius: rs(12),
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(28),
  },
  infoSheet: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rs(20),
    padding: rs(20),
  },
  infoHeadRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginBottom: rs(12) },
  infoTitle: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },
  infoText: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    lineHeight: rs(20),
    color: rd.color.textSecondary,
  },
  infoBtn: {
    marginTop: rs(18),
    height: rs(46),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBtnText: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.onPrimary },
  moduleSubRow: { flexDirection: 'row', gap: rs(10), marginTop: rs(14) },
  moduleSub: { flex: 1, borderRadius: rs(14), padding: rs(12) },
  moduleSubAmt: { fontFamily: rd.font.bold, fontSize: rs(13) },
  moduleSubUsd: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.textSecondary, marginTop: rs(1) },
  moduleSubLabel: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(4) },

  // Balance card
  balanceCard: { borderRadius: rs(24), padding: rs(20), overflow: 'hidden', gap: rs(16) },
  balanceTop: { flexDirection: 'row', alignItems: 'center' },
  balanceTitle: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.onPrimaryStrong },
  trendChip: { backgroundColor: rd.color.onPrimaryChip, paddingHorizontal: rs(9), paddingVertical: rs(4), borderRadius: rs(20) },
  trendText: { fontFamily: rd.font.semibold, fontSize: rs(11), color: rd.color.onPrimary },
  balanceTotal: { fontFamily: rd.font.bold, fontSize: rs(30), color: rd.color.onPrimary },
  balanceDivider: { height: 1, backgroundColor: rd.color.onPrimaryChip },
  statsRow: { flexDirection: 'row', gap: rs(12) },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  statLabel: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.onPrimaryMuted },
  statValue: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.onPrimary, marginTop: 1 },

  // Quick actions
  actionsRow: { flexDirection: 'row', gap: rs(10) },
  actionCard: {
    flex: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    paddingTop: rs(14),
    paddingBottom: rs(12),
    alignItems: 'center',
    gap: rs(8),
  },
  actionLabel: { fontFamily: rd.font.medium, fontSize: rs(11), color: rd.color.textSecondary },

  debtCard: {
    flex: 1,
    borderRadius: rs(22),
    paddingHorizontal: rs(16),
    paddingTop: rs(16),
    paddingBottom: rs(18),
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  debtTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(12),
  },
  debtIconWrap: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: 'rgba(255,255,255,0.9)',
  },
  debtAmount: {
    fontFamily: rd.font.bold,
    fontSize: rs(22),
    color: rd.color.onPrimary,
    marginTop: rs(4),
    letterSpacing: 0.2,
  },
  debtUsdChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    backgroundColor: 'rgba(255,255,255,0.26)',
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(11),
    paddingVertical: rs(5),
    marginTop: rs(9),
  },
  debtUsd: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.onPrimary },
  debtCount: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: 'rgba(255,255,255,0.95)',
    marginTop: rs(10),
  },

  // Generic card
  card: { backgroundColor: rd.color.surface, borderRadius: rs(20), padding: rs(16) },
  cardTitle: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },

  // Contracts
  contractsRow: { flexDirection: 'row', alignItems: 'center', gap: rs(16) },
  legend: { flex: 1, gap: rs(9) },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  dot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  legendLabel: { flex: 1, fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.textSecondary },
  legendCount: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },

  // Warning
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.warningBg,
    borderRadius: rs(16),
    paddingHorizontal: rs(14),
    paddingVertical: rs(13),
  },
  warningText: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },


  // Ogohlantirishlar (alert-lar)
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    borderRadius: rd.radius.lg,
    paddingVertical: rs(12),
    paddingHorizontal: rs(14),
  },
  alertIcon: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    backgroundColor: rd.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },
  alertSub: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
  alertView: { fontFamily: rd.font.semibold, fontSize: rs(13) },
  alertEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(28),
    gap: rs(8),
  },
  alertEmptyText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textTertiary,
  },

  // Recent ops
  opsCard: { backgroundColor: rd.color.surface, borderRadius: rs(16), padding: rs(4) },
  opRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12), padding: rs(12) },
  opDivider: { height: 1, backgroundColor: rd.color.border },
  opName: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  opSub: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary, marginTop: 2 },
  opAmount: { fontFamily: rd.font.semibold, fontSize: rs(14) },
  opsEmpty: { alignItems: 'center', gap: rs(8), paddingVertical: rs(22) },
  opsEmptyText: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textTertiary },

});
