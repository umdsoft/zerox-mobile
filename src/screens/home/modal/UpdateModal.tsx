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
import { useSelector } from 'react-redux';

import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../theme/rd';
import { ShieldIcon } from '../redesign/icons';

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
      contentContainerStyle={styles.overlay}
      // onDismiss={() => {
      //   dispatch(checkUpdate({update: false}));
      // }}
    >
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <ShieldIcon size={rs(30)} color={rd.color.primary} strokeWidth={1.8} />
        </View>

        <Text style={styles.title} allowFontScaling={false}>
          {t('newUpdate')}
        </Text>

        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.85}
          style={styles.btn}
        >
          <Text style={styles.btnText} allowFontScaling={false}>
            {t('update')}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default UpdateModal;

const styles = StyleSheet.create({
  overlay: {
    paddingHorizontal: rs(24),
  },
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(24),
    padding: rs(24),
    alignItems: 'center',
  },
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
    fontSize: rs(17),
    lineHeight: rs(24),
    color: rd.color.text,
    textAlign: 'center',
    marginBottom: rs(22),
  },
  btn: {
    height: rs(52),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rd.color.primary,
    borderRadius: rd.radius.lg,
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  btnText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
});
