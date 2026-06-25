import {Dimensions, StyleSheet, View} from 'react-native';
import React from 'react';
import {style} from '../../theme/style';
import {useNavigation, useRoute} from '@react-navigation/native';
import ListCard from '../components/ListCard';
import ScreenLayout from '../components/ScreenLayout';
import {useTranslation} from 'react-i18next';
const {width} = Dimensions.get('screen');
const MuddatOzQolgan = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {t} = useTranslation();
  const {creditor, debitor, type} = route.params;
  console.log(type, 'type');
  return (
    <ScreenLayout title={type === 'debitor' ? t('168') : t('171')} scroll={false}>
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
    </ScreenLayout>
  );
};

export default MuddatOzQolgan;

const styles = StyleSheet.create({
  cardViewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    flex: 0.9,
    borderRadius: 12,
  },
});
