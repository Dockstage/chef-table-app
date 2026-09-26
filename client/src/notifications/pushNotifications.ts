import { Platform } from 'react-native';

import { PushPlatform } from '../domain/types';
import {
  parseStudioCancellationNotification,
  StudioCancellationNotification,
} from './pushPayload';

export type PushRegistrationResult =
  | { status: 'enabled'; token: string; platform: PushPlatform }
  | { status: 'denied' | 'unsupported' };

export type CancellationInteraction = 'received' | 'opened';

export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return { status: 'unsupported' };

  const Notifications = await import('expo-notifications');
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
  onCancellation: (
    payload: StudioCancellationNotification,
    interaction: CancellationInteraction,
  ) => void | Promise<void>,
): Promise<() => void> {
  if (Platform.OS === 'web') return () => undefined;
  const Notifications = await import('expo-notifications');
  let active = true;
  const handlePayload = async (data: unknown, interaction: CancellationInteraction) => {
    const payload = parseStudioCancellationNotification(data);
    if (active && payload) await onCancellation(payload, interaction);
  };

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    void handlePayload(notification.request.content.data, 'received');
  });
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    void handlePayload(response.notification.request.content.data, 'opened');
  });

  const lastResponse = await Notifications.getLastNotificationResponseAsync();
  if (lastResponse) {
    const payload = parseStudioCancellationNotification(
      lastResponse.notification.request.content.data,
    );
    if (payload) {
      await handlePayload(payload, 'opened');
      await Notifications.clearLastNotificationResponseAsync();
    }
  }

  return () => {
    active = false;
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
