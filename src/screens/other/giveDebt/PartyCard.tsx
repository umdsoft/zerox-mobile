import React from 'react';
import { Text, View } from 'react-native';
import { t } from 'i18next';
import Person from '../../../images/home/person';
import Juridic from '../../../images/home/juridic';
import Famale from '../../../images/Famale';
import { rd, rs } from '../../../theme/rd';
import { useFio } from '../../../helper/useFio';
import { fullName, Party } from './giveDebtLogic';
import { styles } from './giveDebtStyles';

const PartyAvatar = ({ party }: { party: Party }) => {
  const size = rs(28);
  return (
    <View style={styles.avatar}>
      {party?.type === 2 ? (
        party?.gender == '1' ? (
          <Person width={size} height={size} color={rd.color.primary} />
        ) : (
          <Famale width={size} height={size} color={rd.color.primary} />
        )
      ) : (
        <Juridic width={size} height={size} color={rd.color.primary} />
      )}
    </View>
  );
};

interface Props {
  debtor: Party;
  creditor: Party;
  debtorName: Party;
  creditorName: Party;
}

/** Ishtirokchilar kartasi: qarz oluvchi va qarz beruvchi. */
export const PartyCard = ({ debtor, creditor, debtorName, creditorName }: Props) => {
  const { fio } = useFio();
  return (
    <View style={styles.partyCard}>
      <View style={styles.partyRow}>
        <PartyAvatar party={debtor} />
        <View style={styles.partyInfo}>
          <Text allowFontScaling={false} style={styles.partyRole}>
            {t('270')}
          </Text>
          <Text allowFontScaling={false} style={styles.partyName}>
            {fio(fullName(debtorName))}
          </Text>
        </View>
      </View>

      <View style={styles.partyDivider} />

      <View style={styles.partyRow}>
        <PartyAvatar party={creditor} />
        <View style={styles.partyInfo}>
          <Text allowFontScaling={false} style={[styles.partyRole, styles.partyRoleCreditor]}>
            {t('273')}
          </Text>
          <Text allowFontScaling={false} style={styles.partyName}>
            {fio(fullName(creditorName))}
          </Text>
        </View>
      </View>
    </View>
  );
};
