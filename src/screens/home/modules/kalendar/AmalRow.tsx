import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { rs } from '../../../../theme/rd';
import { fMoney } from '../financeMoney';
import { UserIcon } from '../../redesign/icons';
import { BER_COLOR, ddmm, hhmm, KunAmal, UND_COLOR } from './kalendarLogic';
import { styles } from './kalendarStyles';

interface AmalRowProps {
  r: KunAmal;
  und: boolean;
  varaqTuri?: 'kun' | 'hafta';
  cur: string;
  opening: number | null;
  goAmaliyot: (r: KunAmal) => void;
}

/** Varaq ichidagi bitta amaliyot qatori (saytdagi "Berilgan/Qaytarilgan qarzlar" kartasi kabi). */
const AmalRow = ({ r, und, varaqTuri, cur, opening, goAmaliyot }: AmalRowProps) => {
const nom = (r.mijoz || '—').trim();
const vaqt = hhmm(r.vaqt);
const meta = [r.dokon, varaqTuri === 'hafta' ? ddmm(r._date) : null, vaqt]
  .filter(Boolean)
  .join(' · ');
return (
  <TouchableOpacity
    key={`${und ? 'u' : 'b'}${r.id}`}
    activeOpacity={0.75}
    onPress={() => goAmaliyot(r)}
    disabled={opening != null}
    style={[styles.amalRow, und ? styles.amalRowUnd : styles.amalRowBer]}>
    <View style={[styles.amalAvatar, { backgroundColor: und ? UND_COLOR : BER_COLOR }]}>
      {/* 2026-09-28: ismning bosh harfi o'rniga ODAM AVATARI (so'rov) —
          rangli fon (qizil/yashil) semantikasi saqlanadi. */}
      <UserIcon size={rs(18)} color="#fff" />
    </View>
    <View style={styles.flex1}>
      <Text allowFontScaling={false} style={styles.amalName} numberOfLines={1}>{nom}</Text>
      <Text allowFontScaling={false} style={styles.amalMeta} numberOfLines={1}>{meta || '—'}</Text>
    </View>
    {opening === r.id ? (
      <ActivityIndicator size="small" color={und ? UND_COLOR : BER_COLOR} />
    ) : (
      <Text
        allowFontScaling={false}
        style={[styles.amalSum, { color: und ? UND_COLOR : BER_COLOR }]}
        numberOfLines={1}>
        {und ? '−' : '+'}{fMoney(r.summa, r.valyuta || cur)}
      </Text>
    )}
  </TouchableOpacity>
);
};

export default AmalRow;
