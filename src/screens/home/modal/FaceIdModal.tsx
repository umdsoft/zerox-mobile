import {StyleSheet, Text, View} from 'react-native';
import React, {useCallback} from 'react';
import {normalize, style} from '../../../theme/style';
import {useDispatch, useSelector} from 'react-redux';
import {showModal} from '../../../store/reducers/HomeReducer';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import AppModal from '../../components/AppModal';
import Button from '../../components/Button';

const FaceIdModal = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const {t} = useTranslation();
  const {isActive} = useSelector(state => state.HomeReducer);

  const onClose = useCallback(() => {
    dispatch(showModal({show: false}));
  }, [dispatch]);
  return (
    <AppModal visible={isActive} onDismiss={onClose}>
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
        <Button
          title={t('otish')}
          onPress={() => {
            navigation.navigate('ScanFaceMyId');
            dispatch(showModal({show: false}));
          }}
          fullWidth={false}
          style={styles.enterButton}
        />
        <Button
          title={t('750')}
          onPress={onClose}
          fullWidth={false}
          style={styles.enterButton}
        />
      </View>
    </AppModal>
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
});
