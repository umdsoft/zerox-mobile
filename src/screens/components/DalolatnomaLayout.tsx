/**
 * DalolatnomaLayout — "DALOLATNOMA" hujjat qobig'i.
 *
 * Ilgari 6 ta modal (QarzniToliqQaytarish, QismanQaytarish, MuddatUzaytirish,
 * QarzToliqQaytarish, QarzMuddatUzaytirish, QarzdanVozKechish) bir xil oq karta +
 * markazlashgan "D A L O L A T N O M A" sarlavhasini qayta yozardi. Endi:
 *   <DalolatnomaLayout>
 *     <Text>...hujjat matni...</Text>
 *   </DalolatnomaLayout>
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { normalize, tokens } from '../../theme/tokens';

interface DalolatnomaLayoutProps {
  children: React.ReactNode;
}

const DalolatnomaLayout: React.FC<DalolatnomaLayoutProps> = ({ children }) => {
  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title} allowFontScaling={false}>
          D А L O L А T N O M А
        </Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    alignSelf: 'center',
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: normalize(10),
  },
  title: {
    fontFamily: tokens.font.bold,
    color: tokens.color.onSurface,
    fontSize: tokens.fontSize.xs,
  },
  body: {
    marginTop: normalize(10),
    marginBottom: normalize(10),
    paddingHorizontal: normalize(10),
  },
});

export default DalolatnomaLayout;
