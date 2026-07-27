import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { rd, rs } from '../../../theme/rd';
import { sortText } from '../StatisticCard';
import {
  AvatarPersonIcon,
  ArrowDownLeft,
  CalendarIcon,
  CheckIcon,
  ChevronRight,
  ClockIcon,
  CloseIcon,
  ContractIcon,
  IconProps,
  InfoIcon,
  WalletIcon,
} from '../../home/redesign/icons';
import { checkDate, settingDate } from '../../../helper';
import { t } from 'i18next';

/**
 * DebtDetailList — qarz tafsiloti kartasi (REDIZAYN v2).
 *
 * So'rov bo'yicha: FISH + qarz miqdori TEPADA alohida (FISH KO'K, summa QORA);
 * qolgan qatorlar HAR BIRIGA MOS IKONA bilan. 4 variant (detail/statistic ×
 * creditor/debitor) va ularning maydonlari/navigatsiyasi/shartli ko'rinishi
 * eski fayldagidek AYNAN saqlangan — faqat vizual qatlam yangilandi.
 */
const DebtDetailList = ({ role = 'creditor', variant = 'detail', ...props }: any) => {
  const isDetail = variant === 'detail';
  const isCreditor = role === 'creditor';
  if (isCreditor && isDetail) return <CreditorDetail {...props} />;
  if (!isCreditor && isDetail) return <DebitorDetail {...props} />;
  if (isCreditor && !isDetail) return <CreditorStatistic {...props} />;
  return <DebitorStatistic {...props} />;
};

export default DebtDetailList;

/* ── Umumiy qatlam ─────────────────────────────────────────────── */

// FISH (ko'k, bosiladigan) + Qarz miqdori (qora) — TEPA karta.
const PartyHeader = ({
  label,
  name,
  amount,
  onPress,
}: {
  label: string;
  name?: string;
  amount: string;
  onPress?: () => void;
}) => (
  <View style={styles.headerCard}>
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.partyRow}>
      <View style={styles.partyAvatar}>
        <AvatarPersonIcon size={rs(26)} color={rd.color.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text allowFontScaling={false} style={styles.partyLabel}>
          {label}
        </Text>
        <Text allowFontScaling={false} numberOfLines={2} style={styles.partyName}>
          {name}
        </Text>
      </View>
      {onPress ? <ChevronRight size={rs(18)} color={rd.color.textTertiary} /> : null}
    </TouchableOpacity>
    <View style={styles.amountBlock}>
      <Text allowFontScaling={false} style={styles.amountLabel}>
        {t('327')}
      </Text>
      <Text allowFontScaling={false} numberOfLines={1} style={styles.amountValue}>
        {amount}
      </Text>
    </View>
  </View>
);

// Ikonali qator (chapda mos ikona, o'ngda qiymat).
const IconRow = ({
  Icon,
  label,
  value,
  valueNode,
  valueColor,
  onPress,
  link,
  divider,
}: {
  Icon: (p: IconProps) => JSX.Element;
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  valueColor?: string;
  onPress?: () => void;
  link?: boolean;
  divider?: boolean;
}) => {
  const node =
    valueNode ??
    (
      <Text
        allowFontScaling={false}
        numberOfLines={2}
        style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    );
  return (
    <View style={[styles.row, divider && styles.rowDivider]}>
      <View style={styles.rowIcon}>
        <Icon size={rs(17)} color={rd.color.primary} />
      </View>
      <Text allowFontScaling={false} style={styles.rowLabel}>
        {label}
      </Text>
      {onPress ? (
        <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.rowRight}>
          {node}
          {link ? <ChevronRight size={rs(15)} color={rd.color.primary} /> : null}
        </TouchableOpacity>
      ) : (
        <View style={styles.rowRight}>{node}</View>
      )}
    </View>
  );
};

const StatusValue = ({ ok, okLabel, noLabel }: any) => (
  <Text
    allowFontScaling={false}
    style={[styles.rowValue, { color: ok ? rd.color.success : rd.color.error }]}>
    {ok ? okLabel : noLabel}
  </Text>
);

const Contract = ({ number, onPress, label }: any) => (
  <IconRow
    Icon={ContractIcon}
    label={label}
    value={number}
    valueColor={rd.color.primary}
    link
    divider
    onPress={onPress}
  />
);

/* ── role="creditor" variant="detail" (eski CreditorList) ───────── */
const CreditorDetail = ({ item }: any) => {
  const navigation = useNavigation<any>();
  const cur = item?.currency;
  return (
    <View>
      <PartyHeader
        label={t('273')}
        name={item?.debitor_name}
        amount={`${sortText(item?.amount)} ${cur}`}
        onPress={() => navigation.navigate('ShowUserDetails', { id: item.duid, type: 1 })}
      />
      <View style={styles.detailCard}>
        <IconRow
          Icon={ArrowDownLeft}
          label={t('330')}
          value={`${sortText(item?.inc == null ? 0 : item?.inc)} ${cur}`}
        />
        {item?.residual_amount == null ? null : (
          <IconRow
            Icon={WalletIcon}
            label={t('420')}
            value={`${sortText(item?.residual_amount)} ${cur}`}
            divider
          />
        )}
        <IconRow
          Icon={CalendarIcon}
          label={t('390')}
          value={settingDate(item?.created_at)}
          divider
        />
        <IconRow
          Icon={ClockIcon}
          label={t('396')}
          value={settingDate(item?.end_date)}
          divider
        />
        {item?.vos_summa == null && item?.status == null ? null : (
          <IconRow
            Icon={CloseIcon}
            label={t('333')}
            value={`${item?.vos_summa !== null ? sortText(item?.vos_summa) : 0} ${cur}`}
            divider
          />
        )}
        {item?.status == null ? null : (
          <IconRow
            Icon={InfoIcon}
            label={t('339')}
            divider
            valueNode={<StatusValue ok={item?.status === 2} okLabel={t('198')} noLabel={t('201')} />}
          />
        )}
        <Contract
          label={t('324')}
          number={item?.number}
          onPress={() => navigation.navigate('DownloadStatistic', { item, id: item.uid })}
        />
      </View>
    </View>
  );
};

/* ── role="debitor" variant="detail" (eski DebitorList) ─────────── */
const DebitorDetail = ({ item, isHave }: any) => {
  const navigation = useNavigation<any>();
  const cur = item?.currency;
  return (
    <View>
      <PartyHeader
        label={t('270')}
        name={item?.creditor_name}
        amount={`${sortText(item?.amount)} ${cur}`}
        onPress={() => navigation.navigate('ShowUserDetails', { id: item.cuid, type: 0 })}
      />
      <View style={styles.detailCard}>
        <IconRow Icon={ArrowDownLeft} label={t('330')} value={`${sortText(item?.inc)} ${cur}`} />
        {isHave ? (
          <IconRow
            Icon={WalletIcon}
            label={t('420')}
            value={`${sortText(item?.residual_amount)} ${cur}`}
            divider
          />
        ) : null}
        <IconRow Icon={CalendarIcon} label={t('303')} value={settingDate(item?.created_at)} divider />
        <IconRow Icon={ClockIcon} label={t('396')} value={checkDate(item?.end_date)} divider />
        {item?.vos_summa == null ? null : (
          <IconRow Icon={CloseIcon} label={t('333')} value={`${item?.vos_summa}`} divider />
        )}
        {item?.status ? (
          <IconRow
            Icon={InfoIcon}
            label={t('339')}
            divider
            valueNode={<StatusValue ok={item?.status === 2} okLabel={t('198')} noLabel={t('261')} />}
          />
        ) : null}
        <Contract
          label={t('306')}
          number={item?.number}
          onPress={() => navigation.navigate('DownloadStatistic', { item, id: item.id })}
        />
      </View>
    </View>
  );
};

/* ── role="creditor" variant="statistic" (eski StatisticCreditor) ─ */
const CreditorStatistic = ({ item }: any) => {
  const navigation = useNavigation<any>();
  const cur = item?.currency;
  return (
    <View>
      <PartyHeader
        label={t('273')}
        name={item?.debitor_name}
        amount={`${sortText(item?.amount)} ${cur}`}
        onPress={() => navigation.navigate('ShowUserDetails', { id: item.duid, type: 1 })}
      />
      <View style={styles.detailCard}>
        <IconRow
          Icon={ArrowDownLeft}
          label={t('330')}
          value={item?.inc == null ? '-' : `${sortText(item?.inc)} ${cur}`}
        />
        {item?.vos_summa == null && item?.status == null ? null : (
          <IconRow
            Icon={CloseIcon}
            label={t('333')}
            value={item?.vos_summa !== null ? `${sortText(item?.vos_summa)} ${cur}` : ' - '}
            divider
          />
        )}
        <IconRow
          Icon={CalendarIcon}
          label={item?.status === 2 ? t('390') : t('336')}
          value={settingDate(item?.created_at)}
          divider
        />
        {item?.status === 2 ? (
          <IconRow Icon={CheckIcon} label={t('321')} value={settingDate(item?.sana)} divider />
        ) : null}
        <IconRow
          Icon={InfoIcon}
          label={t('339')}
          divider
          valueNode={<StatusValue ok={item?.status === 2} okLabel={t('198')} noLabel={t('201')} />}
        />
        <Contract
          label={t('324')}
          number={item?.number}
          onPress={() => navigation.navigate('DownloadStatistic', { item, id: item.uid })}
        />
      </View>
    </View>
  );
};

/* ── role="debitor" variant="statistic" (eski StatisticDebitor) ─── */
const DebitorStatistic = ({ item }: any) => {
  const navigation = useNavigation<any>();
  const cur = item?.currency;
  return (
    <View>
      <PartyHeader
        label={t('270')}
        name={item?.creditor_name}
        amount={`${sortText(item?.amount)} ${cur}`}
        onPress={() => navigation.navigate('ShowUserDetails', { id: item.cuid, type: 0 })}
      />
      <View style={styles.detailCard}>
        <IconRow
          Icon={ArrowDownLeft}
          label={t('330')}
          value={item?.inc === null ? '-' : `${sortText(item?.inc)} ${cur}`}
        />
        <IconRow
          Icon={CloseIcon}
          label={t('333')}
          value={item?.vos_summa === null ? '-' : `${sortText(item?.vos_summa)} ${cur}`}
          divider
        />
        <IconRow
          Icon={CalendarIcon}
          label={item?.status === 2 ? t('303') : t('336')}
          value={settingDate(item?.created_at)}
          divider
        />
        {item?.status === 2 ? (
          <IconRow Icon={CheckIcon} label={t('321')} value={settingDate(item?.sana)} divider />
        ) : null}
        {item?.status ? (
          <IconRow
            Icon={InfoIcon}
            label={t('339')}
            divider
            valueNode={<StatusValue ok={item?.status === 2} okLabel={t('198')} noLabel={t('201')} />}
          />
        ) : null}
        <Contract
          label={t('306')}
          number={item?.number}
          onPress={() => navigation.navigate('DownloadStatistic', { item, id: item.id })}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // ── TEPA karta: FISH (ko'k) + summa (qora).
  headerCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    marginTop: rs(8),
    padding: rs(14),
  },
  partyRow: { flexDirection: 'row', alignItems: 'center' },
  partyAvatar: {
    width: rs(46),
    height: rs(46),
    borderRadius: rs(23),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
  },
  partyLabel: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
  },
  // FISH — KO'K (so'rov bo'yicha).
  partyName: {
    fontFamily: rd.font.bold,
    fontSize: rs(15),
    color: rd.color.primary,
    marginTop: rs(2),
  },
  amountBlock: {
    marginTop: rs(14),
    paddingTop: rs(12),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
  },
  // Qarz miqdori — QORA (so'rov bo'yicha).
  amountValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    color: rd.color.text,
    marginLeft: rs(10),
    flexShrink: 1,
    textAlign: 'right',
  },

  // ── Pastki karta: ikonali qatorlar.
  detailCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    marginTop: rs(14),
    paddingHorizontal: rs(12),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rs(13),
    gap: rs(10),
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: rd.color.border },
  rowIcon: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(11),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    flexShrink: 0,
  },
  rowRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: rs(4),
  },
  rowValue: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.text,
    textAlign: 'right',
  },
});
