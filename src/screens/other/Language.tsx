import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback} from 'react';
import {style} from '../../theme/style';

import Uzbekistan from '../../images/Uzbekistan';
import Russian from '../../images/Russian';
import CheckIcon from '../../images/Check';

import {useTranslation} from 'react-i18next';
import ScreenLayout from '../components/ScreenLayout';
import {storage} from '../../store/api/token/getToken';
import {t} from 'i18next';
import {onPostDefaultLang} from '../../store/api/home';
import {useDispatch, useSelector} from 'react-redux';

const Language = () => {
  const {i18n} = useTranslation();
  const dispatch = useDispatch();
  const {user} = useSelector(state => state.HomeReducer);
  const onChangeLanguage = useCallback(
    async text => {
      i18n.changeLanguage(text);
      storage.set('lang', text);
      await dispatch(
        onPostDefaultLang({lang: text, id: user?.data?.id}),
      ).unwrap();
    },
    [dispatch, i18n, user?.data?.id],
  );

  return (
    <ScreenLayout title={t('til')}>
      <View style={styles.aboutUsContainer}>
              <TouchableOpacity
                onPress={() => {
                  onChangeLanguage('uz');
                }}
                style={styles.TouchableOpacity}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Uzbekistan size={35} />
                  <Text style={styles.optionTx} allowFontScaling={false}>O‘zbekcha </Text>
                </View>
                {i18n.language === 'uz' && (
                  <View style={styles.check}>
                    <CheckIcon size={22} color={style.blue} />
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  onChangeLanguage('kr');
                }}
                style={styles.TouchableOpacity}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Uzbekistan size={35} />
                  <Text style={styles.optionTx} allowFontScaling={false}>Ўзбекча</Text>
                </View>
                {i18n.language === 'kr' && (
                  <View style={styles.check}>
                    <CheckIcon size={22} color={style.blue} />
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  onChangeLanguage('ru');
                }}
                style={styles.TouchableOpacity}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Russian size={35} />
                  <Text style={styles.optionTx} allowFontScaling={false}>Русский </Text>
                </View>
                {i18n.language === 'ru' && (
                  <View style={styles.check}>
                    <CheckIcon size={22} color={style.blue} />
                  </View>
                )}
              </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
};

export default Language;

const styles = StyleSheet.create({
  check: {
    marginRight: 10,
  },
  TouchableOpacity: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    marginTop: 5,
    justifyContent: 'space-between',
  },
  optionTx: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xa + 2,
    color: '#000',
    marginLeft: 5,
  },
  name: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xa + 1,
    color: '#000',
  },
  info: {
    marginTop: 5,
  },
  title: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xa,
    color: style.blue,
  },
  userImageContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  aboutUsContainer: {
    backgroundColor: '#EAF2FB',

    borderRadius: 15,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    padding: 10,
    paddingBottom: 20,
  },
});
