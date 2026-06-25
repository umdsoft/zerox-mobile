import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {normalize, style} from '../../../theme/style';
import {sortText} from '../StatisticCard';

import Border from '../Border';
import MainText from '../MainText';
import {fontSize} from '../../../theme/font';
import {colors} from '../../../theme/colors';
import {tokens} from '../../../theme/tokens';
import {checkDate, settingDate} from '../../../helper';
// StatisticDebitor historically imported settingDate from UserDetails. Both
// implementations are byte-for-byte equivalent (DD.MM.YYYY), so the shared
// helper version below produces identical output for every variant.
import {t} from 'i18next';

/**
 * DebtDetailList — qarz tafsiloti / statistika kartasi (4 ta eski komponent o'rnida 1 ta).
 *
 * Eski komponentlar:
 *   CreditorList     => role="creditor" variant="detail"
 *   DebitorList      => role="debitor"  variant="detail"
 *   StatisticCreditor=> role="creditor" variant="statistic"
 *   StatisticDebitor => role="debitor"  variant="statistic"
 *
 * Har bir qator (field, t() kaliti, navigatsiya, shartli ko'rinish) eski
 * fayldagidek aynan saqlangan. StatisticCreditor'dagi xom <Text> -> <MainText>
 * ga normallashtirilgan (boshqalarga moslash uchun).
 */

const DebtDetailList = ({role = 'creditor', variant = 'detail', ...props}: any) => {
  const isDetail = variant === 'detail';
  const isCreditor = role === 'creditor';

  if (isCreditor && isDetail) {
    return <CreditorDetail {...props} />;
  }
  if (!isCreditor && isDetail) {
    return <DebitorDetail {...props} />;
  }
  if (isCreditor && !isDetail) {
    return <CreditorStatistic {...props} />;
  }
  return <DebitorStatistic {...props} />;
};

export default DebtDetailList;

/* =========================================================================
 * role="creditor" variant="detail"  (eski CreditorList)
 * ===================================================================== */
const CreditorDetail = ({type, item, status}) => {
  const navigation = useNavigation();
  const qarzmiqdori = String(t('330')).split(' ');

  return (
    <View style={styles.aboutUsContainer}>
      <View style={styles.header}>
        <View style={[styles.item, {left: 30}]}>
          <MainText size={fontSize[12]}>{t('273')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('ShowUserDetails', {
                id: item.duid,
                type: 1,
              });
            }}>
            <MainText color={colors.green} size={fontSize[12]}>
              {item?.debitor_name}
            </MainText>
          </TouchableOpacity>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: 30}]}>
          <MainText size={fontSize[12]}>{t('327')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {sortText(item?.amount)} {item?.currency}
          </MainText>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: 30}]}>
          <MainText size={fontSize[12]}>
            {qarzmiqdori[0]} {qarzmiqdori[1]} {'\n'}
            {qarzmiqdori[2]}
          </MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {sortText(item?.inc == null ? 0 : item?.inc)}{' '}
            {item?.currency}
          </MainText>
        </View>
      </View>
      <Border />
      {item?.residual_amount == null ? null : (
        <View style={styles.header}>
          <View style={[styles.item, {left: 30}]}>
            <MainText size={fontSize[12]}>{t('420')} </MainText>
          </View>
          <View style={[styles.item, {alignItems: 'center'}]}>
            <MainText size={fontSize[12]}>
              {sortText(item?.residual_amount)} {item?.currency}
            </MainText>
          </View>
        </View>
      )}
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: 30}]}>
          <MainText size={fontSize[12]}>{t('390')} </MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {settingDate(item?.created_at)}
          </MainText>
        </View>
      </View>

      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: 30}]}>
          <MainText size={fontSize[12]}>{t('396')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>{settingDate(item?.end_date)}</MainText>
        </View>
      </View>

      {item?.vos_summa == null && item.status == null ? null : (
        <>
          <View
            style={{
              backgroundColor: style.backgroundColor,
              width: '100%',
              height: 2,
            }}
          />
          <View style={styles.header}>
            <View style={[styles.item, {left: 30}]}>
              <MainText size={fontSize[12]}>{t('333')}</MainText>
            </View>
            <View style={[styles.item, {alignItems: 'center'}]}>
              <MainText size={fontSize[12]}>
                {item?.vos_summa !== null ? sortText(item?.vos_summa) : 0}{' '}
                {item?.currency}
              </MainText>
            </View>
          </View>
        </>
      )}

      {item?.status == null ? null : (
        <>
          <View
            style={{
              backgroundColor: style.backgroundColor,
              width: '100%',
              height: 2,
            }}
          />
          <View style={styles.header}>
            <View style={[styles.item, {left: 30}]}>
              <MainText size={fontSize[12]}>{t('339')}</MainText>
            </View>
            <View style={[styles.item, {alignItems: 'center'}]}>
              <MainText size={fontSize[12]}>
                {item?.status === 2 ? (
                  <MainText size={fontSize[12]} color={colors.green}>
                    {t('198')}
                  </MainText>
                ) : (
                  <MainText size={fontSize[12]} color={colors.red}>
                    {t('201')}
                  </MainText>
                )}
              </MainText>
            </View>
          </View>
        </>
      )}
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: 30}]}>
          <MainText size={fontSize[12]}>{t('324')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('DownloadStatistic', {
                item: item,
                id: item.uid,
              });
            }}>
            <MainText color={colors.blue} size={fontSize[12]}>
              {item?.number}
            </MainText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

/* =========================================================================
 * role="debitor" variant="detail"  (eski DebitorList)
 * ===================================================================== */
const DebitorDetail = ({isHave, item, type, status, person}) => {
  const navigation = useNavigation();
  const qarzmiqdori = String(t('330')).split(' ');

  return (
    <View style={[styles.aboutUsContainer, {marginTop: 20}]}>
      <View style={styles.header}>
        <View style={[styles.item, {left: normalize(20)}]}>
          <MainText size={fontSize[12]}>{t('270')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('ShowUserDetails', {
                id: item.cuid,
                type: 0,
              });
            }}>
            <MainText color={colors.red} size={fontSize[12]}>
              {item?.creditor_name}{' '}
            </MainText>
          </TouchableOpacity>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: normalize(20)}]}>
          <MainText size={fontSize[12]}>{t('327')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {sortText(item?.amount)} {item?.currency}
          </MainText>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: normalize(20)}]}>
          <MainText size={fontSize[12]}>
            {qarzmiqdori[0]} {qarzmiqdori[1]} {'\n'}
            {qarzmiqdori[2]}
          </MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {sortText(item?.inc)} {item?.currency}
          </MainText>
        </View>
      </View>
      {isHave ? (
        <>
          <Border />
          <View style={styles.header}>
            <View style={[styles.item, {left: normalize(20)}]}>
              <MainText size={fontSize[12]}>{t('420')}</MainText>
            </View>
            <View style={[styles.item, {alignItems: 'center'}]}>
              <MainText size={fontSize[12]}>
                {sortText(item?.residual_amount)} {item?.currency}
              </MainText>
            </View>
          </View>
        </>
      ) : null}
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: normalize(20)}]}>
          <MainText size={fontSize[12]}>{t('303')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {settingDate(item?.created_at)}
          </MainText>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: normalize(20)}]}>
          <MainText size={fontSize[12]}>{t('396')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>{checkDate(item?.end_date)}</MainText>
        </View>
      </View>

      {item?.vos_summa == null ? null : (
        <>
          <Border />
          <View style={styles.header}>
            <View style={[styles.item, {left: 40}]}>
              <MainText size={fontSize[12]}>{t('333')}</MainText>
            </View>
            <View style={[styles.item, {alignItems: 'center'}]}>
              <MainText size={fontSize[12]}>{item?.vos_summa}</MainText>
            </View>
          </View>
        </>
      )}
      {item?.status && (
        <>
          <Border />
          <View style={styles.header}>
            <View style={[styles.item, {left: 40}]}>
              <MainText size={fontSize[12]}>{t('339')}</MainText>
            </View>
            <View style={[styles.item, {alignItems: 'center'}]}>
              <MainText size={fontSize[12]}>
                {item?.status === 2 ? (
                  <MainText color={colors.green} size={fontSize[12]}>
                    {t('198')}
                  </MainText>
                ) : (
                  <MainText color={colors.red} size={fontSize[12]}>
                    {t('261')}
                  </MainText>
                )}
              </MainText>
            </View>
          </View>
        </>
      )}
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: normalize(20)}]}>
          <MainText size={fontSize[12]}>{t('306')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('DownloadStatistic', {
                item: item,
                id: item.id,
              });
            }}>
            <MainText color={colors.blue} size={fontSize[12]}>
              {item?.number}
            </MainText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

/* =========================================================================
 * role="creditor" variant="statistic"  (eski StatisticCreditor)
 * Xom <Text> -> <MainText> ga normallashtirildi (boshqa fayllarga moslash).
 * ===================================================================== */
const CreditorStatistic = ({type, item, status}) => {
  const navigation = useNavigation();

  return (
    <View style={styles.aboutUsContainer}>
      <View style={styles.header}>
        <View style={[styles.item, {left: 25}]}>
          <MainText color={colors.blue} size={fontSize[12]}>
            {t('273')}
          </MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          {/* Asl xom <Text onPress> normallashtirildi: MainText.onPress
              o'chirilgan, shuning uchun TouchableOpacity (siblinglardek). */}
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('ShowUserDetails', {
                id: item.duid,
                type: 1,
              });
            }}>
            <MainText color={colors.green} size={fontSize[12]}>
              {item?.debitor_name}
            </MainText>
          </TouchableOpacity>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: 25}]}>
          <MainText size={fontSize[12]}>{t('327')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {sortText(item?.amount)} {item?.currency}
          </MainText>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: 25}]}>
          <MainText size={fontSize[12]}>{t('330')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {item?.inc == null
              ? '-'
              : sortText(item?.inc) + ' ' + item?.currency}
          </MainText>
        </View>
      </View>
      <Border />
      {item?.vos_summa == null && item.status == null ? null : (
        <>
          <Border />
          <View style={styles.header}>
            <View style={[styles.item, {left: 25}]}>
              <MainText size={fontSize[12]}>{t('333')}</MainText>
            </View>
            <View style={[styles.item, {alignItems: 'center'}]}>
              <MainText size={fontSize[12]}>
                {item?.vos_summa !== null
                  ? sortText(item?.vos_summa) + ' ' + item?.currency
                  : ' - '}{' '}
              </MainText>
            </View>
          </View>
        </>
      )}
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: 25}]}>
          <MainText size={fontSize[12]}>
            {item.status === 2 ? t('390') : t('336')}
          </MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {settingDate(item?.created_at)}
          </MainText>
        </View>
      </View>
      {item.status === 2 ? (
        <>
          <Border />
          <View style={styles.header}>
            <View style={[styles.item, {left: 25}]}>
              <MainText size={fontSize[12]}>{t('321')}</MainText>
            </View>
            <View style={[styles.item, {alignItems: 'center'}]}>
              <MainText size={fontSize[12]}>{settingDate(item?.sana)}</MainText>
            </View>
          </View>
        </>
      ) : null}
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: 25}]}>
          <MainText size={fontSize[12]}>{t('339')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {item?.status === 2 ? (
              <MainText color={'green'} size={fontSize[12]}>
                {t('198')}
              </MainText>
            ) : (
              <MainText color={'red'} size={fontSize[12]}>
                {t('201')}
              </MainText>
            )}
          </MainText>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: 25}]}>
          <MainText size={fontSize[12]}>{t('324')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('DownloadStatistic', {
                item: item,
                id: item.uid,
              });
            }}>
            <MainText color={style.blue} size={fontSize[12]}>
              {item?.number}
            </MainText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

/* =========================================================================
 * role="debitor" variant="statistic"  (eski StatisticDebitor)
 * ===================================================================== */
const DebitorStatistic = ({isHave, item}) => {
  const navigation = useNavigation();

  return (
    <View style={[styles.aboutUsContainer, {marginTop: 20}]}>
      <View style={styles.header}>
        <View style={[styles.item, {left: normalize(30)}]}>
          <MainText size={fontSize[12]}>{t('270')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('ShowUserDetails', {
                id: item.cuid,
                type: 0,
              });
            }}>
            <MainText color={colors.red} size={fontSize[12]}>
              {item?.creditor_name}
            </MainText>
          </TouchableOpacity>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: normalize(30)}]}>
          <MainText size={fontSize[12]}>{t('327')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {sortText(item?.amount) + ' ' + item?.currency}
          </MainText>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: normalize(30)}]}>
          <MainText size={fontSize[12]}>{t('330')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {item.inc === null
              ? '-'
              : sortText(item?.inc) + ' ' + `${item?.currency}`}
          </MainText>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: normalize(30)}]}>
          <MainText size={fontSize[12]}>{t('333')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {item.vos_summa === null
              ? '-'
              : sortText(item?.vos_summa) + ' ' + `${item?.currency}`}
          </MainText>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: normalize(30)}]}>
          <MainText size={fontSize[12]}>
            {item.status === 2 ? t('303') : t('336')}
          </MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {settingDate(item?.created_at)}
          </MainText>
        </View>
      </View>
      {item.status === 2 ? (
        <>
          <Border />
          <View style={styles.header}>
            <View style={[styles.item, {left: normalize(30)}]}>
              <MainText size={fontSize[12]}>{t('321')}</MainText>
            </View>
            <View style={[styles.item, {alignItems: 'center'}]}>
              <MainText size={fontSize[12]}>{settingDate(item?.sana)}</MainText>
            </View>
          </View>
        </>
      ) : null}
      <Border />
      {item?.status && (
        <>
          <Border />
          <View style={styles.header}>
            <View style={[styles.item, {left: 40}]}>
              <MainText size={fontSize[12]}>{t('339')}</MainText>
            </View>
            <View style={[styles.item, {alignItems: 'center'}]}>
              <MainText size={fontSize[12]}>
                {item?.status === 2 ? (
                  <MainText size={fontSize[12]} color={colors.green}>
                    {t('198')}
                  </MainText>
                ) : (
                  <MainText color={colors.red} size={fontSize[12]}>
                    {t('201')}
                  </MainText>
                )}
              </MainText>
            </View>
          </View>
        </>
      )}
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: normalize(30)}]}>
          <MainText size={fontSize[12]}>{t('306')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('DownloadStatistic', {
                item: item,
                id: item.id,
              });
            }}>
            <MainText color={colors.blue} size={fontSize[12]}>
              {item?.number}
            </MainText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Eslatma: ranglar tokens.ts'dan olinadi (style/colors literallari o'rniga),
// ammo masofa/o'lcham SON qiymatlari (paddingVertical: 20, marginTop: 20 va h.k.)
// AYNAN saqlanadi — vizual layout o'zgarmasligi uchun (tokens.spacing scale != bu sonlar).
// aboutUsContainer'da `marginTop: 20` qoldirildi: bu Debitor variantlarining
// asl ko'rinishi; har bir wrapper ekrani allaqachon `styles.main` ichida joylashgan.
const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.color.background,
    flex: 1,
  },
  buttonInsideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  item: {
    flex: 1,
  },
  textButton: {
    fontSize: tokens.fontSize.xx,
    fontFamily: tokens.font.medium,
    color: tokens.color.white,
  },
  registerButton: {
    width: '85%',
    height: tokens.size.buttonHeight,
    backgroundColor: tokens.color.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    justifyContent: 'center',
  },
  info: {
    color: tokens.color.onSurface,
    fontFamily: tokens.font.medium,
    fontSize: tokens.fontSize.xx - 1,
    textAlign: 'left',
  },
  header: {
    backgroundColor: tokens.color.surface,
    paddingVertical: 20,
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    alignItems: 'center',
  },
  main: {
    width: '90%',
    alignSelf: 'center',
    zIndex: 1,
    paddingBottom: 5,
    marginTop: 20,
  },
  aboutUsContainer: {
    backgroundColor: tokens.color.surface,
    borderRadius: 10,
    flex: 1,
    ...tokens.shadow.card,
    overflow: 'hidden',
  },
});
