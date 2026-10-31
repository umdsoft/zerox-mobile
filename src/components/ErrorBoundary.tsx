import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';
import {t} from 'i18next';
import {rd, rs} from '../theme/rd';

type State = {error: Error | null};

/**
 * Global ErrorBoundary: render paytida tutilmagan xato ilovani oq ekranga aylantirmasin.
 * Xato Crashlytics'ga yoziladi; foydalanuvchiga "Qayta urinish" tugmasi ko'rsatiladi
 * (bosilganda holat tozalanib, bolalar qayta mount qilinadi).
 */
export default class ErrorBoundary extends React.Component<
  {children?: React.ReactNode},
  State
> {
  state: State = {error: null};

  static getDerivedStateFromError(error: Error): State {
    return {error};
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    try {
      crashlytics().log(`ErrorBoundary: ${info?.componentStack?.slice(0, 500) ?? ''}`);
      crashlytics().recordError(error);
    } catch (_) {
      // Crashlytics tayyor bo'lmasa ham fallback ko'rsatilishi shart
    }
  }

  reset = () => this.setState({error: null});

  render() {
    if (!this.state.error) return this.props.children ?? null;
    return (
      <View style={styles.container}>
        <Text style={styles.title} allowFontScaling={false}>
          {t('Kutilmagan xatolik yuz berdi')}
        </Text>
        <Text style={styles.desc} allowFontScaling={false}>
          {t('Ilovada nosozlik yuz berdi. Qayta urinib ko‘ring.')}
        </Text>
        <TouchableOpacity activeOpacity={0.8} onPress={this.reset} style={styles.button}>
          <Text style={styles.buttonText} allowFontScaling={false}>
            {t('Qayta urinish')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: rs(24),
    backgroundColor: rd.color.page,
  },
  title: {
    fontFamily: rd.font.semibold,
    fontSize: rs(18),
    color: rd.color.text,
    textAlign: 'center',
  },
  desc: {
    marginTop: rs(8),
    fontSize: rs(14),
    color: rd.color.textTertiary,
    textAlign: 'center',
  },
  button: {
    marginTop: rs(24),
    paddingHorizontal: rs(28),
    height: rs(48),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
});
