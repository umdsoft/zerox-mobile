import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rs } from '../../../../../theme/rd';
import { cardDigits, fmtCard4 } from '../../../../../helper/cardBin';
import { CopyIcon, PencilIcon } from '../../../redesign/icons';
import { styles, TEAL } from '../gapDetailStyles';

interface Props {
  r: Record<string, any>;
  canSet: boolean;
  onCopy: (digits?: string) => void;
  onEdit: (r: any) => void;
}

/** SS3: Plastik karta raqami + egasi (FISH) — nusxa olib pul o'tkazish; SS4: nusxalash va (ruxsat bo'lsa) tahrirlash ikonkalari. */
const GapRoundCardBox = ({ r, canSet, onCopy, onEdit }: Props) => {
  const { t } = useTranslation();
  return (
    <View style={styles.cardBox}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text allowFontScaling={false} style={styles.cardLabel}>{t('💳 Plastik karta')}</Text>
        <Text allowFontScaling={false} style={styles.cardNum} selectable>{fmtCard4(r.card_number)}</Text>
        {r.card_holder ? <Text allowFontScaling={false} style={styles.cardHolder}>👤 {r.card_holder}</Text> : null}
      </View>
      <TouchableOpacity
        style={styles.cardIconBtn}
        // Nusxa olishda FAQAT RAQAMLAR — bank ilovasiga to'g'ridan-to'g'ri qo'yiladi.
        onPress={() => onCopy(cardDigits(r.card_number))}
        accessibilityLabel="Karta raqamidan nusxa olish">
        <CopyIcon size={rs(16)} color={TEAL} />
      </TouchableOpacity>
      {canSet && (
        <TouchableOpacity style={styles.cardIconBtn} onPress={() => onEdit(r)} accessibilityLabel="Karta raqamini o‘zgartirish">
          <PencilIcon size={rs(16)} color={TEAL} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default GapRoundCardBox;
