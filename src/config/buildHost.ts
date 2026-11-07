// Build-vaqtida server tanlovi. Standart: false (RELEASE build -> PRODUCTION app.zerox.uz).
// Ichki TEST release build uchun: `npm run deploy:test` (scripts/set-host.js bu faylni vaqtincha
// true qiladi va build'dan keyin false'ga qaytaradi). Bu fayl HECH QACHON true holda commit qilinmaydi
// (scripts/check-release-host.js deploy/publish/google oldidan tekshiradi).
// feature/sign-otp: FAQAT shu branch'da true — imzo test APK release build'i tb-sign.zerox.uz ga ulanadi.
// Bu branch Play/App Store'ga yuklanmaydi (scripts/check-release-host.js shuni ataylab bloklaydi).
export const USE_TEST_HOST_IN_RELEASE = true;
