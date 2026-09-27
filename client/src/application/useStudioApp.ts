import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { getScheduleQuery } from '../domain/policies';
import { Booking, CookingClass, EquipmentOption, StudioApi, StudioApiError } from '../domain/types';
import { BookingAttempt, getOrCreateBookingAttempt } from '../features/booking/bookingAttempt';
import {
  executeBooking,
  executeCancellation,
  finalizeBookingMutation,
  replaceCookingClass,
  upsertBooking,
} from '../features/booking/bookingFlow';
import { loadStudioSnapshot } from '../features/schedule/loadStudioSnapshot';
import { findCancelledBooking } from '../notifications/cancellationRouting';
import {
  registerForPushNotifications,
  subscribeToStudioCancellations,
} from '../notifications/pushNotifications';
import { beginLoad, completeLoad, failLoad, LoadState } from '../shared/loadState';
import { BookingFilter, PushStatus, Tab } from '../shared/viewTypes';

export function useStudioApp(api: StudioApi) {
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

  const classesRef = useRef(classes);
  const horizonDaysRef = useRef(horizonDays);

  useEffect(() => {
    classesRef.current = classes;
  }, [classes]);

  useEffect(() => {
    horizonDaysRef.current = horizonDays;
  }, [horizonDays]);

  const refresh = useCallback(
    async (days = horizonDaysRef.current) => {
      const requestId = ++refreshRequestRef.current;
      const isLatestRequest = () => requestId === refreshRequestRef.current;
      setScheduleLoadState(beginLoad(scheduleSnapshotRef.current));
      setBookingsLoadState(beginLoad(bookingsSnapshotRef.current));

      const { scheduleResult, bookingsResult, detailResults } = await loadStudioSnapshot(
        api,
        getScheduleQuery(days),
        classesRef.current,
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
              current.filter((item) => wantedClassIds.has(item.id)).map((item) => [item.id, item]),
            );
            loadedClasses.forEach((item) => byId.set(item.id, item));
            return [...byId.values()];
          });
          setBookings(nextBookings);
          bookingsSnapshotRef.current = true;
          setBookingsLoadState(classDetailsFailed ? 'stale' : completeLoad(nextBookings.length));
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
    },
    [api],
  );

  useEffect(() => {
    refresh(horizonDays).catch(() => setToast('Не все данные удалось обновить. Доступен повтор.'));
  }, [horizonDays, refresh]);

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
    })
      .then((cleanup) => {
        if (disposed) cleanup();
        else unsubscribe = cleanup;
      })
      .catch(() => {
        if (!disposed) setToast('Не удалось подключить обработчик уведомлений.');
      });
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [api]);

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
          result.error instanceof Error ? result.error.message : 'Не удалось отменить запись.',
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
      {
        text: 'Отменить запись',
        style: 'destructive',
        onPress: () => void performCancel(booking),
      },
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

  return {
    tab,
    setTab,
    bookingFilter,
    setBookingFilter,
    scheduleClasses,
    classes,
    bookings,
    selectedClass,
    setSelectedClass,
    reviewBooking,
    setReviewBooking,
    scheduleLoadState,
    bookingsLoadState,
    busy,
    toast,
    horizonDays,
    setHorizonDays,
    pushStatus,
    refresh,
    handleEnablePush,
    handleBook,
    handleCancel,
    handleReview,
    reviewClass,
  };
}
