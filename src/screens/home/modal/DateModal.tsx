import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import DatePicker from '@react-native-community/datetimepicker';
import { Modal } from 'react-native-paper';
import { rd, rs } from '../../../theme/rd';
import { useTranslation } from 'react-i18next';

interface DateModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: string;
  date: Date;
  setDate: (date: Date) => void;
  min?: Date;
  max?: Date;
}

const DateModal: React.FC<DateModalProps> = ({
  open,
  setOpen,
  title = '',
  date,
  setDate,
  min,
  max,
}) => {
  const { t } = useTranslation();
  return (
    <Modal
      visible={open}
      dismissable={true}
      theme={{
        animation: {
          scale: 3.0,
          defaultAnimationDuration: 100,
        },
      }}
      onDismiss={() => setOpen(!open)}
    >
      <View style={styles.card}>
        <View style={styles.grabber} />

        {title ? (
          <Text allowFontScaling={false} style={styles.title}>
            {title}
          </Text>
        ) : null}

        <DatePicker
          value={date}
          themeVariant="light"
          style={styles.picker}
          mode="date"
          display="spinner"
          onChange={(_, date) => {
            setDate(date!);
          }}
          minimumDate={min}
          maximumDate={max}
        />

        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setDate(new Date());
              setOpen(!open);
            }}
            style={[styles.btn, styles.btnSecondary]}
          >
            <Text allowFontScaling={false} style={styles.btnSecondaryText}>
              {t('804')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setOpen(!open);
            }}
            style={[styles.btn, styles.btnPrimary]}
          >
            <Text allowFontScaling={false} style={styles.btnPrimaryText}>
              OK
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default DateModal;

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    width: rs(322),
    maxWidth: '92%',
    backgroundColor: rd.color.surface,
    borderRadius: rs(24),
    paddingTop: rs(10),
    paddingHorizontal: rs(16),
    paddingBottom: rs(16),
    shadowColor: rd.color.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  grabber: {
    width: rs(40),
    height: rs(4),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.textTertiary,
    alignSelf: 'center',
    marginBottom: rs(12),
  },
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(17),
    color: rd.color.text,
    textAlign: 'center',
    marginBottom: rs(4),
  },
  picker: {
    alignSelf: 'center',
    backgroundColor: rd.color.surface,
  },
  actions: {
    flexDirection: 'row',
    marginTop: rs(8),
  },
  btn: {
    flex: 1,
    height: rs(50),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rd.radius.lg,
  },
  btnSecondary: {
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    marginRight: rs(10),
  },
  btnSecondaryText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.textSecondary,
  },
  btnPrimary: {
    backgroundColor: rd.color.primary,
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  btnPrimaryText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.onPrimary,
  },
});
