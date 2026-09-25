// SS-PERF (2026-09-25): kam ishlatiladigan OG'IR ekranlar (MyID SDK, kamera/QR,
// PDF, grafik) ilova ishga tushganda emas, BIRINCHI ochilganda yuklanadi.
// Metro `inlineRequires` bilan modul faqat `require` chaqirilganda baholanadi —
// shu sabab startup'da vision-camera/skia/pdf/myid JS'i evaluatsiya qilinmaydi.
// Komponent identifikatori barqaror (bir marta yaratiladi) — react-navigation
// uchun oddiy ekran kabi ishlaydi; route/params o'zgarmaydi.
import React from 'react';

type Loader = () => { default: React.ComponentType<any> };

export function lazyScreen(load: Loader): React.ComponentType<any> {
  let Loaded: React.ComponentType<any> | null = null;
  const LazyScreen = (props: any) => {
    if (!Loaded) {
      Loaded = load().default;
    }
    return <Loaded {...props} />;
  };
  return LazyScreen;
}
