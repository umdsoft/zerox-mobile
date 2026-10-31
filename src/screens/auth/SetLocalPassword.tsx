import { StatusBar, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { t } from 'i18next';
import MainText from '../components/MainText';
import { fontSize } from '../../theme/font';
import { rd, rs } from '../../theme/rd';
import { ShieldIcon } from '../home/redesign/icons';
import { GradientIconBadge } from '../components/BrandLockup';
import { PinDots, PinPad } from './setLocalPassword/PinPad';
import { BiometricModal, LockedView } from './setLocalPassword/PinOverlays';
import { styles } from './setLocalPassword/setLocalPasswordStyles';
import { useSetLocalPassword } from './setLocalPassword/useSetLocalPassword';

const SetLocalPassword = () => {
  const p = useSetLocalPassword();
  const title = p.isLocal ? (p.step === 1 ? t('771') : t('PIN-kodni takrorlang')) : t('PIN-kodni kiriting');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {p.lockRemaining <= 0 ? (
        <View style={{ flex: 1 }}>
          {!p.isLocal && (
            // "PIN-kodni tiklash" — MARKAZDA, ko'rinadigan pill (tint fon) ko'rinishida.
            <View style={{ alignItems: 'center', marginTop: rs(16) }}>
              <TouchableOpacity onPress={p.onResetPin} activeOpacity={0.8} style={styles.resetPill}>
                <MainText color={rd.color.primary} size={fontSize[13]} ft={rd.font.semibold}>
                  {t('PIN-kodni tiklash')}
                </MainText>
              </TouchableOpacity>
            </View>
          )}
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: rs(48),
              marginBottom: rs(20),
            }}
          >
            <GradientIconBadge size={rs(84)}>
              <ShieldIcon size={rs(34)} color={rd.color.primary} />
            </GradientIconBadge>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.setCodeTextContainer}>
              <MainText color={rd.color.text} size={fontSize[16]} ft={rd.font.bold}>
                {title}
              </MainText>
            </View>
            <View style={styles.codeContainer}>
              <PinDots length={p.password.length} />
              <PinPad onDigit={p.onSetCode} onBackspace={p.onBackSpace} onFaceTouch={p.onFaceTouch} />
            </View>
          </View>
        </View>
      ) : (
        <LockedView remainingMs={p.lockRemaining} onReset={p.onResetPin} />
      )}

      <BiometricModal visible={p.bio.bioModal.visible} onChoose={p.bio.onBioChoose} />
    </View>
  );
};

export default SetLocalPassword;
