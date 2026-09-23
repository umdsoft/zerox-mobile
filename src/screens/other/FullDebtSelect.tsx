import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { goHomeSmooth } from "../../helper/finishAction";

import { useNavigation, useRoute } from '@react-navigation/native';

import Toast from 'react-native-toast-message';
import Loading from '../components/Loading';
import axios from 'axios';
import { storage } from '../../store/api/token/getToken';
import { URL } from '../constants';
import ScreenLayout from '../components/ScreenLayout';
import { settingDate } from '../../helper';
import { rd, rs } from '../../theme/rd';
import { Trans, useTranslation } from 'react-i18next';
import { AnimatedIconCircle, DemandReturnIcon } from '../../images/debtActionIcons';

// ALL CAPS ismni "O'tamuratov Nurbek" ko'rinishiga keltiradi (SS1: FISH baqiruvchi
// CAPS o'rniga tabiiy holatда; kichik harflar ham qabul qilinadi).
const titleCase = (s?: string) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const FullDebtSelect = () => {
  const { item } = useRoute().params;
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [info, setInfo] = useState({});
  const [loading, setLoading] = useState(false);
  // SS9: talabnoma POST'i uchun ALOHIDA in-flight bayroq (loading esa faqat GET
  // paytida to'liq ekran spinnerini boshqaradi). Ikki marta bosishда dublikat SMS
  // yuborilmasligi uchun.
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getData();
  }, []);

  const getData = useCallback(async () => {
    const token = storage.getString('token');
    try {
      setLoading(true);
      const { data, status } = await axios.get(URL + `/contract/by/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (status === 200) {
        setInfo(data.data);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  }, [item.id]);

  const onPress = async () => {
    if (submitting) return; // dublikat SMS himoyasi
    const token = storage.getString('token');
    try {
      setSubmitting(true);
      const { data, status } = await axios.post(
        URL + '/contract/talab',
        {
          act: info?.act,
          contract: info?.id,
          creditor: info?.creditor,
          debitor: info?.debitor,
          reciver: info?.creditor,
          residual_amount: info?.residual_amount,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (status === 200 && data.msg === 'ex') {
        // Sarlavhasiz -> matn bold (descStrong). Oldin "Xatolik" sarlavhasi bor edi.
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'error2',
          props: { desc: t('Ushbu shartnoma bo‘yicha talabnoma yuborilgan.') },
        });
      }
      // SS3 (2026-09-20): shartnoma YOPILGAN bo'lsa backend 200 + msg:'end'
      // qaytaradi. Ilgari bu holat umuman ishlov ko'rmas edi — tugma
      // bosilar, lekin ekranda HECH NARSA o'zgarmasdi.
      if (status === 200 && data.msg === 'end') {
        Toast.show({
          autoHide: true,
          visibilityTime: 3500,
          position: 'bottom',
          type: 'error2',
          props: {
            desc: t('Bu shartnoma yopilgan — qaytarishni talab qilib bo‘lmaydi.'),
          },
        });
      }
      if (status === 200 && data.msg === 'contract-not-found') {
        Toast.show({
          autoHide: true,
          visibilityTime: 3500,
          position: 'bottom',
          type: 'error2',
          props: { desc: t('Shartnoma topilmadi.') },
        });
      }
      if (status === 201) {
        // SS3: talab QAYD ETILDI. Agar bildirishnoma yetib bormagan bo'lsa
        // (`notified === false`) buni yashirmaymiz — foydalanuvchi qarzdor
        // xabar olgan-olmaganini bilishi kerak.
        if (data?.notified === false) {
          Toast.show({
            autoHide: true,
            visibilityTime: 4000,
            position: 'bottom',
            type: 'error2',
            props: {
              desc: t(
                'Talab qayd etildi, ammo bildirishnoma yuborilmadi. Qarzdorga o‘zingiz xabar bering.',
              ),
            },
          });
          goHomeSmooth(navigation, t('360'));
          return;
        }
        // SS2: "Muvaffaqiyatli" sarlavhasi olib tashlandi -> "Talabnoma yuborildi."
        // yagona bold matn sifatida ko'rinadi (descStrong).
        Toast.show({
          // autoHide: false -> toast goHomeSmooth hide qilgunча turadi (o'qilsin).
          autoHide: false,
          position: 'bottom',
          type: 'omad',
          props: { desc: t('360') },
        });
        goHomeSmooth(navigation, t('360'));
      }
    } catch (error: any) {
      // SS3: serverning sababi bo'lsa AYNAN SHUNI ko'rsatamiz — "Xatolik
      // sodir bo'ldi" hech narsa tushuntirmasdi.
      const code = error?.response?.data?.msg;
      const desc =
        code === 'contract-not-found'
          ? t('Shartnoma topilmadi.')
          : code === 'forbidden' || error?.response?.status === 403
          ? t('Ruxsat yo‘q')
          : error?.response?.status === 500
          ? t('Server xatosi. Birozdan so‘ng qayta urinib ko‘ring.')
          : t('Xatolik sodir bo‘ldi');
      Toast.show({
        autoHide: true,
        visibilityTime: 4000,
        position: 'bottom',
        type: 'error2',
        props: { desc },
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout title={dotHelper(t('351'))} scroll={false}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <Loading />
        </View>
      ) : (
        <View style={styles.centerWrap}>
          {/* Amal ikonasi — talab (refund) + yengil puls. */}
          <View style={styles.iconWrap}>
            <AnimatedIconCircle size={rs(104)} bg={rd.color.primary}>
              <DemandReturnIcon width={rs(52)} height={rs(52)} />
            </AnimatedIconCircle>
          </View>

          {/* Xabar + Jo'natish tugmasi. Matn shrifti bir xil; FISh (name) bold,
              shartnoma raqami ko'k havola. */}
          <View style={styles.bottom}>
            <View style={styles.card}>
              <Text allowFontScaling={false} style={styles.hisob}>
                <Trans
                  t={t}
                  i18nKey="354"
                  values={{
                    start: settingDate(info.created_at),
                    count: info?.number,
                    name: titleCase(info?.creditor_name),
                  }}
                  components={{
                    start: <Text allowFontScaling={false} />,
                    count: (
                      <Text
                        allowFontScaling={false}
                        onPress={() =>
                          navigation.navigate('DownloadStatistic', {
                            item: info,
                            id: info.id,
                          })
                        }
                        style={styles.link}
                      />
                    ),
                    name: (
                      <Text
                        allowFontScaling={false}
                        style={styles.nameBold}
                      />
                    ),
                  }}
                />
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onPress}
              disabled={submitting}
              style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={rd.color.onPrimary} />
              ) : (
                <Text allowFontScaling={false} style={styles.primaryBtnText}>
                  {t('357') as string}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScreenLayout>
  );
};

export const dotHelper = text => {
  return text.length > 35 ? text.slice(0, 35) + '...' : text;
};

export default FullDebtSelect;

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Ikona + kontent guruhi VERTIKAL MARKAZDA (so'rov bo'yicha biroz pastroq/balansli).
  centerWrap: { flex: 1, justifyContent: 'center' },
  iconWrap: {
    alignItems: 'center',
    marginBottom: rs(30),
  },
  // Past yarim — kontent.
  bottom: { paddingBottom: rs(20) },
  card: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    padding: rs(14),
  },
  // Yagona (bir xil) shrift — barcha so'z va raqam.
  hisob: {
    fontSize: rs(15),
    fontFamily: rd.font.medium,
    color: rd.color.text,
    textAlign: 'center',
    lineHeight: rs(23),
  },
  // Shartnoma raqami — bosiladigan ko'k havola (shrift bir xil, faqat rang).
  link: { color: rd.color.primary },
  // FISh — bold (so'rov bo'yicha jirniy).
  nameBold: { fontFamily: rd.font.bold, color: rd.color.text },
  primaryBtn: {
    marginTop: rs(20),
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: rs(16),
    fontFamily: rd.font.semibold,
    color: rd.color.onPrimary,
  },
});
