import { Platform, StyleSheet } from 'react-native';

import { palette } from './theme';

export const layoutStyles = StyleSheet.create({
  screenContent: {
    paddingTop: Platform.OS === 'ios' ? 58 : 38,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  loader: { marginVertical: 50 },
});

export const actionStyles = StyleSheet.create({
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: palette.tomato,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  buttonDisabled: { opacity: 0.42 },
});
