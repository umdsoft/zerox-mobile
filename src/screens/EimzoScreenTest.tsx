import {Button, DeviceEventEmitter, StyleSheet, View} from 'react-native';
import React, {useEffect} from 'react';
import {eimzo} from '../nativemodule/android.event';

const EimzoScreenTest = () => {
  useEffect(() => {
    DeviceEventEmitter.addListener('eimzo', data => {
      console.log('data', JSON.parse(JSON.stringify(data, null, 2)));
    });

    DeviceEventEmitter.addListener('errorrr', data => {
      console.log(data, 'errorr');
    });

    return () => {
      DeviceEventEmitter.removeAllListeners('eimzo');
    };
  }, []);
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Button
        title="Open"
        onPress={() => {
          eimzo();
        }}
      />
    </View>
  );
};

export default EimzoScreenTest;

const styles = StyleSheet.create({});

// const createQRCode = (siteId,documentId,hashStiring)=>{
//     let qrbody = siteId + documentId + hashString;

// }

// const zerePad = (s,count)=>{
//     if (s.length >= count) {
//         return s;
//     }
//     let sb = []
//     for (let i = 0; i < count - s.length(); i++) {
//         sb.push("0");
//     }
//     sb.push(s);
//     return sb.join("")
// }
