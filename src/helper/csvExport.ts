/**
 * csvExport.ts — ro'yxatni CSV faylga yuklab olish (umumiy yordamchi).
 *
 * 02.10: SearchDebitor'dagi `onExcel` mantig'i shu yerga ko'chirildi — endi
 * foydalanuvchi sahifasidagi "Shartnomalar" ro'yxati (ShowUserDetails) ham
 * xuddi shu usulda yuklab olinadi (copy-paste o'rniga bitta funksiya).
 *
 * Server excel endpoint'i yo'q, shu bois CSV klientda yaratiladi (Excel/Sheets
 * CSV'ni to'g'ridan-to'g'ri ochadi). UTF-8 BOM — kirill/o'zbek harflari uchun.
 * Android'da fayl Download/Zerox papkasiga ham nusxalanadi.
 */
import { Platform } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import i18next from 'i18next';

type Cell = string | number | null | undefined;

export type CsvExportOptions = {
  /** Fayl nomi bosh qismi (kengaytmasiz, vaqt belgisi avtomatik qo'shiladi). */
  baseName: string;
  /** Ustun sarlavhalari. */
  header: string[];
  /** Qatorlar — har biri `header` tartibidagi qiymatlar. */
  rows: Cell[][];
  /**
   * 03.10: MATN sifatida saqlanishi SHART bo'lgan ustunlar (0 dan boshlab indeks).
   * Excel CSV ochganda "2/11/2025-1" (shartnoma raqami) va "02.11.2025" kabi
   * qiymatlarni o'zi SANA/raqamga aylantiradi (tor ustunda "########").
   * Bu ustunlardagi qiymat `="..."` ko'rinishida yoziladi — Excel / Google Sheets /
   * WPS uni aynan matn sifatida ko'rsatadi. Berilmasa — eski xatti-harakat.
   */
  textColumns?: number[];
};

const esc = (v: Cell): string => `"${String(v ?? '').replace(/"/g, '""')}"`;

// 03.10: matn-ustun katakchasi — `="qiymat"` (bo'sh qiymat oddiy bo'sh katak bo'ladi).
const escText = (v: Cell): string => {
  const s = String(v ?? '');
  return s ? esc(`="${s.replace(/"/g, '""')}"`) : esc('');
};

/** Fayl nomidan taqiqlangan belgilarni olib tashlaydi. */
const safeName = (s: string): string =>
  String(s || 'export')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, '_')
    .trim() || 'export';

export const buildCsv = (header: string[], rows: Cell[][], textColumns: number[] = []): string => {
  const lines = [header.map(esc).join(',')];
  rows.forEach(r =>
    lines.push(r.map((v, i) => (textColumns.includes(i) ? escText(v) : esc(v))).join(',')),
  );
  return '﻿' + lines.join('\r\n');
};

/**
 * CSV yaratadi, saqlaydi, toast ko'rsatadi va fayl ochuvchi ilovani taklif qiladi.
 * Ro'yxat bo'sh bo'lsa — "Ro'yxat bo'sh" toast'i, fayl yaratilmaydi.
 * @returns muvaffaqiyatli saqlangan bo'lsa `true`.
 */
export const exportCsv = async ({
  baseName,
  header,
  rows,
  textColumns,
}: CsvExportOptions): Promise<boolean> => {
  const t = i18next.t.bind(i18next);
  if (!rows.length) {
    Toast.show({
      type: 'omad',
      position: 'bottom',
      props: { title: t('Ro‘yxat bo‘sh'), desc: t('Yuklab olish uchun ma’lumot yo‘q') },
    });
    return false;
  }
  try {
    const fileName = `${safeName(baseName)}_${Date.now()}.csv`;
    const cachePath = `${RNBlobUtil.fs.dirs.CacheDir}/${fileName}`;
    await RNBlobUtil.fs.writeFile(cachePath, buildCsv(header, rows, textColumns), 'utf8');

    // 02.10 (review): Android 7–9 (API < 29) da MediaStore nusxasi WRITE_EXTERNAL_STORAGE
    // ruxsatini talab qiladi (manifestda yo'q) — xato bo'lsa umumiy "Xatolik" EMAS: fayl
    // keshda tayyor, quyida FileViewer orqali ochiladi (u yerdan ulashish/saqlash mumkin).
    let savedToDownloads = false;
    if (Platform.OS === 'android' && Number(Platform.Version) >= 29) {
      try {
        await RNBlobUtil.MediaCollection.copyToMediaStore(
          { name: fileName, parentFolder: 'Zerox', mimeType: 'text/csv' },
          'Download',
          cachePath,
        );
        savedToDownloads = true;
      } catch (copyErr) {
        console.warn('csv copyToMediaStore failed', copyErr);
      }
    }
    Toast.show({
      type: 'omad',
      position: 'bottom',
      visibilityTime: 2500,
      props: {
        // 02.10: "Excel yuklab olindi" → "Yuklab olindi" (tugma nomi "Yuklash" bo'ldi).
        title: t('Yuklab olindi'),
        desc: savedToDownloads ? t('Download/Zerox papkasiga saqlandi') : fileName,
      },
    });
    // Excel/Sheets ilovasida ochishga urinamiz (bo'lmasa — jimgina o'tkazamiz).
    FileViewer.open(cachePath, { showOpenWithDialog: true }).catch(() => {});
    return true;
  } catch (e) {
    console.error('csv export error', e);
    Toast.show({
      type: 'error2',
      position: 'bottom',
      props: { desc: t('Xatolik yuz berdi') },
    });
    return false;
  }
};
