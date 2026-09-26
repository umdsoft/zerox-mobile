/**
 * NotifFallback.tsx — SS-DEV (2026-09-26): bildirishnomalar ro'yxati uchun
 * "Xatolik sodir bo'ldi" O'RNIGA umumiy (fallback) karta + har element uchun
 * ErrorBoundary.
 *
 * Muammo: `Notification.tsx` `switch(item.type)` ning `default` shoxi oddiy
 * `<Text>Xatolik sodir bo'ldi</Text>` qaytarardi. Backend yangi tur (42/43 —
 * shikoyat, kelajakda boshqalar) yuborsa, foydalanuvchi karta o'rniga faqat
 * xato matnini ko'rardi va uni yopib ham bo'lmasdi (Ok tugmasi yo'q).
 *
 *   <NotifFallback item okay />  — sarlavha "Bildirishnoma", tushuntirish matni,
 *                                  (bo'lsa) shartnoma raqami, sana/vaqt, "Ok".
 *   <NotifItemBoundary item okay> — bola komponent render'da throw qilsa
 *                                  (undefined maydon, JSON.parse va h.k.) xatoni
 *                                  __DEV__ da console.error ga yozadi va SHU
 *                                  fallback kartani ko'rsatadi; boshqa qatorlar
 *                                  va butun ekran yiqilmaydi.
 */
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { t } from 'i18next';
import NotificationShell from '../../../components/NotificationShell';
import { rd, rs } from '../../../../theme/rd';
import { style } from '../../../../theme/style';

type Props = { item: any; okay?: (id: any, type?: any) => void };

export const NotifFallback = ({ item, okay }: Props) => {
  const it = item || {};
  const number = it.number != null && it.number !== '' ? String(it.number) : '';
  return (
    <NotificationShell
      title={t('Bildirishnoma') as string}
      date={it.created}
      time={it.time}
      onOk={it.id != null ? () => okay?.(it.id, it.type) : undefined}
    >
      <Text allowFontScaling={false} style={styles.text}>
        {t('Bu bildirishnomani ko‘rsatib bo‘lmadi. Iltimos, ilovani yangilang yoki saytdan tekshiring.')}
      </Text>
      {number ? (
        <Text allowFontScaling={false} style={styles.meta}>
          {t('Shartnoma')} №{number}
        </Text>
      ) : null}
    </NotificationShell>
  );
};

type BoundaryProps = Props & { children: React.ReactNode };
type BoundaryState = { failed: boolean };

export class NotifItemBoundary extends React.Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string }) {
    if (__DEV__) {
      const it = this.props.item || {};
      console.error(
        `notification render error (id=${it.id}, type=${it.type}):`,
        (error as any)?.message || error,
        info?.componentStack,
      );
    }
  }

  componentDidUpdate(prev: BoundaryProps) {
    // Boshqa element (FlatList qayta ishlatgan qator) — holatni tiklaymiz.
    if (this.state.failed && prev.item?.id !== this.props.item?.id) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) {
      return <NotifFallback item={this.props.item} okay={this.props.okay} />;
    }
    return this.props.children;
  }
}

export default NotifFallback;

const styles = StyleSheet.create({
  text: {
    fontFamily: rd.font.medium,
    fontSize: style.fontSize.xx + 1,
    color: rd.color.text,
    lineHeight: rs(20),
  },
  meta: {
    marginTop: rs(6),
    fontFamily: rd.font.regular,
    fontSize: style.fontSize.xx,
    color: rd.color.textSecondary,
  },
});
