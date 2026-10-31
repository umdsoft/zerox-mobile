/**
 * debtDetailStyles.ts — FinanceDebtDetail uslublari (FinanceDebtDetail.tsx dan ko'chirilgan; kalitlar o'zgarmagan).
 */
import { StyleSheet } from 'react-native';
import { rd, rs } from '../../../../theme/rd';
import { AMBER, RED, ROSE } from './debtDetailLogic';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(10), paddingBottom: rs(20) },

  headCard: { backgroundColor: rd.color.surface, borderRadius: rd.radius.lg, borderWidth: 1, borderColor: rd.color.border, padding: rs(16), marginBottom: rs(14) },
  headTop: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  avatar: { width: rs(46), height: rs(46), borderRadius: rs(23), alignItems: 'center', justifyContent: 'center' },
  headName: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text },
  headSub: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary, marginTop: rs(2) },
  headMeta: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginTop: rs(6), flexWrap: 'wrap' },
  badge: { borderRadius: rd.radius.pill, paddingHorizontal: rs(9), paddingVertical: rs(3) },
  badgeText: { fontFamily: rd.font.semibold, fontSize: rs(11) },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginTop: rs(12) },
  phoneText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(13.5), color: rd.color.textSecondary },
  phoneActions: { flexDirection: 'row', gap: rs(8) },
  smsBtn: { width: rs(34), height: rs(34), borderRadius: rs(17), backgroundColor: rd.color.primary, alignItems: 'center', justifyContent: 'center' },
  callBtn: { width: rs(34), height: rs(34), borderRadius: rs(17), backgroundColor: rd.color.success, alignItems: 'center', justifyContent: 'center' },
  actGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8), marginTop: rs(14), paddingTop: rs(14), borderTopWidth: 1, borderTopColor: rd.color.border },
  demandHint: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(8), textAlign: 'center' },

  tiles: { flexDirection: 'row', gap: rs(10) },
  tile: { flex: 1, backgroundColor: rd.color.surface, borderRadius: rd.radius.md, borderWidth: 1, borderColor: rd.color.border, paddingVertical: rs(12), paddingHorizontal: rs(8), alignItems: 'center' },
  tileLabel: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary },
  tileVal: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.text, marginTop: rs(4) },
  barTrack: { height: rs(9), borderRadius: rs(5), backgroundColor: rd.color.surfaceAlt, marginTop: rs(12), overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: rs(5) },
  pctText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), marginTop: rs(6), marginBottom: rs(4) },

  infoCard: { backgroundColor: rd.color.surface, borderRadius: rd.radius.lg, borderWidth: 1, borderColor: rd.color.border, padding: rs(14), marginTop: rs(10) },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: rs(12), paddingVertical: rs(7) },
  infoLabel: { fontFamily: rd.font.regular, fontSize: rs(13), color: rd.color.textTertiary },
  infoRight: { flex: 1, alignItems: 'flex-end' },
  infoValue: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text, textAlign: 'right' },

  // Modallar
  modalInput: { width: '100%', height: rs(50), borderRadius: rd.radius.md, borderWidth: 1.5, borderColor: rd.color.border, backgroundColor: rd.color.page, paddingHorizontal: rs(14), fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.text },
  formLabel: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.textSecondary, marginTop: rs(12), marginBottom: rs(6) },
  smsRow: { flexDirection: 'row', alignItems: 'center', marginTop: rs(14), backgroundColor: rd.color.page, borderRadius: rd.radius.md, padding: rs(12) },
  smsLabel: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  smsSub: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary, marginTop: rs(2), lineHeight: rs(15) },
  smsTplList: { maxHeight: rs(330) },
  smsTpl: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(10), backgroundColor: rd.color.page, borderRadius: rd.radius.md, borderWidth: 1, borderColor: rd.color.border, padding: rs(12), marginTop: rs(10) },
  smsTplText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.text, lineHeight: rs(19) },
  // 02.10: "Qarzni yopish / qaytarish" oynasi
  payCard: { maxHeight: '90%' },
  paySub: { fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.textTertiary, marginBottom: rs(12) },
  paySubStrong: { fontFamily: rd.font.semibold, color: rd.color.textSecondary },
  seg: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: rd.radius.md, padding: rs(4), gap: rs(4) },
  segBtn: { flex: 1, height: rs(36), borderRadius: rs(9), alignItems: 'center', justifyContent: 'center' },
  segBtnOn: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: '#4B5563' },
  segTextOn: { color: '#111827' },
  amountWrap: { flexDirection: 'row', alignItems: 'center', height: rs(50), borderRadius: rd.radius.md, borderWidth: 1.5, borderColor: rd.color.border, backgroundColor: rd.color.page, paddingHorizontal: rs(14) },
  amountInput: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.text, paddingVertical: 0 },
  amountCur: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textTertiary, marginLeft: rs(8) },
  errText: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: RED, marginTop: rs(5) },

  // Tarix
  histCard: { backgroundColor: rd.color.surface, borderRadius: rd.radius.lg, borderWidth: 1, borderColor: rd.color.border, padding: rs(14), marginTop: rs(12) },
  histTitle: { fontFamily: rd.font.bold, fontSize: rs(14.5), color: rd.color.text, marginBottom: rs(4) },
  histRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: rs(9), borderTopWidth: 1, borderTopColor: rd.color.border },
  histLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(10), flex: 1 },
  histDot: { width: rs(30), height: rs(30), borderRadius: rs(15), alignItems: 'center', justifyContent: 'center' },
  histType: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  histDate: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(1) },
  histBy: { fontFamily: rd.font.medium, fontSize: rs(11), color: '#4F46E5', marginTop: rs(1) },
  histAmt: { fontFamily: rd.font.bold, fontSize: rs(13.5) },

  // SS6: ko'zgu qarz tushuntirishi
  mirrorNote: { backgroundColor: AMBER + '14', borderWidth: 1, borderColor: AMBER + '40', borderRadius: rd.radius.md, padding: rs(12), marginTop: rs(12) },
  mirrorNoteTitle: { fontFamily: rd.font.bold, fontSize: rs(12.5), color: AMBER, marginBottom: rs(4) },
  mirrorNoteText: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary, lineHeight: rs(18) },
  // Shikoyat
  complainBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), height: rs(46), borderRadius: rd.radius.md, backgroundColor: '#fff1f2', borderWidth: 1, borderColor: ROSE + '33', marginTop: rs(10) },
  complainText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: '#be123c' },
  complainIconWrap: { alignSelf: 'center', width: rs(52), height: rs(52), borderRadius: rs(26), backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', marginBottom: rs(10) },
  reasonBtn: { borderWidth: 1, borderColor: rd.color.border, borderRadius: rd.radius.md, paddingHorizontal: rs(14), paddingVertical: rs(11), marginTop: rs(8), backgroundColor: rd.color.surface },
  reasonBtnOn: { borderColor: ROSE, backgroundColor: '#fff1f2' },
  reasonText: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.text },
  reasonTextOn: { color: '#9f1239' },
  centerText: { textAlign: 'center' },
  formLabelHint: { fontFamily: rd.font.regular, color: rd.color.textTertiary },
  complainInput: { height: rs(76), marginTop: rs(10), paddingTop: rs(10), textAlignVertical: 'top', fontFamily: rd.font.regular, fontSize: rs(13.5) },
  complainCard: { maxHeight: '92%' },
  // 03.10: ustun + markaz (ilgari ikonka chapda, matn chapga tekislangan edi)
  complainDone: { alignItems: 'center', gap: rs(8), backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#dcfce7', borderRadius: rd.radius.md, paddingVertical: rs(14), paddingHorizontal: rs(14), marginTop: rs(4) },
  complainDoneText: { fontFamily: rd.font.medium, fontSize: rs(13), color: '#166534', lineHeight: rs(19), textAlign: 'center' },

  backdrop: { flex: 1, backgroundColor: 'rgba(9,14,26,0.55)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(24) },
  confirmCard: { width: '100%', backgroundColor: rd.color.surface, borderRadius: rd.radius.xxl, padding: rs(20) },
  confirmTitle: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text, marginBottom: rs(8) },
  confirmText: { fontFamily: rd.font.regular, fontSize: rs(14), color: rd.color.textSecondary, marginBottom: rs(14), lineHeight: rs(20) },
  confirmBtns: { flexDirection: 'row', gap: rs(12) },
  cancelBtn: { flex: 1, height: rs(50), borderRadius: rd.radius.md, backgroundColor: rd.color.surfaceAlt, borderWidth: 1, borderColor: rd.color.border, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.textSecondary },
  confirmDel: { flex: 1, height: rs(50), borderRadius: rd.radius.md, alignItems: 'center', justifyContent: 'center' },
  confirmDelText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: '#fff' },
});
