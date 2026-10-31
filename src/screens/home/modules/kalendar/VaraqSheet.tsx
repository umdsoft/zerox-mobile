import React from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import AnimatedEmpty from '../../../components/AnimatedEmpty';
import { fMoney } from '../financeMoney';
import { CloseIcon } from '../../redesign/icons';
import AmalRow from './AmalRow';
import { BER_COLOR, KunAmal, UND_COLOR, Varaq } from './kalendarLogic';
import { styles } from './kalendarStyles';

interface VaraqSheetProps {
  varaq: Varaq | null;
  closeVaraq: () => void;
  openVaraq: (turi: 'kun' | 'hafta') => void;
  cur: 'UZS' | 'USD';
  varaqBer: KunAmal[];
  varaqUnd: KunAmal[];
  varaqJamiBer: number;
  varaqJamiUnd: number;
  varaqLoading: boolean;
  varaqErr: boolean;
  opening: number | null;
  goAmaliyot: (r: KunAmal) => void;
}
/** KUN / HAFTA tafsilot varag'i (saytdagi "Kun tahlili"). */
const VaraqSheet = ({
  varaq,
  closeVaraq,
  openVaraq,
  cur,
  varaqBer,
  varaqUnd,
  varaqJamiBer,
  varaqJamiUnd,
  varaqLoading,
  varaqErr,
  opening,
  goAmaliyot,
}: VaraqSheetProps) => {
  const { t } = useTranslation();
  return (
    <Modal
      visible={varaq != null}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closeVaraq}>
      <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={closeVaraq} />
      <View style={styles.sheet}>
        <View style={styles.sheetHead}>
          <View style={styles.flex1}>
            <Text allowFontScaling={false} style={styles.sheetTitle} numberOfLines={1}>
              {varaq?.title}
            </Text>
            <Text allowFontScaling={false} style={styles.sheetSub} numberOfLines={1}>
              {varaq?.turi === 'hafta'
                ? t('Hafta tahlili — berilgan va undirilgan qarzlar')
                : t('Kun tahlili — berilgan va undirilgan qarzlar')}
            </Text>
          </View>
          <TouchableOpacity onPress={closeVaraq} style={styles.closeBtn}>
            <CloseIcon size={rs(18)} color={rd.color.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Jami — BERILGAN / UNDIRILGAN */}
        <View style={styles.sheetSums}>
          <View style={[styles.sheetSum, styles.sheetSumBer]}>
            <Text allowFontScaling={false} style={styles.sheetSumLabel}>{t('Berilgan')}</Text>
            <Text
              allowFontScaling={false}
              style={[styles.sheetSumVal, { color: BER_COLOR }]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {fMoney(varaqJamiBer, cur)}
            </Text>
          </View>
          <View style={[styles.sheetSum, styles.sheetSumUnd]}>
            <Text allowFontScaling={false} style={styles.sheetSumLabel}>{t('Undirilgan')}</Text>
            <Text
              allowFontScaling={false}
              style={[styles.sheetSumVal, { color: UND_COLOR }]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {fMoney(varaqJamiUnd, cur)}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.sheetList}
          contentContainerStyle={{ paddingBottom: rs(12) }}
          showsVerticalScrollIndicator={false}>
          {varaqLoading ? (
            <View style={styles.sheetCenter}>
              <ActivityIndicator size="small" color={rd.color.primary} />
            </View>
          ) : varaqErr ? (
            <View style={styles.sheetCenter}>
              <Text allowFontScaling={false} style={styles.sheetEmpty}>
                {t('Ma’lumotni yuklab bo‘lmadi. Qayta urinib ko‘ring.')}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => varaq && openVaraq(varaq.turi)}
                style={styles.retryBtn}>
                <Text allowFontScaling={false} style={styles.retryText}>{t('Qayta urinish')}</Text>
              </TouchableOpacity>
            </View>
          ) : varaqBer.length === 0 && varaqUnd.length === 0 ? (
            <View style={styles.sheetCenter}>
              {/* 02.10: bo'sh holat — harakatli ikonka */}
              <AnimatedEmpty variant="time" compact />
              <Text allowFontScaling={false} style={styles.sheetEmpty}>
                {t('Bu davrda qarz amaliyoti yo‘q')}
              </Text>
            </View>
          ) : (
            <>
              {varaqBer.length > 0 && (
                <>
                  <Text allowFontScaling={false} style={styles.sheetSection}>
                    {t('Berilgan qarzlar')} ({varaqBer.length})
                  </Text>
                  {varaqBer.map(r => (
                    <AmalRow key={`b${r.id}`} r={r} und={false} varaqTuri={varaq?.turi} cur={cur} opening={opening} goAmaliyot={goAmaliyot} />
                  ))}
                </>
              )}
              {varaqUnd.length > 0 && (
                <>
                  <Text allowFontScaling={false} style={styles.sheetSection}>
                    {t('Undirilgan qarzlar')} ({varaqUnd.length})
                  </Text>
                  {varaqUnd.map(r => (
                    <AmalRow key={`u${r.id}`} r={r} und varaqTuri={varaq?.turi} cur={cur} opening={opening} goAmaliyot={goAmaliyot} />
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default VaraqSheet;
