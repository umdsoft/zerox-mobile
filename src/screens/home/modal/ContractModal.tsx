import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useState } from 'react';
import { Modal } from 'react-native-paper';
import { rd, rs } from '../../../theme/rd';
import { useDispatch, useSelector } from 'react-redux';
import { contractModalShow } from '../../../store/reducers/HomeReducer';
import { getMe } from '../../../store/api/home';

import Pdf from 'react-native-pdf';
import axios from 'axios';
import { URL, PDF_OFERTA_URL } from '../../constants';
import { storage } from '../../../store/api/token/getToken';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import Loading from '../../components/Loading';
import CheckBox from '@react-native-community/checkbox';
import { useTranslation } from 'react-i18next';
const { width, height } = Dimensions.get('screen');

const ContractModal = () => {
  const dispatch = useDispatch();

  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [check, setCheck] = useState(false);
  const [page, setPage] = useState(1);
  const { contract, user } = useSelector(state => state.HomeReducer);
  const [allPage, setAllPage] = useState(0);
  // SS5 (2026-09-20): eng uzoq borilgan sahifa — "oxirigacha o'qildi"
  // shartini shu orqali aniqlaymiz (joriy sahifa emas: foydalanuvchi
  // oxirga yetib, keyin orqaga qaytishi mumkin).
  const [maxPage, setMaxPage] = useState(1);
  // So'rov SS5: PDF yuklanmasa foydalanuvchi bo'sh oynada QAMALIB qolmasin
  // (dismissable=false). Xato bo'lsa xabar + "Qayta urinish" ko'rsatiladi.
  const [pdfErr, setPdfErr] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  /**
   * SS5: oxirigacha o'qilganmi?
   * Darvoza FAQAT ko'p sahifali hujjatda ishlaydi — `allPage` 0 yoki 1
   * bo'lsa tekshirib bo'lmaydi va bloklash foydalanuvchini qamab qo'yardi.
   */
  const readToEnd = allPage > 0 && maxPage >= allPage;
  const needRead = !pdfErr && allPage > 1 && !readToEnd;

  const warnRead = useCallback(() => {
    Toast.show({
      autoHide: true,
      visibilityTime: 3500,
      position: 'bottom',
      type: 'error2',
      props: {
        desc: t(
          'Iltimos, ommaviy ofertani oxirigacha o‘qib chiqing va tasdiqlang.',
        ),
      },
    });
  }, [t]);

  const onClose = useCallback(async () => {
    // Tugma FAQAT `check` (rozilik belgilangan)да yoqiladi. Ilgari bu yerda ham
    // `page === allPage` sharti bor edi — u ishonchsiz bo'lib, tugma bosilса jim
    // o'tib ketardi (tasdiqlanmasdi). Endi rozilik belgisiga tayanamiz.
    if (check) {
      const token = storage.getString('token');
      try {
        setLoading(true);
        const { data } = await axios.put(
          URL + '/user/edit_contract',
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (data.success) {
          // is_contract=1 bo'ldi — redux `user`ni YANGILAB BO'LGACH yopamiz. Aks holda
          // Main.tsx re-trigger effekti (is_contract hali 0) modalni QAYTA ochadi (flicker/loop).
          await dispatch(getMe());
          dispatch(contractModalShow({ show: false }));
        }

        if (data.success === false && data.msg === 'is_contract_true') {
          Toast.show({
            autoHide: true,
            visibilityTime: 3000,
            position: 'bottom',
            type: 'error2',
            props: {
              desc: t('Siz ommaviy ofertani boshqa qurilmada tasdiqlagansiz'),
            },
          });
          await dispatch(getMe());
          dispatch(contractModalShow({ show: false }));
        }

        setLoading(false);
      } catch (error) {
        setLoading(false);
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'error2',
          props: { desc: "Amalga oxshirib bo'lmadi " },
        });
      }
    } else {
      console.log('red');
    }
  }, [check, dispatch, t]);

  return (
    <Modal visible={contract} dismissable={false}>
      <View style={styles.main}>
        {loading ? (
          <Loading />
        ) : (
          <>
            {pdfErr ? (
              <View style={styles.errBox}>
                <Text style={styles.errText} allowFontScaling={false}>
                  {t(
                    'Oferta hujjatini yuklab bo‘lmadi. Internet aloqasini tekshirib, qayta urinib ko‘ring.',
                  )}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setPdfErr(false);
                    setPage(1);
                    setAllPage(0);
                    setCheck(false);
                    setReloadKey(k => k + 1);
                  }}
                  style={styles.retryBtn}
                >
                  <Text style={styles.retryText} allowFontScaling={false}>
                    {t('Qayta urinish')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Pdf
                key={reloadKey}
                trustAllCerts={false}
                enablePaging={true}
                onError={error => {
                  console.warn(error);
                  setPdfErr(true);
                }}
                renderActivityIndicator={() => (
                  <ActivityIndicator
                    size="small"
                    color={rd.color.primary}
                    style={styles.indicator}
                  />
                )}
                source={{
                  cache: false,
                  uri: `${PDF_OFERTA_URL}?id=${user?.data?.uid}&lang=${
                    storage.getString('lang') || 'uz'
                  }&download=0`,
                  method: 'GET',
                }}
                onLoadComplete={(numberOfPages: number) => {
                  setLoading(false);
                  // So'rov: checkbox `page===allPage`да yoqiladi. Ilgari `allPage` FAQAT
                  // onPageChanged'дан kelardi — u esa BIRINCHI sahifада (yoki 1-sahifали
                  // PDF'да) ishga tushmasligi mumkin → allPage=0 → checkbox HECH QACHON
                  // yoqilmaydi → tasdiqlab bo'lmaydi. Endi yuklanganда umumiy sahifa
                  // soni to'g'ridan-to'g'ri o'rnatiladi (ishonchli gate).
                  if (numberOfPages > 0) {
                    setAllPage(numberOfPages);
                  }
                }}
                onPageChanged={(p, allpage) => {
                  setPage(p);
                  // SS5: eng uzoq borilgan sahifa yig'iladi.
                  setMaxPage(m => Math.max(m, p));
                  if (allpage > 0) {
                    setAllPage(allpage);
                  }
                }}
                style={styles.pdf}
              />
            )}
            <View style={styles.footer}>
              {/* So'rov: oferta TASDIQLASH ishlashi kerak. IKKI muammo bor edi:
                  (1) checkbox `page===allPage` gate'ига bog'liq edi — react-native-pdf
                  paginatsiyasida ISHONCHSIZ → hech qachon yoqilmasdi;
                  (2) CheckBox `TouchableWithoutFeedback` ichида edi — Androidда wrapper
                  bosishни "yutardi", native checkbox toggle bo'lmasdi.
                  YECHIM: butun qator TouchableOpacity — bosilса roziliкни toggle qiladi;
                  CheckBox esa FAQAT ko'rsatish uchun (pointerEvents:none). PDF xato
                  bo'lса (pdfErr) — roziliк belgilanmaydi. */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (pdfErr) return;
                  if (needRead) {
                    warnRead();
                    return;
                  }
                  setCheck(c => !c);
                }}
              >
                <View style={styles.checkRow} pointerEvents="none">
                  <CheckBox
                    value={check}
                    tintColor={rd.color.border}
                    onTintColor={rd.color.primary}
                    tintColors={{
                      true: rd.color.primary,
                      false: rd.color.textTertiary,
                    }}
                    boxType="square"
                    style={styles.checkbox}
                  />
                  <Text style={styles.checkText} allowFontScaling={false}>
                    {t('ofertaaa')}
                  </Text>
                </View>
              </TouchableOpacity>
              {/* SS5: qancha qolganini ko'rsatamiz — aks holda darvoza
                  sababsiz to'siq bo'lib ko'rinardi. */}
              {needRead && (
                <Text style={styles.readHint} allowFontScaling={false}>
                  {`${t('Oxirigacha o‘qing')}: ${Math.min(maxPage, allPage)} / ${allPage}`}
                </Text>
              )}
              {/* SS5: tugma BOSILADI (disabled emas) — aks holda sababini
                  tushuntiruvchi ogohlantirish umuman chiqmasdi. */}
              <TouchableOpacity
                onPress={() => {
                  if (needRead || !check) {
                    warnRead();
                    return;
                  }
                  onClose();
                }}
                activeOpacity={0.85}
                style={[
                  styles.btn,
                  {
                    backgroundColor: check
                      ? rd.color.primary
                      : rd.color.textTertiary,
                  },
                  check ? styles.btnActiveShadow : null,
                ]}
              >
                <Text style={styles.btnText} allowFontScaling={false}>
                  {t('93')}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

export default ContractModal;

const styles = StyleSheet.create({
  main: {
    backgroundColor: rd.color.surface,
    width: width,
    height: height,
    alignSelf: 'center',
    paddingHorizontal: rs(16),
    paddingTop: rs(8),
  },
  // So'rov SS5: Pdf uchun aniq o'lcham — ilgari `styles.pdf` UNDEFINED edi,
  // shu bois PDF 0-balandlikда ("ko'rinmayapti") render bo'lishi mumkin edi.
  pdf: {
    flex: 1,
    width: '100%',
    backgroundColor: rd.color.surface,
  },
  indicator: {
    flex: 1,
    justifyContent: 'center',
  },
  errBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(24),
  },
  errText: {
    fontFamily: rd.font.medium,
    fontSize: rs(14.5),
    lineHeight: rs(21),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginBottom: rs(18),
  },
  retryBtn: {
    paddingHorizontal: rs(24),
    paddingVertical: rs(12),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
  },
  retryText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14.5),
    color: rd.color.onPrimary,
  },
  footer: {
    backgroundColor: rd.color.surface,
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
    paddingTop: rs(8),
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rs(10),
  },
  checkbox: {
    height: rs(20),
    width: rs(20),
  },
  readHint: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: '#b45309',
    marginTop: rs(6),
    marginLeft: rs(4),
  },
  checkText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginLeft: rs(10),
    maxWidth: '90%',
  },
  btn: {
    height: rs(52),
    paddingHorizontal: rs(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rd.radius.lg,
    alignSelf: 'center',
    width: '100%',
    marginBottom: rs(40),
  },
  btnActiveShadow: {
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  btnText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.onPrimary,
  },
});
