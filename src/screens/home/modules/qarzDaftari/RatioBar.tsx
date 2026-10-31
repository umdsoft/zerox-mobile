import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BLUE, GREEN, PERSONAL } from './qarzDaftariLogic';
import { styles } from './qarzDaftariStyles';

// SS2 (2026-09-14): nisbat bari endi UCH manba — shartnoma (ko'k) + daftar
// (yashil) + shaxsiy qarz (binafsha). Uchinchi manba jami summaga qo'shilgani
// uchun diagramma ham uni ko'rsatishi SHART; aks holda foizlar jamiga mos
// kelmay, karta o'zini-o'zi inkor qilardi.
const RatioBar = ({
  contract,
  ledger,
  personal,
}: {
  contract: number;
  ledger: number;
  personal: number;
}) => {
  const { t } = useTranslation();
  const total = contract + ledger + personal;
  // Yaxlitlash sababli yig'indi 100 dan chiqib ketmasligi uchun oxirgi ulush
  // qoldiqdan hisoblanadi.
  const cPct = total > 0 ? Math.round((contract / total) * 100) : 0;
  const lPct = total > 0 ? Math.round((ledger / total) * 100) : 0;
  const pPct = total > 0 ? Math.max(0, 100 - cPct - lPct) : 0;
  const seg = [
    { pct: cPct, color: BLUE, label: t('Shartnoma {{pct}}%', { pct: cPct }) },
    { pct: lPct, color: GREEN, label: t('Daftar {{pct}}%', { pct: lPct }) },
    { pct: pPct, color: PERSONAL, label: t('Shaxsiy {{pct}}%', { pct: pPct }) },
  ];
  return (
    <View>
      <View style={styles.barTrack}>
        {seg.map((x, i) => (
          <View
            key={i}
            style={[styles.barFill, { flex: x.pct || 0.0001, backgroundColor: x.color }]}
          />
        ))}
      </View>
      <View style={styles.barLegend}>
        {seg.map((x, i) => (
          <View key={i} style={styles.barLegendItem}>
            <View style={[styles.barDot, { backgroundColor: x.color }]} />
            <Text style={styles.barLegendText}>{x.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default RatioBar;
