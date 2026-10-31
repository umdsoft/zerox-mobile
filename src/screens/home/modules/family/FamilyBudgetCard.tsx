import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import Donut from '../../redesign/Donut';
import { PencilIcon } from '../../redesign/icons';
import { catLabel, fCompact, fMoney, num } from '../financeMoney';
import { GREEN, memberColor, RED } from './familyLogic';
import { styles } from './familyStyles';

interface FamilyBudgetCardProps {
  budget: any;
  onManage: () => void;
}
/** So'rov: Oila byudjeti tahlili (sayt kabi) — jami daromad/xarajat/sof balans, a'zolar bo'yicha halqalar, kategoriyalar. */
const FamilyBudgetCard = ({ budget, onManage }: FamilyBudgetCardProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.budgetCard}>
      <View style={styles.budgetTitleRow}>
        <Text allowFontScaling={false} style={styles.budgetTitle}>{t('Oila budjeti (shu oy)')}</Text>
        {/* SS5: "✎ Boshqarish" matnli chip o'rniga FAQAT qalam ikonasi
            (sarlavha yonida ixcham, matn "Xarajat" ustiga tushmaydi). */}
        {budget.can_manage && (
          <TouchableOpacity
            onPress={onManage}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.budgetManageBtn}>
            <PencilIcon size={rs(16)} color={rd.color.primary} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.budgetRow}>
        <View style={styles.budgetCol}>
          <Text allowFontScaling={false} style={styles.budgetLabel}>{t('Daromad')}</Text>
          <Text allowFontScaling={false} style={[styles.budgetVal, { color: GREEN }]} numberOfLines={1} adjustsFontSizeToFit>{fMoney(num(budget.total_income_uzs), 'UZS')}</Text>
        </View>
        <View style={styles.budgetCol}>
          <Text allowFontScaling={false} style={styles.budgetLabel}>{t('Xarajat')}</Text>
          <Text allowFontScaling={false} style={[styles.budgetVal, { color: RED }]} numberOfLines={1} adjustsFontSizeToFit>{fMoney(num(budget.total_expense_uzs), 'UZS')}</Text>
        </View>
      </View>
      <View style={styles.budgetNet}>
        <Text allowFontScaling={false} style={styles.budgetLabel}>{t('Sof balans')}</Text>
        <Text allowFontScaling={false} style={[styles.budgetNetVal, { color: num(budget.net_uzs) >= 0 ? GREEN : RED }]} numberOfLines={1} adjustsFontSizeToFit>
          {num(budget.net_uzs) >= 0 ? '+' : '−'}{fMoney(Math.abs(num(budget.net_uzs)), 'UZS')}
        </Text>
      </View>

      {/* SS8: A'ZOLAR bo'yicha tahlil — sayt kabi IKKI halqa (daromad / xarajat).
          Ilgari faqat jami raqamlar bor edi: kim qancha qo'shayotgani ko'rinmasdi. */}
      {(() => {
        const mem: any[] = Array.isArray(budget.members) ? budget.members : [];
        const incSegs = mem.map((m, i) => ({ value: num(m.income_uzs), color: memberColor(i) })).filter(s => s.value > 0);
        const expSegs = mem.map((m, i) => ({ value: num(m.expense_uzs), color: memberColor(i) })).filter(s => s.value > 0);
        if (mem.length < 2 || (!incSegs.length && !expSegs.length)) return null;
        return (
          <View style={styles.memAnalysis}>
            <Text allowFontScaling={false} style={styles.budgetCatsTitle}>{t('A\'zolar bo‘yicha')}</Text>
            <View style={styles.donutRow}>
              <View style={styles.donutCol}>
                <Donut
                  segments={incSegs.length ? incSegs : [{ value: 1, color: rd.color.border }]}
                  size={rs(96)}
                  strokeWidth={rs(11)}
                  centerValue={fCompact(num(budget.total_income_uzs))}
                  centerLabel="Daromad"
                  valueSize={rs(13)}
                />
              </View>
              <View style={styles.donutCol}>
                <Donut
                  segments={expSegs.length ? expSegs : [{ value: 1, color: rd.color.border }]}
                  size={rs(96)}
                  strokeWidth={rs(11)}
                  centerValue={fCompact(num(budget.total_expense_uzs))}
                  centerLabel="Xarajat"
                  valueSize={rs(13)}
                />
              </View>
            </View>
            {mem.map((m, i) => (
              <View key={`ml${m.id ?? i}`} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: memberColor(i) }]} />
                <Text allowFontScaling={false} style={styles.legendName} numberOfLines={1}>
                  {m.is_self ? 'Men' : m.name}
                </Text>
                <Text allowFontScaling={false} style={[styles.legendVal, { color: GREEN }]}>
                  {fCompact(num(m.income_uzs))}
                </Text>
                <Text allowFontScaling={false} style={[styles.legendVal, { color: RED }]}>
                  {fCompact(num(m.expense_uzs))}
                </Text>
              </View>
            ))}
          </View>
        );
      })()}

      {/* img6a: xarajat kategoriyalari tahlili (sayt kabi) — ustun grafik. */}
      {Array.isArray(budget.expense_by_category) && budget.expense_by_category.length > 0 && (
        <View style={styles.budgetCats}>
          <Text allowFontScaling={false} style={styles.budgetCatsTitle}>{t('Xarajat kategoriyalari')}</Text>
          {budget.expense_by_category.slice(0, 6).map((c: any, i: number) => {
            const totalExp = num(budget.total_expense_uzs) || 1;
            const pctv = Math.min(100, Math.round((num(c.total_uzs) / totalExp) * 100));
            return (
              <View key={i} style={styles.catBarRow}>
                <View style={styles.catBarHead}>
                  <Text allowFontScaling={false} style={styles.catBarName} numberOfLines={1}>
                    {c.icon ? c.icon + ' ' : ''}{catLabel(c.name)}
                  </Text>
                  <Text allowFontScaling={false} style={styles.catBarVal}>
                    {fMoney(num(c.total_uzs), 'UZS')} · {pctv}%
                  </Text>
                </View>
                <View style={styles.catBarTrack}>
                  <View style={[styles.catBarFill, { width: `${pctv}%` }]} />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default FamilyBudgetCard;
