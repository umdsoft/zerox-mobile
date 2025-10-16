import {StyleSheet, Text, TouchableOpacity, View, Modal} from 'react-native';
import React, {useCallback} from 'react';
// import {Modal} from 'react-native-paper';
import {style} from '../../../theme/style';
import {useDispatch, useSelector} from 'react-redux';

import {useTranslation} from 'react-i18next';
import {navigate} from '../../../navigation/NavigationRef';
import {checkExpire} from '../../../store/reducers/HomeReducer';

const ExpirePassportModal = () => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const {expire} = useSelector(state => state.HomeReducer);
  const onClose = useCallback(async () => {
    navigate('ChangePassportData');
    dispatch(checkExpire({expire: false}));
  }, []);

  const onOk = useCallback(async () => {
    dispatch(checkExpire({expire: false}));
  }, []);

  return (
    <Modal
      visible={expire}
      transparent
      animationType="fade"
      onRequestClose={() => {
        dispatch(checkExpire({expire: false}));
      }}>
      <View style={styles.overlay}>
        <View style={styles.main}>
          <View style={styles.view}>
            <Text style={styles.teext} allowFontScaling={false}>{t('expire_passport')}</Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
              }}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.btn, {marginRight: 10}]}>
                <Text style={[styles.teextx, {color: '#fff'}]} allowFontScaling={false}>{t('747')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onOk} style={styles.btn}>
                <Text style={[styles.teextx, {color: '#fff'}]} allowFontScaling={false}>{t('OK')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ExpirePassportModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)', // semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  main: {
    backgroundColor: '#fff',
    width: '90%',
    height: '20%',
    padding: 10,
    borderRadius: 12,
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: style.blue,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  view: {flex: 1, justifyContent: 'space-around'},
  teext: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    color: style.textColor,
    // marginLeft: 10,
    maxWidth: '90%',
  },
  teextx: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx - 2,
    color: style.textColor,
    // marginLeft: 10,
  },
});
