import {StyleSheet, Text, TouchableOpacity, View, Modal} from 'react-native';
import React, {useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {useTranslation} from 'react-i18next';
import {navigate} from '../../../navigation/NavigationRef';
import {checkExpire} from '../../../store/reducers/HomeReducer';
import {rd, rs} from '../../../theme/rd';
import {ClockIcon} from '../redesign/icons';

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
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <ClockIcon size={rs(30)} color={rd.color.warning} strokeWidth={1.8} />
          </View>

          <Text style={styles.title} allowFontScaling={false}>
            {t('expire_passport')}
          </Text>

          <View style={styles.row}>
            <TouchableOpacity
              onPress={onOk}
              activeOpacity={0.85}
              style={[styles.btn, styles.btnCancel]}>
              <Text style={styles.btnCancelText} allowFontScaling={false}>
                {t('OK')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.85}
              style={[styles.btn, styles.btnPrimary]}>
              <Text style={styles.btnPrimaryText} allowFontScaling={false}>
                {t('747')}
              </Text>
            </TouchableOpacity>
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
    backgroundColor: 'rgba(19,26,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: rs(24),
  },
  card: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rs(24),
    padding: rs(24),
    alignItems: 'center',
  },
  iconCircle: {
    width: rs(64),
    height: rs(64),
    borderRadius: rs(32),
    backgroundColor: rd.color.warningBg,
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
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  btn: {
    flex: 1,
    height: rs(50),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rd.radius.lg,
  },
  btnCancel: {
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    marginRight: rs(12),
  },
  btnCancelText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.textSecondary,
  },
  btnPrimary: {
    backgroundColor: rd.color.primary,
    shadowColor: rd.color.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  btnPrimaryText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.onPrimary,
  },
});
