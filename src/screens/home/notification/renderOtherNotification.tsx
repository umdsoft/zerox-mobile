import React from 'react';
import ExpirePassport from '../notifications/all/Expire_Passport';
import GapTaklif from '../notifications/all/GapTaklif';
import MoliyaEslatma from '../notifications/all/MoliyaEslatma';
import QarzDaftariEslatma from '../notifications/all/QarzDaftariEslatma';
import ShaxsiyQarzEslatma from '../notifications/all/ShaxsiyQarzEslatma';
import DebtPlanEslatma from '../notifications/all/DebtPlanEslatma';
import FamilyInviteTaklif from '../notifications/all/FamilyInviteTaklif';
import Shikoyat from '../notifications/all/Shikoyat';
import SmsUndelivered from '../notifications/all/SmsUndelivered';
import NotifFallback from '../notifications/all/NotifFallback';

export interface NotificationHandlers {
  okay: (id: any, type?: any) => any;
  onSuccessG: (item: any, status: any, type: any) => any;
  onReject: (item: any, status: any, type: any) => any;
  onToliqQaytganG: (item: any, status: any) => any;
  onQismanQaytarilganG: (item: any, status: any) => any;
  onQarzMuddatUzaytirishG: (item: any, status: any) => any;
}

/** Moliya / eslatma / taklif turlari (35+) va noma'lum tur uchun umumiy karta. */
export function renderOtherNotification(item: any, h: NotificationHandlers) {
  const { okay } = h;
  switch (Number(item?.type)) {
    case 35:
      return <ExpirePassport item={item} okay={okay} />;
    // SS8: Gap uchrashuviga taklif — lokatsiya, borish/bormaslik, karta, summa.
    case 40:
      return <GapTaklif item={item} okay={okay} />;
    // SS20: Shaxsiy moliya — 3 kun daromad/xarajat kiritilmadi.
    case 41:
      return <MoliyaEslatma item={item} okay={okay} />;
    // 10.10: Qarz daftari — belgilangan vaqtda qarz kiritilmagan (do'kon eslatmasi).
    case 44:
      return <QarzDaftariEslatma item={item} okay={okay} />;
    // 13.10: Shaxsiy moliya — kunlik eslatma (belgilangan vaqtda, bugun daromad/xarajat kiritilmagan).
    case 46:
      return <MoliyaEslatma daily item={item} okay={okay} />;
    // 11.10: Shaxsiy qarz — 2 hafta shaxsiy qarz kiritilmagan (belgilangan kun/vaqtda).
    case 45:
      return <ShaxsiyQarzEslatma item={item} okay={okay} />;
    // 22.10: "Qarzdan chiqish" — to'lov kuni eslatmasi ("To'ladim" + reja paneli).
    case 47:
      return <DebtPlanEslatma item={item} okay={okay} />;
    // 23.10: Oila moliyasi taklifi — «Ruxsat berish» / «Rad etish».
    case 48:
      return <FamilyInviteTaklif item={item} okay={okay} />;
    // 30.10: qarzdorga SMS yetkazilmadi — «Qarzga o'tish» (Amaliyot tafsiloti) / «Ok».
    case 49:
      return <SmsUndelivered item={item} okay={okay} />;
    // SS-DEV (2026-09-26): qarz bo'yicha shikoyat — 42 do'kon (qarz daftari), 43 shaxsiy qarz.
    case 42:
    case 43:
      return <Shikoyat item={item} okay={okay} />;
    default:
      // SS-DEV (2026-09-26): ilgari `<Text>Xatolik sodir bo'ldi</Text>` — backend yangi
      // tur yuborsa foydalanuvchi karta o'rniga xato matnini ko'rardi va uni yopa olmasdi.
      // Endi umumiy karta (sarlavha/matn/sana + Ok).
      if (__DEV__) {
        console.error('notification: unknown type', item?.type, 'id', item?.id);
      }
      return <NotifFallback item={item} okay={okay} />;
  }
}
