import React from 'react';
import { Text, View } from 'react-native';
import { rd, rs } from '../../../theme/rd';
import { NewsIcon } from '../redesign/icons';
import RingingBell from './RingingBell';
import { styles } from './notificationStyles';

// Professional bo'sh holat. news=true -> yangiliklar ikonkasi; aks holda jiringlovchi qo'ng'iroq.
const RdEmpty = ({ text, news }: { text: string; news?: boolean }) => (
  <View style={styles.rdEmpty}>
    <View style={styles.rdEmptyCircle}>
      {news ? (
        <NewsIcon size={rs(34)} color={rd.color.primary} />
      ) : (
        <RingingBell />
      )}
    </View>
    <Text allowFontScaling={false} style={styles.rdEmptyText}>
      {text}
    </Text>
  </View>
);

export default RdEmpty;
