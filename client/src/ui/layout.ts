import { Platform, StyleSheet } from 'react-native';

export const layoutStyles = StyleSheet.create({
  screenContent: {
    paddingTop: Platform.OS === 'ios' ? 58 : 38,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  loader: { marginVertical: 50 },
});
