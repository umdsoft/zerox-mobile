import {Image, StyleSheet, Text, View} from 'react-native';
import React, {memo} from 'react';
import {VictoryPie} from 'victory-native';
import {normalize, style} from '../../theme/style';

import {useTranslation} from 'react-i18next';
const Chart = ({data, title}) => {
  const {t} = useTranslation();
  let is = 0;
  Object.keys(data || {}).forEach(key => {
    if (String(data[key]) != 0) {
      is += 1;
    }
  });

  return (
    <View
      style={{
        flex: 1,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
      {}
      {is == 0 ? (
        <View style={{marginLeft: 10}}>
          <Image
            source={require('../../images/home/circular-diagram.png')}
            style={{width: normalize(120), height: normalize(120)}}
          />
        </View>
      ) : (
        <VictoryPie
          colorScale={[style.blue, '#47bb78', '#feb116']}
          height={normalize(150)}
          radius={60}
          width={normalize(120)}
          padAngle={2}
          cornerRadius={6}
          innerRadius={normalize(20)}
          style={{
            labels: {
              fontFamily: style.fontFamilyMedium,
              fontSize: style.fontSize.xa + 2,
              opacity: 0,
            },
            parent: {
              marginLeft: 20,
            },
          }}
          data={[
            {
              y: data?.jarayon,
            },
            {y: data?.tugallangan},
            {y: data?.rad},
          ]}
        />
      )}
      <View style={{marginLeft: normalize(25)}}>
        <Text style={styles.key(style.blue)} allowFontScaling={false}>
          {t('195')} - {data?.jarayon}
        </Text>
        <Text style={styles.key('#47bb78')} allowFontScaling={false}>
          {t('198')} - {data?.tugallangan}
        </Text>
        <Text style={styles.key('#feb116')} allowFontScaling={false}>
          {t('201')} - {data?.rad}
        </Text>
        {/* <Text style={[styles.key(style.blue), {marginTop: normalize(15)}]}>
          {t('144')} - {data?.all}
        </Text> */}
      </View>
    </View>
  );
};

export default memo(Chart);

const styles = StyleSheet.create({
  key: color => {
    return {
      fontFamily: style.fontFamilyMedium,
      fontSize: style.fontSize.xa + 1,
      color: color,
      marginTop: 2,
    };
  },
});
