import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { fmtPhoneUzFull as fmtPhone } from '../../../../helper/phone';
import { InfoIcon, MessageIcon, PencilIcon, PhoneCallIcon, PhoneIcon, StorefrontIcon, UserIcon } from '../../redesign/icons';
import { totalsText } from '../FinanceDebtActionModal';
import { BLUE, GREEN, Side } from './debtGroupLogic';
import { styles } from './debtGroupStyles';

interface ContragentCardProps {
  isShop: boolean;
  displayName: string;
  side: Side;
  canEdit: boolean;
  phone: string;
  address: string;
  openDebts: any[];
  /** Amal tugmalari bloki (ActionsGrid). */
  actions: React.ReactNode;
  onEdit: () => void;
  onSms: () => void;
  onCall: () => void;
}

/** 1. KONTRAGENT kartochkasi + AMALLAR (02.10: sayt sarlavha bloki — ism, telefon, amallar). */
const ContragentCard = ({
  isShop,
  displayName,
  side,
  canEdit,
  phone,
  address,
  openDebts,
  actions,
  onEdit,
  onSms,
  onCall,
}: ContragentCardProps) => {
  const { t } = useTranslation();
  const Ico = isShop ? StorefrontIcon : UserIcon;
  return (
    <View style={styles.idCard}>
      <View style={styles.idTop}>
        <View style={[styles.avatar, { backgroundColor: BLUE + '14' }]}>
          <Ico size={rs(24)} color={BLUE} />
        </View>
        <View style={{ flex: 1 }}>
          <Text allowFontScaling={false} style={styles.idName} numberOfLines={2}>
            {displayName}
          </Text>
          {/* 02.10: bo'lim belgisi (sayt `badgeLent` / `badgeBorrowed`) */}
          {!!side && (
            <View
              style={[
                styles.sideChip,
                { backgroundColor: side === 'lent' ? '#F0FDF4' : '#FEF2F2' },
              ]}>
              <Text
                allowFontScaling={false}
                style={[styles.sideChipText, { color: side === 'lent' ? '#15803D' : '#B91C1C' }]}>
                {side === 'lent' ? t('Berilgan qarz') : t('Olingan qarz')}
              </Text>
            </View>
          )}
        </View>
        {canEdit && (
          <TouchableOpacity
            style={styles.idEdit}
            onPress={onEdit}
            accessibilityLabel={t('Tahrirlash')}>
            <PencilIcon size={rs(17)} color={BLUE} />
          </TouchableOpacity>
        )}
      </View>

      {!!phone && (
        <View style={styles.idRow}>
          <PhoneIcon size={rs(15)} color={rd.color.textTertiary} />
          <Text allowFontScaling={false} style={styles.idRowText} numberOfLines={1}>
            {fmtPhone(phone)}
          </Text>
          <TouchableOpacity
            style={[styles.roundBtn, { backgroundColor: BLUE }]}
            onPress={onSms}
            accessibilityLabel={t('SMS yuborish')}>
            <MessageIcon size={rs(16)} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roundBtn, { backgroundColor: GREEN }]}
            onPress={onCall}
            accessibilityLabel={t('Qo‘ng‘iroq qilish')}>
            <PhoneCallIcon size={rs(16)} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {!!address && (
        <View style={styles.idRow}>
          <StorefrontIcon size={rs(15)} color={rd.color.textTertiary} />
          <Text allowFontScaling={false} style={styles.idRowText} numberOfLines={2}>
            {address}
          </Text>
        </View>
      )}

      {!isShop && <View style={styles.actDivider} />}
      {actions}
      {/* 02.10 (sayt): faol qarzlar soni va jami qoldig'i */}
      {!!side && (
        <View style={styles.actNote}>
          <InfoIcon size={rs(13)} color={rd.color.textTertiary} />
          <Text allowFontScaling={false} style={styles.actNoteText}>
            {openDebts.length
              ? `${t('Faol qarzlar: {{n}} ta', { n: openDebts.length })}: ${totalsText(openDebts)}`
              : t('Aktiv qarzlar yo‘q')}
          </Text>
        </View>
      )}
    </View>
  );
};

export default ContragentCard;
