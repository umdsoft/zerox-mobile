import { StyleSheet, View } from 'react-native';
import React from 'react';
import { normalize } from '../../theme/style';
import AppIcon from '../../images/AppIcon.svg';
import LottieView from 'lottie-react-native';

const Loading = () => {
  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../images/jsonloading/lf30_editor_2wueqzih.json')}
        style={{
          width: normalize(150),
          height: normalize(150),
        }}
        loop={true}
        autoPlay={true}
      />
      <View
        style={[
          {
            alignItems: 'center',
            justifyContent: 'center',
            ...StyleSheet.absoluteFillObject,
          },
        ]}>
        <AppIcon width={normalize(30)} height={normalize(30)} />
      </View>
    </View>
  );
};

export default Loading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
