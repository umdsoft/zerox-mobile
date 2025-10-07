import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback } from 'react';
import { Modal } from 'react-native-paper';
import { style } from '../../../theme/style';
import { useSelector } from 'react-redux';

import { useTranslation } from 'react-i18next';

const UpdateModal = () => {
  const { t } = useTranslation();
  const { update } = useSelector(state => state.HomeReducer);
  const onClose = useCallback(async () => {
    Linking.openURL(
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/uz/app/zerox/id6446497826'
        : 'https://play.google.com/store/apps/details?id=com.zeroxuz&hl=en',
    );
    // dispatch(checkUpdate({update: false}));
  }, []);

  return (
    <Modal
      visible={update}
      dismissable={false}
      // onDismiss={() => {
      //   dispatch(checkUpdate({update: false}));
      // }}
    >
      <View style={styles.main}>
        <View style={styles.view}>
          <Text style={styles.teext}>{t('newUpdate')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.btn}>
            <Text style={[styles.teext, { color: '#fff' }]}>{t('update')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default UpdateModal;

const styles = StyleSheet.create({
  main: {
    backgroundColor: '#fff',
    width: '90%',
    // height: normalize(100),
    height: '60%',
    alignSelf: 'center',
    padding: 10,
    borderRadius: 12,
  },
  btn: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: style.blue,
    borderRadius: 12,
    width: '100%',
  },
  view: { flex: 1, justifyContent: 'space-between' },
  teext: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    color: style.textColor,
    marginLeft: 10,
    maxWidth: '90%',
  },
});
