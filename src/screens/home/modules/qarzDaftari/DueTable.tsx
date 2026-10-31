import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import AnimatedEmpty from '../../../components/AnimatedEmpty';
import { groupDigits } from '../../../../helper/money';
import { daysColor, daysText, Row, toDueRows } from './qarzDaftariLogic';
import { styles } from './qarzDaftariStyles';

// F) Muddati yaqin qarzlar jadvali (UZS/USD toggle bilan).
const DueTable = ({
  title,
  accent,
  rows,
  onRow,
}: {
  title: string;
  accent: string;
  rows: any[];
  onRow: (row: Row) => void;
}) => {
  const { t } = useTranslation();
  const [cur, setCur] = React.useState<'UZS' | 'USD'>('UZS');
  const filtered: Row[] = toDueRows(rows, cur);

  return (
    <View style={styles.card}>
      <View style={styles.tableHeadRow}>
        {/* numberOfLines 1→2: uzun sarlavha ("Muddati yaqin berilgan qarzlar")
            UZS/USD toggle yonida 2 qatorda TO'LIQ ko'rinadi (kesilmaydi). */}
        <Text style={[styles.tableTitle, { color: accent }]} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.toggle}>
          {(['UZS', 'USD'] as const).map(c => (
            <TouchableOpacity
              key={c}
              activeOpacity={0.8}
              onPress={() => setCur(c)}
              style={[styles.toggleBtn, cur === c && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleText, cur === c && styles.toggleTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          {/* 02.10: bo'sh holat — harakatli ikonka */}
          <AnimatedEmpty variant="time" compact />
          <Text style={styles.emptyText}>
            {t('Yaqin orada muddati tugaydigan qarzlar yo‘q.')}
          </Text>
        </View>
      ) : (
        <>
          {/* So'rov SS2.2: "Mijoz" ustuni OLINDI; "Muddat"→"Qolgan vaqt".
              Endi 2 ustun: Qolgan vaqt (chap) | Qarz miqdori (o'ng). */}
          <View style={styles.trHead}>
            <Text style={[styles.thText, styles.colDate2]}>{t('Qolgan vaqt')}</Text>
            <Text style={[styles.thText, styles.colAmt]}>{t('Qarz miqdori')}</Text>
          </View>
          {filtered.map((row, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              onPress={() => onRow(row)}
              style={styles.tr}
            >
              <View style={styles.colDate2}>
                <View
                  style={[styles.dayPill, { backgroundColor: daysColor(row.end) + '1A' }]}
                >
                  <Text style={[styles.dayPillText, { color: daysColor(row.end) }]}>
                    {daysText(row.end)}
                  </Text>
                </View>
              </View>
              {/* So'rov SS2: summa qisqartirilmasin (mln/mlrd emas) — to'liq
                  raqam, mingliklar bo'shliq bilan: "1 000 000 000 UZS". */}
              <Text style={[styles.tdAmt, styles.colAmt]} numberOfLines={1} adjustsFontSizeToFit>
                {`${groupDigits(row.amount)} ${row.currency}`}
              </Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );
};

export default DueTable;
