# Parol tiklash — App oqimi + Backend API spetsifikatsiyasi

> **Asosiy tamoyil (YANGILANGAN):** parol tiklash foydalanuvchi holatiga qarab **IKKI xil** yo'l bilan:
> - **Identifikatsiyadan O'TGAN** (PINFL bor, `check-user` → `code 2`) → **JSHSHIR + MyID** yuz-identifikatsiyasi (xavfsiz).
> - **Identifikatsiyadan O'TMAGAN** (PINFL yo'q, `check-user` → `code 1`) → **SMS** orqali tiklash.

Ushbu hujjat ZeroX mobil ilovasidagi parol-tiklash oqimini va u chaqiradigan backend API'larni tavsiflaydi. Backend dasturchi shu kontraktni implementatsiya qilishi kerak.

---

## 1. App oqimi (ekranma-ekran)

```
LoginWithPhone ("Parolni unutdingizmi?")
   │
   ▼
① UpdatePasswordWithJshir     — foydalanuvchi telefon raqamini kiritadi
   │  POST /user/check-user
   │      ├── code 2 (PINFL bor, identifikatsiyadan O'TGAN) ──────────► MyID YO'LI (A)
   │      ├── code 1 (PINFL yo'q, identifikatsiyadan O'TMAGAN) ───────► SMS YO'LI (B)
   │      └── code 0 (ro'yxatdan o'tmagan) → xato
   │
   │  ══════════ YO'L A: JSHSHIR + MyID (identifikatsiyadan o'tgan) ══════════
   ▼
② EnterJsh                     — JSHSHIR (14 xonali PINFL) kiritadi
   │  POST /user/askjshshir/init       → success + reset_token
   ▼
③ MyIdScreen                   — reset_token bilan MyID sessiya, so'ng kamera
   │  POST /user/askjshshir/myid-session → sessionId (+ pinflBound)
   │  MyID SDK (entryType: IDENTIFICATION, yuz)  → code
   ▼
④ UpdatePassword               — yangi parolni kiritadi
   │  POST /user/askjshshir/complete   → success
   ▼
   LoginWithPhone (reset)

   ══════════ YO'L B: SMS (identifikatsiyadan o'tmagan) ══════════
   ▼
② RecoverySmsReset             — ochilganda SMS yuboriladi; kod + yangi parol kiritiladi
   │  POST /user/recovery/send-sms     → success (SMS yuboriladi)
   │  POST /user/recovery/verify-sms   → success (kod tekshiriladi + parol o'rnatiladi)
   ▼
   LoginWithPhone (reset)
```

**Navigatsiya qoidalari:**
- `check-user` → `code === 2` → **EnterJsh** (MyID yo'li A).
- `check-user` → `code === 1` → **RecoverySmsReset** (SMS yo'li B).
- **YO'L A:** `askjshshir/init` → `reset_token` → **MyIdScreen** → `myid_code` → **UpdatePassword** → `complete` → **LoginWithPhone**.
- **YO'L B:** **RecoverySmsReset** ochilganda `send-sms`, so'ng kod+parol → `verify-sms` → **LoginWithPhone**.

---

## 2. Backend API kontrakti

Barcha so'rovlar `Content-Type: application/json`. `<BASE_URL>` — API bazaviy manzili.

### 2.1. `POST /user/check-user`
**Vazifa:** telefon raqami ro'yxatdan o'tganini va PINFL holatini tekshirish.

- **Auth:** yo'q
- **So'rov tanasi:**
  ```json
  {
    "phone": "+998901234567",
    "lang": "uz",
    "type": 2
  }
  ```
- **Javob:**
  ```json
  { "code": 2 }
  ```
  | `code` | Ma'nosi | App harakati |
  |--------|---------|--------------|
  | `0` | Telefon ro'yxatdan o'tmagan | Xato ko'rsatiladi (registratsiya taklif etilmaydi) |
  | `1` | Foydalanuvchi bor, PINFL yo'q | **EnterJsh**ga o'tadi |
  | `2` | Foydalanuvchi bor, PINFL bor | **EnterJsh**ga o'tadi |
  | `3` | Server xatosi | Xato ko'rsatiladi |

---

### 2.2. `POST /user/askjshshir/init`
**Vazifa:** JSHSHIR ↔ telefon mosligini tekshirish va tiklash sessiyasini ochish.

- **Auth:** yo'q
- **So'rov tanasi:**
  ```json
  {
    "jshshir": "12345678901234",
    "phone": "+998901234567",
    "lang": "uz"
  }
  ```
- **Muvaffaqiyatli javob:**
  ```json
  {
    "success": true,
    "reset_token": "<qisqa muddatli JWT>"
  }
  ```
- **Xato javoblari:**
  ```json
  { "success": false, "code": 2 }   // JSHSHIR noto'g'ri kiritilgan
  { "success": false, "code": 0 }   // topilmadi / telefonga mos emas
  ```
- **Backend logikasi:**
  - JSHSHIR (PINFL) berilgan telefon raqamiga tegishli ekanini tekshirish.
  - Muvaffaqiyatli bo'lsa, **qisqa muddatli `reset_token`** (JWT) yaratish — bu token PINFL'ga bog'langan bo'lishi va faqat shu tiklash oqimida ishlashi kerak.
  - `reset_token` keyingi ikki chaqiruvda (`myid-session`, `complete`) `Bearer` sifatida ishlatiladi.

---

### 2.3. `POST /user/askjshshir/myid-session`
**Vazifa:** PINFL'ga bog'langan (PINFL-bound) MyID sessiyasini olish.

- **Auth:** `Authorization: Bearer <reset_token>`
- **So'rov tanasi:**
  ```json
  { "method": "face" }
  ```
- **Muvaffaqiyatli javob:**
  ```json
  {
    "success": true,
    "sessionId": "<MyID session id>",
    "pinflBound": true
  }
  ```
- **Xato javoblari:**
  ```json
  { "success": false, "error": "myid-bind-failed" }
  { "success": false, "error": "invalid-or-expired-token" }   // yoki HTTP 401
  ```
- **Backend logikasi:**
  - `reset_token`ni tekshirish (yaroqsiz/eskirgan bo'lsa `401`).
  - MyID API'дан yangi sessiya olish.
  - Foydalanuvchi PINFL'ini MyID sessiyaga **bind** qilish. `pinflBound: true` bo'lsa MyID hujjat so'ramaydi → to'g'ridan-to'g'ri **1:1 yuz mosligi** → tez. `false` bo'lsa MyID hujjat so'raydi (sekinroq).

---

### 2.4. MyID SDK (mobil ilova tomonida — kamera)
`sessionId` bilan MyID SDK **`entryType: IDENTIFICATION`** rejimida ishga tushadi (kamera ochiladi, yuz tekshiriladi).

- Muvaffaqiyatli bo'lsa SDK `{ code: "<myid_code>" }` qaytaradi.
- ⚠️ `FACE_DETECTION` rejimi ishlatilmaydi — u faqat selfi oladi, `code` bermaydi, shuning uchun backend tasdiqlay olmaydi.

Konfiguratsiya (ilova tomonida): `sessionId`, `clientHash`, `clientHashId`, `environment: PRODUCTION`, `entryType: IDENTIFICATION`, `cameraShape: CIRCLE`, `locale`.

---

### 2.5. `POST /user/askjshshir/complete`
**Vazifa:** MyID kodini tekshirish **va** yangi parolni o'rnatish (bitta chaqiruvda).

- **Auth:** `Authorization: Bearer <reset_token>`
- **So'rov tanasi:**
  ```json
  {
    "myid_code": "<MyID SDK qaytargan code>",
    "new_password": "<yangi parol>"
  }
  ```
- **Muvaffaqiyatli javob:**
  ```json
  { "success": true }
  ```
- **Xato javobi:**
  ```json
  { "success": false, "code": 1 }
  ```
- **Backend logikasi:**
  - `reset_token`ni tekshirish.
  - MyID `code`ni MyID backend'da tekshirish — qaytgan PINFL `reset_token`dagi PINFL bilan mos kelishini tasdiqlash.
  - Mos bo'lsa: yangi parolni **hash** qilib saqlash.
  - Bu bitta endpoint eski `/myidchecking` + `/updatePassword` juftligining o'rnini bosadi.

---

---

## 2B. SMS YO'LI endpointlari (identifikatsiyadan O'TMAGAN — `code 1`)

> ✅ **Backend'da IMPLEMENTATSIYA QILINDI** — `controllers/smsRecovery.controller.js` + `router/router/user.router.js`. FAQAT `pinfl == null` foydalanuvchi uchun (pinfl bor bo'lsa `code 3 use-myid` qaytaradi).

### 2B.1. `POST /user/recovery/send-sms`
**Vazifa:** tiklash uchun bir martalik SMS kod yaratish va yuborish.
- **Auth:** yo'q (`smsLimiter` + `ipRateLimiter` — SMS bombing himoyasi)
- **Body:** `{ "phone": "+998901234567", "lang": "uz" }`
- **Javob:** `{ "success": true }` yoki `{ "success": false, "code": <0|3|5|6> }`
  - `0` user topilmadi · `3` pinfl bor → MyID kerak · `5` server xato · `6` phone yo'q
- **Logika:** user topiladi → `pinfl != null` bo'lsa rad → `generateVerificationCode()` → `code` + `code_expired` (3 daqiqa, `getCodeExpiration(3)`) saqlanadi → `SMS(phone, generateSMSText(lang, code))`.

### 2B.2. `POST /user/recovery/verify-sms`
**Vazifa:** SMS kodni tekshirish **va** yangi parolni o'rnatish.
- **Auth:** yo'q (`authLimiter` + `ipRateLimiter`)
- **Body:** `{ "phone": "+998901234567", "code": "12345", "new_password": "<yangi parol>" }`
- **Javob:** `{ "success": true }` yoki `{ "success": false, "code": <0|1|2|3|4> }`
  - `1` kod noto'g'ri · `2` kod muddati tugagan · `0` user yo'q · `3` MyID kerak · `4` zaif parol (<8)
- **Logika:** muddat (`Date.now() > code_expired`) → kod (`Number(user.code) === Number(code)`) → parol kuchi (≥8) → `bcrypt.hash(new_password, 12)` → `password` yangilanadi, `code`/`code_expired` **tozalanadi** (bir martalik).

---

### 2.6. `POST /user/askjshshir` — to'lov tarmog'i (ixtiyoriy)
> Hozir asosiy oqimда o'chirilgan (EnterJsh'da kommentда). Balans/to'lov talab qilinsa ishlatiladi.

- **So'rov tanasi:** `{ "jshshir": "<pinfl>" }`
- **Javob:** `{ "success": true }` — hisobда yetarli mablag' bo'lmasa `false`.

---

## 3. Muhim texnik jihatlar

- **`reset_token` — oqimning o'zagi.** `init` uni yaratadi; `myid-session` va `complete` uni `Bearer` header'da talab qiladi. Qisqa muddatli (masalan 5–10 daqiqa) va PINFL'ga bog'langan bo'lishi kerak. Eskirsa `401` / `invalid-or-expired-token`.
- **PINFL-bound MyID** — foydalanuvchi PINFL'ini MyID sessiyaga bog'lash hujjat-skanerlashni chetlab o'tadi (1:1 yuz mosligi) → tezroq va ishonchliroq.
- **IDENTIFICATION majburiy** — `code` faqat shu rejimda qaytadi; backend tasdiqlash uchun aynan shu `code` kerak.
- **Xavfsizlik:** parol backend'da hash qilinadi; `reset_token` bir martalik/qisqa muddatli; MyID `code` PINFL bilan solishtiriladi.

## 4. Eski/ishlatilmayotgan yo'llar (e'tibor uchun)

- `RecoveryPassword.tsx` → `POST /user/edit/password` — **eski, alohida** tiklash oqimi (JSHSHIR-siz). Hozirgi asosiy oqimда ishlatilmaydi.
- `InfoForUser`, `Inforamation`, `PayFor`, `PayScreenForRecovery` ekranlari (2000/2500 so'm to'lov ogohlantirishi bilan) — hozir kommentда; asosiy oqim to'g'ridan-to'g'ri MyID'ga o'tadi.

---

## 5. Endpointlar jamlanmasi

| # | Method | Endpoint | Auth | Asosiy natija |
|---|--------|----------|------|---------------|
| 1 | POST | `/user/check-user` | — | `code` (0/1/2/3) |
| 2 | POST | `/user/askjshshir/init` | — | `success` + `reset_token` |
| 3 | POST | `/user/askjshshir/myid-session` | Bearer reset_token | `sessionId` + `pinflBound` |
| 4 | — | MyID SDK (IDENTIFICATION) | sessionId | `code` |
| 5 | POST | `/user/askjshshir/complete` | Bearer reset_token | `success` |
| 6 | POST | `/user/askjshshir` (ixtiyoriy) | — | `success` (balans) |
| **B1** | POST | **`/user/recovery/send-sms`** (SMS yo'li) | — | `success` (SMS yuboriladi) ✅ implementatsiya |
| **B2** | POST | **`/user/recovery/verify-sms`** (SMS yo'li) | — | `success` (kod+parol) ✅ implementatsiya |
