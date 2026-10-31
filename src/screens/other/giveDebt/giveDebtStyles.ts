import { StyleSheet } from 'react-native';
import { rd, rs } from '../../../theme/rd';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: rd.color.page,
    flex: 1,
  },
  main: {
    flex: 1,
    paddingHorizontal: rs(16),
    paddingTop: rs(8),
  },

  // Ishtirokchilar kartasi
  partyCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partyDivider: {
    height: 1,
    backgroundColor: rd.color.border,
    marginVertical: rs(14),
  },
  avatar: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(24),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyInfo: {
    flex: 1,
    marginLeft: rs(12),
  },
  partyRole: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.error,
    marginBottom: rs(2),
  },
  partyRoleCreditor: {
    color: rd.color.success,
  },
  partyName: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.text,
  },

  // Valyuta segment
  currencyRow: {
    flexDirection: 'row',
    marginTop: rs(20),
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.lg,
    padding: rs(4),
  },
  currencyOption: {
    flex: 1,
    height: rs(44),
    borderRadius: rd.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyOptionActive: {
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
  },
  currencyText: {
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.textSecondary,
  },
  currencyTextActive: {
    fontFamily: rd.font.semibold,
    color: rd.color.primary,
  },

  // Maydonlar
  field: {
    marginTop: rs(20),
  },
  label: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginBottom: rs(8),
  },
  inputWrap: {
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    height: rs(56),
    paddingHorizontal: rs(16),
    justifyContent: 'center',
  },
  inputText: {
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
  },
  inputPlaceholder: {
    color: rd.color.textTertiary,
  },
  TextInput: {
    width: '100%',
    height: '100%',
    padding: 0,
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
  },

  // Shartnoma bilan tanishish
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(20),
  },
  agreeText: {
    flex: 1,
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.primary,
    marginLeft: rs(12),
  },
  cntRow: {
    marginTop: rs(12),
  },
  cntText: {
    fontFamily: rd.font.regular,
    fontSize: rs(14),
    color: rd.color.text,
  },

  // Xizmat haqi info-kartasi — yumshoq amber fon + chap rangли urg'u + tanga ikonka.
  feeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: rs(14),
    backgroundColor: rd.color.warningBg,
    borderRadius: rd.radius.lg,
    borderLeftWidth: rs(3),
    borderLeftColor: rd.color.warning,
    paddingVertical: rs(12),
    paddingHorizontal: rs(14),
    gap: rs(12),
  },
  feeIconWrap: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    backgroundColor: rd.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeTextWrap: {
    flex: 1,
  },

  // Tugma
  button: {
    height: rs(54),
    borderRadius: rd.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(24),
  },
  buttonActive: {
    backgroundColor: rd.color.primary,
  },
  buttonDisabled: {
    backgroundColor: rd.color.surfaceAlt,
  },
  buttonText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
  buttonTextDisabled: {
    color: rd.color.textTertiary,
  },
});
