import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { styles } from './qarzDaftariStyles';

/**
 * Xodim rejimi banneri — boshqa egaga tegishli do'konni xodim sifatida boshqarayotganini bildiradi
 * + o'z hisobiga qaytish (Chiqish).
 */
const XodimBar = ({ name, onExit }: { name: string; onExit: () => void }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.xodimBar}>
      <View style={{ flex: 1 }}>
        <Text style={styles.xodimBarTitle} numberOfLines={1}>
          {t('Xodim rejimi')}
        </Text>
        {!!name && (
          <Text style={styles.xodimBarSub} numberOfLines={1}>
            {name}
          </Text>
        )}
      </View>
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.xodimBarBtn}
        onPress={onExit}
      >
        <Text style={styles.xodimBarBtnText}>{t('Chiqish')}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default XodimBar;
