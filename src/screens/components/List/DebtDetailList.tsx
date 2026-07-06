import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {rd, rs} from '../../../theme/rd';
import {sortText} from '../StatisticCard';
import {ChevronRight} from '../../home/redesign/icons';
import {checkDate, settingDate} from '../../../helper';
// StatisticDebitor historically imported settingDate from UserDetails. Both
// implementations are byte-for-byte equivalent (DD.MM.YYYY), so the shared
// helper version below produces identical output for every variant.
import {t} from 'i18next';

/**
 * DebtDetailList — qarz tafsiloti / statistika kartasi (4 ta eski komponent o'rnida 1 ta).
 *
 * Eski komponentlar:
 *   CreditorList     => role="creditor" variant="detail"
 *   DebitorList      => role="debitor"  variant="detail"
 *   StatisticCreditor=> role="creditor" variant="statistic"
 *   StatisticDebitor => role="debitor"  variant="statistic"
 *
 * REDIZAYN: eski ko'k-chiziqli spreadsheet-jadval (colors/style/MainText/Border)
 * o'rniga zamonaviy oq `rd.color.surface` karta — har qator "belgi chapda, qiymat
 * o'ngda", yengil `rd.color.border` ajratgich, summalar `rd.font.bold` va yo'nalish
 * bo'yicha rangli (debitor=qizil, creditor=yashil). Har bir qator (field, t() kaliti,
 * navigatsiya, shartli ko'rinish, hisob-kitob) eski fayldagidek AYNAN saqlangan.
 */

const DebtDetailList = ({role = 'creditor', variant = 'detail', ...props}: any) => {
  const isDetail = variant === 'detail';
  const isCreditor = role === 'creditor';

  if (isCreditor && isDetail) {
    return <CreditorDetail {...props} />;
  }
  if (!isCreditor && isDetail) {
    return <DebitorDetail {...props} />;
  }
  if (isCreditor && !isDetail) {
    return <CreditorStatistic {...props} />;
  }
  return <DebitorStatistic {...props} />;
};

export default DebtDetailList;

/* =========================================================================
 * Umumiy REDIZAYN qatlami — faqat vizual (belgi/qiymat qatori, ajratgich, karta).
 * ===================================================================== */
const Divider = () => <View style={styles.divider} />;

const Row = ({
  label,
  value,
  valueColor,
  bold,
  onPress,
  link,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  bold?: boolean;
  onPress?: () => void;
  link?: boolean;
}) => {
  const valueStyle = [
    styles.value,
    bold && styles.valueBold,
    valueColor ? {color: valueColor} : null,
  ];

  const valueNode =
    typeof value === 'string' || typeof value === 'number' ? (
      <Text allowFontScaling={false} style={valueStyle} numberOfLines={2}>
        {value}
      </Text>
    ) : (
      value
    );

  return (
    <View style={styles.row}>
      <Text allowFontScaling={false} style={styles.label}>
        {label}
      </Text>
      {onPress ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPress}
          style={styles.valueTouch}>
          {valueNode}
          {link ? (
            <ChevronRight size={rs(15)} color={rd.color.primary} />
          ) : null}
        </TouchableOpacity>
      ) : (
        <View style={styles.valueTouch}>{valueNode}</View>
      )}
    </View>
  );
};

const StatusValue = ({ok, okLabel, noLabel}: {ok: boolean; okLabel: string; noLabel: string}) => (
  <Text
    allowFontScaling={false}
    style={[styles.value, {color: ok ? rd.color.success : rd.color.error}]}>
    {ok ? okLabel : noLabel}
  </Text>
);

const Card = ({children, gap}: {children: React.ReactNode; gap?: boolean}) => (
  <View style={[styles.card, gap && styles.cardGap]}>{children}</View>
);

/* =========================================================================
 * role="creditor" variant="detail"  (eski CreditorList)
 * ===================================================================== */
const CreditorDetail = ({type, item, status}) => {
  const navigation = useNavigation();

  return (
    <Card>
      <Row
        label={t('273')}
        value={item?.debitor_name}
        valueColor={rd.color.success}
        onPress={() => {
          navigation.navigate('ShowUserDetails', {id: item.duid, type: 1});
        }}
      />
      <Divider />
      <Row
        label={t('327')}
        value={`${sortText(item?.amount)} ${item?.currency}`}
        valueColor={rd.color.success}
        bold
      />
      <Divider />
      <Row
        label={t('330')}
        value={`${sortText(item?.inc == null ? 0 : item?.inc)} ${item?.currency}`}
      />
      {item?.residual_amount == null ? null : (
        <>
          <Divider />
          <Row
            label={t('420')}
            value={`${sortText(item?.residual_amount)} ${item?.currency}`}
          />
        </>
      )}
      <Divider />
      <Row label={t('390')} value={settingDate(item?.created_at)} />
      <Divider />
      <Row label={t('396')} value={settingDate(item?.end_date)} />

      {item?.vos_summa == null && item.status == null ? null : (
        <>
          <Divider />
          <Row
            label={t('333')}
            value={`${item?.vos_summa !== null ? sortText(item?.vos_summa) : 0} ${item?.currency}`}
          />
        </>
      )}

      {item?.status == null ? null : (
        <>
          <Divider />
          <Row
            label={t('339')}
            value={
              <StatusValue
                ok={item?.status === 2}
                okLabel={t('198')}
                noLabel={t('201')}
              />
            }
          />
        </>
      )}
      <Divider />
      <Row
        label={t('324')}
        value={item?.number}
        valueColor={rd.color.primary}
        link
        onPress={() => {
          navigation.navigate('DownloadStatistic', {item: item, id: item.uid});
        }}
      />
    </Card>
  );
};

/* =========================================================================
 * role="debitor" variant="detail"  (eski DebitorList)
 * ===================================================================== */
const DebitorDetail = ({isHave, item, type, status, person}) => {
  const navigation = useNavigation();

  return (
    <Card gap>
      <Row
        label={t('270')}
        value={item?.creditor_name}
        valueColor={rd.color.error}
        onPress={() => {
          navigation.navigate('ShowUserDetails', {id: item.cuid, type: 0});
        }}
      />
      <Divider />
      <Row
        label={t('327')}
        value={`${sortText(item?.amount)} ${item?.currency}`}
        valueColor={rd.color.error}
        bold
      />
      <Divider />
      <Row
        label={t('330')}
        value={`${sortText(item?.inc)} ${item?.currency}`}
      />
      {isHave ? (
        <>
          <Divider />
          <Row
            label={t('420')}
            value={`${sortText(item?.residual_amount)} ${item?.currency}`}
          />
        </>
      ) : null}
      <Divider />
      <Row label={t('303')} value={settingDate(item?.created_at)} />
      <Divider />
      <Row label={t('396')} value={checkDate(item?.end_date)} />

      {item?.vos_summa == null ? null : (
        <>
          <Divider />
          <Row label={t('333')} value={item?.vos_summa} />
        </>
      )}
      {item?.status && (
        <>
          <Divider />
          <Row
            label={t('339')}
            value={
              <StatusValue
                ok={item?.status === 2}
                okLabel={t('198')}
                noLabel={t('261')}
              />
            }
          />
        </>
      )}
      <Divider />
      <Row
        label={t('306')}
        value={item?.number}
        valueColor={rd.color.primary}
        link
        onPress={() => {
          navigation.navigate('DownloadStatistic', {item: item, id: item.id});
        }}
      />
    </Card>
  );
};

/* =========================================================================
 * role="creditor" variant="statistic"  (eski StatisticCreditor)
 * ===================================================================== */
const CreditorStatistic = ({type, item, status}) => {
  const navigation = useNavigation();

  return (
    <Card>
      <Row
        label={t('273')}
        value={item?.debitor_name}
        valueColor={rd.color.success}
        onPress={() => {
          navigation.navigate('ShowUserDetails', {id: item.duid, type: 1});
        }}
      />
      <Divider />
      <Row
        label={t('327')}
        value={`${sortText(item?.amount)} ${item?.currency}`}
        valueColor={rd.color.success}
        bold
      />
      <Divider />
      <Row
        label={t('330')}
        value={
          item?.inc == null ? '-' : sortText(item?.inc) + ' ' + item?.currency
        }
      />
      {item?.vos_summa == null && item.status == null ? null : (
        <>
          <Divider />
          <Row
            label={t('333')}
            value={
              item?.vos_summa !== null
                ? sortText(item?.vos_summa) + ' ' + item?.currency
                : ' - '
            }
          />
        </>
      )}
      <Divider />
      <Row
        label={item.status === 2 ? t('390') : t('336')}
        value={settingDate(item?.created_at)}
      />
      {item.status === 2 ? (
        <>
          <Divider />
          <Row label={t('321')} value={settingDate(item?.sana)} />
        </>
      ) : null}
      <Divider />
      <Row
        label={t('339')}
        value={
          <StatusValue
            ok={item?.status === 2}
            okLabel={t('198')}
            noLabel={t('201')}
          />
        }
      />
      <Divider />
      <Row
        label={t('324')}
        value={item?.number}
        valueColor={rd.color.primary}
        link
        onPress={() => {
          navigation.navigate('DownloadStatistic', {item: item, id: item.uid});
        }}
      />
    </Card>
  );
};

/* =========================================================================
 * role="debitor" variant="statistic"  (eski StatisticDebitor)
 * ===================================================================== */
const DebitorStatistic = ({isHave, item}) => {
  const navigation = useNavigation();

  return (
    <Card gap>
      <Row
        label={t('270')}
        value={item?.creditor_name}
        valueColor={rd.color.error}
        onPress={() => {
          navigation.navigate('ShowUserDetails', {id: item.cuid, type: 0});
        }}
      />
      <Divider />
      <Row
        label={t('327')}
        value={sortText(item?.amount) + ' ' + item?.currency}
        valueColor={rd.color.error}
        bold
      />
      <Divider />
      <Row
        label={t('330')}
        value={
          item.inc === null
            ? '-'
            : sortText(item?.inc) + ' ' + `${item?.currency}`
        }
      />
      <Divider />
      <Row
        label={t('333')}
        value={
          item.vos_summa === null
            ? '-'
            : sortText(item?.vos_summa) + ' ' + `${item?.currency}`
        }
      />
      <Divider />
      <Row
        label={item.status === 2 ? t('303') : t('336')}
        value={settingDate(item?.created_at)}
      />
      {item.status === 2 ? (
        <>
          <Divider />
          <Row label={t('321')} value={settingDate(item?.sana)} />
        </>
      ) : null}
      {item?.status && (
        <>
          <Divider />
          <Row
            label={t('339')}
            value={
              <StatusValue
                ok={item?.status === 2}
                okLabel={t('198')}
                noLabel={t('201')}
              />
            }
          />
        </>
      )}
      <Divider />
      <Row
        label={t('306')}
        value={item?.number}
        valueColor={rd.color.primary}
        link
        onPress={() => {
          navigation.navigate('DownloadStatistic', {item: item, id: item.id});
        }}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    overflow: 'hidden',
    paddingHorizontal: rs(4),
  },
  cardGap: {marginTop: rs(16)},

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(13),
    paddingHorizontal: rs(12),
    gap: rs(12),
  },
  label: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    flexShrink: 0,
  },
  valueTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: rs(4),
  },
  value: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.text,
    textAlign: 'right',
  },
  valueBold: {fontFamily: rd.font.bold},

  divider: {
    height: 1,
    backgroundColor: rd.color.border,
    marginHorizontal: rs(12),
  },
});
