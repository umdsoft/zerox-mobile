/**
 * SmsListRow.tsx — SMS qatori (SmsManager va kategoriya oynasi uchun YAGONA).
 * Yetkazilmagan SMS: qizil "Yetkazilmagan" + lampochka; lampochka bosilsa sabab oynasi ochiladi.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { fmtDateTimeUz } from '../../../../helper';
import { fmtPhoneUzFull } from '../../../../helper/phone';
import { BulbIcon } from '../../redesign/icons';
import BlurModal from '../../../components/BlurModal';
import { isSmsUndelivered, smsFailureModalText } from '../../modules/components/smsDeliveryFormat';

const VIOLET = '#6d5ae6';
const VIOLET_TINT = '#efe9fd';

export type SmsItem = {
  id?: number | string;
  phone?: string;
  type?: string;
  message?: string;
  sent_at?: string;
  created_at?: string;
  status?: string;
  delivery_status?: string;
  failure_reason?: string | null;
  undelivered?: boolean;
  pool?: 'plan' | 'package' | null;
};

// sms_history.type ENUM → yorliq + rang.
const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  auto: { label: 'Avtomatik', color: rd.color.primary, bg: rd.color.primaryTint },
  manual: { label: 'Qo‘lda', color: VIOLET, bg: VIOLET_TINT },
  registration: { label: 'Qarz yozildi', color: rd.color.textSecondary, bg: rd.color.surfaceAlt },
  payment_link: { label: 'To‘lov havolasi', color: rd.color.warning, bg: rd.color.warningBg },
  qarz_tolandi: { label: 'Qarz to‘landi', color: rd.color.success, bg: rd.color.successBg },
};

const SmsListRow = ({ item }: { item: SmsItem }) => {
  const { t } = useTranslation();
  const [why, setWhy] = React.useState(false);
  const meta = TYPE_META[String(item.type || '').toLowerCase()];
  const undelivered = isSmsUndelivered(item);
  const reasonText = smsFailureModalText(t, item.failure_reason);
  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text allowFontScaling={false} style={styles.rowDate}>
          {fmtDateTimeUz(item.sent_at || item.created_at) || '—'}
        </Text>
        <View style={[styles.tag, { backgroundColor: meta?.bg || rd.color.surfaceAlt }]}>
          <Text allowFontScaling={false} style={[styles.tagText, { color: meta?.color || rd.color.textSecondary }]}>
            {meta ? t(meta.label) : t('Boshqa')}
          </Text>
        </View>
      </View>
      <Text allowFontScaling={false} style={styles.rowPhone}>
        {item.phone ? fmtPhoneUzFull(item.phone) : '—'}
      </Text>
      {item.message ? (
        <Text allowFontScaling={false} style={styles.rowMsg}>
          {item.message}
        </Text>
      ) : null}
      {undelivered ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setWhy(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('Nima uchun yetkazilmadi?')}
          style={styles.failRow}>
          <Text allowFontScaling={false} style={styles.failText}>
            {t('Yetkazilmagan')}
          </Text>
          <BulbIcon size={rs(15)} color={rd.color.error} />
        </TouchableOpacity>
      ) : null}
      {undelivered ? (
        <BlurModal
          visible={why}
          title={t('SMS nima uchun yetkazilmadi')}
          icon={<BulbIcon size={rs(18)} color={rd.color.error} />}
          footerCloseLabel={t('Yopish')}
          onClose={() => setWhy(false)}>
          <Text allowFontScaling={false} style={styles.whyHead}>
            {reasonText.headline}
          </Text>
          <Text allowFontScaling={false} style={styles.whyText}>
            {reasonText.description}
          </Text>
          {item.phone || item.message ? (
            <View style={styles.msgBox}>
              {item.phone ? (
                <Text allowFontScaling={false} style={styles.msgPhone}>
                  {fmtPhoneUzFull(item.phone)}
                </Text>
              ) : null}
              {item.message ? (
                <Text allowFontScaling={false} style={styles.msgText}>
                  {item.message}
                </Text>
              ) : null}
            </View>
          ) : null}
        </BlurModal>
      ) : null}
    </View>
  );
};

export default SmsListRow;

const styles = StyleSheet.create({
  row: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(12),
    marginBottom: rs(8),
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: rs(8) },
  rowDate: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary },
  tag: { borderRadius: rd.radius.pill, paddingHorizontal: rs(8), paddingVertical: rs(2) },
  tagText: { fontFamily: rd.font.medium, fontSize: rs(11) },
  rowPhone: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text, marginTop: rs(6) },
  rowMsg: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    lineHeight: rs(18),
    color: rd.color.textSecondary,
    marginTop: rs(4),
  },
  failRow: { flexDirection: 'row', alignItems: 'center', gap: rs(5), marginTop: rs(6), alignSelf: 'flex-start' },
  failText: { fontFamily: rd.font.bold, fontSize: rs(12), color: rd.color.error },
  whyHead: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.error, marginBottom: rs(8) },
  whyText: { fontFamily: rd.font.regular, fontSize: rs(14), lineHeight: rs(21), color: rd.color.text },
  msgBox: {
    marginTop: rs(14),
    padding: rs(12),
    borderRadius: rs(12),
    backgroundColor: rd.color.surfaceAlt,
  },
  msgPhone: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary },
  msgText: { fontFamily: rd.font.regular, fontSize: rs(12.5), lineHeight: rs(18), color: rd.color.textSecondary, marginTop: rs(2) },
});
