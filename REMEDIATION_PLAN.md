# ZeroX Mobile — Tuzatish Rejasi (Remediation Plan)

> Audit topilmalari (`AUDIT_REPORT.md`) asosida. Bosqichlar **xavf ↑ / ta'sir ↓** tartibida — eng xavfsiz va eng katta foydadan boshlanadi. Har fix manba-faylga aniq bog'langan. Git'ga push qilinmaydi (review uchun working tree'da to'planadi).

---

## FAZA 1 — Tezkor + XAVFSIZ (crash fix + cleanup, regression yo'q)
**Maqsad:** latent crash'lar + keraksiz overhead'ni nol-tavakkal bilan olib tashlash.

| # | Ish | Fayl | Manba |
|---|-----|------|-------|
| 1.1 | TDZ tuzatish — `Enter`ni `function` qilish yoki yuqoriga | `App.tsx:139,185` | C-022 |
| 1.2 | `ToastWrapper`ni module-scope'ga (render-ichi `memo` o'rniga) | `App.tsx:136` | C-021 |
| 1.3 | Import paytida ulanadigan ikkinchi socket'ni o'chirish | `src/screens/constants.ts:10` | C-004 |
| 1.4 | babel `transform-remove-console` (prod) + render-ichi loglar | `babel.config.js`, `StatisticCard.tsx:57`, `DebitorList.tsx:19` | C-003 |
| 1.5 | Token log + dead SANDBOX config o'chirish | `ScanFaceMyId.tsx:161,270-278` | V-009, P-004 |
| 1.6 | Request BODY'dagi `Connection:'close'`ni olib tashlash | `store/api/home/index.ts:213` | C-024 |

**Test:** ilova ishga tushadi (TDZ), Toast ko'rinadi, socket bitta, MyID ishlaydi.

---

## FAZA 2 — `Connection: close` → bitta `apiClient` (eng katta PERFORMANCE) ⚠️
**Maqsad:** keep-alive'ni tiklash → butun ilova tezlashadi. **EHTIYOT** — kengmiqyosli.

1. **`src/store/api/apiClient.ts`** yaratish — `axios.create({ baseURL: URL, timeout })` + request interceptor (auth token) + response interceptor (xato normalize).
2. Barcha `Connection: 'close'` header'larini olib tashlash (37 fayl, ~80 joy).
3. Call-site'larni `apiClient`ga ko'chirish (yoki kamida header'ni olib tashlash).
4. **Backend tekshiruvi:** express `server.keepAliveTimeout` / nginx `keepalive` to'g'ri sozlanganmi — `Connection:close` eski workaround bo'lsa, avval shuni to'g'rilash.

**Test:** real qurilmada API latency oldin/keyin o'lchash; "socket hang up" yo'qligini tasdiqlash. Bosqichma-bosqich (avval bitta modul) chiqarish.

---

## FAZA 3 — XAVFSIZLIK: config + storage (HIGH)
| # | Ish | Fayl | Manba |
|---|-----|------|-------|
| 3.1 | Keystore parol → `~/.gradle`/CI + rotatsiya | `android/gradle.properties:50` | V-001 |
| 3.2 | Cleartext traffic o'chirish (Android+iOS) | `AndroidManifest.xml:36`, `Info.plist:42` | V-003 |
| 3.3 | Socket TLS tekshiruv yoqish + token `auth:{}` | `socketService.ts:98` | V-004 |
| 3.4 | MMKV `encryptionKey` (Keystore/Keychain) + PIN hash | `getToken.tsx`, `SetLocalPassword.tsx` | V-002 |

**Test:** login/PIN/biometrika, socket realtime, network ishlashi (cleartext'siz).

---

## FAZA 4 — PERFORMANCE + CORRECTNESS
| # | Ish | Manba |
|---|-----|-------|
| 4.1 | Stale-closure dep array tuzatish (qarz amali xavfi) | C-020 |
| 4.2 | Error guard + `return rejectWithValue` (crash + swallow) | C-017 |
| 4.3 | `Animated.Value` → `useRef` | C-005 |
| 4.4 | Search debounce + `AbortController` | C-008 |
| 4.5 | FlatList row memoize + stabil key | C-006/007 |
| 4.6 | MyID session pre-fetch + timeout | P-002, P-003 |
| 4.7 | Pull-to-refresh `await unwrap()` | C-023 |
| 4.8 | Cache/dedup (RTK Query yoki coalesce) + notification paginate | C-002 |

---

## FAZA 5 — XAVFSIZLIK (qolgan) + ARXITEKTURA
- V-005 cert pinning · V-006 WebView sanitize · V-008 app-lock Keystore-bound · V-007 redirect domeni · V-010 Firebase cheklash + App Check · V-011 R8 + root-detection · V-012 screenshot himoyasi
- C-009 socketService bo'lish · C-010 God-screen refactor · C-011 API markazlashtirish · C-012 navigation bo'lish · C-014 dead/test kod · C-015 constants · C-016 typing · C-018 i18n · C-019 unused deps · P-005 prod URL

---

## Tartib
1. **Faza 1** (bugun, men) — xavfsiz, darhol.
2. **Faza 2** — apiClient (backend keep-alive tekshirilgach).
3. **Faza 3** — xavfsizlik config/storage.
4. **Faza 4-5** — bosqichma-bosqich.

*Har fix `tsc`/compile + qo'lda test bilan; ishlayotgan auth/to'lov/MyID buzilmaydi.*
