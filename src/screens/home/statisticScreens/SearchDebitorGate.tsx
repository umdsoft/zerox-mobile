/**
 * SearchDebitorGate — "Qarz shartnomasi" ro'yxat sahifalari uchun oferta darvozasi.
 *
 * 03.10 (egasi): ofertani tasdiqlash qarz berish / qarz olish tugmalaridan tashqari
 * BERILGAN qarz, OLINGAN qarz, MUDDATI O'TGAN va MUDDATI OZ QOLGAN qarzlar sahifasi
 * ochilganda ham so'ralishi kerak. Bu sahifalarning hammasi bitta ekran — SearchDebitor —
 * va unga 8+ joydan (Qarz shartnomasi, Bosh sahifa, Statistika, kartalar, bildirishnoma)
 * o'tiladi. Har bir chaqiruvni o'rash o'rniga darvoza EKRANNING O'ZIDA: oferta
 * tasdiqlanmagan bo'lsa ekran ko'rsatilmaydi, oldingi sahifaga qaytiladi va oferta oynasi
 * ochiladi; tasdiqlangach shu sahifa (o'sha parametrlar bilan) avtomatik ochiladi,
 * yopilsa — foydalanuvchi joyida qoladi.
 *
 * HISOBOT rejimi (`report: true` — "Tugallangan qarz shartnomalari") ochiq qoladi.
 */
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import SearchDebitor from './SearchDebitor';
import { needsOferta, openOferta } from '../../../helper/ofertaGate';
import { navigationRef } from '../../../navigation/NavigationRef';
import { rd } from '../../../theme/rd';

const SearchDebitorGate = (props: any) => {
  const { route, navigation } = props;
  const userData = useSelector((s: any) => s.HomeReducer?.user?.data);
  const isReport = route?.params?.report === true;
  const blocked = !isReport && needsOferta(userData);
  const handled = useRef(false);

  useEffect(() => {
    if (!blocked || handled.current) return;
    handled.current = true;
    const params = route?.params;
    if (navigation?.canGoBack?.()) navigation.goBack();
    // Tasdiqlangach — shu sahifaga qayta o'tamiz (ekran allaqachon stekdan olingan,
    // shu sabab global navigationRef orqali).
    openOferta(() => {
      const ref: any = navigationRef.current;
      ref?.navigate?.('SearchDebitor', params);
    });
  }, [blocked, navigation, route]);

  if (blocked) return <View style={{ flex: 1, backgroundColor: rd.color.page }} />;
  return <SearchDebitor {...props} />;
};

export default SearchDebitorGate;
