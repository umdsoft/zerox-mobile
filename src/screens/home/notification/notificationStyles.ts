import { StyleSheet } from 'react-native';
import { rd, rs } from '../../../theme/rd';

export const styles = StyleSheet.create({
  rdContainer: { flex: 1, backgroundColor: rd.color.page },
  rdBody: { flex: 1, paddingTop: rs(8) },
  rdEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: rs(60), gap: rs(14) },
  rdEmptyCircle: {
    width: rs(84),
    height: rs(84),
    borderRadius: rs(42),
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rdEmptyText: { fontFamily: rd.font.medium, fontSize: rs(14), color: rd.color.textTertiary, textAlign: 'center' },
  container: {
    backgroundColor: rd.color.page,
    flex: 1,
  },

});
