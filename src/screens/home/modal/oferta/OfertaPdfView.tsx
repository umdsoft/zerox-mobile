import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import Pdf from 'react-native-pdf';
import { useTranslation } from 'react-i18next';
import { rd } from '../../../../theme/rd';
import { styles } from './ofertaStyles';
import type { OfertaReadGate } from './useOfertaReadGate';
import type { OfertaSource } from './useOfertaSource';

interface Props {
  gate: OfertaReadGate;
  src: OfertaSource;
  pdfErr: boolean;
}

/** Hujjat maydoni: xato + "Qayta urinish" | yuklanmoqda | PDF ko'ruvchi (teginishlarni sanovchi o'rov bilan). */
const OfertaPdfView = ({ gate, src, pdfErr }: Props) => {
  const { t } = useTranslation();
  const { pdfSource, docSrc, reloadKey, onDocFailed, retry } = src;
  const { loadedAtRef, allPageRef, setAllPage, markLoaded, notePage, onPdfTouchStart, onPdfTouchEnd } = gate;

  if (pdfErr) {
    return (
      <View style={styles.errBox}>
        <Text style={styles.errText} allowFontScaling={false}>
          {t('Oferta hujjatini yuklab bo‘lmadi. Internet aloqasini tekshirib, qayta urinib ko‘ring.')}
        </Text>
        <TouchableOpacity activeOpacity={0.85} onPress={retry} style={styles.retryBtn}>
          <Text style={styles.retryText} allowFontScaling={false}>
            {t('Qayta urinish')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!pdfSource) {
    // SS-DEV (2026-10-04): serverdan yuklanmoqda (timeout + qayta urinishlar).
    return (
      <View style={styles.errBox}>
        <ActivityIndicator size="large" color={rd.color.primary} />
      </View>
    );
  }
  // 08.10 (5-band): teginishlarni sanash uchun o'rov (varaqlashga xalaqit bermaydi — faqat kuzatadi).
  return (
    <View
      style={styles.pdfWrap}
      onTouchStart={onPdfTouchStart}
      onTouchEnd={onPdfTouchEnd}
      onTouchCancel={onPdfTouchEnd}>
      <Pdf
        key={`${reloadKey}-${docSrc.kind}`}
        trustAllCerts={false}
        // SS-DEV (2026-09-24): sahifa-sahifa VERTIKAL scroll (pageSnap + pageFling) — onPageChanged har sahifada ketma-ket keladi.
        enablePaging={true}
        horizontal={false}
        page={1}
        // SS-DEV (2026-10-04): server nusxasi ochilmasa — ilova ichidagi zaxira.
        onError={() => {
          if (!loadedAtRef.current) onDocFailed();
        }}
        renderActivityIndicator={() => <ActivityIndicator size="small" color={rd.color.primary} style={styles.indicator} />}
        source={pdfSource}
        onLoadComplete={(numberOfPages: number) => {
          // Yuklanganda umumiy sahifa soni to'g'ridan-to'g'ri o'rnatiladi (ishonchli gate); o'qish taymeri shu yerdan.
          if (numberOfPages > 0) setAllPage(numberOfPages);
          markLoaded(numberOfPages);
        }}
        onPageChanged={(p, allpage) => {
          if (allpage > 0) {
            allPageRef.current = allpage;
            setAllPage(allpage);
          }
          // onLoadComplete kelmagan bo'lsa ham (ba'zi qurilmalarda faqat sahifa hodisasi keladi) yuklangan deb belgilaymiz.
          if (!loadedAtRef.current) {
            markLoaded(allpage);
            return;
          }
          // 08.10 (5-band): ketma-ketlik sharti olib tashlandi; orqaga qaytish maxPage'ni kamaytirmaydi.
          notePage(p, allpage);
        }}
        // 08.10: sahifaga bosilganda ham joriy sahifa keladi (qo'shimcha signal).
        onPageSingleTap={(p: number) => notePage(p)}
        style={styles.pdf}
      />
    </View>
  );
};

export default OfertaPdfView;
