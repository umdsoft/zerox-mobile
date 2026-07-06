import {StyleSheet, Text, View} from 'react-native';
import React, {useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {showModal} from '../../../store/reducers/HomeReducer';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import AppModal from '../../components/AppModal';
import Button from '../../components/Button';
import {rd, rs} from '../../../theme/rd';
import {FingerprintIcon} from '../redesign/icons';

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
      <View style={styles.iconCircle}>
        <FingerprintIcon size={rs(30)} color={rd.color.primary} strokeWidth={1.8} />
      </View>

      <Text style={styles.title} allowFontScaling={false}>
        {t('Identifikatsiya')}
      </Text>

      <View style={styles.actions}>
        <Button
          title={t('otish')}
          onPress={() => {
            navigation.navigate('ScanFaceMyId');
            dispatch(showModal({show: false}));
          }}
          style={styles.actionBtn}
        />
        <Button
          title={t('750')}
          onPress={onClose}
          variant="outline"
          style={styles.actionBtn}
        />
      </View>
    </AppModal>
  );
};

export default FaceIdModal;

const styles = StyleSheet.create({
  iconCircle: {
    width: rs(64),
    height: rs(64),
    borderRadius: rs(32),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(18),
  },
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    lineHeight: rs(25),
    color: rd.color.text,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    marginTop: rs(24),
  },
  actionBtn: {
    marginTop: rs(12),
  },
});
