import { StyleSheet } from 'react-native';
import { heightPercentageToDP } from 'react-native-responsive-screen';
import { scale } from '../../../helper/scale';
import { style } from '../../../theme/style';
import { rd, rs } from '../../../theme/rd';

// PIN paneli o'lchamlari.
// MUAMMO: panel kengligi `heightPercentageToDP(33)` edi — GORIZONTAL o'lcham ekran BALANDLIGIga bog'langan,
// tugma cheti esa `scale()` orqali KENGLIKka; planshetda 3 ta tugma sig'may panel 2 ustunga tushardi.
// YECHIM: panel kengligi TUGMA o'lchamidan hisoblanadi -> har qanday ekranda aynan 3 ustun.
// DIQQAT: `flexWrap` da grid kengligi 3 tugmaga AYNAN teng bo'lsa, sub-piksel yaxlitlash oxirgi tugmani
// pastga o'raydi; shuning uchun grid kengligiga BUFER (+14dp) qo'shiladi.
export const PIN_BTN_SIZE = heightPercentageToDP(8.4);
export const PIN_BTN_MARGIN = scale(10);
export const PIN_GRID_WIDTH = (PIN_BTN_SIZE + PIN_BTN_MARGIN * 2) * 3 + 14;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: rd.color.page,
  },
  enterButton: {
    width: '90%',
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    height: style.buttonHeight - 15,
    alignSelf: 'center',
  },
  codeNumberContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // KONTRAST: och-kulrang page fonida oq tugma + chegara + yengil soya bilan
  // aniq ajralib turadi (ilgari surfaceAlt fon bilan deyarli qo'shilib ketgandi).
  codeButton: {
    width: PIN_BTN_SIZE,
    height: PIN_BTN_SIZE,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    margin: PIN_BTN_MARGIN,
    overflow: 'hidden',
    shadowColor: '#0b1220',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  fourItem: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 10,
  },
  codeItem: {
    width: 18,
    height: 18,
    backgroundColor: rd.color.primary,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
  },
  codeContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    borderTopRightRadius: 15,
    borderTopLeftRadius: 15,
  },
  setCodeTextContainer: {
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  textCode: {
    fontSize: style.fontSize.m,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
  notSetPasswordButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    alignSelf: 'flex-end',
    marginRight: 20,
    marginTop: 10,
  },
  resetPill: {
    paddingHorizontal: rs(16),
    paddingVertical: rs(9),
    borderRadius: rs(22),
    backgroundColor: rd.color.primaryTint,
  },

  // Biometrik modal
  bioOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11,18,32,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(28),
  },
  bioCard: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rs(24),
    paddingHorizontal: rs(22),
    paddingTop: rs(26),
    paddingBottom: rs(18),
    alignItems: 'center',
  },
  bioIcon: {
    width: rs(72),
    height: rs(72),
    borderRadius: rs(36),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(16),
  },
  bioTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    color: rd.color.text,
    textAlign: 'center',
  },
  bioDesc: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    textAlign: 'center',
    lineHeight: rs(20),
    marginTop: rs(8),
    paddingHorizontal: rs(6),
  },
  bioBtns: {
    flexDirection: 'row',
    gap: rs(12),
    marginTop: rs(22),
    width: '100%',
  },
  bioBtn: {
    flex: 1,
    height: rs(50),
    borderRadius: rs(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioBtnGhost: {
    backgroundColor: rd.color.surfaceAlt,
    borderWidth: 1,
    borderColor: rd.color.border,
  },
  bioBtnGhostText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.textSecondary,
  },
  bioBtnPrimary: { backgroundColor: rd.color.primary },
  bioBtnPrimaryText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.onPrimary,
  },
  text: {
    fontSize: style.fontSize.xx,
    color: '#fff',
    fontFamily: style.fontFamilyBold,
  },
  notSetText: {
    color: '#fff',
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
  },
});
