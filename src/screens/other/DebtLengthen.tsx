import {ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {rd, rs} from '../../theme/rd';
import RdHeader from '../home/redesign/RdHeader';
import {ClockIcon} from '../home/redesign/icons';

type RowProps = {
  label: string;
  value: string;
  date?: boolean;
  link?: boolean;
  onPress?: () => void;
  last?: boolean;
};

const InfoRow = ({label, value, date, link, onPress, last}: RowProps) => (
  <View>
    <View style={styles.row}>
      <Text style={styles.label} allowFontScaling={false}>
        {label}
      </Text>
      <View style={styles.valueWrap}>
        {date ? (
          <ClockIcon size={rs(15)} color={rd.color.textTertiary} />
        ) : null}
        <Text
          onPress={onPress}
          style={[styles.value, link && styles.link]}
          allowFontScaling={false}>
          {value}
        </Text>
      </View>
    </View>
    {last ? null : <View style={styles.divider} />}
  </View>
);

const DebtLengthen = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title="Qarz ma’lumotlari" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <InfoRow label="Qarzdor nomi" value="Abdullayev Abdulla" />
          <InfoRow label="Qarz summasi" value="1,0 mln so’m" />
          <InfoRow label="Qarz olingan sana " value="22.10.2021" date />
          <InfoRow label="Qarz qaytarilgan sana" value="22.10.2022" date />
          <InfoRow label="Qaytarilgan summa " value="1.0 mln so’m" />
          <InfoRow
            label="Hujjatla"
            value="22/10/2021/000001"
            link
            last
            onPress={() => {
              navigation.navigate('DownloadStatistic');
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default DebtLengthen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: rd.color.page,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: rs(16),
    paddingTop: rs(8),
    paddingBottom: rs(24),
  },
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(16),
    paddingVertical: rs(6),
  },
  row: {
    minHeight: rs(52),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(10),
  },
  label: {
    flex: 1,
    fontFamily: rd.font.medium,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
  },
  valueWrap: {
    flexShrink: 1,
    marginLeft: rs(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
  },
  value: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.text,
    textAlign: 'right',
  },
  link: {
    color: rd.color.primary,
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: rd.color.border,
  },
});
