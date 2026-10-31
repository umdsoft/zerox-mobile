import React, { useCallback, useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Modal } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { t } from 'i18next';
import { rd } from '../../../theme/rd';
import { normalize } from '../../../theme/style';
import Cancel from '../../../images/Cancel';
import CancelTransfer from '../../../images/cancel_transfer';
import Success from '../../../images/Success';
import PdfIcon from '../../../images/pdf';
import { sortText } from '../../components/StatisticCard';
import { renderReceiptInfo } from './ReceiptInfo';
import { receiptTitle } from './sendMoneyLogic';
import { useReceiptDownload } from './useReceiptDownload';
import { styles } from './sendMoneyStyles';

/** Kirim-chiqim tafsilot oynasi (ref orqali `open(isOpen, item, type)` bilan ochiladi) + PDF yuklash. */
const ShowDetailsModal = ({ getRef }: { getRef: (ref: any) => void }) => {
  const navigation = useNavigation();
  const [show, setShow] = useState(false);
  const [data, setData] = useState<any>({});
  useEffect(() => {
    let ref = {
      open: (isOpen: boolean | ((prevState: boolean) => boolean), item: any) => {
        setShow(isOpen);
        setData(item);
      },
    };
    getRef(ref);
  }, [getRef]);

  const onDismiss = useCallback(() => {
    setShow(false);
  }, []);

  const onDownload = useReceiptDownload(data);

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
              {receiptTitle(data)}
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
          {renderReceiptInfo(data.type, data, navigation)}
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

export default ShowDetailsModal;
