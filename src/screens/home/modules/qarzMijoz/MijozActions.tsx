import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rs } from '../../../../theme/rd';
import { CheckIcon, ClockIcon, HandCoinReturnIcon, LockIcon, PlusIcon } from '../../redesign/icons';
import DebtActionButton, { pastelFg } from '../DebtActionButton';
import { BanIcon } from '../FinanceDebtActionModal';
import { styles } from './mijozStyles';

interface MijozActionsProps {
  turi: 'berish' | 'olish';
  noActive: boolean;
  talabOff: boolean;
  talabLoading: boolean;
  talabLocked: boolean;
  goYangi: () => void;
  onYopish: () => void;
  onTalab: () => void;
  onVozKechish: () => void;
}

/** 03.10: amal tugmalari — Shaxsiy qarzdagidek 2x2 pastel to'r (olingan qarzda: Yangi qarz + Qarzni qaytarish). */
const MijozActions = ({
  turi,
  noActive,
  talabOff,
  talabLoading,
  talabLocked,
  goYangi,
  onYopish,
  onTalab,
  onVozKechish,
}: MijozActionsProps) => {
  const { t } = useTranslation();
  const yangiBtn = (
    <DebtActionButton
      label={t('Yangi qarz')}
      tone="blue"
      icon={<PlusIcon size={rs(15)} color={pastelFg('blue')} />}
      onPress={goYangi}
    />
  );
  // Olingan qarz ("Qarz beruvchi"): talab / voz kechish YO'Q (SS8-7 qoidasi o'zgarmagan).
  if (turi === 'olish') {
    return (
      <View style={styles.actGrid}>
        {yangiBtn}
        <DebtActionButton
          label={t('Qarzni qaytarish')}
          tone="green"
          disabled={noActive}
          icon={<HandCoinReturnIcon size={rs(15)} color={pastelFg('green', noActive)} />}
          onPress={onYopish}
        />
      </View>
    );
  }
  return (
    <View style={styles.actGrid}>
      {yangiBtn}
      <DebtActionButton
        label={t('Qarzni yopish')}
        tone="green"
        disabled={noActive}
        icon={<CheckIcon size={rs(15)} color={pastelFg('green', noActive)} strokeWidth={2.6} />}
        onPress={onYopish}
      />
      <DebtActionButton
        label={talabLoading ? t('Yuborilmoqda...') : t('Talab qilish')}
        tone="yellow"
        disabled={talabOff}
        icon={<ClockIcon size={rs(15)} color={pastelFg('yellow', talabOff)} />}
        trailing={
          talabLocked ? <LockIcon size={rs(13)} color={pastelFg('yellow', talabOff)} /> : null
        }
        onPress={onTalab}
      />
      <DebtActionButton
        label={t('Voz kechish')}
        tone="red"
        disabled={noActive}
        icon={<BanIcon size={rs(15)} color={pastelFg('red', noActive)} strokeWidth={2.4} />}
        onPress={onVozKechish}
      />
    </View>
  );
};

export default MijozActions;
