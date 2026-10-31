import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rs } from '../../../../../theme/rd';
import { CloseIcon, TrashIcon } from '../../../redesign/icons';
import { styles, RED, TEAL } from '../gapDetailStyles';

interface Props {
  m: Record<string, any>;
  index: number;
  g: Record<string, any>;
  /** Navbat raqami (qo'lda rejimda i+1, aks holda m.turn_order || i+1). */
  orderNo: number;
  manual: boolean;
  isFirst: boolean;
  isLast: boolean;
  canDelete: boolean;
  onMove: (idx: number, dir: -1 | 1) => void;
  onCoOrg: (member: any, add: boolean) => void;
  onDelete: (member: any) => void;
}

const HIT = { top: 8, bottom: 8, left: 8, right: 8 };

/** SS6: GAPDA IKKINCHI TASHKILOTCHI — nishon / "Tashkilotchi qilish" / "Olib tashlash" (faqat dastlabki tashkilotchida). */
const OrganizerBadge = ({ m, g, onCoOrg }: Pick<Props, 'm' | 'g' | 'onCoOrg'>) => {
  const { t } = useTranslation();
  if (m.user_id && m.user_id === g.organizer_id) {
    return (
      <View style={[styles.orgTag, { backgroundColor: TEAL + '18' }]}>
        <Text allowFontScaling={false} style={[styles.orgTagText, { color: TEAL }]}>{t('Tashkilotchi')}</Text>
      </View>
    );
  }
  if (m.user_id && m.user_id === g.co_organizer_id) {
    return (
      <View style={styles.orgWrap}>
        <View style={[styles.orgTag, { backgroundColor: '#4F46E5' + '18' }]}>
          <Text allowFontScaling={false} style={[styles.orgTagText, { color: '#4F46E5' }]}>{t('Tashkilotchi')}</Text>
        </View>
        {!!g.is_primary_organizer && (
          <TouchableOpacity onPress={() => onCoOrg(m, false)} hitSlop={HIT} accessibilityLabel={t('Tashkilotchilikni olib tashlash')}>
            <CloseIcon size={rs(14)} color={RED} />
          </TouchableOpacity>
        )}
      </View>
    );
  }
  if (!!g.is_primary_organizer && !g.co_organizer_id && m.user_id) {
    return (
      <TouchableOpacity style={styles.orgAddBtn} onPress={() => onCoOrg(m, true)}>
        <Text allowFontScaling={false} style={styles.orgAddText}>{t('Tashkilotchi qilish')}</Text>
      </TouchableOpacity>
    );
  }
  return null;
};

/** Qo'lda rejimda navbatni yuqori/pastga surish (SS5: 28px doira tugmalar, hitSlop bilan). */
const MoveButtons = ({ index, isFirst, isLast, onMove }: Pick<Props, 'index' | 'isFirst' | 'isLast' | 'onMove'>) => (
  <View style={styles.moveCol}>
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onMove(index, -1)}
      disabled={isFirst}
      hitSlop={{ top: 6, bottom: 4, left: 8, right: 8 }}
      style={[styles.moveBtn, isFirst && styles.moveBtnOff]}>
      <Text allowFontScaling={false} style={[styles.moveArrow, isFirst && styles.moveArrowOff]}>▲</Text>
    </TouchableOpacity>
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onMove(index, 1)}
      disabled={isLast}
      hitSlop={{ top: 4, bottom: 6, left: 8, right: 8 }}
      style={[styles.moveBtn, isLast && styles.moveBtnOff]}>
      <Text allowFontScaling={false} style={[styles.moveArrow, isLast && styles.moveArrowOff]}>▼</Text>
    </TouchableOpacity>
  </View>
);

const GapMemberRow = (p: Props) => {
  const { m, orderNo, manual, canDelete } = p;
  return (
    <View style={styles.memberRow}>
      <View style={styles.memberOrder}><Text style={styles.memberOrderText}>{orderNo}</Text></View>
      {manual && <MoveButtons index={p.index} isFirst={p.isFirst} isLast={p.isLast} onMove={p.onMove} />}
      <View style={{ flex: 1 }}>
        <Text allowFontScaling={false} style={styles.memberName} numberOfLines={1}>{m.name || m.phone || 'A‘zo'}</Text>
        {/* SS10: ism tagida TELEFON RAQAMI; ism yo'q bo'lsa (nom o'rniga telefon chiqqan) — takrorlamaymiz. */}
        {!!m.phone && m.name ? (
          <Text allowFontScaling={false} style={styles.memberAmt} numberOfLines={1}>{m.phone}</Text>
        ) : null}
      </View>
      <OrganizerBadge m={m} g={p.g} onCoOrg={p.onCoOrg} />
      {canDelete && (
        <TouchableOpacity onPress={() => p.onDelete(m)} hitSlop={HIT}>
          <TrashIcon size={rs(16)} color={RED} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default GapMemberRow;
