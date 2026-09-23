import React from 'react';
import DatePicker from 'react-native-date-picker';
import { useTranslation } from 'react-i18next';

/**
 * DateModal — sana tanlash oynasi.
 *
 * NEGA `react-native-date-picker`: ilgari bu komponent `@react-native-community/
 * datetimepicker`ni react-native-paper `Modal` ichiga o'rardi. Android'da native
 * sana-tanlagich IMPERATIV DIALOG sifatida ochilib, paper Modal bilan IKKI oyna
 * hosil bo'lardi -> ayniqsa "qaytarish sanasi" ishonchli o'rnatilmasdi (SS8).
 * Ilovada allaqachon ishlatiladigan `react-native-date-picker` (SearchUserScreen)
 * esa toza, ishonchli va chiroyli modal spinner beradi — shuni ishlatamiz.
 *
 * Interfeys O'ZGARMAGAN (open/setOpen/title/date/setDate/min/max) — barcha
 * chaqiruvchilar (QarzDaftariYangi, GiveDebtUser, DebtDateLength ...) o'zgarishsiz.
 */
interface DateModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: string;
  date: Date;
  setDate: (date: Date) => void;
  min?: Date;
  max?: Date;
}

const DateModal: React.FC<DateModalProps> = ({
  open,
  setOpen,
  title = '',
  date,
  setDate,
  min,
  max,
}) => {
  const { t } = useTranslation();
  return (
    <DatePicker
      modal
      open={open}
      date={date}
      mode="date"
      theme="light"
      title={title || undefined}
      confirmText="OK"
      cancelText={t('804')}
      minimumDate={min}
      maximumDate={max}
      onConfirm={selected => {
        setDate(selected);
        setOpen(false);
      }}
      onCancel={() => setOpen(false)}
    />
  );
};

export default DateModal;
