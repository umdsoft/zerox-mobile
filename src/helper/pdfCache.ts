/**
 * SEC (2026-10-31): yuklab olingan hujjat PDF'lari (shartnoma, dalolatnoma, hisobot)
 * ommaviy Download/Document papkasiga emas, ilovaning KESH papkasiga (`zx_pdf/`) tushadi.
 * Foydalanuvchi "ulashish/saqlash"ni FileViewer/Share oynasi orqali o'zi tanlaydi.
 * Logout'da (forceLogout) papka va keshning ildizidagi *.pdf fayllar o'chiriladi.
 */
import ReactNativeBlobUtil from 'react-native-blob-util';

export const pdfCacheDir = (): string => `${ReactNativeBlobUtil.fs.dirs.CacheDir}/zx_pdf`;

/** Fayl nomini xavfsiz qiladi (yo'l ajratgichlarsiz). */
export const safePdfName = (name: string): string =>
  String(name).replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 120) || 'document.pdf';

/** Kesh ichidagi PDF yo'li; papkani yaratadi. */
export async function pdfCachePath(name: string): Promise<string> {
  const dir = pdfCacheDir();
  try {
    if (!(await ReactNativeBlobUtil.fs.isDir(dir))) await ReactNativeBlobUtil.fs.mkdir(dir);
  } catch {}
  return `${dir}/${safePdfName(name)}`;
}

/** Kesh PDF'larini o'chiradi (logout). Xatolar yutiladi. */
export async function clearPdfCache(): Promise<void> {
  try {
    const fs = ReactNativeBlobUtil.fs;
    await fs.unlink(pdfCacheDir()).catch(() => {});
    const root = fs.dirs.CacheDir;
    const names: string[] = await fs.ls(root).catch(() => []);
    await Promise.all(
      names.filter(n => /\.pdf$/i.test(n)).map(n => fs.unlink(`${root}/${n}`).catch(() => {})),
    );
  } catch {}
}
