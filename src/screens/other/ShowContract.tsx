import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { rd, rs } from '../../theme/rd';

export default function ShowContract() {
  return (
    <View style={styles.container}>
      <Text style={styles.title} allowFontScaling={false}>
        ShowContract
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: rd.color.page,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(16),
  },
  title: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.text,
  },
});
