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

const validPayload = {
  type: 'class_cancelled',
  bookingId: '30000000-0000-4000-8000-000000000003',
  reason: 'Поставка продуктов задерживается',
};
const notification = (data: unknown) => ({ request: { content: { data } } });

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

    notificationMocks.receivedListener?.(notification(validPayload));
    notificationMocks.responseListener?.({
      notification: notification(validPayload),
    });
    notificationMocks.responseListener?.({ notification: notification({ type: 'marketing' }) });

    expect(onCancellation).toHaveBeenCalledTimes(2);
    expect(onCancellation).toHaveBeenNthCalledWith(1, validPayload, 'received');
    expect(onCancellation).toHaveBeenNthCalledWith(2, validPayload, 'opened');
    unsubscribe();
    expect(notificationMocks.receivedRemove).toHaveBeenCalledOnce();
    expect(notificationMocks.responseRemove).toHaveBeenCalledOnce();
  });

  it('handles and clears a cancellation that launched the app', async () => {
    notificationMocks.lastResponse = {
      notification: notification(validPayload),
    };
    const onCancellation = vi.fn();

    await subscribeToStudioCancellations(onCancellation);

    expect(onCancellation).toHaveBeenCalledOnce();
    expect(onCancellation).toHaveBeenCalledWith(validPayload, 'opened');
    expect(notificationMocks.clearLastResponse).toHaveBeenCalledOnce();
  });

  it('does not process or clear a malformed cold-start response', async () => {
    notificationMocks.lastResponse = {
      notification: notification({
        type: 'class_cancelled',
        bookingId: validPayload.bookingId,
      }),
    };
    const onCancellation = vi.fn();

    await subscribeToStudioCancellations(onCancellation);

    expect(onCancellation).not.toHaveBeenCalled();
    expect(notificationMocks.clearLastResponse).not.toHaveBeenCalled();
  });
});
