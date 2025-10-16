import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import DatePicker from '@react-native-community/datetimepicker';
import { Modal } from 'react-native-paper';
import { normalize, style } from '../../../theme/style';
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
      <View
        style={{
          backgroundColor: 'white',
          alignSelf: 'center',
          borderRadius: 10,
        }}
      >
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: style.fontFamilyMedium,
            fontSize: style.fontSize.xx + 2,
            color: '#000',
            marginLeft: 10,
            marginTop: 10,
            marginBottom: 10,
          }}
        >
          {title}
        </Text>
        <DatePicker
          value={date}
          themeVariant="light"
          style={{ backgroundColor: '#fff', alignSelf: 'center' }}
          mode="date"
          display="spinner"
          onChange={(_, date) => {
            setDate(date!);
          }}
          minimumDate={min}
          maximumDate={max}
        />
        <View
          style={{
            justifyContent: 'space-between',
            flexDirection: 'row',
            borderTopColor: style.blue,
            borderTopWidth: 0.3,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setDate(new Date());
              setOpen(!open);
            }}
            style={styles.buttonDate}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: style.fontFamilyMedium,
                fontSize: style.fontSize.xx - 2,
                color: '#000',
              }}
            >
              {t('804')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setOpen(!open);
            }}
            style={[
              styles.buttonDate,
              { borderLeftColor: style.blue, borderLeftWidth: 0.3 },
            ]}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: style.fontFamilyMedium,
                fontSize: style.fontSize.xx - 2,
                color: '#000',
              }}
            >
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
  buttonDate: {
    height: normalize(40),
    alignItems: 'center',
    justifyContent: 'center',

    width: normalize(250) / 2,
  },
});
