import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { memo } from 'react';
import { settingDate } from '../../helper';
import { navigate } from '../../navigation/NavigationRef';
import { rd, rs } from '../../theme/rd';

const NewsNotificationCard = ({ data }) => {
  return (
    <TouchableOpacity
      onPress={() => {
        navigate('NewsScreen', { data: data });
      }}
      activeOpacity={0.85}
      style={styles.container}
    >
      <Text style={styles.title} allowFontScaling={false}>
        {data?.title}
      </Text>
      <Text style={styles.body} allowFontScaling={false} numberOfLines={3}>
        {data?.description}
      </Text>
      <View style={styles.footer}>
        <View style={styles.dot} />
        <Text style={styles.date} allowFontScaling={false}>
          {settingDate(data?.created)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default memo(NewsNotificationCard);

const styles = StyleSheet.create({
  container: {
    backgroundColor: rd.color.surface,
    width: '100%',
    alignSelf: 'center',
    marginTop: rs(12),
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
  },
  title: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
  },
  body: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    lineHeight: rs(20),
    marginTop: rs(8),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    marginTop: rs(12),
  },
  dot: {
    width: rs(6),
    height: rs(6),
    borderRadius: rs(3),
    backgroundColor: rd.color.textTertiary,
  },
  date: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
  },
});
