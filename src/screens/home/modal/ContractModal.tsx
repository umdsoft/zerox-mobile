/**
 * ContractModal.tsx — ommaviy oferta tasdiqlash oynasi.
 *
 * 01.11 (wave B): bo'lindi — sof mantiq oferta/ofertaLogic.ts, o'qish darvozasi oferta/useOfertaReadGate.ts,
 * hujjat manbai oferta/useOfertaSource.ts, ochish/qulf oferta/useOfertaAfterId.ts, tasdiqlash oferta/useOfertaAccept.ts,
 * ko'rinish oferta/Oferta*.tsx. Xulq o'zgarmagan (__tests__/contract_modal.test.tsx). Eski izohlardagi tarix
 * (SS-DEV ...) tegishli fayllarga ko'chirilgan.
 */
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Modal } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import { ChevronLeft } from '../redesign/icons';
import OfertaFooter from './oferta/OfertaFooter';
import OfertaPdfView from './oferta/OfertaPdfView';
import { styles } from './oferta/ofertaStyles';
import { useOfertaAccept } from './oferta/useOfertaAccept';
import { useOfertaAfterId } from './oferta/useOfertaAfterId';
import { useOfertaReadGate } from './oferta/useOfertaReadGate';
import { useOfertaSafePad } from './oferta/useOfertaSafePad';
import { useOfertaSource } from './oferta/useOfertaSource';

const ContractModal = () => {
  const { t } = useTranslation();
  const { contract, user } = useSelector((state: any) => state.HomeReducer);
  const userData = user?.data;
  const { resetHiddenByLock } = useOfertaAfterId(contract, userData);

  // So'rov SS5: PDF yuklanmasa foydalanuvchi bo'sh oynada QAMALIB qolmasin (dismissable=false).
  const [pdfErr, setPdfErr] = useState(false);
  const gate = useOfertaReadGate(pdfErr);
  const src = useOfertaSource(contract, user?.data?.uid, gate, setPdfErr);
  const { mainRef, pad, measureInsets } = useOfertaSafePad(contract);
  const { check, setCheck, needRead } = gate;
  // Darvoza yopiq bo'lsa rozilik belgisi hech qachon true qolmasin (masalan qayta yuklash / holat o'zgarishi paytida).
  useEffect(() => {
    if (needRead && check) setCheck(false);
  }, [needRead, check, setCheck]);

  const { loading, onClose, onDecline, warnRead, warnCheck } = useOfertaAccept(check, resetHiddenByLock);

  return (
    <Modal
      visible={contract}
      dismissable={false}
      // SS-DEV (2026-09-29): Android "orqaga" — oynani yopadi (majburiy emas).
      dismissableBackButton
      onDismiss={onDecline}
      // SS-DEV (2026-10-04): Paper wrapper'ning o'z inset margin'lari va markazlash o'chiriladi — inset'lar `pad` orqali.
      style={styles.modalWrapper}
      contentContainerStyle={styles.modalContent}>
      <View ref={mainRef} onLayout={measureInsets} style={[styles.main, { paddingTop: pad.top + rs(8), paddingBottom: pad.bottom }]}>
        {/* SS-DEV (2026-09-29): oferta majburiy emas (faqat Qarz shartnomasi amallari uchun shart). 01.10 (4-band):
            chiqish — chap tomondagi "ORQAGA" tugmasi (RdHeader uslubi); Android tizim "orqaga" tugmasi ham yopadi. */}
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onDecline}
            disabled={loading}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('21')}
            style={styles.backBtn}>
            <ChevronLeft size={rs(22)} color={rd.color.onPrimary} />
          </TouchableOpacity>
          <Text style={styles.topTitle} allowFontScaling={false} numberOfLines={1}>
            {t('Ommaviy oferta')}
          </Text>
          <View style={styles.topSide} />
        </View>
        {loading ? (
          <Loading />
        ) : (
          <>
            <OfertaPdfView gate={gate} src={src} pdfErr={pdfErr} />
            <OfertaFooter
              check={check}
              needRead={needRead}
              pdfErr={pdfErr}
              setCheck={setCheck}
              checkReadFallback={gate.checkReadFallback}
              warnRead={warnRead}
              warnCheck={warnCheck}
              onClose={onClose}
            />
          </>
        )}
      </View>
    </Modal>
  );
};

export default ContractModal;
