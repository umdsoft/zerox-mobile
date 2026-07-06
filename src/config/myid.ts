/**
 * MyID SDK credentiallari — YAGONA MANBA (prod + sandbox).
 *
 * MUHIM: mobil MyID `environment` va credentiallari BACKEND `MYID_HOST` bilan MOS bo'lishi shart:
 *   - PRODUCTION → backend api.myid.uz (MYID_HOST default) → bu yerda ACTIVE = MYID_PROD
 *   - SANDBOX    → backend api.devmyid.uz (MYID_HOST=test) → ACTIVE = MYID_SANDBOX
 * Agar ular mos kelmasa: backend bir serverda sessiya yaratadi, SDK boshqasida tekshiradi →
 * sessiya topilmaydi / liveness yiqiladi.
 *
 * Backend hozir PRODUCTION (MYID_HOST o'rnatilmagan → default prod), shuning uchun mobil ham PROD.
 * Test backend'ga o'tilganda: pastdagi `MYID = MYID_SANDBOX` qilib almashtiriladi (bitta joy).
 *
 * Ilgari bu credentiallar ScanFaceMyId.tsx va MyIdScreen.tsx da ALOHIDA hardcode edi — endi bitta manba.
 */
import { MyIdEnvironment } from 'react-native-nitro-myid';

export type MyIdCreds = {
  clientHash: string;
  clientHashId: string;
  environment: MyIdEnvironment;
};

// PRODUCTION — clientHashId 7b4507ca; app.zerox.uz production imzosi (zerox.keystore)
// bilan ro'yxatdan o'tgan. Play Integrity/liveness aynan shu imzo bilan o'tadi.
export const MYID_PROD: MyIdCreds = {
  clientHash:
    'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsw3Ad+h8EgEjt+5sdTxveshhapa+Q0anEajGtEGt6KLJgOfk54AU/RwBIvBPFJRUQqOAbngtFFS6SCWt26AtG8QtRRVL+xWF//2u/66bXVjrHlCKuBQNVoISJ+YyfVLpOhQYlrRyLP23sKrJdB2PBYlovP1HCWFP56KUn5T1dSluBy5h81ZSfmsUJO5U1lKLli2WMOPCFl9K1/6TOuRSv70U/nZX+pRLCIPzrdlf9zCLL49OShztalJOYtXibasqTrNCd0sBzTNbiQ3uGkmK5RH+L2hi4dy1vDEwH7VqMLcogJXnTEYAZ3KCAxmIUXvkhDstWK5uH8Ru0uZskcR5GwIDAQAB',
  clientHashId: '7b4507ca-9b70-4e92-8bfe-767db25a0be2',
  environment: MyIdEnvironment.PRODUCTION,
};

// SANDBOX — clientHashId 97496c4e; test backend (api.devmyid.uz) uchun. Debug/dev sinovda
// Play Integrity majburiy emas, shuning uchun imzosiz ham test qilish mumkin.
export const MYID_SANDBOX: MyIdCreds = {
  clientHash:
    'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzZVrqQt5Py76zh2cdkrizznvuRaFzW66mzzmgOvG7va92Nqk5AhstNCDJCYU+NzPtTCDxJF4qo3MSDOU+U2utyx6tuLoqxZS3vt833GOJmXGd9c77b1n9aazo9WMjk+i6GGpVrb28sKJNbzQWriTJhYfxz42EP5iKMnSXUyEZMFN6LZddJ4YpO7TnFSEYKBECOW0+NxRH+I3D2B+l+w231Jb3zJjSQyNd6tDoRKu4CcqEqTDHRFg3OQvQJschMDKnpPOERtQoksbRyysIufufz8r5yIBtPaA8rZqy1VFTa2tGCOoC4ZNPMv5kLFZstTVNp4hnfw7djdfWNUGJP12AQIDAQAB',
  clientHashId: '97496c4e-e979-4697-8a38-98848872cfc2',
  environment: MyIdEnvironment.SANDBOX,
};

// AKTIV credentiallar — backend PRODUCTION bo'lgani uchun PROD.
// Test backend'ga o'tilganda faqat shu qatorni MYID_SANDBOX ga o'zgartiring.
export const MYID: MyIdCreds = MYID_PROD;
