/**
 * ofertaStyles.ts — ContractModal (ommaviy oferta oynasi) uslublari; ContractModal.tsx dan ko'chirilgan, kalitlar o'zgarmagan.
 */
import { StyleSheet } from 'react-native';
import { rd, rs } from '../../../../theme/rd';

export const styles = StyleSheet.create({
  // SS-DEV (2026-10-04): Paper Modal wrapper — margin/markazlash yo'q (pastga qarang).
  modalWrapper: {
    marginTop: 0,
    marginBottom: 0,
    justifyContent: 'flex-start',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  // SS-DEV (2026-10-04): ilgari `height: Dimensions('screen')` — ota maydondan
  // katta bo'lib, markazlanganda tepasi (orqaga tugmasi) kesilardi. Endi flex:1.
  main: {
    flex: 1,
    width: '100%',
    backgroundColor: rd.color.surface,
    paddingHorizontal: rs(16),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: rs(4),
    paddingBottom: rs(8),
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
  },
  // RdHeader bilan bir xil: to'ldirilgan ko'k doira + oq chevron.
  backBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sarlavha markazda tursin — chapdagi tugma bilan teng o'ng bo'shliq.
  topSide: { width: rs(40) },
  // So'rov SS5: Pdf uchun aniq o'lcham — ilgari `styles.pdf` UNDEFINED edi,
  // shu bois PDF 0-balandlikда ("ko'rinmayapti") render bo'lishi mumkin edi.
  pdf: {
    flex: 1,
    width: '100%',
    backgroundColor: rd.color.surface,
  },
  // 08.10: PDF o'rovi (teginishlarni sanash) — PDF bilan bir xil maydon.
  pdfWrap: {
    flex: 1,
    width: '100%',
  },
  indicator: {
    flex: 1,
    justifyContent: 'center',
  },
  errBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(24),
  },
  errText: {
    fontFamily: rd.font.medium,
    fontSize: rs(14.5),
    lineHeight: rs(21),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginBottom: rs(18),
  },
  retryBtn: {
    paddingHorizontal: rs(24),
    paddingVertical: rs(12),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
  },
  retryText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14.5),
    color: rd.color.onPrimary,
  },
  footer: {
    backgroundColor: rd.color.surface,
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
    paddingTop: rs(8),
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rs(10),
  },
  checkbox: {
    height: rs(20),
    width: rs(20),
  },
  checkText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginLeft: rs(10),
    // SS-DEV (2026-10-05): matn bitta oqim — sig'masa tabiiy o'raladi.
    flex: 1,
    flexShrink: 1,
  },
  btn: {
    height: rs(52),
    paddingHorizontal: rs(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rd.radius.lg,
    alignSelf: 'center',
    width: '100%',
    marginBottom: rs(16),
  },
  btnActiveShadow: {
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  btnText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.onPrimary,
  },
});
