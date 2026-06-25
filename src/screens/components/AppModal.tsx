/**
 * AppModal — yagona dialog modal qobig'i (shell).
 *
 * Ilgari har bir modal (NoInternet, UpdateModal, FaceIdModal, ExpirePassport...)
 * react-native-paper Modal'ni o'zicha o'rab, markaziy karta + tugmani qayta yozardi.
 * Endi:
 *   <AppModal visible={x} onDismiss={...}>
 *     ...kontent...
 *     <Button title={t('783')} onPress={...} />
 *   </AppModal>
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Modal } from 'react-native-paper';
import { tokens } from '../../theme/tokens';

interface AppModalProps {
  visible: boolean;
  onDismiss?: () => void;
  dismissable?: boolean; // default: true
  children: React.ReactNode;
  cardStyle?: ViewStyle | ViewStyle[];
}

const AppModal: React.FC<AppModalProps> = ({
  visible,
  onDismiss,
  dismissable = true,
  children,
  cardStyle,
}) => {
  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      dismissable={dismissable}
      contentContainerStyle={styles.overlay}
    >
      <View style={[styles.card, cardStyle]}>{children}</View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    paddingHorizontal: tokens.spacing.lg,
  },
  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    alignItems: 'center',
    ...tokens.shadow.card,
  },
});

export default AppModal;
