import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Platform,
  Button,
  Image,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { style } from '../../../../theme/style';

import QRCode from 'react-native-qrcode-svg';
import ShareIcon from '../../../../images/home/share.svg';
import DownloadIcon from '../../../../images/home/download.svg';
import { useSelector } from 'react-redux';
import { generatePDF } from 'react-native-html-to-pdf';

import Share from 'react-native-share';
import FileViewer from 'react-native-file-viewer';
import ScreenLayout from '../../../components/ScreenLayout';

import MainText from '../../../components/MainText';

import { colors } from '../../../../theme/colors';
import { t } from 'i18next';
import { rd, rs } from '../../../../theme/rd';
import { ArrowDown, ArrowUpRight } from '../../../home/redesign/icons';
import ZeroXWordmark from '../../../../images/TextAndLogo';

import RNBlobUtil from 'react-native-blob-util';

// import RNFS from 'react-native-fs';
import ViewShot from 'react-native-view-shot';
import { fontSize } from '../../../../theme';

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
        const destPath = `${RNBlobUtil.fs.dirs.CacheDir}/${fileName}`;

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
          await RNBlobUtil.fs.cp(filePath!, destPath);
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
              await RNBlobUtil.fs.exists(
                `${RNBlobUtil.fs.dirs.CacheDir}/${user?.data?.uid}.pdf`,
              )
            ) {
              await RNBlobUtil.fs.unlink(
                `${RNBlobUtil.fs.dirs.CacheDir}/${user?.data?.uid}.pdf`,
              );
            }

            const destPath = `${RNBlobUtil.fs.dirs.CacheDir}/${user?.data?.uid}.pdf`;
            await RNBlobUtil.fs.cp(filePath!, destPath);

            await Share.open({
              url: `file://${destPath}`,
              title: 'Share QR Code',
              type: 'application/pdf',
            })
              .then(res => {
                console.log('Share is good', res);
              })
              .catch(async error => {
                await RNBlobUtil.fs.unlink(destPath);
                console.log('Share is bad', error);
              });
            await RNBlobUtil.fs.unlink(destPath);
          })
          .catch(error => {
            console.log('RNHTMLtoPDF', error.message);
          });
      });
    });
  };

  // FISH: familiya + ism BIR qatorda, otasining ismi PASTKI qatorda (so'rov bo'yicha).
  const nameLine1 = `${user?.data?.last_name ?? ''} ${
    user?.data?.first_name ?? ''
  }`.trim();
  const nameLine2 = `${user?.data?.middle_name ?? ''}`.trim();

  return (
    <ScreenLayout title={t('qrcode')}>
      <View style={styles.page}>
        {/* ESKI ILOVADAGIDEK joylashuv: ZeroX logo TEPADA, QR o'rtada,
            "ID raqami" QR OSTIDA, ism eng pastda — hammasi bitta kartada
            (ViewShot bilan ulashiladigan/yuklab olinadigan rasmga to'liq tushadi). */}
        <ViewShot
          ref={viewShootRef}
          options={{
            format: 'png',
            quality: 1,
            result: 'base64',
          }}
        >
          <View style={styles.qrCard}>
            {/* viewBox — komponentning DEFAULT (0 350 4000 1000) framing'i:
                "ZeroX" TO'LIQ ko'rinadi (ilgari 0 0 4000 1300 override "Z"ni qirqardi). */}
            <ZeroXWordmark
              width={rs(140)}
              height={rs(38)}
              viewBox="0 350 4000 1000"
              fill="#0063B6"
              color="#FF2D2D"
            />

            <View style={styles.qrWrap}>
              <QRCode
                getRef={c => setProductQRref(c)}
                ecl="M"
                color={rd.color.primary}
                backgroundColor={rd.color.surface}
                size={rs(210)}
                logoBorderRadius={5}
                logo={require('../../../../images/iconapp.jpg')}
                value={item}
              />
            </View>

            <Text allowFontScaling={false} style={styles.uidText}>
              {t('idNumber')}: {user?.data?.uid}
            </Text>

            <Text allowFontScaling={false} numberOfLines={1} style={styles.nameText}>
              {nameLine1}
            </Text>
            {nameLine2 ? (
              <Text allowFontScaling={false} numberOfLines={1} style={styles.nameText2}>
                {nameLine2}
              </Text>
            ) : null}
          </View>
        </ViewShot>

        <Text allowFontScaling={false} style={styles.helperText}>
          {t('123')}
        </Text>

        {/* Tugmalar YONMA-YON (eski ilovadagidek): Yuklab olish + Ulashish. */}
        <View style={styles.buttons}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onDownload()}
            style={styles.secondaryBtn}
          >
            <ArrowDown size={rs(18)} color={rd.color.textSecondary} />
            <Text allowFontScaling={false} style={styles.secondaryBtnText}>
              {t('126')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onShare()}
            style={styles.primaryBtn}
          >
            <ArrowUpRight size={rs(18)} color={rd.color.onPrimary} />
            <Text allowFontScaling={false} style={styles.primaryBtnText}>
              {t('129')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
};

export default QrCode;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: rd.color.page,
    alignItems: 'center',
    paddingTop: rs(12),
  },
  qrCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.huge,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingVertical: rs(26),
    paddingHorizontal: rs(24),
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: '#0f1b3d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  qrWrap: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    padding: rs(8),
    alignSelf: 'center',
    marginTop: rs(18),
  },
  // "ID raqami" — QR OSTIDA (eski ilovadagidek).
  uidText: {
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.textSecondary,
    marginTop: rs(16),
  },
  // Ism — eng pastda, quyuq va markazda (eski ilovadagidek).
  nameText: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
    textAlign: 'center',
    marginTop: rs(6),
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  // Otasining ismi — pastki qator.
  nameText2: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
    textAlign: 'center',
    marginTop: rs(1),
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  helperText: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.textTertiary,
    textAlign: 'center',
    marginTop: rs(18),
    marginHorizontal: rs(24),
    lineHeight: rs(19),
  },
  // Tugmalar YONMA-YON (eski ilovadagidek).
  buttons: {
    marginTop: rs(22),
    flexDirection: 'row',
    alignSelf: 'stretch',
    paddingHorizontal: rs(16),
    gap: rs(12),
  },
  primaryBtn: {
    flex: 1,
    height: rs(52),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
  },
  primaryBtnText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.onPrimary,
  },
  secondaryBtn: {
    flex: 1,
    height: rs(52),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.surfaceAlt,
    borderWidth: 1,
    borderColor: rd.color.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
  },
  secondaryBtnText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.textSecondary,
  },
});
