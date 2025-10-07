import {StyleSheet, Text, View} from 'react-native';
import React, {memo} from 'react';
import {style} from '../../theme/style';

const Border = () => {
  return (
    <View
      style={{
        backgroundColor: style.backgroundColor,
        width: '100%',
        height: 2,
      }}
    />
  );
};

export default memo(Border);

const styles = StyleSheet.create({});
