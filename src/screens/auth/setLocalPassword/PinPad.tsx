import React from 'react';
import { Pressable, View } from 'react-native';
import MainText from '../../components/MainText';
import { fontSize } from '../../../theme/font';
import { rd, rs } from '../../../theme/rd';
import { BackspaceIcon, FaceTouchIdIcon } from '../../home/redesign/icons';
import { PIN_GRID_WIDTH, styles } from './setLocalPasswordStyles';

const ripple = { color: rd.color.primary, radius: 50, borderless: true };
const PAD_KEYS = 12;
const FACE_KEY = 9;
const ZERO_KEY = 10;
const BACKSPACE_KEY = 11;

/** Terilgan PIN nuqtalari (4 ta). */
export const PinDots = ({ length }: { length: number }) => (
  <View style={styles.fourItem}>
    {Array.from({ length: 4 }, (_v, i) => (
      <View
        key={i}
        style={[
          styles.codeItem,
          // eslint-disable-next-line react-native/no-inline-styles
          { backgroundColor: i < length ? rd.color.primary : rd.color.border },
        ]}
      />
    ))}
  </View>
);

interface KeyProps {
  onPress: () => void;
  /** Biometrik tugma konteyneri eski daraxtda massiv uslubida (golden bilan bir xil). */
  wrapAsArray?: boolean;
  children: React.ReactNode;
}
const PadKey = ({ onPress, wrapAsArray, children }: KeyProps) => (
  <View style={wrapAsArray ? [styles.codeNumberContainer] : styles.codeNumberContainer}>
    <Pressable onPress={onPress} android_ripple={ripple} style={styles.codeButton}>
      {children}
    </Pressable>
  </View>
);

const Digit = ({ label }: { label: number }) => (
  <MainText ft={rd.font.medium} color={rd.color.text} size={fontSize[23]}>
    {label}
  </MainText>
);

interface PadProps {
  onDigit: (d: number) => void;
  onBackspace: () => void;
  onFaceTouch: () => void;
}

/** Raqamlar paneli: 1-9, biometrik tugma, 0, backspace. */
export const PinPad = ({ onDigit, onBackspace, onFaceTouch }: PadProps) => (
  <View
    style={{
      flex: 1,
      alignSelf: 'center',
      width: PIN_GRID_WIDTH,
      // Raqamlar panelini PASTGA suramiz — bir qo'lda bosh barmoq bilan yetish oson bo'lsin.
      justifyContent: 'flex-end',
      paddingBottom: rs(40),
    }}
  >
    <View style={styles.codeNumberContainer}>
      {Array.from({ length: PAD_KEYS }, (_v, i) => {
        if (i === FACE_KEY) {
          // 0 ning chap tomonidagi tugma — DOIM ko'rinadi (panel simmetrik); biometrik faqat unlock rejimida ishlaydi.
          return (
            <PadKey key={i} onPress={onFaceTouch} wrapAsArray>
              <FaceTouchIdIcon size={rs(30)} color={rd.color.primary} />
            </PadKey>
          );
        }
        if (i === ZERO_KEY) {
          return (
            <PadKey key={i} onPress={() => onDigit(0)}>
              <Digit label={0} />
            </PadKey>
          );
        }
        if (i === BACKSPACE_KEY) {
          return (
            <PadKey key={i} onPress={onBackspace}>
              <BackspaceIcon size={rs(24)} color={rd.color.textSecondary} />
            </PadKey>
          );
        }
        return (
          <PadKey key={i} onPress={() => onDigit(i + 1)}>
            <Digit label={i + 1} />
          </PadKey>
        );
      })}
    </View>
  </View>
);
