import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from 'react-native-paper';
import { rd, rs } from '../../../theme/rd';
import { useDispatch, useSelector } from 'react-redux';
import { contractModalShow } from '../../../store/reducers/HomeReducer';
import { getMe } from '../../../store/api/home';

import Pdf from 'react-native-pdf';
import axios from 'axios';
import { URL, PDF_OFERTA_URL } from '../../constants';
import { storage } from '../../../store/api/token/getToken';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import Loading from '../../components/Loading';
import CheckBox from '@react-native-community/checkbox';
import { useTranslation } from 'react-i18next';
const { width, height } = Dimensions.get('screen');
// SS-DEV (2026-09-24, 3-tuzatish): oferta o'qish darvozasi sozlamalari.
const MIN_READ_MS = 3000; // yuklangandan keyin eng kam o'qish vaqti (1 sahifali hujjat)
const PER_PAGE_MS = 1500; // har bir KEYINGI sahifa uchun eng kam vaqt: (n-1)*1.5 s
const SETTLE_MS = 1000; // yuklangandan keyingi "spurious" sahifa hodisalari oynasi
// Hujjat UMUMAN yuklanmasa (onLoadComplete ham, onPageChanged ham kelmasa) —
// foydalanuvchi abadiy qamalib qolmasin. YUKLANGAN hujjat uchun bu taymer
// ISHLAMAYDI (pastga qarang).
const FALLBACK_MS = 60000;

const ContractModal = () => {
  const dispatch = useDispatch();

  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [check, setCheck] = useState(false);
  const { contract, user } = useSelector(state => state.HomeReducer);
  const [allPage, setAllPage] = useState(0);
  // SS5 (2026-09-20): eng uzoq borilgan sahifa — "oxirigacha o'qildi"
  // shartini shu orqali aniqlaymiz (joriy sahifa emas: foydalanuvchi
  // oxirga yetib, keyin orqaga qaytishi mumkin).
  const [maxPage, setMaxPage] = useState(1);
  // So'rov SS5: PDF yuklanmasa foydalanuvchi bo'sh oynada QAMALIB qolmasin
  // (dismissable=false). Xato bo'lsa xabar + "Qayta urinish" ko'rsatiladi.
  const [pdfErr, setPdfErr] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // SS-DEV (2026-09-24): hujjat yuklangach eng kam o'qish vaqti o'tdimi.
  const [readTimerDone, setReadTimerDone] = useState(false);
  // SS-DEV (2026-09-24): native hodisalar UMUMAN kelmasa — uzoq kutishdan
  // keyin vaqt-darvozasiga o'tiladi (faqat YUKLANMAGAN hujjat uchun).
  const [eventsFallback, setEventsFallback] = useState(false);
  const loadedAtRef = useRef<number | null>(null);
  // Sinxron nusxa — ketma-ket sahifa tekshiruvi (p === maxPage + 1) uchun.
  const maxPageRef = useRef(1);
  const readTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * SS-DEV (2026-09-24, 3-tuzatish): "Oferta oxirigacha o'qilmaguncha
   * tasdiqlab bo'lmasin" — darvoza QAYTA MUSTAHKAMLANDI.
   *
   * Skrinshotdagi holat (1-sahifa, checkbox belgilangan, Tasdiqlash ko'k)
   * QANDAY yuzaga kelgan (2-tuzatishdan keyingi kod bo'yicha):
   *  1) 60 s FALLBACK — modal ochilganda VA yuklanganda 60 s taymer
   *     boshlanardi; u faqat HAQIQIY sahifa hodisasi kelganda o'chirilardi.
   *     Foydalanuvchi 1-sahifani 1 daqiqa o'qib tursa (yoki shunchaki ochiq
   *     qoldirsa) — sahifa o'zgarmagani uchun hodisa yo'q → 60 s da
   *     `eventsFallback=true` → darvoza JIMGINA ochilar, hint yo'qolar,
   *     checkbox belgilanar edi. Bu talabga zid: yuklangan hujjat uchun
   *     vaqt-fallback endi UMUMAN YO'Q.
   *  2) Android'da (barteksc PDFView) `jumpTo`/havola (link) orqali sahifa
   *     SAKRAB o'zgarsa `onPageChanged(oxirgi)` bir zumda kelar, `maxPage`
   *     darhol `allPage` bo'lardi — endi faqat KETMA-KET (p === maxPage+1)
   *     siljish hisobga olinadi va oxirgi sahifaga yetish yetarli emas:
   *     yuklangandan keyin kamida (n-1)×1.5 s o'tishi ham shart.
   *  3) Yoga o'lchov paytidagi (h=0) soxta hodisa — SETTLE_MS oynasi.
   *
   * Yangi darvoza (BARCHA shartlar birga):
   *  a) hujjat yuklangan (allPage > 0, onLoadComplete/onPageChanged kelgan);
   *  b) yuklangandan keyin kamida max(3 s, (n-1)×1.5 s) o'tgan;
   *  c) ko'p sahifali hujjatda OXIRGI sahifaga KETMA-KET yetilgan.
   * Fallback (60 s) FAQAT hujjat umuman yuklanmagan (allPage === 0) holatda.
   * Har ochilishda holat NOLLANADI (useEffect quyida); `check` darvoza
   * yopiq bo'lsa hech qachon true bo'lolmaydi (pastdagi effekt).
   */
  const reachedLast = allPage > 0 && (allPage === 1 || maxPage >= allPage);
  const readToEnd =
    !pdfErr &&
    ((allPage > 0 && readTimerDone && reachedLast) ||
      (eventsFallback && allPage === 0));
  const needRead = !pdfErr && !readToEnd;

  const clearTimers = useCallback(() => {
    if (readTimerRef.current) {
      clearTimeout(readTimerRef.current);
      readTimerRef.current = null;
    }
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const resetGate = useCallback(() => {
    clearTimers();
    loadedAtRef.current = null;
    maxPageRef.current = 1;
    setCheck(false);
    setMaxPage(1);
    setAllPage(0);
    setReadTimerDone(false);
    setEventsFallback(false);
  }, [clearTimers]);

  // Hujjat yuklandi — o'qish taymerini boshlaymiz, fallback O'CHIRILADI.
  const markLoaded = useCallback((numberOfPages: number) => {
    if (loadedAtRef.current) return;
    loadedAtRef.current = Date.now();
    // SS-DEV (2026-09-24, 3-tuzatish): yuklangan hujjat uchun vaqt-fallback
    // yo'q — faqat sahifa darvozasi. (Ilgari shu yerda 60 s taymer QAYTA
    // boshlanardi — skrinshotdagi holatning sababi.)
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    setEventsFallback(false);
    const n = Math.max(1, Number(numberOfPages) || 1);
    const minMs = Math.max(MIN_READ_MS, (n - 1) * PER_PAGE_MS);
    if (readTimerRef.current) clearTimeout(readTimerRef.current);
    readTimerRef.current = setTimeout(() => setReadTimerDone(true), minMs);
  }, []);

  useEffect(() => {
    if (contract) {
      resetGate();
      // Native hodisalar (onLoadComplete/onPageChanged) UMUMAN kelmasa
      // foydalanuvchi abadiy qamalib qolmasin. Taymer otganda hujjat
      // yuklangan bo'lsa — HECH NARSA qilinmaydi (darvoza sahifa asosida).
      fallbackTimerRef.current = setTimeout(() => {
        if (!loadedAtRef.current) setEventsFallback(true);
      }, FALLBACK_MS);
    } else {
      clearTimers();
    }
    return clearTimers;
  }, [contract, reloadKey, resetGate, clearTimers]);

  // Darvoza yopiq bo'lsa rozilik belgisi hech qachon true qolmasin
  // (masalan qayta yuklash / holat o'zgarishi paytida).
  useEffect(() => {
    if (needRead && check) setCheck(false);
  }, [needRead, check]);

  const warnRead = useCallback(() => {
    Toast.show({
      autoHide: true,
      visibilityTime: 3500,
      position: 'bottom',
      type: 'error2',
      props: {
        desc: t(
          'Iltimos, ommaviy ofertani oxirigacha o‘qib chiqing va tasdiqlang.',
        ),
      },
    });
  }, [t]);

  const onClose = useCallback(async () => {
    // Tugma FAQAT `check` (rozilik belgilangan)да yoqiladi. Ilgari bu yerda ham
    // `page === allPage` sharti bor edi — u ishonchsiz bo'lib, tugma bosilса jim
    // o'tib ketardi (tasdiqlanmasdi). Endi rozilik belgisiga tayanamiz.
    if (check) {
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
          // is_contract=1 bo'ldi — redux `user`ni YANGILAB BO'LGACH yopamiz. Aks holda
          // Main.tsx re-trigger effekti (is_contract hali 0) modalni QAYTA ochadi (flicker/loop).
          await dispatch(getMe());
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
          await dispatch(getMe());
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
  }, [check, dispatch, t]);

  return (
    <Modal visible={contract} dismissable={false}>
      <View style={styles.main}>
        {loading ? (
          <Loading />
        ) : (
          <>
            {pdfErr ? (
              <View style={styles.errBox}>
                <Text style={styles.errText} allowFontScaling={false}>
                  {t(
                    'Oferta hujjatini yuklab bo‘lmadi. Internet aloqasini tekshirib, qayta urinib ko‘ring.',
                  )}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setPdfErr(false);
                    // SS-DEV (2026-09-24): reloadKey o'zgarishi useEffect orqali
                    // darvozani to'liq nollaydi.
                    setReloadKey(k => k + 1);
                  }}
                  style={styles.retryBtn}
                >
                  <Text style={styles.retryText} allowFontScaling={false}>
                    {t('Qayta urinish')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Pdf
                key={reloadKey}
                trustAllCerts={false}
                // SS-DEV (2026-09-24): sahifa-sahifa VERTIKAL scroll (pageSnap +
                // pageFling) — onPageChanged har sahifada ketma-ket keladi.
                enablePaging={true}
                horizontal={false}
                page={1}
                onError={error => {
                  console.warn(error);
                  setPdfErr(true);
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
                  uri: `${PDF_OFERTA_URL}?id=${user?.data?.uid}&lang=${
                    storage.getString('lang') || 'uz'
                  }&download=0`,
                  method: 'GET',
                }}
                onLoadComplete={(numberOfPages: number) => {
                  setLoading(false);
                  // So'rov: checkbox `page===allPage`да yoqiladi. Ilgari `allPage` FAQAT
                  // onPageChanged'дан kelardi — u esa BIRINCHI sahifада (yoki 1-sahifали
                  // PDF'да) ishga tushmasligi mumkin → allPage=0 → checkbox HECH QACHON
                  // yoqilmaydi → tasdiqlab bo'lmaydi. Endi yuklanganда umumiy sahifa
                  // soni to'g'ridan-to'g'ri o'rnatiladi (ishonchli gate).
                  if (numberOfPages > 0) {
                    setAllPage(numberOfPages);
                  }
                  // SS-DEV (2026-09-24): o'qish taymeri shu yerdan boshlanadi —
                  // muddati sahifa soniga bog'liq.
                  markLoaded(numberOfPages);
                }}
                onPageChanged={(p, allpage) => {
                  if (allpage > 0) {
                    setAllPage(allpage);
                  }
                  // SS-DEV (2026-09-24): onLoadComplete kelmagan bo'lsa ham
                  // (ba'zi qurilmalarda faqat sahifa hodisasi keladi) yuklangan
                  // deb belgilaymiz — aks holda taymer hech qachon boshlanmaydi.
                  if (!loadedAtRef.current) {
                    markLoaded(allpage);
                    return;
                  }
                  // Yuklangandan keyingi birinchi SETTLE_MS ichidagi hodisalar —
                  // Android'dagi soxta "oxirgi sahifa" hodisasi; hisobga olinmaydi.
                  if (Date.now() - loadedAtRef.current < SETTLE_MS) {
                    return;
                  }
                  if (p < 1 || (allpage > 0 && p > allpage)) return;
                  // SS-DEV (2026-09-24, 3-tuzatish): faqat KETMA-KET oldinga
                  // siljish (p === maxPage + 1) hisoblanadi — havola/jumpTo
                  // orqali oxirgi sahifaga SAKRASH "o'qildi" degani emas.
                  // Orqaga qaytish maxPage'ni kamaytirmaydi.
                  if (p === maxPageRef.current + 1) {
                    maxPageRef.current = p;
                    setMaxPage(p);
                  }
                }}
                style={styles.pdf}
              />
            )}
            <View style={styles.footer}>
              {/* So'rov: oferta TASDIQLASH ishlashi kerak. IKKI muammo bor edi:
                  (1) checkbox `page===allPage` gate'ига bog'liq edi — react-native-pdf
                  paginatsiyasida ISHONCHSIZ → hech qachon yoqilmasdi;
                  (2) CheckBox `TouchableWithoutFeedback` ichида edi — Androidда wrapper
                  bosishни "yutardi", native checkbox toggle bo'lmasdi.
                  YECHIM: butun qator TouchableOpacity — bosilса roziliкни toggle qiladi;
                  CheckBox esa FAQAT ko'rsatish uchun (pointerEvents:none). PDF xato
                  bo'lса (pdfErr) — roziliк belgilanmaydi. */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (pdfErr) return;
                  if (needRead) {
                    warnRead();
                    return;
                  }
                  setCheck(c => !c);
                }}
              >
                <View style={styles.checkRow} pointerEvents="none">
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
                  />
                  <Text style={styles.checkText} allowFontScaling={false}>
                    {t('ofertaaa')}
                  </Text>
                </View>
              </TouchableOpacity>
              {/* SS5: qancha qolganini ko'rsatamiz — aks holda darvoza
                  sababsiz to'siq bo'lib ko'rinardi. */}
              {needRead && (
                <Text style={styles.readHint} allowFontScaling={false}>
                  {allPage > 1
                    ? `${t('Oxirigacha o‘qing')}: ${Math.min(maxPage, allPage)} / ${allPage}`
                    : t('Oxirigacha o‘qing')}
                </Text>
              )}
              {/* SS5: tugma BOSILADI (disabled emas) — aks holda sababini
                  tushuntiruvchi ogohlantirish umuman chiqmasdi. */}
              <TouchableOpacity
                onPress={() => {
                  if (needRead || !check) {
                    warnRead();
                    return;
                  }
                  onClose();
                }}
                activeOpacity={0.85}
                style={[
                  styles.btn,
                  {
                    backgroundColor:
                      check && !needRead
                        ? rd.color.primary
                        : rd.color.textTertiary,
                  },
                  check && !needRead ? styles.btnActiveShadow : null,
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
  // So'rov SS5: Pdf uchun aniq o'lcham — ilgari `styles.pdf` UNDEFINED edi,
  // shu bois PDF 0-balandlikда ("ko'rinmayapti") render bo'lishi mumkin edi.
  pdf: {
    flex: 1,
    width: '100%',
    backgroundColor: rd.color.surface,
  },
  indicator: {
    flex: 1,
    justifyContent: 'center',
  },
  errBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(24),
  },
  errText: {
    fontFamily: rd.font.medium,
    fontSize: rs(14.5),
    lineHeight: rs(21),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginBottom: rs(18),
  },
  retryBtn: {
    paddingHorizontal: rs(24),
    paddingVertical: rs(12),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
  },
  retryText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14.5),
    color: rd.color.onPrimary,
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
  readHint: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: '#b45309',
    marginTop: rs(6),
    marginLeft: rs(4),
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
