import { beforeEach, describe, expect, it, vi } from 'vitest';

const notificationMocks = vi.hoisted(() => ({
  receivedListener: undefined as ((notification: any) => void) | undefined,
  responseListener: undefined as ((response: any) => void) | undefined,
  receivedRemove: vi.fn(),
  responseRemove: vi.fn(),
  lastResponse: null as any,
  clearLastResponse: vi.fn(async () => undefined),
  setHandler: vi.fn(),
}));

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-notifications', () => ({
  setNotificationHandler: notificationMocks.setHandler,
  addNotificationReceivedListener: vi.fn((listener) => {
    notificationMocks.receivedListener = listener;
    return { remove: notificationMocks.receivedRemove };
  }),
  addNotificationResponseReceivedListener: vi.fn((listener) => {
    notificationMocks.responseListener = listener;
    return { remove: notificationMocks.responseRemove };
  }),
  getLastNotificationResponseAsync: vi.fn(async () => notificationMocks.lastResponse),
  clearLastNotificationResponseAsync: notificationMocks.clearLastResponse,
}));

import { subscribeToStudioCancellations } from '../src/notifications/pushNotifications';

const notification = (type: string) => ({ request: { content: { data: { type } } } });

describe('studio cancellation subscriptions', () => {
  beforeEach(() => {
    notificationMocks.receivedListener = undefined;
    notificationMocks.responseListener = undefined;
    notificationMocks.lastResponse = null;
    vi.clearAllMocks();
  });

  it('handles foreground delivery and a user opening the notification', async () => {
    const onCancellation = vi.fn();
    const unsubscribe = await subscribeToStudioCancellations(onCancellation);

    notificationMocks.receivedListener?.(notification('class_cancelled'));
    notificationMocks.responseListener?.({
      notification: notification('class_cancelled'),
    });
    notificationMocks.responseListener?.({ notification: notification('marketing') });

    expect(onCancellation).toHaveBeenCalledTimes(2);
    unsubscribe();
    expect(notificationMocks.receivedRemove).toHaveBeenCalledOnce();
    expect(notificationMocks.responseRemove).toHaveBeenCalledOnce();
  });

  it('handles and clears a cancellation that launched the app', async () => {
    notificationMocks.lastResponse = {
      notification: notification('class_cancelled'),
    };
    const onCancellation = vi.fn();

    await subscribeToStudioCancellations(onCancellation);

    expect(onCancellation).toHaveBeenCalledOnce();
    expect(notificationMocks.clearLastResponse).toHaveBeenCalledOnce();
  });
});
