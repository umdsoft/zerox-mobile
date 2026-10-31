/**
 * amaliyotStyles.ts — QarzDaftariAmaliyot uslublari; QarzDaftariAmaliyot.tsx dan ko'chirilgan, kalitlar o'zgarmagan.
 */
import { StyleSheet } from 'react-native';
import { rd, rs } from '../../../../theme/rd';
import { GREEN } from './amaliyotLogic';

export const styles = StyleSheet.create({
  grafikNote: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.warning,
    marginTop: rs(10),
  },
  // SS13: kvitansiya / ulashish tugmalari va kvitansiya oynasi.
  // SS4 (2026-09-20) — to'lov grafigi
  schedule: { marginTop: rs(10), borderTopWidth: 1, borderTopColor: rd.color.border, paddingTop: rs(10) },
  scheduleTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(12.5),
    color: rd.color.text,
    marginBottom: rs(8),
  },
  schRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    paddingVertical: rs(7),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border + '80',
  },
  schNo: {
    width: rs(26),
    height: rs(26),
    borderRadius: rs(13),
    alignItems: 'center',
    justifyContent: 'center',
  },
  schNoText: { fontFamily: rd.font.bold, fontSize: rs(11) },
  // SS3-1 (2026-09-21) — jadval ko'rinishi
  schHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    paddingBottom: rs(6),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  schHeadText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(10.5),
    color: rd.color.textTertiary,
  },
  schHeadAmt: { textAlign: 'left' },
  // SS-DEV (2026-09-24): 3-band — "Summa" sarlavhasi va summalar ustun ichida
  // CHAPDAN tekis (ilgari sarlavha o'rtada, summalar o'ng chekkada edi).
  schColAmt: { width: rs(132), alignItems: 'flex-start' },
  schBadge: {
    alignSelf: 'flex-start',
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(7),
    paddingVertical: rs(1),
    marginTop: rs(3),
  },
  // SS-DEV (2026-09-23): konturli (to'ldirilmagan) — yashil "To'landi" holat
  // belgisi bilan adashtirmaslik uchun.
  schPayBtn: {
    marginTop: rs(5),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(10),
    paddingVertical: rs(3),
  },
  schPayText: { fontFamily: rd.font.semibold, fontSize: rs(10.5), color: GREEN },
  payBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9,14,26,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(24),
  },
  payCard: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    padding: rs(18),
  },
  payTitle: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  payHint: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textSecondary,
    marginTop: rs(6),
    lineHeight: rs(16),
  },
  payInput: {
    marginTop: rs(12),
    height: rs(48),
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
  },
  payActions: { flexDirection: 'row', gap: rs(10), marginTop: rs(14) },
  payBtn: {
    flex: 1,
    height: rs(44),
    borderRadius: rd.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: { fontFamily: rd.font.semibold, fontSize: rs(13) },
  schDate: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.text },
  schStatus: { fontFamily: rd.font.medium, fontSize: rs(10.5), marginTop: rs(1) },
  schAmount: { fontFamily: rd.font.bold, fontSize: rs(12), color: rd.color.text, maxWidth: rs(130), textAlign: 'left' },

  actRow: { flexDirection: 'row', gap: rs(10), marginTop: rs(4) },
  actBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(7),
    borderRadius: rs(14),
    borderWidth: 1.5,
    paddingVertical: rs(12),
  },
  actText: { fontFamily: rd.font.bold, fontSize: rs(13) },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9,14,26,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(20),
  },
  receiptCard: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rs(20),
    padding: rs(18),
  },
  receiptTitle: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text },
  receiptSub: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginBottom: rs(10),
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: rs(10),
    paddingVertical: rs(9),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  receiptLabel: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary },
  receiptValue: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(12.5), color: rd.color.text, textAlign: 'right' },
  receiptActions: { flexDirection: 'row', gap: rs(10), marginTop: rs(14) },
  receiptBtn: { flex: 1, height: rs(44), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center' },
  receiptBtnText: { fontFamily: rd.font.bold, fontSize: rs(14) },

  screen: { flex: 1, backgroundColor: rd.color.page },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(28),
    gap: rs(12),
  },

  // SS-DEV (2026-10-04): ixcham bosh karta (bitta qator, ~64pt).
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    borderLeftWidth: rs(4),
    paddingVertical: rs(12),
    paddingHorizontal: rs(14),
  },
  heroIcon: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: { flex: 1, alignItems: 'flex-start', gap: rs(3) },
  heroBadge: {
    paddingHorizontal: rs(8),
    paddingVertical: rs(2),
    borderRadius: rs(8),
  },
  heroTitle: { fontFamily: rd.font.semibold, fontSize: rs(11.5) },
  heroAmount: { fontFamily: rd.font.bold, fontSize: rs(18), color: rd.color.text },
  heroDesc: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    lineHeight: rs(16),
    color: rd.color.textSecondary,
  },

  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    paddingVertical: rs(6),
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(7),
    paddingTop: rs(10),
    paddingBottom: rs(4),
  },
  cardTitle: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.text },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: rs(12),
    paddingVertical: rs(10),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  rowLabel: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary },
  rowValue: {
    flexShrink: 1,
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: rd.color.text,
    textAlign: 'right',
  },

  pill: { borderRadius: rd.radius.pill, paddingHorizontal: rs(10), paddingVertical: rs(4) },
  pillText: { fontFamily: rd.font.semibold, fontSize: rs(11) },
});
