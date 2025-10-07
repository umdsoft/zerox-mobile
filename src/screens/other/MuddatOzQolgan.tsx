import {Dimensions, StyleSheet, View} from 'react-native';
import React from 'react';
import {BackGroundIcon} from '../../helper/homeIcon';
import {style} from '../../theme/style';
import {useNavigation, useRoute} from '@react-navigation/native';
import ListCard from '../components/ListCard';
import OtherHeader from '../components/OtherHeader';
import {useTranslation} from 'react-i18next';
const {width} = Dimensions.get('screen');
const MuddatOzQolgan = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {t} = useTranslation();
  const {creditor, debitor, type} = route.params;
  console.log(type, 'type');
  return (
    <View style={{flex: 1}}>
      <View
        style={{position: 'absolute', height: style.height / 3, width: '100%'}}>
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={type === 'debitor' ? t('168') : t('171')} />
      <View style={styles.main}>
        <View style={styles.cardViewContainer}>
          <View>
            {type === 'debitor' ? (
              <ListCard
                type={2}
                width={width - 40}
                color={style.blue}
                isHave={true}
                disabled={true}
                userType={1}
                title={t('berilganqarz')}
                data={debitor?.data?.five}
              />
            ) : (
              <ListCard
                type={2}
                userType={2}
                disabled={true}
                width={width - 40}
                isHave={true}
                title={t('olinganqarz')}
                color={style.blue}
                data={creditor?.data?.five}
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default MuddatOzQolgan;

const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
  },
  main: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
  },
  cardViewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    flex: 0.9,
    borderRadius: 12,
  },
});
