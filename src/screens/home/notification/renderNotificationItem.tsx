import React from 'react';
import Qarzdanvozkechilganligitogrisida from '../notifications/all/Qarzdanvozkechilganligitogrisida';
import QarzShartnomasiniRasmiylashtirishTogrisida from '../notifications/all/QarzShartnomasiniRasmiylashtirishTogrisida';
import Qarzmuddatiuzaytirilganligitogrisida from '../notifications/all/Qarzmuddatiuzaytirilganligitogrisida';
import QarzToliqQaytarilganli from '../notifications/all/QarzToliqQaytarilganli';
import Qarzniqaytarishtalabqilinganligitogrisida from '../notifications/all/Qarzniqaytarishtalabqilinganligitogrisida';
import Qarzqismanqaytarilganli from '../notifications/all/Qarzqismanqaytarilganli';
import Qarzmuddatiniuzaytirishsoralganligitogrisida from '../notifications/all/Qarzmuddatiniuzaytirishsoralganligitogrisida';
import Qarzniqaytarishqabulqilinmaganligitogrisida from '../notifications/all/Qarzniqaytarishqabulqilinmaganligitogrisida';
import { renderContractNotification } from './renderContractNotification';
import { NotificationHandlers } from './renderOtherNotification';

export type { NotificationHandlers };

/**
 * Bildirishnoma turi (`item.type`) -> komponent. Bola komponentlar `navigation` ni o'zi `useNavigation()` dan oladi
 * (wave D: 35 ta `navigation={navigation}` prop uzatish olib tashlandi).
 * SS-DEV (2026-09-26): `type` satr bo'lib kelsa ham ("17") mos shablon tanlanadi.
 */
export function renderNotificationItem(item: any, h: NotificationHandlers) {
  const { okay, onSuccessG, onReject, onToliqQaytganG, onQismanQaytarilganG, onQarzMuddatUzaytirishG } = h;
  switch (Number(item?.type)) {
    //buldi bi batafsil qoldi
    case 0:
      return (
        <QarzShartnomasiniRasmiylashtirishTogrisida
          item={item}
          okay={okay}
          onSuccess={onSuccessG}
          onReject={onReject}
        />
      );
    case 1:
      return (
        <QarzToliqQaytarilganli
          item={item}
          okay={okay}
          onToliqQaytgan={onToliqQaytganG}
          onQismanQaytarilgan={onQismanQaytarilganG}
        />
      );
    case 4:
      return (
        <Qarzdanvozkechilganligitogrisida
          item={item}
          okay={okay}
        />
      );
    case 2:
      return (
        <Qarzqismanqaytarilganli
          item={item}
          okay={okay}
          onToliqQaytgan={onToliqQaytganG}
        />
      );
    case 3:
      return (
        <Qarzmuddatiniuzaytirishsoralganligitogrisida
          item={item}
          okay={okay}
          onQarzMuddatUzaytirish={onQarzMuddatUzaytirishG}
          reject={onReject}
        />
      );
    case 17:
      return (
        <Qarzniqaytarishtalabqilinganligitogrisida
          item={item}
          okay={okay}
        />
      );

    //buldi bi
    case 16:
      return (
        <Qarzmuddatiuzaytirilganligitogrisida
          item={item}
          okay={okay}
        />
      );
    case 12:
      return (
        <Qarzmuddatiuzaytirilganligitogrisida
          item={item}
          okay={okay}
        />
      );
    case 9:
      return (
        <Qarzniqaytarishqabulqilinmaganligitogrisida
          item={item}
          okay={okay}
        />
      );
    case 15:
      return (
        <Qarzniqaytarishqabulqilinmaganligitogrisida
          item={item}
          okay={okay}
        />
      );
    default:
      return renderContractNotification(item, h);
  }
}
