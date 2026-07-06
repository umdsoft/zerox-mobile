import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import React, { useCallback, useState } from 'react';
import { Modal } from 'react-native-paper';
import { rd, rs } from '../../../theme/rd';
import { useDispatch, useSelector } from 'react-redux';
import { contractModalShow } from '../../../store/reducers/HomeReducer';

import Pdf from 'react-native-pdf';
import axios from 'axios';
import { URL } from '../../constants';
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

  const onClose = useCallback(async () => {
    if (page === allPage) {
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
  }, [allPage, page, t]);

  return (
    <Modal visible={contract} dismissable={false}>
      <View style={styles.main}>
        {loading ? (
          <Loading />
        ) : (
          <>
            <Pdf
              trustAllCerts={false}
              enablePaging={true}
              onError={error => {
                console.warn(error);
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
                uri: `https://pdf.zerox.uz/oferta.php?id=${
                  user?.data?.uid
                }&lang=${storage.getString('lang')}&download=0`,
                method: 'GET',
              }}
              onLoadComplete={() => {
                setLoading(false);
              }}
              onPageChanged={(page, allpage) => {
                setPage(page);
                setAllPage(allpage);
                setCheck(false);
              }}
              style={styles.pdf}
            />
            <View style={styles.footer}>
              <TouchableWithoutFeedback
                onPress={() => {
                  if (page !== allPage) {
                    Toast.show({
                      autoHide: true,
                      position: 'bottom',
                      props: {
                        desc: t('tanishdim'),
                      },
                      type: 'error2',
                      visibilityTime: 3000,
                    });
                  }
                }}
              >
                <View style={styles.checkRow}>
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
                    disabled={page !== allPage ? true : false}
                    onValueChange={() => {
                      if (page === allPage) {
                        setCheck(!check);
                      }
                    }}
                  />
                  <Text style={styles.checkText} allowFontScaling={false}>
                    {t('ofertaaa')}
                  </Text>
                </View>
              </TouchableWithoutFeedback>
              <TouchableOpacity
                disabled={check ? false : true}
                onPress={onClose}
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
  indicator: {
    flex: 1,
    justifyContent: 'center',
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
