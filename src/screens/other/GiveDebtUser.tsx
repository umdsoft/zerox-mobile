import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Provider } from 'react-native-paper';
import DatePicker from 'react-native-date-picker';
import { t } from 'i18next';
import Loading from '../components/Loading';
import MeetInfoGiveDebtModal from '../../modal/MeetInfoGiveDebtModal';
import { rs } from '../../theme/rd';
import RdHeader from '../home/redesign/RdHeader';
import { PartyCard } from './giveDebt/PartyCard';
import { AgreeRow, AmountField, CntRow, CurrencyToggle, DateRow, FeeCard } from './giveDebt/GiveDebtFields';
import { useGiveDebt } from './giveDebt/useGiveDebt';
import { styles } from './giveDebt/giveDebtStyles';
import { feeApplies } from './giveDebt/giveDebtLogic';

export { formatDateMinus } from './giveDebt/giveDebtLogic';

const DATE_PICKER_MAX_MS = 2 * 365 * 24 * 60 * 60 * 1000; // maksimum sana — 2 yil

const GiveDebtUser = () => {
  const g = useGiveDebt();
  const { type, qarzoluvchi, user } = g;

  if (g.loading) {
    return <Loading />;
  }

  const me = user?.data;
  // type 1: qarz oluvchi = qarzoluvchi, beruvchi = user; aks holda teskari (eski mantiq saqlangan).
  const debtor = type !== 1 ? me : qarzoluvchi;
  const creditor = type !== 1 ? qarzoluvchi : me;
  const creditorName = type === 0 ? qarzoluvchi : me;
  const showCnt = type === 0 && me?.cnt !== 0;
  const showFee = g.checked && g.amount.length > 0 && feeApplies(type, me.cnt);

  return (
    <View style={styles.container}>
      <Provider>
        <StatusBar barStyle="dark-content" />
        <RdHeader title={type === 1 ? t('147') : t('150')} />
        <ScrollView contentContainerStyle={{ paddingBottom: rs(32) }} showsVerticalScrollIndicator={false}>
          <View style={styles.main}>
            <PartyCard debtor={debtor} creditor={creditor} debtorName={debtor} creditorName={creditorName} />

            <CurrencyToggle isUzs={g.isUzs} onUzs={g.selectUzs} onUsd={g.selectUsd} />
            <AmountField isUzs={g.isUzs} amount={g.amount} onChange={g.setAmount} />
            <DateRow date={g.date} isPlaceholder={g.isPlaceholderDate} onPress={() => g.setOpen(!g.open)} />
            <AgreeRow checked={g.checked} onToggle={g.toggleChecked} onOpenContract={g.openContractPreview} />

            {showCnt ? <CntRow cnt={me?.cnt} /> : null}
            {showFee ? <FeeCard fee={g.fee} /> : null}

            <TouchableOpacity
              disabled={g.isDisabled}
              activeOpacity={0.85}
              onPress={g.submit}
              style={[styles.button, g.isDisabled ? styles.buttonDisabled : styles.buttonActive]}
            >
              <Text
                allowFontScaling={false}
                style={[styles.buttonText, g.isDisabled && styles.buttonTextDisabled]}
              >
                {t('93')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <MeetInfoGiveDebtModal toggleModal={g.openContractPreview} visible={false} />

        <DatePicker
          open={g.open}
          date={g.date}
          style={{ backgroundColor: '#fff', alignSelf: 'center' }}
          mode="date"
          confirmText="OK"
          cancelText={t('804')}
          theme="light"
          modal={true}
          minimumDate={new Date()}
          maximumDate={new Date(Date.now() + DATE_PICKER_MAX_MS)}
          onCancel={() => g.setOpen(false)}
          title={t('801')}
          onConfirm={picked => {
            g.setDate(picked);
            g.setOpen(false);
          }}
        />
      </Provider>
    </View>
  );
};

export default GiveDebtUser;
