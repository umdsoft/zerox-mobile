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
import { style } from '../../../theme/style';
import { useDispatch, useSelector } from 'react-redux';
import { contractModalShow } from '../../../store/reducers/HomeReducer';

import Pdf from 'react-native-pdf';
import axios from 'axios';
import { URL } from '../../constants';
import { storage } from '../../../store/api/token/getToken';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import Loading from '../../components/Loading';
import CheckBox from '@react-native-community/checkbox';
import { fontSize } from '../../../theme/font';
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
            headers: { Authorization: `Bearer ${token}`, Connection: 'close' },
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
                  color={style.blue}
                  style={{ flex: 1, justifyContent: 'center' }}
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
            <View style={{ backgroundColor: '#fff' }}>
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
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                  }}
                >
                  <CheckBox
                    value={check}
                    tintColor={'#DBDBDB'}
                    onTintColor={style.blue}
                    tintColors={{
                      true: style.blue,
                      false: style.disabledButtonColor,
                    }}
                    boxType="square"
                    style={{ height: 20, width: 20 }}
                    disabled={page !== allPage ? true : false}
                    onValueChange={() => {
                      if (page === allPage) {
                        setCheck(!check);
                      }
                    }}
                  />
                  <Text style={styles.teext} allowFontScaling={false}>
                    {t('ofertaaa')}
                  </Text>
                </View>
              </TouchableWithoutFeedback>
              <TouchableOpacity
                disabled={check ? false : true}
                onPress={onClose}
                style={[
                  styles.btn,
                  {
                    backgroundColor: check
                      ? style.blue
                      : style.disabledButtonColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.teext,
                    { color: 'white', paddingHorizontal: 10, marginLeft: 0 },
                  ]}
                  allowFontScaling={false}
                >
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
    backgroundColor: '#fff',
    width: width,
    height: height,
    alignSelf: 'center',
    padding: 10,
  },
  btn: {
    // position: 'absolute',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: style.blue,
    borderRadius: 12,
    bottom: 0,
    alignSelf: 'center',
    marginBottom: 50,
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  teext: {
    fontFamily: style.fontFamilyMedium,
    fontSize: fontSize[13],
    color: style.blue,
    marginLeft: 10,
    maxWidth: '90%',
  },
});
