import React from 'react';
import { Linking, Modal, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { t } from 'i18next';
import { SUPPORT_TG_URL } from '../../constants';
import MainText from '../../components/MainText';
import MarkIcon from '../../../images/mark';
import { fontSize } from '../../../theme/font';
import { rd, rs } from '../../../theme/rd';
import { FingerprintIcon } from '../../home/redesign/icons';
import { formatRemaining } from '../../../store/api/token/pinLockout';
import { styles } from './setLocalPasswordStyles';

interface LockedProps {
  remainingMs: number;
  onReset: () => void;
}

/** Ketma-ket xato PIN'dan keyingi qulf ekrani. */
export const LockedView = ({ remainingMs, onReset }: LockedProps) => (
  <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
    <StatusBar backgroundColor={'#fff'} barStyle={'dark-content'} animated={true} />
    <MarkIcon width={100} height={100} color={'#fff'} />

    <MainText size={fontSize[12]} mTop={10} ft={rd.font.bold}>
      {t('Ilovaga kirish vaqtincha cheklandi')}
    </MainText>

    <MainText size={fontSize[12]} mTop={10} ft={rd.font.medium}>
      {t('Qolgan vaqt: {{time}}', { time: formatRemaining(remainingMs) })}
    </MainText>

    <MainText size={fontSize[12]} mTop={10} ft={rd.font.medium}>
      {t('PIN-kod bir necha bor xato kiritildi')}
    </MainText>
    <View style={{ width: '100%', alignItems: 'center', position: 'absolute', bottom: 30 }}>
      <TouchableOpacity activeOpacity={0.8} onPress={onReset} style={[styles.enterButton]}>
        <MainText color={rd.color.onPrimary} size={fontSize[14]}>
          {t('PIN-kodni tiklash')}
        </MainText>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          // 10.10: qo'llab-quvvatlash — @zeroxuz_bot (funksiyalar boti @ZeroXuzbot emas).
          Linking.openURL(SUPPORT_TG_URL);
        }}
      >
        <MainText ft={rd.font.bold} color={rd.color.primary} mTop={15} size={fontSize[12]}>
          {t('Qo‘llab-quvvatlash xizmati bilan bog‘lanish')}
        </MainText>
      </TouchableOpacity>
    </View>
  </View>
);

interface ModalProps {
  visible: boolean;
  onChoose: (yes: boolean) => void;
}

/** Biometrik kirish — brendlangan opt-in modal (native Alert o'rniga). */
export const BiometricModal = ({ visible, onChoose }: ModalProps) => (
  <Modal
    transparent
    visible={visible}
    animationType="fade"
    statusBarTranslucent
    onRequestClose={() => onChoose(false)}
  >
    <View style={styles.bioOverlay}>
      <View style={styles.bioCard}>
        <View style={styles.bioIcon}>
          <FingerprintIcon size={rs(38)} color={rd.color.primary} />
        </View>
        <Text style={styles.bioTitle} allowFontScaling={false}>
          {t('Biometrik kirish')}
        </Text>
        <Text style={styles.bioDesc} allowFontScaling={false}>
          {t('Keyingi kirishlarda Touch ID / Face ID dan foydalanasizmi?')}
        </Text>
        <View style={styles.bioBtns}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.bioBtn, styles.bioBtnGhost]}
            onPress={() => onChoose(false)}
          >
            <Text style={styles.bioBtnGhostText} allowFontScaling={false}>
              {t("Yo'q")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.bioBtn, styles.bioBtnPrimary]}
            onPress={() => onChoose(true)}
          >
            <Text style={styles.bioBtnPrimaryText} allowFontScaling={false}>
              {t('Ha')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);
