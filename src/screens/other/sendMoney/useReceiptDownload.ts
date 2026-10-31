import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { generatePDF } from 'react-native-html-to-pdf';
import FileViewer from 'react-native-file-viewer';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { useApiAction } from '../../../hooks/useApiAction';
import { renderHTMLS } from '../../constants';
import { receiptBaseName } from './sendMoneyLogic';

/** Tafsilotni PDF qilib saqlash (Android: Download/Zerox, MediaStore; iOS: writeFile) va ochish. Mavjud nom bo'lsa (1), (2)... qo'shiladi. */
export function useReceiptDownload(data: any) {
  const vv = useTranslation();
  // Ikki marta bosish: ikki marta PDF yaratib (1), (2) nusxa qoldirmasin.
  const { run } = useApiAction();
  return useCallback(() => {
    return run(async () => {
      try {
        let baseFileName = receiptBaseName(vv[1].language, data.type, data?.id);
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


        // Open file: fayl allaqachon saqlangan — ochib bo'lmasa bu YUKLASH xatosi emas.
        try {
          await FileViewer.open(`file://${filePath}`);
        } catch (openError) {
          console.error('Error opening saved PDF:', openError);
          if (Platform.OS === 'android') {
            Toast.show({
              type: 'omad',
              position: 'bottom',
              visibilityTime: 2500,
              props: { title: vv[0]('Yuklab olindi'), desc: vv[0]('Download/Zerox papkasiga saqlandi') },
            });
          }
        }
      } catch (error) {
        // Alert.alert('Error', JSON.stringify(error));
        console.error('Error generating or opening PDF:', error);
        // Foydalanuvchi ham bilsin (oldin jim edi); toast parametrlari UseTerm yuklab olish xatosi bilan bir xil.
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'error2',
          props: { desc: vv[0]('Yuklab olish amalga oshmadi') },
        });
      }
    });
  }, [data, vv, run]);
}
