import {Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';

import ScreenLayout from '../../../components/ScreenLayout';

import {useDispatch, useSelector} from 'react-redux';
import IosIcon from '../../../../images/ios';
import AndroidIcon from '../../../../images/android';
import LaptopIcon from '../../../../images/laptop';

import {getUniqueId} from 'react-native-device-info';
import {getDevicesAction, onDeleteDevices} from '../../../../store/api/home';
import {rd, rs} from '../../../../theme/rd';

const ShareDevices = () => {
  const {user, devices} = useSelector(state => state.HomeReducer);
  const [data, setData] = useState([]);
  const [currect, setCurrent] = useState({});
  const dispatch = useDispatch();
  const checking = useCallback(async () => {
    const id = await getUniqueId();
    const a = devices.filter(item => item.device_id === id);
    const b = devices.filter(item => item.device_id !== id);

    setData(b);
    setCurrent(a[0]);
  }, [devices]);

  const onDeleteDevice = useCallback(async () => {
    let c = [];

    devices.map((item, index) => {
      if (item.id !== currect.id) {
        c.push(item.id);
      }
    });

    dispatch(onDeleteDevices({data: c}))
      .then(value => {
        dispatch(getDevicesAction());
      })
      .catch(err => {
        console.error(err);
      });
  }, []);

  // Ekran ochilganda qurilmalar ro'yxatini olamiz (oldin faqat o'chirishdan keyin olinardi → bo'sh edi).
  useEffect(() => {
    dispatch(getDevicesAction());
  }, [dispatch]);

  useEffect(() => {
    checking();
  }, [checking]);

  return (
    <ScreenLayout title={'Ulangan qurilmalar'}>
      <Text style={styles.sectionLabel} allowFontScaling={false}>
        Hozirgi seans
      </Text>
      <View style={styles.card}>
        <View style={styles.deviceRow}>
          <View style={styles.iconCircle}>{renderImage(currect)}</View>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName} allowFontScaling={false}>
              {currect?.device_name}
            </Text>
            <Text style={styles.deviceMeta} allowFontScaling={false}>
              ZeroX{' '}
              {Platform.OS === 'ios'
                ? `IOS ${currect?.system_version}`
                : `Android ${currect?.system_version}`}
            </Text>
            <Text style={styles.deviceLocation} allowFontScaling={false}>
              {currect?.location}
            </Text>
          </View>
        </View>
      </View>

      {data.length === 0 ? null : (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onDeleteDevice}
          style={styles.deleteBtn}>
          <Text style={styles.deleteText} allowFontScaling={false}>
            Barcha seanslarni o'chirish
          </Text>
        </TouchableOpacity>
      )}

      {data.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText} allowFontScaling={false}>
            Sizda boshqa seanslar mavjud emas
          </Text>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionLabel} allowFontScaling={false}>
            Active seanslar
          </Text>
          <View style={styles.card}>
            {data.map((item, index) => {
              return (
                <View
                  key={index.toString()}
                  style={[styles.deviceRow, index > 0 && styles.rowDivider]}>
                  <View style={styles.iconCircle}>{renderImage(item)}</View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName} allowFontScaling={false}>
                      {item.device_name}
                    </Text>
                    <Text style={styles.deviceMeta} allowFontScaling={false}>
                      ZeroX {renderText(item)}
                    </Text>
                    <Text style={styles.deviceLocation} allowFontScaling={false}>
                      {item?.location}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </ScreenLayout>
  );
};

const renderImage = item => {
  switch (item?.os_type) {
    case 'Destop':
      return <LaptopIcon width={rs(22)} height={rs(22)} color="white" />;
    case 'Apple':
      return <IosIcon width={rs(22)} height={rs(22)} color="white" />;
    case 'google':
      return <AndroidIcon width={rs(22)} height={rs(22)} color="white" />;
    default:
      return <AndroidIcon width={rs(22)} height={rs(22)} color="white" />;
  }
};

const renderText = item => {
  if (item.os_type === 'Apple') {
    return `IOS ${item?.system_version}`;
  }
  if (item.os_type === 'Android') {
    return `Android ${item?.system_version}`;
  }
  return `Android ${item?.system_version}`;
};

export default ShareDevices;

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginBottom: rs(8),
  },
  section: {
    marginTop: rs(20),
  },
  card: {
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    overflow: 'hidden',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rs(12),
    paddingHorizontal: rs(14),
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  iconCircle: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.text,
  },
  deviceMeta: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginTop: rs(2),
  },
  deviceLocation: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
  deleteBtn: {
    alignItems: 'center',
    marginTop: rs(14),
    paddingVertical: rs(6),
  },
  deleteText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.error,
  },
  emptyWrap: {
    marginTop: rs(20),
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.textTertiary,
  },
});
