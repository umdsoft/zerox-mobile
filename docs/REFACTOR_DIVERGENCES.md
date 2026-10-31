# Refaktoring: birlashtirilmagan (natijasi farq qiladigan) nusxalar

> 01.11 YANGILANISH: quyidagi barcha xatolar tuzatildi (egasi tasdiqlagan): sanalar Toshkent kuni bo'yicha (qurilma TZ'ga bog'liq emas),
> num/sumCur chekli va xavfsiz, `HomeRedesign.sumCur` USD tsentni saqlaydi, soat-siljish kuzatuvi `apiClient` ga o'rnatildi,
> `RecoverySmsReset` taymeri deadline asosida (`useCountdown`). Isbot: `__tests__/refactor_tz_proof.test.ts` (golden: `refactor_golden_pre.json` = tuzatishdan oldingi).
> Faqat `sumByCur`, `formatThousands`, `formatMln` ataylab alohida qoldi. Quyidagi matn — TARIXIY tavsif.

2026-11-01, DRY 1-bosqich. Quyidagilar umumiy helperdan farqli natija beradi va ataylab o'zgartirilmadi
(foydalanuvchi ko'radigan xulq saqlansin). Xulq `__tests__/refactor_characterization.test.ts` va
`__tests__/fixtures/refactor_golden.json` da (Tashkent, UTC, EST5EDT) qayd etilgan.

## Sana
- `fmtLocalDate*` oilasi (QarzDaftariAmaliyot, Amaliyotlar, Mijoz, SearchUserScreen, DebtDateLengthAsk) —
  qurilmaning lokal vaqt mintaqasi bo'yicha formatlaydi: UTC+5 dan g'arbdagi qurilmada `'2026-10-31'` → `30.10.2026`
  (bir kun erta). Toshkentdagi qurilmalarda to'g'ri.
- `debtAllocation.ymdOf` — zonasiz `'2026-10-31T21:00:00'` uchun `tkYmdOf` dan farq qiladi.
- `StatisticCard` holat funksiyasi va `financeMoney.parseLocalDate` — lokal TZ va +5 soat aralash.
- `financeDebtGroups.daysLeft` — g'arbiy TZ'da "bugun" uchun -1.

## Raqam / pul
- `num`: `smsPools` (`Infinity` qoladi, `-0` → 0), `financeMoney` (`Infinity` qoladi), `QarzShartnomasi`
  (`'abc'`, `'1 234,50'` → NaN).
- `QarzShartnomasi.sumCur` — NaN yoki `[null]` da TypeError; `HomeRedesign.sumCur` butun songa yaxlitlaydi (USD 10.7 → 11).
- `sumByCur` (shakli `{uzs, usd}`), `formatThousands` (`'0012'` → `'0 012'`), `formatMln` (`compactMoney` dan farqli).

## Alohida o'zgarish sifatida qoldirilgan (xulqni o'zgartiradi)
- `apiClient` ga soat-siljish kuzatuvini o'rnatish.
- `RecoverySmsReset` taymerini deadline asosiga o'tkazish (fonga o'tib qaytganda aniq vaqt).
