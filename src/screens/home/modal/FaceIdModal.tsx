import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useCallback} from 'react';
import {Modal} from 'react-native-paper';
import {normalize, style} from '../../../theme/style';
import {useDispatch, useSelector} from 'react-redux';
import {showModal} from '../../../store/reducers/HomeReducer';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

const FaceIdModal = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const {t} = useTranslation();
  const {isActive} = useSelector(state => state.HomeReducer);

  const onClose = useCallback(() => {
    dispatch(showModal({show: false}));
  }, [dispatch]);
  return (
    <Modal visible={isActive} onDismiss={onClose}>
      <View style={styles.main}>
        <View style={{marginTop: 8, maxWidth: '90%'}}>
          <Text
            style={[styles.text, {fontFamily: style.fontFamilyMedium}]}
            allowFontScaling={false}>
            {t('Identifikatsiya')}
          </Text>
        </View>
        <View style={styles.mainInside}>
          {/* <Text
            style={{
              fontFamily: style.fontFamilyMedium,
              color: '#000',
              fontSize: style.fontSize.xs,
            }}
          >
            Bugun soat 22:30
          </Text> */}
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('ScanFaceMyId');
              dispatch(showModal({show: false}));
            }}
            activeOpacity={0.8}
            style={styles.enterButton}>
            <Text style={styles.btnText} allowFontScaling={false}>{t('otish')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            style={styles.enterButton}>
            <Text style={styles.btnText} allowFontScaling={false}>{t('750')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default FaceIdModal;

const styles = StyleSheet.create({
  enterButton: {
    backgroundColor: style.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    alignSelf: 'center',
    height: normalize(35),
    paddingHorizontal: 10,
  },
  main: {
    backgroundColor: '#fff',
    borderRadius: normalize(10),
    alignSelf: 'center',
    padding: 10,
  },
  rw: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    fontFamily: style.fontFamilyBold,
    color: '#000',
    fontSize: style.fontSize.xx,
  },
  mainInside: {
    flexDirection: 'row',
    marginTop: normalize(15),
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnText: {
    fontFamily: style.fontFamilyMedium,
    color: '#fff',
    fontSize: style.fontSize.xx,
    textAlign: 'center',
  },
});
