/**
 * MapPicker.tsx — ZeroX ILOVA ICHIDA xarita orqali lokatsiya tanlash (WebView + YANDEX Maps).
 * react-native-maps kerak emas. SS13: Google/OSM emas — YANDEX xaritasi; foydalanuvchining
 * JORIY joylashuvini so'raydi (geolokatsiya) va ruxsat berilsa o'sha yerda ochiladi.
 * Foydalanuvchi xaritaga bosadi → marker qo'yiladi → "Tanlash" bosilsa onPick(lat,lng).
 */
import React from 'react';
import { t } from 'i18next';
import { ActivityIndicator, Modal, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';
import { rd, rs } from '../../../theme/rd';
import { ChevronLeft } from '../redesign/icons';

type Coord = { lat: number; lng: number };

// Toshkent markazi — default.
const DEFAULT: Coord = { lat: 41.311081, lng: 69.240562 };

const buildHtml = (c: Coord, hasInitial: boolean) => `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<style>html,body,#map{height:100%;margin:0;padding:0;background:#e9eef5}.hint{position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:1000;background:rgba(19,26,42,.85);color:#fff;font:600 13px -apple-system,Roboto,sans-serif;padding:7px 14px;border-radius:999px}</style>
<script src="https://api-maps.yandex.ru/2.1/?lang=uz_UZ"></script>
</head><body>
<div id="map"></div>
<div class="hint" id="hint">{t('Joyni belgilash uchun xaritaga bosing')}</div>
<script>
  function post(coords){
    document.getElementById('hint').textContent = coords[0].toFixed(5)+', '+coords[1].toFixed(5);
    try{ window.ReactNativeWebView.postMessage(JSON.stringify({lat:coords[0], lng:coords[1]})); }catch(e){}
  }
  function boot(){
    if (!window.ymaps || !ymaps.ready) { return; }
    ymaps.ready(function(){
      var map = new ymaps.Map('map', {
        center: [${c.lat}, ${c.lng}], zoom: 12,
        controls: ['zoomControl','geolocationControl']
      });
      var pm = null;
      function place(coords){
        if (pm){ pm.geometry.setCoordinates(coords); }
        else {
          pm = new ymaps.Placemark(coords, {}, { draggable: true });
          map.geoObjects.add(pm);
          pm.events.add('dragend', function(){ post(pm.geometry.getCoordinates()); });
        }
        post(coords);
      }
      map.events.add('click', function(e){ place(e.get('coords')); });

      function notifyRN(msg){
        try { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); } catch(e){}
      }
      // Joylashuv topildi: xaritani markazlaymiz VA markerni QO'YAMIZ — shunda
      // "Tanlash" tugmasi darhol faollashadi (so'rov: "joylashuvni TANLAMAYAPTI").
      function applyPos(pos){
        if (!pos || pos.length !== 2) return false;
        map.setCenter(pos, 16);
        place(pos);
        return true;
      }

      /**
       * SS2 ILDIZ SABAB: sahifa \`loadDataWithBaseURL\` bilan BO'SH baseUrl'da
       * yuklanardi -> hujjat origini "xavfsiz" hisoblanmasdi va Chromium
       * \`navigator.geolocation\` ni BUTUNLAY bloklardi (hech qanday so'rov
       * chiqmasdi). Endi RN tomonda baseUrl = https://yandex.uz berilgan, shu
       * sabab quyidagi chaqiruv haqiqatda ishlaydi. ymaps o'ramini emas,
       * BEVOSITA navigator.geolocation'ni ishlatamiz — xato KODI bilan qaytadi,
       * shuning uchun foydalanuvchiga aniq sabab ko'rsata olamiz.
       */
      function browserLocate(highAccuracy, done){
        if (!navigator.geolocation) { done(false, 'unsupported'); return; }
        navigator.geolocation.getCurrentPosition(
          function(p){
            done(applyPos([p.coords.latitude, p.coords.longitude]), null);
          },
          function(err){
            // 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
            var code = err && err.code;
            if (code === 3 && highAccuracy) { browserLocate(false, done); return; }
            done(false, code === 1 ? 'denied' : code === 2 ? 'unavailable' : 'timeout');
          },
          { enableHighAccuracy: !!highAccuracy, timeout: highAccuracy ? 12000 : 8000, maximumAge: 0 }
        );
      }
      // Zaxira: Yandex IP-geolokatsiyasi (taxminiy) — GPS o'chiq bo'lsa ham shahar
      // darajasida joy beradi, foydalanuvchi keyin markerni suradi.
      function tryYandex(reason, silent){
        try {
          ymaps.geolocation.get({ provider: 'yandex', mapStateAutoApply: false }).then(
            function(res){
              var pos = res.geoObjects && res.geoObjects.position;
              if (applyPos(pos)) { notifyRN({ geo: 'approx' }); return; }
              notifyRN({ geo: 'fail', reason: reason, silent: !!silent });
            },
            function(){ notifyRN({ geo: 'fail', reason: reason, silent: !!silent }); }
          );
        } catch(e){ notifyRN({ geo: 'fail', reason: reason, silent: !!silent }); }
      }
      // silent=true -> ekran ochilishidagi AVTOMATIK urinish: muvaffaqiyatsiz
      // bo'lsa xato toasti CHIQMAYDI (foydalanuvchi hali hech narsa so'ramagan).
      window.locateMe = function(silent){
        browserLocate(true, function(ok, reason){
          if (ok) { notifyRN({ geo: 'ok' }); return; }
          // Ruxsat RAD etilgan bo'lsa IP-zaxira ham mantiqsiz — sababni aytamiz.
          if (reason === 'denied') { notifyRN({ geo: 'fail', reason: 'denied', silent: !!silent }); return; }
          tryYandex(reason, !!silent);
        });
      };
      // Ekran ochilishida: joy hali tanlanmagan bo'lsa JORIY joyni ko'rsatamiz.
      ${hasInitial
        ? `place([${c.lat}, ${c.lng}]);`
        : `setTimeout(function(){ window.locateMe(true); }, 400);`}
    });
  }
  boot();
</script></body></html>`;

const MapPicker = ({
  visible,
  initial,
  onClose,
  onPick,
}: {
  visible: boolean;
  initial?: Coord | null;
  onClose: () => void;
  onPick: (c: Coord) => void;
}) => {
  const [coord, setCoord] = React.useState<Coord | null>(initial || null);
  const [loading, setLoading] = React.useState(true);
  // SS11: "Joriy joylashuvim" tugmasi WebView ichidagi locateMe() ni chaqiradi.
  const webRef = React.useRef<any>(null);
  const [locating, setLocating] = React.useState(false);

  /**
   * SS9 ROOT-CAUSE: manifestda ACCESS_FINE_LOCATION bor edi, lekin Android 6+ da
   * ruxsat ISH VAQTIDA so'ralishi shart. So'ralmagani uchun WebView ichidagi
   * `navigator.geolocation` rad etilar, natijada tugma bosilganda HECH NARSA
   * bo'lmasdi. Endi avval ruxsat so'raymiz, keyingina locateMe() chaqiriladi.
   */
  const locateMe = async (silent = false) => {
    if (locating) return;
    try {
      setLocating(true);
      if (Platform.OS === 'android') {
        // SS2: TAQRIBIY (COARSE) ruxsatni ham so'raymiz — Android 12+ da
        // foydalanuvchi "Taxminiy" ni tanlashi mumkin; faqat FINE so'ralsa
        // bunday holatda natija RAD bo'lib ko'rinardi.
        const res = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        const ok =
          res[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ||
          res[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
        if (!ok) {
          setLocating(false);
          if (!silent) {
            Toast.show({
              type: 'error2',
              visibilityTime: 4000,
              props: { desc: 'Joylashuvga ruxsat berilmadi. Sozlamalardan yoqishingiz mumkin.' },
            });
          }
          return;
        }
      }
      webRef.current?.injectJavaScript('window.locateMe && window.locateMe(); true;');
    } catch (e) {
      setLocating(false);
    }
  };

  // WebView'dan kelgan geolokatsiya natijasi. Xato JIM YUTILMAYDI — sabab
  // ko'rsatiladi (ruxsat / GPS o'chiq / vaqt tugadi).
  const onGeoResult = (geo: string, reason?: string, silent?: boolean) => {
    setLocating(false);
    if (geo === 'fail' && !silent) {
      const desc =
        reason === 'denied'
          ? 'Joylashuvga ruxsat berilmadi. Sozlamalardan yoqishingiz mumkin.'
          : reason === 'unavailable'
          ? 'Joylashuv aniqlanmadi — GPS (Joylashuv) yoqilganini tekshiring.'
          : reason === 'timeout'
          ? t('Joylashuvni aniqlash cho‘zildi. Ochiq joyda qayta urinib ko‘ring.') : t('Joylashuvni aniqlab bo‘lmadi. GPS yoqilganini tekshiring.');
      Toast.show({ type: 'error2', visibilityTime: 4000, props: { desc } });
    }
  };

  React.useEffect(() => {
    if (visible) {
      setCoord(initial || null);
      setLoading(true);
    }
  }, [visible, initial]);

  const html = React.useMemo(() => buildHtml(initial || DEFAULT, !!initial), [initial]);

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.8}>
            <ChevronLeft size={rs(22)} color={rd.color.text} />
          </TouchableOpacity>
          <Text allowFontScaling={false} style={styles.title}>{t('Lokatsiyani tanlang')}</Text>
          <View style={{ width: rs(40) }} />
        </View>

        <View style={styles.mapWrap}>
          <WebView
            ref={webRef}
            /**
             * SS2 ILDIZ SABAB: `baseUrl` berilmasa react-native-webview
             * `loadDataWithBaseURL("", html, ...)` chaqiradi — hujjat origini
             * OPAQUE bo'ladi va Chromium `navigator.geolocation` ni "xavfsiz
             * bo'lmagan kontekst" sifatida BLOKLAYDI (xato ham chiqmaydi).
             * https origin berilishi bilan geolokatsiya ruxsat so'rovi ishlaydi.
             */
            source={{ html, baseUrl: 'https://yandex.uz' }}
            originWhitelist={['https://*', 'http://*']}
            style={{ flex: 1, backgroundColor: '#e9eef5' }}
            onLoadEnd={() => setLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            geolocationEnabled
            onMessage={(e) => {
              try {
                const c = JSON.parse(e.nativeEvent.data);
                if (typeof c?.lat === 'number' && typeof c?.lng === 'number') setCoord(c);
                // Geolokatsiya natijasi (ok / approx / fail + sabab)
                if (typeof c?.geo === 'string') onGeoResult(c.geo, c?.reason, c?.silent);
              } catch (_) {}
            }}
          />
          {loading && (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={rd.color.primary} />
            </View>
          )}
        </View>

        {/* SS11: "Joriy joylashuvim" — bosilganda joriy joy markeri avtomatik qo'yiladi. */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => locateMe(false)}
          disabled={locating}
          style={[styles.locateBtn, locating && { opacity: 0.6 }]}>
          <Text allowFontScaling={false} style={styles.locateText}>
            {locating ? t('📍 Aniqlanmoqda...') : t('📍 Joriy joylashuvim')}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text allowFontScaling={false} style={styles.coordText}>
            {coord ? `${coord.lat.toFixed(5)}, ${coord.lng.toFixed(5)}` : 'Xaritaga bosib joyni belgilang'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!coord}
            onPress={() => coord && onPick(coord)}
            style={[styles.pickBtn, !coord && { opacity: 0.5 }]}>
            <Text allowFontScaling={false} style={styles.pickBtnText}>{t('Tanlash')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default MapPicker;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(12),
    // SS11: sarlavha PASTROQ (statusBarTranslucent tufayli juda tepada edi).
    paddingTop: rs(40),
    paddingBottom: rs(10),
    backgroundColor: rd.color.surface,
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  backBtn: { width: rs(40), height: rs(40), borderRadius: rs(20), alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },
  mapWrap: { flex: 1, overflow: 'hidden' },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9eef5' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    paddingHorizontal: rs(16),
    paddingVertical: rs(12),
    backgroundColor: rd.color.surface,
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  coordText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textSecondary },
  // SS11: joriy joylashuv tugmasi
  locateBtn: {
    alignSelf: 'flex-start',
    marginHorizontal: rs(16),
    marginTop: rs(10),
    paddingHorizontal: rs(14),
    paddingVertical: rs(9),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.primaryTint,
    borderWidth: 1,
    borderColor: rd.color.primary + '40',
  },
  locateText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.primary },
  pickBtn: {
    paddingHorizontal: rs(24),
    height: rs(46),
    borderRadius: rd.radius.md,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickBtnText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: '#fff' },
});
