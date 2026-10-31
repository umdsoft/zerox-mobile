/**
 * gapDetailStyles.ts — FinanceGapDetail va gap/components/* uchun YAGONA uslublar to'plami.
 * StyleSheet kalitlari va qiymatlari bo'linishdan oldingi bilan AYNAN bir xil (vizual o'zgarish yo'q).
 */
import { StyleSheet } from 'react-native';
import { rd, rs } from '../../../../theme/rd';

export const TEAL = '#0d9488';
export const GREEN = '#16a34a';
export const RED = '#dc2626';
export const AMBER = '#f59e0b';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(10), paddingBottom: rs(20) },

  headCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: rd.color.surface, borderRadius: rd.radius.lg, borderWidth: 1, borderColor: rd.color.border, padding: rs(16), marginBottom: rs(14) },
  headName: { fontFamily: rd.font.bold, fontSize: rs(18), color: rd.color.text },
  headSub: { fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.textTertiary, marginTop: rs(3) },
  headAmt: { fontFamily: rd.font.bold, fontSize: rs(16), color: TEAL },

  card: { backgroundColor: rd.color.surface, borderRadius: rd.radius.lg, borderWidth: 1, borderColor: rd.color.border, padding: rs(14), marginBottom: rs(12) },
  cardTitle: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text, marginBottom: rs(10) },

  // SS11: navbat rejimi tanlagichi + qo‘lda surish tugmalari
  // SS11: sozlamalar tugmasi
  gearBtn: { width: rs(34), height: rs(34), alignItems: 'center', justifyContent: 'center' },
  gearIcon: { fontSize: rs(18) },
  freqRow: { flexDirection: 'row', gap: rs(8), marginTop: rs(6) },
  freqBtn: {
    flex: 1, alignItems: 'center', paddingVertical: rs(9), borderRadius: rd.radius.md,
    borderWidth: 1.5, borderColor: rd.color.border, backgroundColor: rd.color.surface,
  },
  freqText: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.textSecondary },
  orderModeRow: { flexDirection: 'row', gap: rs(8), marginTop: rs(10), marginBottom: rs(4) },
  orderModeBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: rs(9), borderRadius: rd.radius.md,
    borderWidth: 1.5, borderColor: rd.color.border, backgroundColor: rd.color.surface,
  },
  orderModeText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.textSecondary },
  // SS5: navbat surish tugmalari — normal o‘lchamda (28px doira), kesilmaydi.
  moveCol: { alignItems: 'center', justifyContent: 'center', gap: rs(5), marginRight: rs(8) },
  moveBtn: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TEAL + '14',
    borderWidth: 1,
    borderColor: TEAL + '33',
  },
  moveBtnOff: { backgroundColor: rd.color.surfaceAlt, borderColor: rd.color.border },
  moveArrow: { fontSize: rs(13), color: TEAL, lineHeight: rs(16), includeFontPadding: false },
  moveArrowOff: { color: rd.color.textTertiary },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12), paddingVertical: rs(8), borderTopWidth: 1, borderTopColor: rd.color.border },
  // SS6: tashkilotchi nishoni va boshqaruv tugmalari.
  orgWrap: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  orgTag: { borderRadius: rd.radius.pill, paddingHorizontal: rs(8), paddingVertical: rs(3) },
  orgTagText: { fontFamily: rd.font.bold, fontSize: rs(10) },
  orgAddBtn: {
    borderRadius: rd.radius.pill,
    borderWidth: 1,
    borderColor: TEAL + '55',
    backgroundColor: TEAL + '0F',
    paddingHorizontal: rs(9),
    paddingVertical: rs(4),
  },
  orgAddText: { fontFamily: rd.font.semibold, fontSize: rs(10.5), color: TEAL },
  // SS6: PDF tugmasi (a'zolar sarlavhasida).
  pdfBtn: {
    borderRadius: rd.radius.pill,
    backgroundColor: '#4F46E5' + '14',
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
  },
  pdfBtnText: { fontFamily: rd.font.bold, fontSize: rs(11), color: '#4F46E5' },
  memberOrder: { width: rs(28), height: rs(28), borderRadius: rs(14), backgroundColor: TEAL + '16', alignItems: 'center', justifyContent: 'center' },
  memberOrderText: { fontFamily: rd.font.bold, fontSize: rs(12.5), color: TEAL },
  memberName: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  memberAmt: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(1) },

  addBox: { marginTop: rs(12), gap: rs(8) },
  // SS14: telefon maydoni — "+998" prefiksi input bilan bitta ramkada.
  phoneWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    height: rs(46),
    borderRadius: rd.radius.md,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.page,
    paddingHorizontal: rs(12),
  },
  phonePrefix: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  phoneInput: {
    flex: 1,
    padding: 0,
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.text,
  },
  addInput: { height: rs(46), borderRadius: rd.radius.md, borderWidth: 1.5, borderColor: rd.color.border, backgroundColor: rd.color.page, paddingHorizontal: rs(12), fontFamily: rd.font.medium, fontSize: rs(14), color: rd.color.text },
  addMemberBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6), height: rs(44), borderRadius: rd.radius.md, backgroundColor: TEAL + '12' },
  addMemberText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: TEAL },

  startBtn: { height: rs(50), borderRadius: rd.radius.md, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', marginBottom: rs(12) },
  startText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: '#fff' },

  round: { paddingVertical: rs(10), borderTopWidth: 1, borderTopColor: rd.color.border },
  roundHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roundNo: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  roundDate: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textTertiary },
  roundRecipient: { fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.textSecondary, marginTop: rs(4) },
  roundProgress: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(2), marginBottom: rs(6) },
  // So'rov: uchrashuv joyi (venue)
  venueBox: { backgroundColor: TEAL + '0F', borderRadius: rs(10), paddingHorizontal: rs(10), paddingVertical: rs(8), marginBottom: rs(8) },
  cardField: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1.5, borderRadius: rs(12), padding: rs(10), marginTop: rs(4) },
  cardFieldLabel: { fontFamily: rd.font.bold, fontSize: rs(13), color: '#1E40AF', marginBottom: rs(6) },
  cardFieldInput: { height: rs(44), borderRadius: rd.radius.md, borderWidth: 1, borderColor: '#BFDBFE', backgroundColor: '#fff', paddingHorizontal: rs(12), fontFamily: rd.font.medium, fontSize: rs(14), color: rd.color.text },
  cardFieldHint: { fontFamily: rd.font.regular, fontSize: rs(11), color: '#2563EB', marginTop: rs(5) },
  cardBox: { flexDirection: 'row', alignItems: 'center', gap: rs(10), backgroundColor: '#EFF6FF', borderRadius: rs(10), paddingHorizontal: rs(10), paddingVertical: rs(8), marginBottom: rs(8) },
  cardLabel: { fontFamily: rd.font.medium, fontSize: rs(11), color: rd.color.textTertiary },
  cardNum: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text, marginTop: rs(1) },
  cardHolder: { fontFamily: rd.font.medium, fontSize: rs(11), color: rd.color.textSecondary, marginTop: rs(2) },
  // SS4: matnli "Nusxa" o'rniga ikonka-tugmalar (nusxalash / tahrirlash).
  cardIconBtn: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(8),
    backgroundColor: TEAL + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // SS4: joy qatoridagi qalam ikonkasi uchun bosish maydoni.
  iconBtn: { alignItems: 'center', justifyContent: 'center' },
  inviteBtn: { backgroundColor: '#4F46E5', borderRadius: rs(10), paddingVertical: rs(11), alignItems: 'center', justifyContent: 'center', marginBottom: rs(8) },
  inviteBtnText: { fontFamily: rd.font.bold, fontSize: rs(13), color: '#fff' },
  attWrap: { flexDirection: 'row', gap: rs(8), marginBottom: rs(8) },
  attBox: { flex: 1, borderRadius: rs(10), paddingHorizontal: rs(10), paddingVertical: rs(8) },
  attTitle: { fontFamily: rd.font.bold, fontSize: rs(11.5), marginBottom: rs(3) },
  attNames: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textSecondary },
  venueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(6) },
  venueText: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },
  venueActions: { flexDirection: 'row', gap: rs(14), marginTop: rs(6), marginLeft: rs(21) },
  venueLink: { fontFamily: rd.font.bold, fontSize: rs(12), color: TEAL },
  // SS11: plastik karta tugmasi (alohida oyna ochadi)
  cardAddBtn: {
    marginTop: rs(8),
    alignSelf: 'flex-start',
    backgroundColor: TEAL + '12',
    borderWidth: 1,
    borderColor: TEAL + '44',
    borderRadius: rd.radius.md,
    paddingHorizontal: rs(12),
    paddingVertical: rs(8),
  },
  cardAddText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: TEAL },
  venueAddBtn: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  venueAddText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: TEAL },
  venueEmpty: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary },
  venueFieldLabel: { fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.textSecondary, marginTop: rs(10), marginBottom: rs(6), alignSelf: 'flex-start' },
  venueInput: { width: '100%', borderRadius: rs(12), borderWidth: 1.5, borderColor: rd.color.border, backgroundColor: rd.color.page, paddingHorizontal: rs(12), paddingVertical: rs(10), fontFamily: rd.font.medium, fontSize: rs(13.5), color: rd.color.text },
  settingsScroll: { width: '100%', maxHeight: rs(430), flexGrow: 0 },
  // SS6: sozlamalar modalidagi tushuntirish matni (saytdagi kulrang izoh).
  settingsHint: {
    width: '100%',
    fontFamily: rd.font.regular,
    fontSize: rs(11),
    lineHeight: rs(16),
    color: rd.color.textTertiary,
    marginTop: rs(5),
    alignSelf: 'flex-start',
  },
  // img8: xaritadan belgilash tugmasi
  mapPickBtn: { flexDirection: 'row', alignItems: 'center', gap: rs(8), width: '100%', borderRadius: rs(12), borderWidth: 1.5, borderColor: TEAL + '55', backgroundColor: TEAL + '0F', paddingHorizontal: rs(12), paddingVertical: rs(11) },
  mapPickText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: TEAL },
  mapCoord: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary, marginTop: rs(6), alignSelf: 'flex-start' },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), paddingVertical: rs(6) },
  payName: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.text },
  payAmt: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.textSecondary },
  // SS3: "To'langan" + "Bekor qilish" yonma-yon.
  paidWrap: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  // SS2: matnli "Bekor qilish" o'rniga ixcham dumaloq ikonka-tugma.
  unpayIconBtn: {
    width: rs(26),
    height: rs(26),
    borderRadius: rs(13),
    borderWidth: 1,
    borderColor: RED + '55',
    backgroundColor: RED + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // SS2: ustun kengligi "✓ To'langan" BIR QATORGA sig'adigan eng kichik
  // qiymatga qo'yildi (rs78 da so'z ikki qatorga sinib ketardi).
  payDone: { fontFamily: rd.font.semibold, fontSize: rs(11.5), color: GREEN, width: rs(84), textAlign: 'right' },
  payPending: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: AMBER, width: rs(84), textAlign: 'right' },
  payBtn: { backgroundColor: TEAL, borderRadius: rd.radius.pill, paddingHorizontal: rs(12), paddingVertical: rs(6) },
  payBtnText: { fontFamily: rd.font.semibold, fontSize: rs(11.5), color: '#fff' },

  delBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), height: rs(48), borderRadius: rd.radius.md, backgroundColor: RED + '10', marginTop: rs(8) },
  delText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: RED },

  backdrop: { flex: 1, backgroundColor: 'rgba(9,14,26,0.55)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(24) },
  confirmCard: { width: '100%', backgroundColor: rd.color.surface, borderRadius: rd.radius.xxl, padding: rs(20) },
  confirmTitle: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text, marginBottom: rs(8) },
  confirmText: { fontFamily: rd.font.regular, fontSize: rs(14), color: rd.color.textSecondary, marginBottom: rs(18) },
  confirmBtns: { flexDirection: 'row', gap: rs(12) },
  cancelBtn: { flex: 1, height: rs(50), borderRadius: rd.radius.md, backgroundColor: rd.color.surfaceAlt, borderWidth: 1, borderColor: rd.color.border, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.textSecondary },
  confirmDel: { flex: 1, height: rs(50), borderRadius: rd.radius.md, alignItems: 'center', justifyContent: 'center' },
  confirmDelText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: '#fff' },
});
