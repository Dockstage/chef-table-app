import { Platform } from 'react-native';

import { PushPlatform } from '../domain/types';
import { isStudioCancellationNotification } from './pushPayload';

export type PushRegistrationResult =
  | { status: 'enabled'; token: string; platform: PushPlatform }
  | { status: 'denied' | 'unsupported' };

export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return { status: 'unsupported' };

  const Notifications = await import('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('class-cancellations', {
      name: 'Отмены классов',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted
    ? current
    : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return { status: 'denied' };

  const token = await Notifications.getDevicePushTokenAsync();
  if (typeof token.data !== 'string') return { status: 'unsupported' };
  return { status: 'enabled', token: token.data, platform: Platform.OS };
}

export async function subscribeToStudioCancellations(
  onCancellation: () => void,
): Promise<() => void> {
  if (Platform.OS === 'web') return () => undefined;
  const Notifications = await import('expo-notifications');
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    if (isStudioCancellationNotification(notification.request.content.data)) onCancellation();
  });
  return () => subscription.remove();
}
