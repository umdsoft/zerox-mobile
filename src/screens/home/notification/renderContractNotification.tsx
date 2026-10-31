import React from 'react';
import QarzniQaytarishQabulQilinganligiTogrisida from '../notifications/all/QarzniQaytarishQabulQilinganligiTogrisida';
import QarzShartnomasiningRadQilinganligiTogrisida from '../notifications/all/QarzShartnomasiningRadQilinganligiTogrisida';
import QarzShartnomasiningQabulQilinganligiTogrisida from '../notifications/all/QarzShartnomasiningQabulQilinganligiTogrisida';
import QarzMuddatiniUzaytirishRadEtilganligiTogrisida from '../notifications/all/QarzMuddatiniUzaytirishRadEtilganligiTogrisida';
import QarzShartnomasiRuxsatSorash from '../notifications/all/QarzShartnomasiRuxsatSorash';
import QarzniQaytarishRadQilinganligi from '../notifications/all/QarzniQaytarishRadQilinganligi';
import QarzShartnomasiRejectTime from '../notifications/all/QarzShartnomasiRejectTime';
import PulMablagOtkazilganligi from '../notifications/all/PulMablagOtkazilganligi';
import PulMablagOtkazilganligiHaqida from '../notifications/all/PulMablagOtkazilganligiHaqida';
import NewUser from '../notifications/all/NewUser';
import RecoveryPassword from '../notifications/all/RecoveryPassword';
import QarzniMuddatUzaytirishQabul from '../notifications/all/QarzniMuddatUzaytirishQabul';
import MalumotniKorishgaRadEtildi from '../notifications/all/MalumotniKorishgaRadEtildi';
import MalumotniKorishgaRuxsatBerildi from '../notifications/all/MalumotniKorishgaRuxsatBerildi';
import Eslatma from '../notifications/all/Eslatma';
import { NotificationHandlers, renderOtherNotification } from './renderOtherNotification';

/** Shartnoma/qaytarish natijalari va tizim bildirishnomalari (10-32 turlari). */
export function renderContractNotification(item: any, h: NotificationHandlers) {
  const { okay } = h;
  switch (Number(item?.type)) {
    case 10:
      return (
        <QarzniQaytarishQabulQilinganligiTogrisida
          item={item}
          okay={okay}
        />
      );
    case 7:
      return (
        <QarzShartnomasiningRadQilinganligiTogrisida
          item={item}
          okay={okay}
        />
      );
    case 8:
      return (
        <QarzShartnomasiningQabulQilinganligiTogrisida
          item={item}
          okay={okay}
        />
      );
    case 13:
      return (
        <QarzMuddatiniUzaytirishRadEtilganligiTogrisida
          item={item}
          okay={okay}
        />
      );
    case 11:
      return (
        <QarzniQaytarishQabulQilinganligiTogrisida
          item={item}
          okay={okay}
        />
      );

    case 22:
      return (
        <QarzniQaytarishRadQilinganligi
          item={item}
          okay={okay}
        />
      );
    case 21:
      return (
        <QarzShartnomasiRejectTime
          item={item}
          okay={okay}
        />
      );
    case 24:
      return (
        <PulMablagOtkazilganligi
          item={item}
          okay={okay}
        />
      );
    case 23:
      return (
        <PulMablagOtkazilganligiHaqida
          item={item}
          okay={okay}
        />
      );
    case 25:
      return (
        <NewUser item={item} okay={okay} />
      );
    case 26:
      return (
        <RecoveryPassword
          item={item}
          okay={okay}
        />
      );
    case 27:
      return (
        <QarzniMuddatUzaytirishQabul
          item={item}
          okay={okay}
        />
      );

    case 19:
      return (
        <QarzShartnomasiRuxsatSorash
          item={item}
          okay={okay}
        />
      );
    case 31:
      return (
        <MalumotniKorishgaRadEtildi
          item={item}
          okay={okay}
        />
      );
    case 30:
      return (
        <MalumotniKorishgaRuxsatBerildi
          item={item}
          okay={okay}
        />
      );
    case 32:
      return (
        <Eslatma item={item} okay={okay} />
      );
    default:
      return renderOtherNotification(item, h);
  }
}
