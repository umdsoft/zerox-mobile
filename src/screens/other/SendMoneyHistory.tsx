import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import OtherHeader from '../components/OtherHeader';
import { BackGroundIcon } from '../../helper/homeIcon';
import { normalize, style } from '../../theme/style';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import TopTabBarSendMoney from '../../navigation/TopTabBarSendMoney';
import { useFetch } from '../../hooks/useFetch';
import Loading from '../components/Loading';
import { URL, renderHTMLS } from '../constants';
import PdfIcon from '../../images/pdf';
import { sortText } from '../components/StatisticCard';

import Transfer from '../../images/Transfer';
import Transfer2 from '../../images/Transfer2';
import { Modal } from 'react-native-paper';
import Cancel from '../../images/Cancel';
import CancelTransfer from '../../images/cancel_transfer';
import Success from '../../images/Success';
import LottieView from 'lottie-react-native';
import { generatePDF } from 'react-native-html-to-pdf';

import Money from '../../images/Money';
import FileViewer from 'react-native-file-viewer';
import { settingDate } from '../../helper';
import { t } from 'i18next';
import TransText from '../components/TransText';
import ReactNativeBlobUtil from 'react-native-blob-util';

import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
const TopTab = createMaterialTopTabNavigator();
const { width, height } = Dimensions.get('screen');
const SendMoneyHistory = () => {
  let modalRef = useRef(null);

  //type 2 kirim 1 bulsa chiqim

  const openModal = useCallback((item: any, type: any) => {
    modalRef?.open(true, item, type);
  }, []);
  const closeModal = useCallback(() => {
    console.log('close');
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.backgroundImage}>
        <BackGroundIcon width="100%" height="100%" />
      </View>

      <OtherHeader title={t('582')} />

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
    console.log(userType, 'userType');
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
            {t('602')}
          </Text>
        );
    }
  };

  const renderIcon = (iconType: any) => {
    switch (iconType) {
      case 4:
        return (
          <Money width={normalize(16)} color={'#fff'} height={normalize(16)} />
        );
      case 5:
        return (
          <Money width={normalize(16)} color={'#fff'} height={normalize(16)} />
        );

      case 1:
        return (
          <Transfer2
            width={normalize(16)}
            color={'#fff'}
            height={normalize(16)}
          />
        );

      default:
        return (
          <Transfer
            width={normalize(16)}
            color={'#fff'}
            height={normalize(16)}
          />
        );
    }
  };

  return (
    <TouchableOpacity
      onPress={() => {
        openModal(item, type);
      }}
      style={styles.card}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.icon}>{renderIcon(item.type)}</View>
        <View style={{ flex: 1 }}>
          {mainInfo(item.type)}
          <View style={styles.uzs}>
            <Text
              allowFontScaling={false}
              style={[styles.number(type), { color: '#000' }]}
            >
              {settingDate(item?.created_at)} {item?.time?.slice(0, 5)}
            </Text>
            <Text allowFontScaling={false} style={styles.number(type)}>
              {type === 2 ? ' + ' : ' - '}
              {sortText(item?.amount)} UZS
            </Text>
          </View>
        </View>
      </View>
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

  console.log(data.data?.length, 'data.data');
  return (
    <View style={[styles.container]}>
      <FlatList
        contentContainerStyle={styles.flat}
        data={data.data}
        keyExtractor={({ id }) =>
          `${Math.round(Math.random) * 10000}` + id?.toString()
        }
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LottieView
              autoPlay
              source={require('../../images/not-found.json')}
              style={{
                width: normalize(200),
                height: normalize(200),
                marginTop: 40,
              }}
            />
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
  console.log(JSON.stringify(data.data, null, 2), 'data.data');
  return (
    <View style={styles.container}>
      <FlatList
        data={data.data}
        contentContainerStyle={styles.flat}
        keyExtractor={({ id }) => id?.toString()}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LottieView
              autoPlay
              source={require('../../images/not-found.json')}
              style={{
                width: normalize(200),
                height: normalize(200),
                marginTop: 40,
              }}
            />
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
                style={[styles.info, { color: style.blue }]}
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

      console.log('File saved as:', filePath);

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
        return t('602');
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
          {data?.type === 5 ? (
            <CancelTransfer
              width={normalize(50)}
              color={'#fff'}
              height={normalize(50)}
            />
          ) : (
            <Success
              width={normalize(50)}
              color={'#47bb78'}
              height={normalize(50)}
            />
          )}
          {/* {data.type === 1 ? ( */}
          <Text
            allowFontScaling={false}
            style={[styles.sum, { color: data.type === 5 ? 'red' : '#47bb78' }]}
          >
            {sortText(data?.amount)} UZS
          </Text>
          {/* ) : null} */}
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
              style={[styles.info, { color: '#fff', marginLeft: 4 }]}
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
    backgroundColor: '#f1f2f5',
  },

  mainInside: {
    marginTop: normalize(8),
  },
  btn: {
    position: 'absolute',
    // backgroundColor: 'red',
    right: 0,
  },
  sum: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    color: style.MoneyColor,
    marginTop: 5,
  },
  downloadButton: {
    backgroundColor: style.blue,
    width: '60%',
    paddingVertical: normalize(10),
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: normalize(15),
  },
  info: {
    marginTop: normalize(3),
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx - 1,
    color: '#000',
  },
  main: {
    marginTop: normalize(10),
  },
  infoTitle: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx - 2,
    color: '#000',
    opacity: 0.5,
  },
  title: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    color: '#000',
    textAlign: 'center',
  },
  iconSuccess: {
    alignSelf: 'center',
    marginTop: normalize(15),
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    height: style.height / 3,
    width: '100%',
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
    marginTop:
      Platform.OS === 'ios'
        ? (normalize(height) - normalize(340)) / 4.2
        : (normalize(height) - normalize(340)) / 4.2,
    marginLeft: (width - (width - normalize(40))) / 2,
    padding: 15,
    height: normalize(400),
  },
  modalCotainer: {
    width: '100%',
    // height: normalize(400),
    // height: normalize(400),
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: normalize(10),
  },
  number2: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx - 2,
    color: '#000',
  },
  topbar: { flex: 1, marginTop: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10,
  },
  icon: {
    backgroundColor: style.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  uzs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  flat: {
    width: '90%',
    alignSelf: 'center',
    paddingBottom: normalize(25),
  },
  name: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx - 2,
    color: '#000',
  },
  number: (type: number) => {
    return {
      color: type === 2 ? '#47bb78' : 'red',
      fontFamily: style.fontFamilyMedium,
      fontSize: style.fontSize.xx - 2,
    };
  },
});
