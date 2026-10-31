// Build-vaqtida server tanlovi. Standart: false (RELEASE build -> PRODUCTION app.zerox.uz).
// Ichki TEST release build uchun: `npm run deploy:test` (scripts/set-host.js bu faylni vaqtincha
// true qiladi va build'dan keyin false'ga qaytaradi). Bu fayl HECH QACHON true holda commit qilinmaydi
// (scripts/check-release-host.js deploy/publish/google oldidan tekshiradi).
export const USE_TEST_HOST_IN_RELEASE = false;
