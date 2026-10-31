import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../../theme/rd';
import { LocationIcon, PencilIcon } from '../../../redesign/icons';
import { styles, TEAL } from '../gapDetailStyles';

interface Props {
  r: Record<string, any>;
  canSet: boolean;
  onOpenVenue: (r: any) => void;
  onOpenCard: (r: any) => void;
  onOpenLocation: (loc?: string) => void;
}

/**
 * So'rov: uchrashuv joyi — ko'rsatiladi; kiritilmagan bo'lsa tashkilotchi/qabul qiluvchi kiritadi;
 * lokatsiya bosilsa xaritada ochiladi. SS11: plastik karta kiritish tugmasi (karta YO'Q bo'lganda) ham shu yerda
 * (🔴 SS4: karta bor bo'lsa raqam faqat GapRoundCardBox da BIR MARTA ko'rsatiladi).
 */
const GapRoundVenue = ({ r, canSet, onOpenVenue, onOpenCard, onOpenLocation }: Props) => {
  const { t } = useTranslation();
  return (
    <View style={styles.venueBox}>
      {r.venue ? (
        <>
          <TouchableOpacity activeOpacity={r.location ? 0.7 : 1} onPress={() => onOpenLocation(r.location)} style={styles.venueRow}>
            <LocationIcon size={rs(15)} color={TEAL} />
            <Text allowFontScaling={false} style={styles.venueText} numberOfLines={2}>{r.venue}</Text>
          </TouchableOpacity>
          <View style={styles.venueActions}>
            {!!r.location && (
              <TouchableOpacity onPress={() => onOpenLocation(r.location)}>
                <Text allowFontScaling={false} style={styles.venueLink}>{t('Xaritada ochish')}</Text>
              </TouchableOpacity>
            )}
            {/* SS4 (2026-09-17): "O'zgartirish" matni o'rniga QALAM ikonkasi. */}
            {canSet && (
              <TouchableOpacity
                onPress={() => onOpenVenue(r)}
                style={styles.iconBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Uchrashuv joyini o‘zgartirish">
                <PencilIcon size={rs(15)} color={rd.color.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : canSet ? (
        <TouchableOpacity style={styles.venueAddBtn} onPress={() => onOpenVenue(r)}>
          <LocationIcon size={rs(15)} color={TEAL} />
          <Text allowFontScaling={false} style={styles.venueAddText}>{t('Uchrashuv joyini kiritish')}</Text>
        </TouchableOpacity>
      ) : (
        <Text allowFontScaling={false} style={styles.venueEmpty}>{t('Uchrashuv joyi kiritilmagan')}</Text>
      )}

      {canSet && !r.card_number && (
        <TouchableOpacity style={styles.cardAddBtn} onPress={() => onOpenCard(r)} activeOpacity={0.85}>
          <Text allowFontScaling={false} style={styles.cardAddText}>{'💳 Plastik karta kiritish'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default GapRoundVenue;
