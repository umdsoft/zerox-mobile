import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {Modal} from 'react-native-paper';
import {normalize, style} from '../../../theme/style';

import FileViewer from 'react-native-file-viewer';
import {t} from 'i18next';
import TransText from '../../components/TransText';

const DownloadModal = ({hide, onHide, data, path}) => {
  return (
    <Modal
      visible={hide}
      onDismiss={() => {
        onHide(!hide);
      }}>
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: normalize(10),
          alignSelf: 'center',
          padding: 10,
          width: normalize(250),
          height: normalize(160),
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text
            style={{
              fontFamily: style.fontFamilyBold,
              color: '#000',
              fontSize: style.fontSize.xs,
            }}
            allowFontScaling={false}>
            {t('Bildirishnoma')}
          </Text>
        </View>
        {data?.number && (
          <View style={{marginTop: 10, marginBottom: 10}}>
            <TransText
              tKey={'noti'}
              components={{
                id: <Text style={styles.text} allowFontScaling={false} />,
              }}
              values={{id: data.number}}
            />
            {/* <Text style={styles.text}>
              {data.number} - sonli qarz shartnomasi va ilova hujjatlarni yuklab
              oldingiz.
            </Text> */}
          </View>
        )}
        {data?.type == 0 ? (
          <View style={{marginTop: 10, marginBottom: 10}}>
            <Text style={styles.text} allowFontScaling={false}>
              Siz o'zingizni qr kodingizni yuklab oldingiz.
            </Text>
          </View>
        ) : null}
        <View
          style={{
            flexDirection: 'row',
            marginTop: 8,
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flex: 1,
          }}>
          <TouchableOpacity
            onPress={() => {
              onHide(!hide);
            }}
            activeOpacity={0.8}
            style={styles.enterButton}>
            <Text
              style={{
                fontFamily: style.fontFamilyMedium,
                color: '#fff',
                fontSize: style.fontSize.xx,
                textAlign: 'center',
              }}
              allowFontScaling={false}>
              {t('21')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              FileViewer.open(path)
                .then(response => {
                  onHide(!hide);
                  console.log({'FileViewerModal-response': response});
                })
                .catch(error => {
                  console.log({'FileViewerModal-error': error});
                });
              // onHide(!hide);
            }}
            activeOpacity={0.8}
            style={styles.enterButton}>
            <Text
              style={{
                fontFamily: style.fontFamilyMedium,
                color: '#fff',
                fontSize: style.fontSize.xx,
                textAlign: 'center',
              }}
              allowFontScaling={false}>
              {t('ochish')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default DownloadModal;

const styles = StyleSheet.create({
  enterButton: {
    backgroundColor: style.blue,
    borderRadius: 6,
    paddingVertical: 15,
    paddingHorizontal: 10,
    width: 100,
  },
  text: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    color: 'black',
  },
});
