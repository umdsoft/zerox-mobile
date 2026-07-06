import {
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';

import { useNavigation, useRoute } from '@react-navigation/native';
import Card from '../components/Card';
import BerilganQarzIcon from '../../images/home/QarzOlganIcon.svg';
import MuddatUtganPlus from '../../images/home/MuddatUtgan+.svg';
import MuddatUtganMinus from '../../images/home/MuddatUtgan-.svg';
import OlinganQarz from '../../images/home/OlingaQarz.svg';
import axios from 'axios';
import { URL } from '../constants';
import { storage } from '../../store/api/token/getToken';
import Loading from '../components/Loading';
import PersonIcon from '../../images/home/person';
import JuridicIcon from '../../images/home/juridic';
import { settingDate } from './UserDetails';
import ScreenLayout from '../components/ScreenLayout';
import ListCardShowDetails from '../components/ListCardShowDetails';
import Famale from '../../images/Famale';
import { useTranslation } from 'react-i18next';
import { expire_passport_check } from '../../helper/timeChecker';
import { useDispatch, useSelector } from 'react-redux';
import { checkExpire } from '../../store/reducers/HomeReducer';
import { rd, rs } from '../../theme/rd';
import { ArrowUpRight, ArrowDownLeft } from '../home/redesign/icons';

const { width: SCREEN_W } = Dimensions.get('window');
// Ikki karta bir qatorda: ekran eni − chetlar (rs(16)*2) − oradagi bo'shliq (rs(12)).
const CARD_W = (SCREEN_W - rs(16) * 2 - rs(12)) / 2;

const DetailRow = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel} allowFontScaling={false}>
      {label}
    </Text>
    <Text
      style={styles.detailValue}
      numberOfLines={2}
      allowFontScaling={false}
    >
      {value || '—'}
    </Text>
  </View>
);

const UserInformationOfDebt = () => {
  const navigation = useNavigation();
  const { user, type, ctok, dtok, item } = useRoute().params ?? {};
  const { t } = useTranslation();
  const userInfo = useSelector(state => state.HomeReducer);
  const [me, setMe] = useState({});
  const [data, setData] = useState({ profile: {}, creditor: {}, debitor: {} });
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const FetchData = async () => {
    // Params yo'q/to'liq emas bo'lsa (masalan paramsiz navigatsiya) — crash bo'lmasin.
    if (!item?.duid || !item?.debitor) {
      return;
    }
    setLoading(true);
    try {
      const [profile, creditor, debitor] = await axios.all([
        axios.get(URL + `/user/candidate-search/${item.duid}`, {
          headers: {
            Authorization: `Bearer ${storage.getString('token')}`,
          },
        }),
        axios.get(URL + `/home/by/${item.debitor}?type=creditor`, {
          headers: {
            Authorization: `Bearer ${storage.getString('token')}`,
          },
        }),
        axios.get(URL + `/home/by/${item.debitor}?type=debitor`, {
          headers: {
            Authorization: `Bearer ${storage.getString('token')}`,
          },
        }),
      ]);
      axios
        .get(URL + `/user/me`, {
          headers: {
            Authorization: `Bearer ${storage.getString('token')}`,
          },
        })
        .then(res => {
          return setMe(res.data.data);
        });

      if (
        profile.status === 200 &&
        creditor.status === 200 &&
        debitor.status === 200
      ) {
        setData({
          profile: profile.data.data,
          creditor: creditor.data.data,
          debitor: debitor.data.data,
        });
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };
  useEffect(() => {
    FetchData();
  }, []);

  if (loading) {
    return <Loading />;
  }

  console.log(data.debitor, 'debitor');
  console.log(data.creditor, 'creditor');

  const fullName = `${data.profile?.last_name ?? ''} ${
    data.profile?.first_name ?? ''
  } ${data.profile?.middle_name ?? ''}`
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <ScreenLayout title={type === 1 ? '' : t('qidiruv')}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />

      {/* Kontragent kartasi */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            {data?.profile?.type === 1 ? (
              <JuridicIcon
                width={rs(30)}
                height={rs(50)}
                color={rd.color.primary}
              />
            ) : data?.profile?.gender === 2 ? (
              <Famale
                width={rs(30)}
                height={rs(50)}
                color={rd.color.primary}
              />
            ) : (
              <PersonIcon
                width={rs(30)}
                height={rs(50)}
                color={rd.color.primary}
              />
            )}
          </View>
          <View style={styles.profileHead}>
            <Text
              style={styles.profileName}
              numberOfLines={2}
              allowFontScaling={false}
            >
              {fullName || t('fish')}
            </Text>
            <Text style={styles.profileId} allowFontScaling={false}>
              ID: {data?.profile?.uid ?? '—'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <DetailRow label={t('fish')} value={fullName} />
        <DetailRow
          label={t('reg')}
          value={settingDate(data?.profile?.created_at?.slice(0, 10))}
        />
        <DetailRow label={t('120')} value={data?.profile?.uid} />
      </View>

      {/* Qarz jamlanmalari */}
      <View style={styles.cardRow}>
        <Card
          data={data.debitor?.data}
          width={CARD_W}
          disabled={true}
          title={t('153')}
          Icon={OlinganQarz}
          type={0}
          color={rd.color.text}
        />
        <Card
          data={data?.creditor?.data}
          width={CARD_W}
          disabled={true}
          title={t('156')}
          Icon={BerilganQarzIcon}
          type={0}
          color={rd.color.text}
        />
      </View>

      <View style={styles.cardRow}>
        <Card
          width={CARD_W}
          disabled={true}
          title={t('170')}
          Icon={MuddatUtganPlus}
          type={2}
          color={rd.color.error}
          data={data?.debitor?.expired}
        />
        <Card
          width={CARD_W}
          disabled={true}
          title={t('170')}
          Icon={MuddatUtganMinus}
          type={2}
          color={rd.color.error}
          data={data.creditor?.expired}
        />
      </View>

      <View style={styles.cardRow}>
        <ListCardShowDetails
          disabled={true}
          width={CARD_W}
          title={t('168')}
          type={2}
          data={data?.debitor?.five}
        />
        <ListCardShowDetails
          disabled={true}
          width={CARD_W}
          title={t('171')}
          type={2}
          data={data?.creditor?.five}
        />
      </View>

      {/* Amallar */}
      <View style={styles.actionsRow}>
        {/* Qarz berish */}
        <TouchableOpacity
          onPress={() => {
            if (expire_passport_check(userInfo?.user.data.expiry_date)) {
              dispatch(checkExpire({ expire: true }));
              return;
            }
            navigation.navigate('GiveDebtUser', {
              qarzoluvchi: data.profile,
              type: 1,
            });
          }}
          activeOpacity={0.85}
          style={[styles.actionBtn, styles.actionPrimary]}
        >
          <Text
            style={[styles.actionText, { color: rd.color.onPrimary }]}
            allowFontScaling={false}
          >
            {t('147')}
          </Text>
          <View style={styles.actionIconPrimary}>
            <ArrowUpRight size={rs(20)} color={rd.color.onPrimary} />
          </View>
        </TouchableOpacity>

        {/* Qarz olish */}
        <TouchableOpacity
          onPress={() => {
            if (expire_passport_check(userInfo?.user.data.expiry_date)) {
              dispatch(checkExpire({ expire: true }));
              return;
            }
            navigation.navigate('GiveDebtUser', {
              qarzoluvchi: data.profile,
              type: 0,
            });
          }}
          activeOpacity={0.85}
          style={[styles.actionBtn, styles.actionOutline]}
        >
          <Text
            style={[styles.actionText, { color: rd.color.primary }]}
            allowFontScaling={false}
          >
            {t('150')}
          </Text>
          <View style={styles.actionIconOutline}>
            <ArrowDownLeft size={rs(20)} color={rd.color.primary} />
          </View>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
};

export default UserInformationOfDebt;

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
    marginTop: rs(6),
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: rs(56),
    height: rs(56),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileHead: {
    flex: 1,
    marginLeft: rs(14),
  },
  profileName: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
  },
  profileId: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    marginTop: rs(4),
  },
  divider: {
    height: 1,
    backgroundColor: rd.color.border,
    marginVertical: rs(14),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(8),
  },
  detailLabel: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    flexShrink: 0,
    marginRight: rs(12),
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.text,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: rs(16),
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: rs(20),
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: rs(54),
    borderRadius: rd.radius.lg,
    paddingHorizontal: rs(14),
  },
  actionPrimary: {
    backgroundColor: rd.color.primary,
    marginRight: rs(6),
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  actionOutline: {
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: rd.color.primary,
    marginLeft: rs(6),
  },
  actionText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
  },
  actionIconPrimary: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(10),
    backgroundColor: rd.color.onPrimaryChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconOutline: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(10),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
