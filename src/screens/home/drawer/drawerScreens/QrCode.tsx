import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Platform,
  Button,
  Image,
  ScrollView,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackGroundIcon } from '../../../../helper/homeIcon';
import { style } from '../../../../theme/style';

import QRCode from 'react-native-qrcode-svg';
import ShareIcon from '../../../../images/home/share.svg';
import DownloadIcon from '../../../../images/home/download.svg';
import { useSelector } from 'react-redux';
import { generatePDF } from 'react-native-html-to-pdf';

import Share from 'react-native-share';
import FileViewer from 'react-native-file-viewer';
import universalStyle from '../../../../theme/universalStyle';
import OtherHeader from '../../../components/OtherHeader';

import MainText from '../../../components/MainText';
import { font, fontSize } from '../../../../theme/font';
import { colors } from '../../../../theme/colors';
import { t } from 'i18next';
import {
  checkMultiple,
  PERMISSIONS,
  requestMultiple,
  RESULTS,
} from 'react-native-permissions';
import RNBlobUtil from 'react-native-blob-util';

import RNFS from 'react-native-fs';
import ViewShot from 'react-native-view-shot';

// https://www.npmjs.com/package/node-html-to-image

const QrCode = () => {
  const viewShootRef = useRef(null);
  const { user } = useSelector(state => state.HomeReducer);

  const [item, setItem] = useState(
    `https://zerox.uz/user?id=${user?.data?.uid}`,
  );

  const [productQRref, setProductQRref] = useState();

  const generateQR = async image => {
    productQRref.toDataURL(async data => {
      try {
        let options = {
          html: `
          <div style="width: 600px; height: 750px; margin: 120px auto; display: flex;flex-direction: column;justify-content: center;align-items: center;">

              
                <img src="data:image/jpeg;base64,${image}" style="margin: 10px auto; width: 85%; " />
              
            
              
            <p style="font-size: 30px;color: black;font-family: Montserrat-Medium;;margin-top: 10px;text-align: center;">
              ${t('shior')}
            </p>
          </div>
        `,
          fileName: user?.data?.uid,
          base64: true,
          fonts: [
            '../../../../../assets/fonts/Montserrat-Medium.ttf',
            '../../../../../assets/fonts/Cambria.ttf',
          ],
        };

        // Generate PDF
        const file = await generatePDF(options);

        let baseFileName = user?.data?.uid;
        let fileExtension = 'pdf';
        let fileName = `${baseFileName}.${fileExtension}`;

        // Path for Downloads folder (Android) or Documents (iOS)
        const downloadDir =
          Platform.OS === 'android'
            ? RNBlobUtil.fs.dirs.DownloadDir
            : RNBlobUtil.fs.dirs.DocumentDir;

        let filePath = `${downloadDir}/${fileName}`;

        // Check if file exists and create unique name
        let counter = 0;
        while (await RNBlobUtil.fs.exists(filePath)) {
          counter++;
          fileName = `${baseFileName}(${counter}).${fileExtension}`;
          filePath = `${downloadDir}/${fileName}`;
        }

        // Copy the generated PDF into Downloads (or Documents on iOS)
        const destPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
        if (Platform.OS === 'android') {
          await RNBlobUtil.MediaCollection.copyToMediaStore(
            {
              name: fileName,
              parentFolder: 'Zerox',
              mimeType: 'application/pdf',
            },
            'Download',
            file.filePath!,
          );
        } else {
          await RNBlobUtil.fs.cp(file.filePath!, filePath);
          await RNFS.copyFile(filePath!, destPath);
        }
        console.log('File saved at:', filePath);

        await FileViewer.open(file.filePath!);

        // await Share.open({
        //   url: `file://${destPath}`,
        //   title: 'Share QR Code',
        //   message: 'Here is your QR code PDF',
        // });
        // await RNFS.unlink(destPath);
      } catch (error) {
        console.error('Error generating QR PDF:', error);
      }
    });
  };

  const onDownload = async () => {
    try {
      // request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE).then(wPer => {
      //   request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE).then(rPer => {
      //     if (wPer === RESULTS.GRANTED && rPer === RESULTS.GRANTED) {
      if (Platform.OS === 'ios') {
        // if (permission['ios.permission.PHOTO_LIBRARY'] === RESULTS.GRANTED) {
        viewShootRef.current.capture().then(uri => {
          generateQR(uri);
          console.log('Captured image URI:', uri);
        });
        // } else {
        //   Toast.show({
        //     autoHide: true,
        //     visibilityTime: 3000,
        //     position: 'bottom',
        //     type: 'error2',
        //     props: {title: 'Xatolik', desc: 'Permission Denied'},
        //   });
        // }
        return;
      }

      viewShootRef.current.capture().then(uri => {
        generateQR(uri);
        console.log('Captured image URI:', uri);
      });
      // } else {
      //   Toast.show({
      //     autoHide: true,
      //     visibilityTime: 3000,
      //     position: 'bottom',
      //     type: 'error2',
      //     props: {title: 'Xatolik', desc: 'Permission Denied'},
      //   });
      // }
      //   });
      // });

      //   let options = {
      //     html: `
      //   <div style="width: 600px; height: 750px; margin: 120px auto; display: flex;flex-direction: column;justify-content: center;align-items: center;">
      //     <div style="width: 430px;height: 700px;margin: 10% auto;display: flex;flex-direction: column;justify-content: center;align-items: center;background-color: #374151;padding: 25px;border-radius: 15px;">
      //       <div style="width: 400px;height: 700px;display: flex;flex-direction: column;justify-content: center;align-items: center;padding: 20px;border-radius: 15px;background-color: white;">
      //         <div style="width: 100%; display: flex; flex-direction: row;justify-content: center;align-items: center;">
      //           <span style="font-size: 80px;color: #3563B2;font-family:serif;">Zero</span>
      //           <span style="font-size: 80px;color: #EB494F;font-family:serif;">X</span>
      //         </div>
      //         <img src="data:image/jpeg;base64,${data}" style="margin: 10px auto; width: 85%; " />
      //         <p style=" font-size: 35px;color: black;font-family: Montserrat-Medium;margin-top: 10px;">ID raqami: ${
      //           user?.data?.uid
      //         }</p>
      //       </div>
      //       <p style="font-size: 35px;color: rgb(247, 247, 247);font-family: Montserrat-Medium; margin-top: 20px;text-align: center;">
      //         ${
      //           user.data.last_name +
      //           ' ' +
      //           user.data.first_name +
      //           ' ' +
      //           user.data.middle_name
      //         }
      //       </p>

      //     </div>
      //     <p style="font-size: 30px;color: black;font-family: Montserrat-Medium;;margin-top: 10px;text-align: center;">
      //       Qarz shartnomasini tez va oson rasmiylashtirish uchun ushbu QR-kodni ZeroX ilovasi yordamida skaynerlang va tegishli jarayonlarni amalga oshiring.
      //     </p>
      //   </div>
      // `,
      //     fileName: user?.data?.uid,
      //     directory: 'Documents',
      //     fonts: ['../../../../../assets/fonts/Montserrat-Medium.ttf'],
      //     base64: true,
      //   };

      // -------------------------   RASM holatida tuklash   -------------------------
      // let filePath = RNFS.CachesDirectoryPath + `/${user?.data?.uid}.png`;
      // RNFS.writeFile(filePath, data, 'base64')
      //   .then(async (response) => {
      //     FileViewer.open(filePath);
      //   })
    } catch (e) {
      console.error(e);
    }
  };

  const onShare = () => {
    viewShootRef.current.capture().then(uri => {
      productQRref.toDataURL(data => {
        const options = {
          html: `
          <div style="width: 600px; height: 750px; margin: 120px auto; display: flex;flex-direction: column;justify-content: center;align-items: center;">

              
                <img src="data:image/jpeg;base64,${uri}" style="margin: 10px auto; width: 85%; " />
              
            
              
            <p style="font-size: 30px;color: black;font-family: Montserrat-Medium;;margin-top: 10px;text-align: center;">
              ${t('shior')}
            </p>
          </div>
        `,
          fileName: user?.data?.uid,
          base64: true,
          fonts: [
            '../../../../../assets/fonts/Montserrat-Medium.ttf',
            '../../../../../assets/fonts/Cambria.ttf',
          ],
        };

        generatePDF(options)
          .then(async ({ filePath }) => {
            if (
              await RNFS.exists(
                `${RNFS.CachesDirectoryPath}/${user?.data?.uid}.pdf`,
              )
            ) {
              await RNFS.unlink(
                `${RNFS.CachesDirectoryPath}/${user?.data?.uid}.pdf`,
              );
            }

            const destPath = `${RNFS.CachesDirectoryPath}/${user?.data?.uid}.pdf`;
            await RNFS.copyFile(filePath!, destPath);

            await Share.open({
              url: `file://${destPath}`,
              title: 'Share QR Code',
              type: 'application/pdf',
            })
              .then(res => {
                console.log('Share is good', res);
              })
              .catch(async error => {
                await RNFS.unlink(destPath);
                console.log('Share is bad', error);
              });
            await RNFS.unlink(destPath);
          })
          .catch(error => {
            console.log('RNHTMLtoPDF', error.message);
          });
      });
    });
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      checkMultiple([
        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      ]).then(result => {
        if (
          result[PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE] ===
            RESULTS.GRANTED &&
          result[PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE] === RESULTS.GRANTED
        ) {
          console.log('Permission is granted');
        } else {
          requestMultiple([
            PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
            PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
          ]).then(result => {
            if (
              result[PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE] ===
                RESULTS.GRANTED &&
              result[PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE] ===
                RESULTS.GRANTED
            ) {
              console.log('Permission is granted');
            }
          });
        }
      });
    }
    // storage.delete('url');
    // storage.delete('url2');
  }, []);

  return (
    <View style={styles.container}>
      <View style={universalStyle.backimage}>
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={t('qrcode')} />
      <View style={styles.main}>
        <ScrollView>
          <View style={styles.aboutUsContainer}>
            <ViewShot
              ref={viewShootRef}
              // captureMode="mount"
              // onCapture={onCapture}
              options={{
                format: 'png',
                quality: 1,
                result: 'base64',
              }}
            >
              <View style={styles.darkBg}>
                <View style={[styles.row]}>
                  <View style={styles.logoBox}>
                    <Text allowFontScaling={false} style={styles.logoBoxA}>
                      Zero
                    </Text>
                    <Text allowFontScaling={false} style={styles.logoBoxB}>
                      X
                    </Text>
                  </View>
                  <View style={{ alignSelf: 'center' }}>
                    <QRCode
                      // ref={qrRef}
                      getRef={c => setProductQRref(c)}
                      // style={{marginBottom: 20}}
                      ecl="M"
                      color={'#0063b6'}
                      backgroundColor="#fff"
                      size={170}
                      logoBorderRadius={5}
                      logo={require('../../../../images/iconapp.jpg')}
                      value={item}
                    />
                  </View>
                  <Text
                    allowFontScaling={false}
                    style={{
                      color: 'black',
                      fontFamily: 'Montserrat-Medium',
                      marginTop: 15,
                      fontSize: 14,
                      textAlign: 'center',
                    }}
                  >
                    {t('idNumber')}: {user?.data.uid}
                  </Text>
                </View>

                <View style={styles.max}>
                  <MainText
                    textAlign={'center'}
                    color={colors.white}
                    style={styles.userName}
                    size={fontSize[14]}
                  >
                    {user?.data?.last_name +
                      ' ' +
                      user?.data?.first_name +
                      ' ' +
                      user.data.middle_name}
                  </MainText>
                </View>
              </View>
            </ViewShot>
            <Text
              allowFontScaling={false}
              style={{
                color: 'black',
                fontFamily: 'Montserrat-Medium',
                textAlign: 'center',
                marginTop: 15,
                fontSize: 14,
              }}
            >
              {t('123')}
            </Text>
            <View style={styles.buttons}>
              <TouchableOpacity
                onPress={() => onDownload()}
                style={styles.download}
              >
                <DownloadIcon width="20%" height="100%" />
                <MainText color={colors.white} size={fontSize[12]}>
                  {t('126')}
                </MainText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onShare()}
                style={styles.download}
              >
                <ShareIcon width="20%" height="100%" />
                <MainText color={colors.white} size={fontSize[12]}>
                  {t('129')}
                </MainText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default QrCode;

const styles = StyleSheet.create({
  logoBox: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    alignSelf: 'center',
  },

  logoBoxA: {
    fontFamily: 'Cambria',
    fontSize: 40,
    color: '#2D62B6',
  },

  logoBoxB: {
    fontFamily: 'Cambria',
    fontSize: 40,
    color: '#EF4444',
  },

  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
  },
  buttons: {
    marginTop: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  max: {
    alignSelf: 'center',
    marginBottom: 15,
    maxWidth: '95%',
  },
  userName: {
    fontSize: style.fontSize.xx,
    color: style.textColor,
    fontFamily: style.fontFamilyMedium,
  },
  row: {
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: 'white',
    padding: '14%',
    borderRadius: 20,
  },
  download: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: style.StatusbarColor,
    padding: 10,
    width: style.width / 3,
    maxWidth: style.width / 3,
    flexDirection: 'row',
  },
  downloadText: {
    color: '#fff',
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
  },
  main: {
    width: '90%',
    alignSelf: 'center',
    flex: 1,
  },
  darkBg: {
    width: '70%',
    paddingLeft: '10%',
    paddingRight: '10%',
    marginTop: 20,
    borderRadius: 20,
    backgroundColor: '#394052',
    alignSelf: 'center',
  },
  aboutUsContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    padding: 0,
  },

  title: {
    fontSize: style.fontSize.xs,
    color: style.textColor,
    fontFamily: style.fontFamilyBold,
    alignSelf: 'center',
  },
});
