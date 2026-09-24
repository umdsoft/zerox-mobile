import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import RdHeader from '../home/redesign/RdHeader';
import { ArrowDownLeft, ArrowUpRight } from '../home/redesign/icons';
import { rd, rs } from '../../theme/rd';
import { normalize } from '../../theme/style';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import TopTabBarSendMoney from '../../navigation/TopTabBarSendMoney';
import { useFetch } from '../../hooks/useFetch';
import Loading from '../components/Loading';
import { URL, renderHTMLS } from '../constants';
import PdfIcon from '../../images/pdf';
import { sortText } from '../components/StatisticCard';

import { Modal } from 'react-native-paper';
import Cancel from '../../images/Cancel';
import CancelTransfer from '../../images/cancel_transfer';
import Success from '../../images/Success';
import { generatePDF } from 'react-native-html-to-pdf';

import FileViewer from 'react-native-file-viewer';
import { settingDate } from '../../helper';
import { t } from 'i18next';
import TransText from '../components/TransText';
import ReactNativeBlobUtil from 'react-native-blob-util';

import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
const TopTab = createMaterialTopTabNavigator();
const { width, height } = Dimensions.get('screen');

// type=4 (mobil hisob amaliyoti) — `pay` bo'yicha ajratiladi (so'rov SS12/14):
//   pay='Balance'    -> tarif balansdan sotib olindi (chiqim)
//   pay='BalanceSms' -> SMS paket balansdan sotib olindi (chiqim)
//   aks holda        -> "Mobil hisobni to'ldirish" (kirim, t('602'))
const isType4Tariff = (item: any) =>
  ['Balance', 'BalanceSms'].includes(String(item?.pay || ''));
// Ro'yxat yorlig'i (Kirim-chiqim satrida).
const type4ListLabel = (item: any) => {
  const pay = String(item?.pay || '');
  if (pay === 'Balance') return t('Yangi tarifga ulanish');
  if (pay === 'BalanceSms') return t('SMS paket xarid qilish');
  return t('602');
};
// Modal sarlavhasi (tafsilot oynasida).
const type4Title = (item: any) => {
  const pay = String(item?.pay || '');
  if (pay === 'Balance') return t('Tarifga ulanish');
  if (pay === 'BalanceSms') return t('SMS paket xaridi');
  return t('602');
};
const SendMoneyHistory = () => {
  let modalRef = useRef(null);

  //type 2 kirim 1 bulsa chiqim

  const openModal = useCallback((item: any, type: any) => {
    modalRef?.open(true, item, type);
  }, []);
  const closeModal = useCallback(() => {
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <RdHeader title={t('582')} />

      <View style={styles.topbar}>
        <TopTab.Navigator tabBar={props => <TopTabBarSendMoney {...props} />}>
          <TopTab.Screen
            name="Enter"
            component={() => (
              <Enter openModal={openModal} closeModal={closeModal} />
            )}
            options={{ title: t('585') }}
          />
          <TopTab.Screen
            name="Exit"
            component={() => (
              <Exit openModal={openModal} closeModal={closeModal} />
            )}
            options={{ title: t('588') }}
          />
        </TopTab.Navigator>
      </View>
      <ShowDetailsModal
        getRef={(props: React.MutableRefObject<null>) => (modalRef = props)}
      />
    </View>
  );
};
const ListStatistic = ({ item, index, type, openModal }) => {
  const la = useTranslation();

  const mainInfo = (userType: any) => {
    switch (userType) {
      case 3:
        return (
          <TransText
            tKey={Number(type) === 2 ? 600 : 597}
            values={{
              name: la[1].language === 'ru' ? `(${item?.dname})` : item?.dname,
            }}
            components={{
              name: <Text allowFontScaling={false} style={styles.name} />,
            }}
          />
          // <Text style={styles.number2}>
          //   {item?.dname}
          //   {Number(type) === 2 ? `\n${t('591')}` : `\n${t('588')}`}
          // </Text>
        );
      case 2:
        return (
          <TransText
            tKey={Number(type) === 2 ? 600 : 597}
            values={{
              name: la[1].language === 'ru' ? `(${item?.dname})` : item?.dname,
            }}
            components={{
              name: <Text allowFontScaling={false} style={styles.name} />,
            }}
          />
          // <Text style={styles.name}>
          //   {item?.dname}
          //   {'\n'}
          //   {Number(type) === 2 ? `\n${t('600')}` : `\n${t('597')}`}
          // </Text>
        );
      case 5:
        return (
          <Text allowFontScaling={false} style={styles.number2}>
            {t('876')}
          </Text>
        );

      case 1:
        return (
          <TransText
            tKey={594}
            values={{
              id: item?.number,
            }}
            components={{
              id: <Text allowFontScaling={false} style={styles.number2} />,
            }}
          />
          // <Text style={styles.number2}>

          //   {item?.number + '-sonli qarz shartnomasi uchun'}
          // </Text>
        );
      // shurni bir tekshrish grak
      case 4:
        return (
          <Text allowFontScaling={false} style={styles.number2}>
            {type4ListLabel(item)}
          </Text>
        );
    }
  };

  const incoming = type === 2;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        openModal(item, type);
      }}
      style={styles.card}
    >
      <View
        style={[
          styles.icon,
          { backgroundColor: incoming ? rd.color.successBg : rd.color.errorBg },
        ]}
      >
        {incoming ? (
          <ArrowDownLeft size={rs(20)} color={rd.color.success} />
        ) : (
          <ArrowUpRight size={rs(20)} color={rd.color.error} />
        )}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardName}>{mainInfo(item.type)}</View>
        <Text allowFontScaling={false} style={styles.cardSub}>
          {settingDate(item?.created_at)} {item?.time?.slice(0, 5)}
        </Text>
      </View>
      <Text
        allowFontScaling={false}
        style={[
          styles.cardAmount,
          { color: incoming ? rd.color.success : rd.color.error },
        ]}
      >
        {incoming ? '+ ' : '- '}
        {sortText(item?.amount)} UZS
      </Text>
    </TouchableOpacity>
  );
};

const Enter = ({ openModal, closeModal }) => {
  const { data, error, loading } = useFetch({
    method: 'GET',
    url: URL + '/home/cs?status=0',
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={[styles.container]}>
      <FlatList
        contentContainerStyle={styles.flat}
        data={data.data}
        keyExtractor={({ id }) =>
          `${Math.round(Math.random) * 10000}` + id?.toString()
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text allowFontScaling={false} style={styles.emptyText}>
              {t('mavjud')}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <ListStatistic
            item={item}
            index={index}
            type={2}
            openModal={openModal}
          />
        )}
      />
    </View>
  );
};

const Exit = ({ openModal, closeModal }) => {
  const { data, error, loading } = useFetch({
    method: 'GET',
    url: URL + '/home/cs?status=1',
  });
  if (loading) {
    return <Loading />;
  }
  return (
    <View style={styles.container}>
      <FlatList
        data={data.data}
        contentContainerStyle={styles.flat}
        keyExtractor={({ id }) => id?.toString()}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text allowFontScaling={false} style={styles.emptyText}>
              {t('mavjud')}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <ListStatistic
            item={item}
            index={index}
            type={1}
            openModal={openModal}
          />
        )}
      />
    </View>
  );
};

const ShowDetailsModal = ({ getRef }) => {
  const vv = useTranslation();
  const navigation = useNavigation();
  const [show, setShow] = useState(false);
  const [data, setData] = useState({});
  const [type, setType] = useState(null);
  useEffect(() => {
    let ref = {
      open: (
        isOpen: boolean | ((prevState: boolean) => boolean),
        item: React.SetStateAction<{}>,
        typex: React.SetStateAction<null>,
      ) => {
        setShow(isOpen);
        setData(item);
        setType(typex);
      },
    };
    getRef(ref);
  }, [getRef]);

  const onDismiss = useCallback(() => {
    setShow(false);
  }, []);

  // eslint-disable-next-line react/no-unstable-nested-components
  const RenderInfo = (type: any) => {
    switch (type) {
      case 3: {
        return (
          <>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('645')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {data?.dname}
              </Text>
            </View>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('648')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {data?.cname}
              </Text>
            </View>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('651')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {sortText(data.amount)} UZS
              </Text>
            </View>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('336')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {settingDate(data?.created_at)}
                {'    '}
                {data?.time?.slice(0, 5)}
              </Text>
            </View>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('120')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {data?.id}
              </Text>
            </View>
          </>
        );
      }

      case 2: {
        return (
          <>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('645')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {data?.cname}
              </Text>
            </View>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('648')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {data?.dname}
              </Text>
            </View>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('651')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {sortText(data.amount)} UZS
              </Text>
            </View>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('336')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {settingDate(data?.created_at)}
                {'    '}
                {data?.time?.slice(0, 5)}
              </Text>
            </View>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('120')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {data?.id}
              </Text>
            </View>
          </>
        );
      }

      case 1: {
        return (
          <>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('657')}
              </Text>
              <Text allowFontScaling={false} style={[styles.info]}>
                {data?.dname}
              </Text>
            </View>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('660')}
              </Text>
              <Text
                allowFontScaling={false}
                onPress={() => {
                  navigation.navigate('DownloadStatistic', {
                    item: data,
                    id: data.id,
                  });
                }}
                style={[styles.info, { color: rd.color.primary }]}
              >
                {data?.number}
              </Text>
            </View>

            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('663')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {sortText(data.amount)} UZS
              </Text>
            </View>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('336')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {settingDate(data?.created_at)}
                {'    '}
                {data?.time?.slice(0, 5)}
              </Text>
            </View>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('idNumber')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {data?.id}
              </Text>
            </View>
          </>
        );
      }
      case 5: {
        return (
          <>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('657')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {data?.dname}
              </Text>
            </View>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('876')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {sortText(data.amount)} UZS
              </Text>
            </View>

            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('336')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {settingDate(data?.created_at)}
                {'    '}
                {data?.time?.slice(0, 5)}
              </Text>
            </View>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('idNumber')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {data?.id}
              </Text>
            </View>
          </>
        );
      }
      case 4: {
        return (
          <>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('657')}
              </Text>
              <Text allowFontScaling={false} style={[styles.info]}>
                {data?.dname}
              </Text>
            </View>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {/* Tarif/SMS xaridida "O'tkazma summasi" -> "Summa" (so'rov SS14.2). */}
                {isType4Tariff(data) ? t('Summa') : t('651')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {sortText(data.amount)} UZS
              </Text>
            </View>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('336')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {settingDate(data?.created_at)}
                {'    '}
                {data?.time?.slice(0, 5)}
              </Text>
            </View>
            <View style={styles.mainInside}>
              <Text allowFontScaling={false} style={styles.infoTitle}>
                {t('idNumber')}
              </Text>
              <Text allowFontScaling={false} style={styles.info}>
                {data?.id}
              </Text>
            </View>
          </>
        );
      }
    }
  };

  const onDownload = useCallback(async () => {
    const renderText = (type: any) => {
      function renderLang(lang: string, type: number) {
        switch (type) {
          case 2:
            return lang === 'uz'
              ? `O‘tkazma_${String(data?.id)}`
              : lang === 'kr'
              ? `Ўтказма_${String(data?.id)}`
              : `Перевод_${String(data?.id)}`;
          case 3:
            return lang === 'uz'
              ? `O‘tkazma_${String(data?.id)}`
              : lang === 'kr'
              ? `Ўтказма_${String(data?.id)}`
              : `Перевод_${String(data?.id)}`;
          case 4:
            return lang === 'uz'
              ? `Hisobni to‘ldirish_${String(data?.id)}`
              : lang === 'kr'
              ? `Хисобни тўлдириш_${String(data?.id)}`
              : `Пополнение счет_${String(data?.id)}`;
          case 5:
            return lang === 'uz'
              ? `Bekor_qilingan_to‘lov_${String(data?.id)}`
              : lang === 'kr'
              ? `Бекор қилинган тўлов_${String(data?.id)}`
              : `Отмененный платеж_${String(data?.id)}`;
          default:
            return lang === 'uz'
              ? `Komissiya_${String(data?.id)}`
              : lang === 'kr'
              ? `Комиссия_${String(data?.id)}`
              : `Комиссия_${String(data?.id)}`;
        }
      }
      switch (type) {
        case 2:
          return renderLang(vv[1].language, 2);
        case 3:
          return renderLang(vv[1].language, 3);
        case 4:
          return renderLang(vv[1].language, 4);
        case 5:
          return renderLang(vv[1].language, 5);
        default:
          return renderLang(vv[1].language, 1);
      }
    };

    try {
      let baseFileName = renderText(data.type);
      let directory = '/storage/emulated/0/Download/Zerox/';
      let fileExtension = '.pdf';

      // Function to get the next available filename
      async function getAvailableFileName(baseName, ext) {
        let index = 1;
        let newFileName = `${baseName}${ext}`;

        while (await ReactNativeBlobUtil.fs.exists(directory + newFileName)) {
          newFileName = `${baseName}(${index})${ext}`;
          index++;
        }

        return newFileName;
      }

      // Get the next available file name
      let fileName = await getAvailableFileName(baseFileName, fileExtension);

      // Generate PDF
      let file = await generatePDF({
        fileName: fileName.replace(fileExtension, ''), // Remove extension for RNHTMLtoPDF
        html: renderHTMLS(data)!,
        directory: 'docs',
        width: 200,
        base64: true,
      });

      let filePath =
        Platform.OS === 'android' ? `${directory}${fileName}` : file.filePath;

      // Write file
      if (Platform.OS === 'android') {
        await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
          {
            name: fileName,
            parentFolder: 'Zerox',
            mimeType: 'application/pdf',
          },
          'Download',
          file.filePath!,
        );
      } else {
        await ReactNativeBlobUtil.fs.writeFile(
          filePath!,
          file.base64!,
          'base64',
        );
      }


      // Open file
      await FileViewer.open(`file://${filePath}`);
    } catch (error) {
      // Alert.alert('Error', JSON.stringify(error));
      console.error('Error generating or opening PDF:', error);
    }

    // try {
    //   let file = await RNHTMLtoPDF.convert({
    //     fileName: renderText(data.type),
    //     html: renderHTMLS(data)!,
    //     directory: 'docs',
    //     width: 200,
    //     base64: true,
    //   });

    //   let url =
    //     Platform.OS === 'android'
    //       ? `/storage/emulated/0/download/${renderText(data.type)}.pdf`
    //       : file.filePath;
    //   ReactNativeBlobUtil.fs.exists(url!).then(exist => {
    //     if (exist) {
    //       ReactNativeBlobUtil.fs.unlink(url!).then(() => {
    //         console.log('file deleted');
    //       });
    //     }

    //     ReactNativeBlobUtil.fs
    //       .writeFile(url!, file.base64!, 'base64')
    //       .then(val => {
    //         console.log(val);
    //         console.log('File written');
    //         // return ReactNativeBlobUtil.fs.unlink(file.filePath!);
    //       })
    //       .catch(error => {
    //         Alert.alert('Error', JSON.stringify(error));
    //       });
    //   });
    //   await FileViewer.open(`file://${file.filePath}`);
    // } catch (error) {
    //   throw error;
    // }
  }, [data, vv]);

  const RenderText = (type: number) => {
    switch (type?.type) {
      case 2:
        return t('642');
      case 3:
        return t('642');
      case 4:
        return type4Title(data); // tarif/SMS balansdan -> "Tarifga ulanish"/"SMS paket xaridi"
      case 1:
        return t('654');
      case 5:
        return t('876');
      default:
        return t('654');
    }
  };

  return (
    <Modal
      dismissable={true}
      onDismiss={onDismiss}
      visible={show}
      style={styles.modal}
    >
      <View style={styles.modalCotainer}>
        <View style={styles.modalHeader}>
          <View style={{ width: '90%' }}>
            <Text style={styles.title}>
              <RenderText type={data.type} />
            </Text>
          </View>
          <TouchableOpacity style={styles.btn} onPress={onDismiss}>
            <Cancel width={normalize(20)} height={normalize(20)} />
          </TouchableOpacity>
        </View>

        <View style={styles.iconSuccess}>
          {/* Rangли doira-badge ichida holat ikonasi (zamonaviy success/cancel). */}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: (data.type === 5 ? rd.color.error : rd.color.success) + '18' },
            ]}
          >
            {data?.type === 5 ? (
              <CancelTransfer width={normalize(44)} color={rd.color.error} height={normalize(44)} />
            ) : (
              <Success width={normalize(44)} color={rd.color.success} height={normalize(44)} />
            )}
          </View>
          <Text
            allowFontScaling={false}
            style={[styles.sum, { color: data.type === 5 ? rd.color.error : rd.color.success }]}
          >
            {sortText(data?.amount)} UZS
          </Text>
        </View>
        <View style={styles.main}>
          {/* <RenderInfo type={data.type} /> */}
          {RenderInfo(data.type)}
        </View>
        <View>
          <TouchableOpacity onPress={onDownload} style={styles.downloadButton}>
            <PdfIcon width={normalize(15)} height={normalize(15)} />
            <Text
              allowFontScaling={false}
              style={[styles.info, { color: rd.color.onPrimary, marginLeft: 4 }]}
            >
              {t('download')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SendMoneyHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: rd.color.page,
  },

  mainInside: {
    marginTop: normalize(8),
  },
  btn: {
    position: 'absolute',
    // backgroundColor: 'red',
    right: 0,
  },
  // Holat ikonasi doira-badge (zamonaviy success/cancel ko'rinishi).
  statusBadge: {
    width: normalize(76),
    height: normalize(76),
    borderRadius: normalize(38),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sum: {
    fontFamily: rd.font.bold,
    fontSize: rs(22),
    color: rd.color.success,
    marginTop: normalize(12),
  },
  downloadButton: {
    backgroundColor: rd.color.primary,
    width: '100%',
    paddingVertical: normalize(13),
    borderRadius: rd.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: normalize(18),
  },
  info: {
    marginTop: normalize(3),
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
  },
  main: {
    marginTop: normalize(10),
  },
  infoTitle: {
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.text,
    opacity: 0.5,
  },
  title: {
    fontFamily: rd.font.medium,
    fontSize: rs(16),
    color: rd.color.text,
    textAlign: 'center',
  },
  iconSuccess: {
    alignSelf: 'center',
    marginTop: normalize(15),
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: rs(80),
  },
  emptyText: {
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.textTertiary,
  },
  modalHeader: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    alignItems: 'center',
  },
  modal: {
    // backgroundColor: '#fff',
    borderRadius: 12,
    width: width - normalize(40),
    alignSelf: 'center',
    marginLeft: (width - (width - normalize(40))) / 2,
    padding: 15,
    // Qattiq height: normalize(400) OLIB TASHLANDI — redizayndan so'ng kontent
    // balandroq bo'lib, "Yuklab olish" tugmasi 400px chegaradan pastга tushib
    // KESILARDI. Endi modal kontentга moslashadi (auto), maxHeight faqat juda
    // kichik ekranда oshib ketmasligi uchun. react-native-paper Modal o'zi
    // vertikal markazlashtiradi (marginTop kerak emas).
    maxHeight: height - normalize(120),
  },
  modalCotainer: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: normalize(24),
    padding: normalize(18),
  },
  number2: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.text,
  },
  topbar: { flex: 1, marginTop: rs(6) },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    paddingVertical: rs(12),
    paddingHorizontal: rs(14),
    marginTop: rs(10),
  },
  cardBody: {
    flex: 1,
    marginLeft: rs(12),
  },
  cardName: {
    marginBottom: rs(4),
  },
  cardSub: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
  },
  cardAmount: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    marginLeft: rs(8),
  },
  icon: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  flat: {
    paddingHorizontal: rs(16),
    paddingBottom: rs(24),
    flexGrow: 1,
  },
  name: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.text,
  },
});
