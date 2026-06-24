# ZeroX Mobile — To'liq Audit Hisoboti

**Sana:** 2026-06-22
**Ilova:** ZeroX (React Native 0.81.4 bare, TypeScript, New Architecture) — moliyaviy qarz boshqaruvi, MyID identifikatsiya, biometrika, Click/PayMe to'lov
**Audit usuli:** read-only statik tahlil (3 yo'nalish: kiberxavfsizlik, kod-sifat/performance, MyID integratsiyasi)
**Backend:** `tb.zerox.uz` (test) — mobil hozir shunga ulanadi

---

## Umumiy xulosa

| Yo'nalish | Ball | Holat |
|-----------|------|-------|
| 🔒 Kiberxavfsizlik | **46/100** | 15 topilma (0 critical · 4 high · 5 medium · 6 low) |
| 🐢 Performance/MyID | — | Asosiy sabab: `Connection: close` (37 fayl, ~80 marta) |
| 🧹 Kod-sifat | **41/100** | 24 topilma (8 high · 12 medium · 4 low) |

**Eng muhim 4 ta (darhol):** keystore parol, shifrlanmagan MMKV, cleartext traffic, socket TLS o'chiq. Bularni tuzatish ballни ~65-70 ga ko'taradi.

---

# 1-QISM. 🔒 KIBERXAVFSIZLIK (15 topilma)

## HIGH (4)

### V-001 — Release keystore paroli tracked faylda (`zerox2024`)
- **Joy:** `android/gradle.properties:50-53`
- **Muammo:** `MYAPP_UPLOAD_STORE_PASSWORD=zerox2024`, `MYAPP_UPLOAD_KEY_PASSWORD=zerox2024` — kuchsiz parol, git'da. Keystore fayli oqib ketsa, hujumchi haqiqiy ZeroX imzosi bilan soxta APK yaratadi.
- **✅ Yechim:**
  1. Bu qatorlarni `gradle.properties`dan o'chiring.
  2. Parolni `~/.gradle/gradle.properties` (untracked) yoki CI secret/env orqali bering.
  3. Keystore parolini kuchli tasodifiy qiymatga **rotatsiya** qiling.
  4. Git tarixini tekshiring — agar commit qilingan bo'lsa, `git filter-repo`/BFG bilan tozalang.

### V-002 — Sensitive ma'lumotlar shifrlanmagan MMKV'da (JWT, PIN, PINFL)
- **Joy:** `src/store/api/token/getToken.tsx:3`; PIN — `SetLocalPassword.tsx:110,124`; token — `LoginWithPhone.tsx:132`
- **Muammo:** `new MMKV({ id: 'storage' })` — `encryptionKey` YO'Q. JWT, **4-xonali PIN ochiq matnda** (k1/k2), telefon, user_id shifrlanmagan saqlanadi. Root/ADB-backup/forensika orqali `/data/data/com.zeroxuz/.../storage` ochiq o'qiladi → akkaunt egallash + literal PIN.
- **✅ Yechim:**
  1. MMKV'ni `encryptionKey` bilan init qiling; kalitni **Android Keystore / iOS Keychain** (`react-native-keychain`) da saqlang.
  2. PIN'ni **hech qachon ochiq saqlamang** — faqat salted-hash, yoki Keystore-bound kalit bilan gate qiling.
  3. JWT'ni MMKV o'rniga Keychain/Keystore'da saqlang.

### V-003 — Cleartext traffic yoniq (Android + iOS ATS o'chiq)
- **Joy:** `android/app/src/main/AndroidManifest.xml:36` (`usesCleartextTraffic="true"`); `ios/ZeroX/Info.plist:42-48` (`NSAllowsArbitraryLoads=true`)
- **Muammo:** Ikkala platformada ham ixtiyoriy HTTP ruxsat etilgan → MITM/`http://` downgrade'dan OS himoyasi olib tashlangan (token, to'lov trafigi).
- **✅ Yechim:**
  1. `usesCleartextTraffic="false"`.
  2. iOS'dan `NSAllowsArbitraryLoads` olib tashlang.
  3. Agar dev-host'ga HTTP kerak bo'lsa — Android `network-security-config` domain exception (faqat debug) + tor ATS exception.

### V-004 — Socket TLS tekshiruvi o'chiq + JWT URL query'da
- **Joy:** `src/helper/socketService.ts:98-114`
- **Muammo:** `secure:false`, `rejectUnauthorized:false` — sertifikat tekshirilmaydi → MITM token o'g'irlaydi. JWT `query:{token,id}` da (proxy/server loglariga tushadi).
- **✅ Yechim:**
  1. `secure:false` va `rejectUnauthorized:false` ni olib tashlang (TLS tekshirsin).
  2. Token'ni `query` o'rniga `auth:{ token }` handshake payload'da yuboring.
  3. Sertifikat pinning qo'shing.

## MEDIUM (5)

### V-005 — TLS sertifikat pinning umuman yo'q
- **Joy:** `src/store/api/**`, `src/hooks/useFetch.ts`
- **Muammo:** Barcha API bare axios; pinning yo'q → zararli root-CA o'rnatgan/MDM foydalanuvchi butun moliyaviy trafik + JWT'ni ushlaydi.
- **✅ Yechim:** `react-native-ssl-pinning` yoki native `network-security-config <pin-set>` (Android) + TrustKit/ATS pinning (iOS) `*.zerox.uz` uchun.

### V-006 — WebView'da server HTML → stored XSS
- **Joy:** `src/screens/other/NewsScreen.tsx:75-83` (`source={{html: ...description}}` + `javaScriptEnabled` + `domStorageEnabled`); ma'lumot `/news/get`
- **Muammo:** `news` API'dan sanitize'siz HTML JS-yoniq WebView'ga yuklanadi → `<script>` ishga tushishi mumkin.
- **✅ Yechim:** Server-side sanitize (DOMPurify) **YOKI** `javaScriptEnabled={false}` + qat'iy `originWhitelist`; ishonchsiz HTML uchun `domStorageEnabled` yoqmang.

### V-007 — PayMe callback shaxsiy `github.io` orqali
- **Joy:** `src/screens/other/Pay/Click.tsx:70` (`c: 'https://alisherrahimov.github.io/...'`)
- **Muammo:** To'lov-qaytish URL'i shaxsiy GitHub Pages'ga ishora qiladi (tashqi trust). Akkaunt egallansa/nom bo'shasa — to'lov tasdiqlash payti phishing.
- **✅ Yechim:** Redirect sahifani `*.zerox.uz` (HTTPS) da hosting qiling; haqiqiy crediting'ni provayder webhook'i (imzo bilan) hal qilsin.

### V-008 — App-lock PIN faqat client-side, bypass qilinadi
- **Joy:** `src/screens/auth/SetLocalPassword.tsx:104-202`
- **Muammo:** PIN solishtirish, 3-urinish hisoblagich, 30-daqiqa lockout — hammasi JS/MMKV'da. Biometrika "success" oddiy boolean (`appLocked=false`). MMKV tahrirlash / qurilma vaqtini surish / Frida bilan bypass. JWT esa baribir storage'da yaroqli.
- **✅ Yechim:** Unlock'ni **Keystore/Keychain kaliti** ga bog'lang (`BiometricPrompt.CryptoObject` / `setUserAuthenticationRequired`); JWT'ni faqat shu auth'dan keyin deshifr qiling. Brute-force lockout'ni serverga ko'chiring; monotonic/server vaqt ishlating.

### V-009 — Sensitive `console.log` (JWT, PINFL, balance, FCM token)
- **Joy:** `ScanFaceMyId.tsx:161` (JWT), `PayScreenForRecovery.tsx:33` (pinfl/uid), `socketService.ts`, `home/index.ts` — `__DEV__` guard yo'q; Hermes release `console.log`ni saqlaydi
- **Muammo:** `adb logcat`/crash-capture orqali token + PII oqadi.
- **✅ Yechim:** Sensitive `console.*` olib tashlang; barchasini `if (__DEV__)` ostiga oling; release uchun babel `transform-remove-console` qo'shing.

## LOW (6)

### V-010 — Firebase API kalitlari commit qilingan
- **Joy:** `android/app/google-services.json`, `ios/GoogleService-Info.plist`
- **Muammo:** Client-distributed identifikatorlar (sir emas), lekin cheklanmagan bo'lsa quota abuse.
- **✅ Yechim:** Google Cloud'da kalitni package-name + SHA-256 imzo bilan cheklang; faqat ishlatilgan Firebase API'larga scope; **App Check** yoqing.

### V-011 — Release obfuscation yo'q (ProGuard/R8 o'chiq) + root-detection yo'q
- **Joy:** `android/app/build.gradle:63` (`enableProguardInReleaseBuilds = false`)
- **✅ Yechim:** Release uchun R8 minify+shrink (keep-rules bilan); `JailMonkey` root/jailbreak/emulator detection; **Play Integrity / DeviceCheck** attestatsiya.

### V-012 — Screenshot himoyasi yo'q (kutubxona bor-u ishlatilmagan)
- **Joy:** `react-native-capture-protection` o'rnatilgan, lekin `src/`da chaqirilmagan
- **✅ Yechim:** PIN, MyID, balans, to'lov ekranlarida `FLAG_SECURE` (Android) / capture-protection blur yoqing.

### V-013 — MyID `clientHash`/`clientHashId` embed
- **Joy:** `ScanFaceMyId.tsx:263-278`
- **Muammo:** Bular **public** RSA kalit/UUID — zarar cheklangan (informational). ✅ Ijobiy: MyID session server-side yaratiladi, natija server-side tekshiriladi.
- **✅ Yechim:** `clientHashId`/environment'ni backend-issued config'ga ko'chiring; server MyID-tasdiqlangan shaxs (PINFL) autentifikatsiyalangan akkaunt bilan mos kelishini tekshirsin.

### V-014 — Exported deep-link → balans refetch
- **Joy:** `AndroidManifest.xml:52-97`, `App.tsx:105-129`
- **Muammo:** `zeroxuz://UserMoneyResult` har kim chaqira oladi → `getMe()`. Lekin **pul soxtalashtirilmaydi** (crediting server-gated). Faqat UI-spoofing.
- **✅ Yechim:** Deep-link inputni ishonchsiz deb hisoblang; server-tasdiqlangan tranzaksiya ref'isiz to'lov-tasdiq UI ko'rsatmang.

### V-015 — Ortiqcha location permission (iOS)
- **Joy:** `ios/Info.plist:49-56`
- **✅ Yechim:** Location ishlatilmasa — `NSLocationWhenInUseUsageDescription`ni olib tashlang.

---

# 2-QISM. 🐢 PERFORMANCE & MyID

## P-001 — `Connection: 'close'` (BUTUN ILOVA) — sekinlikning ASOSIY sababi 🔴
- **Joy:** `src/store/api/auth/index.ts` (×5), `src/store/api/home/index.ts` (×10+), `ScanFaceMyId.tsx` (×2) — deyarli har axios so'rovida
- **Muammo:** HTTP **keep-alive o'chadi** → har so'rovda yangi TCP + to'liq **TLS handshake** (~100-300ms mobil tarmoqda). Butun ilova sekin, MyID ham.
- **✅ Yechim:** `Connection: 'close'` header'ini **olib tashlang** (keep-alive ulanishni qayta ishlatsin). ⚠️ Test qiling — bu eski "socket hang up" workaround bo'lishi mumkin; agar shunday bo'lsa, backend `keepAliveTimeout`ini (express `server.keepAliveTimeout`) to'g'rilang.

## P-002 — MyID: bloklovchi ketma-ket sessiya olish
- **Joy:** `ScanFaceMyId.tsx:255-282` (`await getSessionId()` → `start()`)
- **Muammo:** Kamera backend session javobini kutib turadi.
- **✅ Yechim:** Sessiyani ekran focus'da **oldindan oling** (pre-fetch), tugma bosilganda tayyor tursin. Sessiya muddati qisqa bo'lsa — qisqa freshness oynasi bilan.

## P-003 — MyID/network: timeout yo'q
- **Joy:** `ScanFaceMyId.tsx:164,194` (session/isactivate axios)
- **Muammo:** Backend osilsa user abadiy kutadi.
- **✅ Yechim:** `timeout: 15000` + aniq xato xabari + retry tugmasi.

## P-004 — Dead SANDBOX config + token log
- **Joy:** `ScanFaceMyId.tsx:270-278` (`test` config ishlatilmaydi), `:161` (`console.log(token)`)
- **✅ Yechim:** Dead `test` config'ni va token log'ni olib tashlang.

## P-005 — Mobil test backend'da
- **Joy:** `src/screens/constants.ts:7` (`tb.zerox.uz` aktiv, `app.zerox.uz` comment)
- **✅ Yechim:** Release uchun `app.zerox.uz`ga o'tkazing (env-based config tavsiya etiladi).

### ✅ MyID integratsiyasi — to'g'ri qurilgan jihatlar
Backend `myid.service.js`: client token **cache'langan** (80% TTL) + thundering-herd coalescing + retry + timeout + instrumentatsiya. Session server-side yaratiladi, natija server-side tekshiriladi. **Backend sekinlik manbai emas.**

---

# 3-QISM. 🧹 KOD-SIFAT, ARXITEKTURA & PERFORMANCE (24 topilma, 41/100)

## Performance (HIGH)

### C-001 — `Connection: 'close'` ~80 marta → keep-alive o'lik (sekinlikning #1 sababi)
- **Joy:** 37 fayl (`home/index.ts` ×21, `auth/index.ts` ×5, `Notification.tsx` ×5, `useFetch.ts`, +25 ekran). Home ekrani 4 ta parallel so'rov yuboradi — har biri yangi TLS handshake.
- **✅ Yechim:** Header'ni hammadan olib tashlang; **bitta umumiy axios instance** (`apiClient`) + auth interceptor; keep-alive default ishlasin. ⚠️ Test qiling (server/nginx keep-alive'ni to'g'ri qo'llashini tekshiring), flag ortida chiqaring, latency'ni o'lchang.

### C-002 — Umumiy axios yo'q, cache yo'q, over-fetch
- **Joy:** `store/api/*`; 3 ta deyarli bir xil "home" thunk; socket har `realTimeChange`da 3-so'rov refetch; notification `?limit=500` (bloklovchi)
- **✅ Yechim:** **RTK Query** (allaqachon `@reduxjs/toolkit` 2.9) — cache/dedup/auto-invalidate; notification'ni paginate qiling.

### C-003 — 305 `console.log` production'da (babel strip yo'q)
- **Joy:** 85 fayl; `socketService.ts` ×46; **har render'da** log: `StatisticCard.tsx:57`, `DebitorList.tsx:19`. `babel.config.js`da strip yo'q
- **✅ Yechim:** `babel.config.js` `env.production.plugins`ga `'transform-remove-console'` (error/warn qoldirib); render-ichidagi loglarni darhol o'chiring.

### C-004 — Ikkinchi socket import paytida ulanadi
- **Joy:** `src/screens/constants.ts:10` (`export const socket = io(SOCKET_URL)`) — `socketService` singleton'dan ALOHIDA, hech kim tozalamaydi
- **✅ Yechim:** Bu `socket` export'ini o'chiring; barcha realtime'ni `socketService` orqali.

### C-005 — `new Animated.Value()` har render'da
- **Joy:** `Home.tsx:53-54`, `Slider.tsx`/`StatisticCard`
- **✅ Yechim:** `useRef(new Animated.Value(0)).current`.

### C-006/C-007 — FlatList row'lari memoize qilinmagan; ko'p list `.map()`/nested ScrollView
- **Joy:** `Notification.tsx:802`, `StatisticCard.tsx:157`; faqat 4 fayl FlatList; `Home.tsx` horizontal ScrollView vertical ichida
- **✅ Yechim:** `React.memo` row + stabil `keyExtractor` (item.id) + hoist separator/empty; uzun listlarni FlatList'ga; carousel'ni `react-native-pager-view`ga.

### C-008 — `useFetch` debounce bug → har harfda so'rov; cancel yo'q
- **Joy:** `SearchDebitor.tsx:37-58`, `hooks/useFetch.ts` (`setTimeout` `clearTimeout`siz, `AbortController` yo'q)
- **✅ Yechim:** To'g'ri debounce (oldingi timer'ni clear) + `AbortController` cancel-on-change.

## Arxitektura

### C-009 — `socketService.ts` 1069-qatorli God-class
- **Joy:** socket + notification + Redux + USD-math + **540-qatorli `returnzBody` switch** (ikki branch'da takrorlangan); ekran modullarini import qiladi (layering inversion)
- **✅ Yechim:** `SocketClient` (transport) + `notificationFormatter` (toza, type-jadval) + money util'ga ajrating; ekran import'larini olib tashlang.

### C-010 — God-screens (biznes-mantiq render ichida)
- **Joy:** `Notification.tsx` (907), `Home.tsx` (629), `LoginWithPhone.tsx` (500) — inline async handlerlar + qo'lda request body
- **✅ Yechim:** API'ni thunk/`store/api`ga ko'chiring; action-hook'larga ajrating; ekranlar presentational bo'lsin.

### C-011/C-012/C-013 — API duplikatsiya · 70+ flat navigator (index key + render-log) · vendored crypto (`Engine.ts` 527q)
- **✅ Yechim:** Endpoint'larni markazlashtiring + slice state'ni type qiling · `AuthStack`/`AppStack`ga bo'ling, `name` bo'yicha key, debug log o'chirish · `Engine.ts`ni `vendor/`ga, lint/coverage'dan chiqaring.

## Kod-sifat

### C-014 — Dead/comment kod + test-fayllar production'da
- **Joy:** `Home.tsx:151-230`, `Notification.tsx`, `constants.ts`; `Test.tsx`, `EimzoScreenTest.tsx`, `TestText` route
- **✅ Yechim:** O'chiring (git tarix saqlaydi).

### C-015 — Magic string/number (yarim refactor)
- **Joy:** `constants/index.ts` toza, lekin kod hali raw literal (`storage.getString('token')`, `'k2'`, `sortMoney` magic ranges). Ikki parallel constants fayl
- **✅ Yechim:** Constants modulini izchil ishlating; ikki faylni birlashtiring.

### C-016 — `any` + zaif typing (lekin `@ts-ignore`=0 ✅)
- **Joy:** 28+ `any`; thunk state untyped; `useAppSelector` kam ishlatiladi
- **✅ Yechim:** Thunk payload + socket data'ni type qiling; `useAppSelector`/`useAppDispatch`ni hamma joyda.

### C-017 — Error swallowing + crash xavfi
- **Joy:** `home/index.ts` 12 thunk faqat `console.log` + `undefined` qaytaradi; `HomeApi:57` `rejectWithValue` `return`siz va network-error'da `error.response` undefined → ikkilamchi crash
- **✅ Yechim:** `error.response`ni guard qiling; user-facing error state; `return rejectWithValue(...)`.

### C-018 — Hardcoded (non-i18n) string · C-019 — Ishlatilmagan deps
- **✅ Yechim:** Barcha ko'rinadigan string'ni i18n key'ga · `react-native-push-notification` + `deprecated-react-native-prop-types` (src'da import yo'q) — tasdiqlab olib tashlang.

## Correctness bug'lar

### C-020 — Stale closure → notification accept/reject NOTO'G'RI parametr yuborishi mumkin 🔴
- **Joy:** `Notification.tsx:792` (`renderItems` `useCallback([])` lekin `okay/onSuccess/user`ni o'qiydi), `:323` (`onSuccess` `[]` lekin `user.data.id`)
- **Nega muhim:** Moliyaviy ilovada qarz amalida noto'g'ri `reciver`/`sender`/`user.id` yuborilishi mumkin (intermittent).
- **✅ Yechim:** To'g'ri dep array (yoki ataylab ref + izoh).

### C-021 — `ToastWrapper` render ichida `memo()` → har render remount
- **Joy:** `App.tsx:136`
- **✅ Yechim:** Module-scope'ga chiqaring (yoki to'g'ridan `<Toast config={...}/>`).

### C-022 — `Enter` declare'dan oldin ishlatiladi (TDZ) → startup crash xavfi
- **Joy:** `App.tsx:139` `<Enter/>` ishlatadi, `const Enter` `:185`da. Birinchi render'da `isLoading=true` → "Cannot access 'Enter' before initialization" mumkin
- **✅ Yechim:** `Enter`ni `function` declaration qiling yoki `App`'dan yuqoriga ko'chiring.

### C-023 — Pull-to-refresh 2s fixed timer (so'rovni kutmaydi) · C-024 — `Connection` request BODY'da
- **Joy:** `Home.tsx:264` · `home/index.ts:213` (`data:{device_id, Connection:'close'}`)
- **✅ Yechim:** `await dispatch(...).unwrap()` keyin refreshing'ni o'chirish · body'dagi `Connection`'ni olib tashlash.

---

# PRIORITETLI HARAKAT REJASI

### 🔴 Darhol (1-2 kun — past tavakkal, katta ta'sir)
| # | Ish | Manba |
|---|-----|-------|
| 1 | `Connection: close` olib tashlash + bitta `apiClient` + interceptor (test bilan) — **butun ilova tezlashadi** | C-001, C-024, P-001 |
| 2 | `transform-remove-console` (babel prod) + render-ichi loglarni o'chirish | C-003, V-009 |
| 3 | `constants.ts:10` ikkinchi socket + `App.tsx` `ToastWrapper`-in-render o'chirish | C-004, C-021 |
| 4 | `App.tsx` TDZ (`Enter`) tuzatish — startup crash | C-022 |
| 5 | Keystore parol → env/CI + rotatsiya | V-001 |
| 6 | MMKV `encryptionKey` + PIN hash | V-002 |
| 7 | Cleartext traffic o'chirish · socket TLS tekshiruv + token `auth:{}` | V-003, V-004 |

### 🟠 Qisqa muddat (1 hafta)
- **Performance:** RTK Query/cache (C-002) · FlatList memoize + virtualizatsiya (C-006/007) · search debounce+cancel (C-008) · MyID session pre-fetch + timeout (P-002, P-003) · `Animated.Value` useRef (C-005)
- **Xavfsizlik:** cert pinning (V-005) · WebView sanitize (V-006) · app-lock Keystore-bound (V-008) · redirect domeni (V-007)
- **Correctness:** stale-closure dep array (C-020) · error guard + rejectWithValue (C-017)

### 🟡 O'rta muddat
- God-class/God-screen refactor (C-009, C-010) · API markazlashtirish + typing (C-011, C-016) · dead/test kod tozalash (C-014) · i18n (C-018) · unused deps (C-019) · navigation bo'lish (C-012)
- V-010 Firebase kalit cheklash + App Check · V-011 R8 + root-detection · V-012 screenshot himoyasi

---

## Yakuniy baho

| Yo'nalish | Ball | Eng kritik |
|-----------|------|-----------|
| Xavfsizlik | 46/100 | Shifrlanmagan MMKV (JWT+PIN), keystore parol, cleartext, socket TLS |
| Kod-sifat | 41/100 | `Connection:close` ×80, 305 log, stale-closure, God-class |
| MyID | — | `Connection:close` (sekinlik), backend o'zi optimal |

**Realistik shift:** yuqoridagi 7 ta "darhol" ishni qilish — sezilarli tezlanish + xavfsizlik ballini ~65-70, kod-sifatni ~60 ga ko'taradi. Aksariyat eng-ta'sirli muammolar **mexanik** (find/replace, config) — past tavakkal.

---

*Hisobot: 3 yo'nalishli professional audit (kiberxavfsizlik agenti + Ruflo kod-sifat agenti + MyID qo'lda chuqur tahlil). Har topilma manbaga tekshirilgan; har biriga aniq yechim berilgan.*
