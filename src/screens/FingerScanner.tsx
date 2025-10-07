import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
// import TouchID from 'react-native-touch-id';
const FingerScanner = () => {
  // React.useEffect(() => {
  //   TouchID.isSupported()
  //     .then(() => {
  //       TouchID.authenticate('token', {unifiedErrors: false})
  //         .then(success => {
  //           console.log(success);
  //         })
  //         .catch(error => {
  //           console.log(error);
  //         });
  //     })
  //     .catch(err => {
  //       console.log(err, 'err');
  //     });
  // }, []);
  return (
    <View style={styles.container}>
      <Text>FINGER</Text>
    </View>
  );
};

export default FingerScanner;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#123212',
  },
});
