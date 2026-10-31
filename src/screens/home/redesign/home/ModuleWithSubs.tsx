import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { CircleIcon } from '../../../../components/ui/CircleIcon';
import { BulbIcon, ChevronRight, IconProps, InfoIcon } from '../icons';
import Shimmer from './Shimmer';
import { styles } from './homeStyles';

// SS-DEV (2026-10-05): modul sub-kartasi summalari uchun skeleton (UZS + USD).
const SubSkeleton = () => (
  <>
    <Shimmer width="72%" height={rs(18)} style={styles.subSkel} />
    <Shimmer width="46%" height={rs(14)} style={styles.subSkel} />
  </>
);

// Modul kartasi — "Qarz shartnomasi" (Debitor + Kreditor qiymatlari bilan).
// Modul kartasi — sarlavha + ikona + IKKI sub-summa (Debitor / Kreditor).
// 25.10: ruscha yorliq (Выданный долг / Полученный долг) har doim 2 qatorda —
// oxirgi bo'sh joyda uziladi. Boshqa tillarda o'zgarishsiz.
const subLabelText = (text: string, lang?: string): string => {
  if (lang !== 'ru') return text;
  const i = text.lastIndexOf(' ');
  return i > 0 ? text.slice(0, i) + '\n' + text.slice(i + 1) : text;
};

// Qarz shartnomasi VA Qarz daftari uchun bitta shakl (faqat ikona/nom/summa farq).
const ModuleWithSubs = ({
  title,
  Icon,
  debUzs,
  debUsd,
  credUzs,
  credUsd,
  onPress,
  // So'rov SS20: Shaxsiy moliya kartasi uchun yorliqlar (Daromadlar/Xarajatlar).
  debLabel,
  credLabel,
  // So'rov SS1: strelka o'rniga lampochka — bosilsa bo'lim izohi (info) modalда chiqadi.
  info,
  loading,
}: {
  title: string;
  Icon: (p: IconProps) => React.ReactElement;
  debUzs: string;
  debUsd: string;
  credUzs: string;
  credUsd: string;
  onPress: () => void;
  debLabel?: string;
  credLabel?: string;
  info?: string;
  loading?: boolean;
}) => {
  const { t, i18n } = useTranslation();
  const [infoOpen, setInfoOpen] = React.useState(false);
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.moduleCard} onPress={onPress}>
      <View style={styles.moduleHead}>
        <CircleIcon size={rs(38)} bg={rd.color.primaryTint}>
          <Icon size={rs(20)} color={rd.color.primary} />
        </CircleIcon>
        <Text style={styles.moduleTitle}>{t(title)}</Text>
        {info ? (
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={e => {
              e.stopPropagation();
              setInfoOpen(true);
            }}
            style={styles.moduleInfoBtn}>
            {/* So'rov: lampochka o'rniga ixcham, chiroyli "i" (info) belgisi. */}
            <InfoIcon size={rs(15)} color={rd.color.textTertiary} />
          </TouchableOpacity>
        ) : (
          <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
        )}
      </View>
      <View style={styles.moduleSubRow}>
        <View style={[styles.moduleSub, { backgroundColor: rd.color.successBg }]}>
          {loading ? (
            <SubSkeleton />
          ) : (
            <>
              <Text style={[styles.moduleSubAmt, { color: rd.color.success }]} numberOfLines={1} adjustsFontSizeToFit>
                {debUzs}
              </Text>
              {debUsd ? <Text style={styles.moduleSubUsd}>{debUsd}</Text> : null}
            </>
          )}
          <Text style={styles.moduleSubLabel}>{subLabelText(t(debLabel || 'Berilgan qarz'), i18n.language)}</Text>
        </View>
        <View style={[styles.moduleSub, { backgroundColor: rd.color.errorBg }]}>
          {loading ? (
            <SubSkeleton />
          ) : (
            <>
              <Text style={[styles.moduleSubAmt, { color: rd.color.error }]} numberOfLines={1} adjustsFontSizeToFit>
                {credUzs}
              </Text>
              {credUsd ? <Text style={styles.moduleSubUsd}>{credUsd}</Text> : null}
            </>
          )}
          <Text style={styles.moduleSubLabel}>{subLabelText(t(credLabel || 'Olingan qarz'), i18n.language)}</Text>
        </View>
      </View>

      {/* So'rov SS1: bo'lim izohi — kichik ma'lumot oynasi (lampochka bosilganda). */}
      {info ? (
        <Modal
          visible={infoOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setInfoOpen(false)}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.infoOverlay}
            onPress={() => setInfoOpen(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.infoSheet} onPress={() => {}}>
              <View style={styles.infoHeadRow}>
                <CircleIcon size={rs(34)} bg="#fef3c7">
                  <BulbIcon size={rs(18)} color="#f59e0b" />
                </CircleIcon>
                <Text style={styles.infoTitle}>{t(title)}</Text>
              </View>
              <Text allowFontScaling={false} style={styles.infoText}>
                {t(info)}
              </Text>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.infoBtn}
                onPress={() => setInfoOpen(false)}>
                <Text allowFontScaling={false} style={styles.infoBtnText}>
                  {t('Tushunarli')}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      ) : null}
    </TouchableOpacity>
  );
};

export default ModuleWithSubs;
