import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { createStudioApi } from './src/data/createStudioApi';
import {
  BookingAttempt,
  getOrCreateBookingAttempt,
} from './src/features/booking/bookingAttempt';
import { ClassModal } from './src/features/booking/ClassModal';
import {
  executeBooking,
  executeCancellation,
  finalizeBookingMutation,
  replaceCookingClass,
  upsertBooking,
} from './src/features/booking/bookingFlow';
import {
  BookingFilter,
  BookingsScreen,
} from './src/features/bookings/BookingsScreen';
import { ProfileScreen, PushStatus } from './src/features/profile/ProfileScreen';
import { ReviewModal } from './src/features/review/ReviewModal';
import { DiscoverScreen } from './src/features/schedule/DiscoverScreen';
import { loadStudioSnapshot } from './src/features/schedule/loadStudioSnapshot';
import { findCancelledBooking } from './src/notifications/cancellationRouting';
import {
  registerForPushNotifications,
  subscribeToStudioCancellations,
} from './src/notifications/pushNotifications';
import { getScheduleQuery } from './src/domain/policies';
import {
  Booking,
  CookingClass,
  EquipmentOption,
  StudioApiError,
} from './src/domain/types';
import {
  beginLoad,
  completeLoad,
  failLoad,
  LoadState,
} from './src/shared/loadState';
import { palette } from './src/ui/theme';

const api = createStudioApi();

type Tab = 'discover' | 'bookings' | 'profile';

function BottomNav({ value, onChange }: { value: Tab; onChange: (tab: Tab) => void }) {
  const tabs: { value: Tab; icon: string; label: string }[] = [
    { value: 'discover', icon: '⌂', label: 'Классы' },
    { value: 'bookings', icon: '□', label: 'Мои записи' },
    { value: 'profile', icon: '○', label: 'Профиль' },
  ];
  return (
    <View style={styles.nav}>
      {tabs.map((tab) => {
        const active = value === tab.value;
        return (
          <Pressable key={tab.value} onPress={() => onChange(tab.value)} style={styles.navItem}>
            <Text style={[styles.navIcon, active && styles.navActive]}>{tab.icon}</Text>
            <Text style={[styles.navLabel, active && styles.navActive]}>{tab.label}</Text>
            {active && <View style={styles.navIndicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function App() {
  const bookingAttemptRef = useRef<BookingAttempt | null>(null);
  const scheduleSnapshotRef = useRef(false);
  const bookingsSnapshotRef = useRef(false);
  const refreshRequestRef = useRef(0);
  const [tab, setTab] = useState<Tab>('discover');
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>('upcoming');
  const [scheduleClasses, setScheduleClasses] = useState<CookingClass[]>([]);
  const [bookingClasses, setBookingClasses] = useState<CookingClass[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedClass, setSelectedClass] = useState<CookingClass | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [scheduleLoadState, setScheduleLoadState] = useState<LoadState>('initial');
  const [bookingsLoadState, setBookingsLoadState] = useState<LoadState>('initial');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [horizonDays, setHorizonDays] = useState(7);
  const [pushStatus, setPushStatus] = useState<PushStatus>(
    Platform.OS === 'web' ? 'unsupported' : 'idle',
  );

  const classes = useMemo(() => {
    const byId = new Map(bookingClasses.map((item) => [item.id, item]));
    scheduleClasses.forEach((item) => byId.set(item.id, item));
    return [...byId.values()];
  }, [bookingClasses, scheduleClasses]);

  const refresh = async (days = horizonDays) => {
    const requestId = ++refreshRequestRef.current;
    const isLatestRequest = () => requestId === refreshRequestRef.current;
    setScheduleLoadState(beginLoad(scheduleSnapshotRef.current));
    setBookingsLoadState(beginLoad(bookingsSnapshotRef.current));

    const { scheduleResult, bookingsResult, detailResults } = await loadStudioSnapshot(
      api,
      getScheduleQuery(days),
      classes,
    );

    if (isLatestRequest()) {
      if (scheduleResult.status === 'fulfilled') {
        setScheduleClasses(scheduleResult.value);
        scheduleSnapshotRef.current = true;
        setScheduleLoadState(completeLoad(scheduleResult.value.length));
      } else {
        setScheduleLoadState(failLoad(scheduleSnapshotRef.current));
      }
    }

    let classDetailsFailed = false;
    if (bookingsResult.status === 'fulfilled') {
      const nextBookings = bookingsResult.value;
      classDetailsFailed = detailResults.some((result) => result.status === 'rejected');

      if (isLatestRequest()) {
        const wantedClassIds = new Set(nextBookings.map((item) => item.classId));
        const loadedClasses = detailResults.flatMap((result) =>
          result.status === 'fulfilled' ? [result.value] : [],
        );
        setBookingClasses((current) => {
          const byId = new Map(
            current
              .filter((item) => wantedClassIds.has(item.id))
              .map((item) => [item.id, item]),
          );
          loadedClasses.forEach((item) => byId.set(item.id, item));
          return [...byId.values()];
        });
        setBookings(nextBookings);
        bookingsSnapshotRef.current = true;
        setBookingsLoadState(
          classDetailsFailed ? 'stale' : completeLoad(nextBookings.length),
        );
      }
    } else if (isLatestRequest()) {
      setBookingsLoadState(failLoad(bookingsSnapshotRef.current));
    }

    if (
      scheduleResult.status === 'rejected' ||
      bookingsResult.status === 'rejected' ||
      classDetailsFailed
    ) {
      throw new Error('Не все данные удалось обновить.');
    }
  };

  useEffect(() => {
    refresh(horizonDays)
      .catch(() => setToast('Не все данные удалось обновить. Доступен повтор.'));
  }, [horizonDays]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    let disposed = false;
    let unsubscribe: () => void = () => undefined;
    void subscribeToStudioCancellations(async (payload, interaction) => {
      if (interaction === 'opened') {
        setBookingFilter('history');
        setTab('bookings');
      }

      setBookingsLoadState(beginLoad(bookingsSnapshotRef.current));
      try {
        const latestBookings = await api.getBookings();
        const cancelledBooking = findCancelledBooking(latestBookings, payload);
        if (!cancelledBooking) throw new Error('Cancellation is not available yet.');

        setBookings((current) => upsertBooking(current, cancelledBooking));
        bookingsSnapshotRef.current = true;
        setBookingsLoadState('content');
        setToast('Студия отменила класс. Причина сохранена в истории.');
      } catch {
        setBookingsLoadState(failLoad(bookingsSnapshotRef.current));
        setToast('Получили отмену, но не смогли обновить запись. Повторите позже.');
      }
    }).then((cleanup) => {
      if (disposed) cleanup();
      else unsubscribe = cleanup;
    }).catch(() => {
      if (!disposed) setToast('Не удалось подключить обработчик уведомлений.');
    });
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  const handleEnablePush = async () => {
    setPushStatus('enabling');
    try {
      const result = await registerForPushNotifications();
      if (result.status === 'enabled') {
        await api.registerPushToken({ token: result.token, platform: result.platform });
        setPushStatus('enabled');
        setToast('Уведомления об отменах включены.');
      } else {
        setPushStatus(result.status);
        setToast(
          result.status === 'denied'
            ? 'Разрешение не выдано. Его можно включить в настройках телефона.'
            : 'Push-уведомления доступны в Android и iOS приложении.',
        );
      }
    } catch {
      setPushStatus('idle');
      setToast('Не удалось подключить уведомления. Попробуйте ещё раз.');
    }
  };

  const handleBook = async (equipment: EquipmentOption, allergyNotes: string) => {
    if (!selectedClass) return;
    const input = {
      classId: selectedClass.id,
      equipmentOption: equipment,
      allergyNotes,
    };
    const attempt = getOrCreateBookingAttempt(input, bookingAttemptRef.current);
    bookingAttemptRef.current = attempt;
    setBusy(true);
    try {
      const result = await executeBooking(api, input, attempt.idempotencyKey);
      if (result.kind === 'rejected') {
        const { error } = result;
        if (!(error instanceof StudioApiError && error.code === 'NETWORK_ERROR')) {
          bookingAttemptRef.current = null;
        }
        const latestClass = result.latestClass;
        if (latestClass) {
          setScheduleClasses((current) => replaceCookingClass(current, latestClass));
          setBookingClasses((current) => replaceCookingClass(current, latestClass));
          setSelectedClass(latestClass);
        }
        setToast(
          error instanceof StudioApiError
            ? error.message
            : 'Не удалось оформить запись. Попробуйте ещё раз.',
        );
        return;
      }

      bookingAttemptRef.current = null;
      const refreshStatus = await finalizeBookingMutation(
        result.booking,
        (booking) => {
          setBookings((current) => upsertBooking(current, booking));
          setSelectedClass(null);
          setTab('bookings');
          setToast('Готово! Класс добавлен в ваши планы.');
        },
        () => refresh(),
      );
      if (refreshStatus === 'stale') {
        setToast('Запись оформлена, но обновить остальные данные не удалось. Повторите позже.');
      }
    } catch {
      if (bookingAttemptRef.current?.idempotencyKey === attempt.idempotencyKey) {
        bookingAttemptRef.current = null;
      }
      setToast('Не удалось обработать результат записи. Обновите данные и проверьте «Мои записи».');
    } finally {
      setBusy(false);
    }
  };

  const performCancel = async (booking: Booking) => {
    setBusy(true);
    try {
      const result = await executeCancellation(api, booking.id);
      if (result.kind === 'rejected') {
        const latestBooking = result.latestBooking;
        if (latestBooking) {
          setBookings((current) => upsertBooking(current, latestBooking));
        }
        setToast(
          result.error instanceof Error
            ? result.error.message
            : 'Не удалось отменить запись.',
        );
        return;
      }

      const refreshStatus = await finalizeBookingMutation(
        result.booking,
        (updatedBooking) => {
          setBookings((current) => upsertBooking(current, updatedBooking));
          setToast('Запись отменена, место вернулось в расписание.');
        },
        () => refresh(),
      );
      if (refreshStatus === 'stale') {
        setToast('Запись отменена, но обновить расписание не удалось. Повторите позже.');
      }
    } catch {
      setToast('Отмена выполнена с неизвестным результатом. Обновите список записей.');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = (booking: Booking) => {
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.('Отменить запись? Место станет доступно другим гостям.')) {
        void performCancel(booking);
      }
      return;
    }
    Alert.alert('Отменить запись?', 'Место станет доступно другим гостям.', [
      { text: 'Оставить', style: 'cancel' },
      { text: 'Отменить запись', style: 'destructive', onPress: () => void performCancel(booking) },
    ]);
  };

  const handleReview = async (rating: number, comment: string) => {
    if (!reviewBooking) return;
    setBusy(true);
    try {
      const updatedBooking = await api.submitReview({
        bookingId: reviewBooking.id,
        rating,
        comment,
      });
      const refreshStatus = await finalizeBookingMutation(
        updatedBooking,
        (booking) => {
          setBookings((current) => upsertBooking(current, booking));
          setReviewBooking(null);
          setToast('Спасибо! Оценка поможет команде студии.');
        },
        () => refresh(),
      );
      if (refreshStatus === 'stale') {
        setToast('Оценка сохранена, но обновить остальные данные не удалось.');
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Не удалось отправить оценку.');
    } finally {
      setBusy(false);
    }
  };

  const reviewClass = reviewBooking
    ? classes.find((item) => item.id === reviewBooking.classId)
    : undefined;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.phoneFrame}>
        <View style={styles.page}>
          {tab === 'discover' && (
            <DiscoverScreen
              classes={scheduleClasses}
              loadState={scheduleLoadState}
              onRetry={() => void refresh(horizonDays).catch(() => undefined)}
              onSelect={setSelectedClass}
              horizonDays={horizonDays}
              onHorizonChange={setHorizonDays}
            />
          )}
          {tab === 'bookings' && (
            <BookingsScreen
              classes={classes}
              bookings={bookings}
              filter={bookingFilter}
              onFilterChange={setBookingFilter}
              loadState={bookingsLoadState}
              onRetry={() => void refresh(horizonDays).catch(() => undefined)}
              onCancel={handleCancel}
              onReview={setReviewBooking}
            />
          )}
          {tab === 'profile' && (
            <ProfileScreen
              bookings={bookings}
              pushStatus={pushStatus}
              onEnablePush={() => void handleEnablePush()}
            />
          )}
        </View>
        <BottomNav value={tab} onChange={setTab} />

        {toast && (
          <View style={styles.toast}>
            <Text style={styles.toastMark}>✓</Text>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}
      </View>

      <ClassModal
        cookingClass={selectedClass}
        busy={busy}
        onClose={() => setSelectedClass(null)}
        onBook={handleBook}
      />
      <ReviewModal
        booking={reviewBooking}
        cookingClass={reviewClass}
        busy={busy}
        onClose={() => setReviewBooking(null)}
        onSubmit={handleReview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#DDD6CB' },
  phoneFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    backgroundColor: palette.canvas,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 60px rgba(50, 45, 35, 0.13)',
        }
      : {}),
  },
  page: { flex: 1 },
  nav: {
    height: Platform.OS === 'ios' ? 88 : 74,
    paddingBottom: Platform.OS === 'ios' ? 16 : 4,
    flexDirection: 'row',
    backgroundColor: palette.paper,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  navIcon: { fontSize: 22, color: '#99938A', lineHeight: 23 },
  navLabel: { fontSize: 9, fontWeight: '700', color: '#99938A', marginTop: 3 },
  navActive: { color: palette.tomato },
  navIndicator: { position: 'absolute', top: 0, width: 26, height: 3, backgroundColor: palette.tomato, borderRadius: 2 },
  toast: { position: 'absolute', left: 16, right: 16, bottom: Platform.OS === 'ios' ? 102 : 84, backgroundColor: palette.ink, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' },
  toastMark: { color: '#9ED6B9', fontSize: 16, fontWeight: '900', marginRight: 10 },
  toastText: { color: '#FFFFFF', fontSize: 12, lineHeight: 17, flex: 1, fontWeight: '700' },
});
