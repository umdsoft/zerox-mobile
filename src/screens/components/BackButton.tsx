import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import ArrowLeft from '../../images/ArrowLeft';
import {rd, rs} from '../../theme/rd';

// REDIZAYN: eski ko'k to'ldirilgan doira o'rniga yengil oq doira + chegara
// (RdHeader bilan bir xil uslub). Prop interfeysi O'ZGARMAGAN.
const BackButton = ({navigation, backgroundColor, IconColor}) => {
  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          navigation.goBack();
        }}
        style={[
          styles.TouchableOpacity,
          backgroundColor ? {backgroundColor} : null,
        ]}>
        <ArrowLeft width={rs(20)} height={rs(20)} color={IconColor || rd.color.text} />
      </TouchableOpacity>
    </View>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  TouchableOpacity: {
    width: rs(42),
    height: rs(42),
    borderRadius: rs(21),
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
