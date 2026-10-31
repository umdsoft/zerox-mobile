import { ScrollView, StatusBar, View } from 'react-native';
import React from 'react';
import Loading from '../components/Loading';
import DatePicker from 'react-native-date-picker';
import { BIRTH_MIN_DATE } from '../../helper/birthDate';
import { t } from 'i18next';
import RdHeader from '../home/redesign/RdHeader';
import SearchForm from './searchUser/SearchForm';
import UserInfo from './searchUser/UserInfo';
import { formatDate } from './searchUser/searchUserLogic';
import { styles } from './searchUser/searchUserStyles';
import { useSearchUser } from './searchUser/useSearchUser';

export { formatDate };

const SearchUserScreen = () => {
  const s = useSearchUser();

  // Qidiruv formasini korsatish
  if (s.loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <RdHeader title={t('267')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {s.searchForm == false ? (
          s.error === false &&
          s.loading === false &&
          s.data?.success && (
            <UserInfo user={s.data?.user} navigation={s.navigation} type={s.type} />
          )
        ) : (
          <SearchForm
            type={s.type}
            accent={s.accent}
            userID={s.userID}
            setUserID={s.setUserID}
            focused={s.focused}
            setFocused={s.setFocused}
            date={s.date}
            datePickerOpen={s.open}
            openDatePicker={s.openDatePicker}
            disabled={s.disabled}
            onSearch={s.searchUser}
          />
        )}
      </ScrollView>

      <DatePicker
        open={s.open}
        date={s.date ?? s.pickerDefault}
        style={{
          backgroundColor: '#fff',
          alignSelf: 'center',
        }}
        mode="date"
        confirmText="OK"
        cancelText={t('804')}
        theme="light"
        modal={true}
        onCancel={() => {
          s.setOpen(false);
        }}
        title={t('213')}
        onConfirm={picked => {
          s.setDate(picked);
          s.setOpen(false);
        }}
        maximumDate={new Date()}
        minimumDate={BIRTH_MIN_DATE}
      />
    </View>
  );
};

export default SearchUserScreen;
