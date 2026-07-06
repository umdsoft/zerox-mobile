import { StyleSheet, Text, View } from 'react-native';
import React, { useState } from 'react';
import Uzbekistan from '../../images/Uzbekistan';
import { rd, rs } from '../../theme/rd';
import { MaskedTextInput } from 'react-native-advanced-input-mask';

// REDIZAYN: eski `style`/`fontSize` o'rniga `rd` tizimi. Mask va prop interfeysi
// O'ZGARMAGAN — faqat vizual qatlam yangi.
const InputMask = ({ onChangeText, value, icon = false }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.box, focused && styles.boxFocused]}>
      {icon && (
        <View style={styles.inputFlag}>
          <Uzbekistan />
          <Text style={styles.phoneNumberText} allowFontScaling={false}>
            +998
          </Text>
          <View style={styles.divider} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <MaskedTextInput
          allowFontScaling={false}
          value={value}
          mask="[00] [000] [00] [00]"
          placeholder="__ ___-__-__"
          placeholderTextColor={rd.color.textTertiary}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          style={styles.input}
        />
      </View>
    </View>
  );
};

export default InputMask;

const styles = StyleSheet.create({
  box: {
    backgroundColor: rd.color.surface,
    borderColor: rd.color.border,
    borderWidth: 1.5,
    borderRadius: rs(14),
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  boxFocused: { borderColor: rd.color.primary },
  inputFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: rs(14),
    height: rs(52),
  },
  phoneNumberText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
    marginLeft: rs(6),
  },
  divider: {
    width: 1,
    height: rs(22),
    backgroundColor: rd.color.border,
    marginLeft: rs(10),
  },
  input: {
    width: '100%',
    height: rs(52),
    paddingLeft: rs(12),
    fontSize: rs(15),
    fontFamily: rd.font.medium,
    color: rd.color.text,
  },
});
