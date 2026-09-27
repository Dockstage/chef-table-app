import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createStudioApi } from './src/data/createStudioApi';
import {
  BookingAttempt,
  getOrCreateBookingAttempt,
} from './src/features/booking/bookingAttempt';
import {
  executeBooking,
  executeCancellation,
  finalizeBookingMutation,
  replaceCookingClass,
  upsertBooking,
} from './src/features/booking/bookingFlow';
import { DiscoverScreen } from './src/features/schedule/DiscoverScreen';
import { loadStudioSnapshot } from './src/features/schedule/loadStudioSnapshot';
import { findCancelledBooking } from './src/notifications/cancellationRouting';
import {
  registerForPushNotifications,
  subscribeToStudioCancellations,
} from './src/notifications/pushNotifications';
import {
  canCancelBooking,
  canReview,
  filterBookings,
  formatLongDate,
  formatMoney,
  formatTime,
  getScheduleQuery,
  hoursUntilClass,
  isBookable,
} from './src/domain/policies';
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
  isInitialLoad,
  LoadState,
} from './src/shared/loadState';
import { layoutStyles } from './src/ui/layout';
import {
  EmptyState,
  ErrorState,
  RefreshNotice,
  ScreenHeader,
  Segment,
} from './src/ui/primitives';
import { palette } from './src/ui/theme';

const api = createStudioApi();

type Tab = 'discover' | 'bookings' | 'profile';
type BookingFilter = 'upcoming' | 'history';
type PushStatus = 'idle' | 'enabling' | 'enabled' | 'denied' | 'unsupported';

function formatCountdown(cookingClass: CookingClass): string {
  const hours = hoursUntilClass(cookingClass);
  if (hours < 24) return 'сегодня';
  return `${Math.ceil(hours / 24)} дн.`;
}

function BookingStatusPill({ status }: { status: Booking['status'] }) {
  const config: Record<Booking['status'], { label: string; background: string; color: string }> = {
    confirmed: { label: 'Подтверждено', background: palette.sageSoft, color: palette.sage },
    attended: { label: 'Вы были', background: '#ECE8DF', color: '#5C584F' },
    cancelled_by_client: {
      label: 'Вы отменили',
      background: '#ECE8DF',
      color: '#77736B',
    },
    cancelled_by_studio: {
      label: 'Отменён студией',
      background: palette.dangerSoft,
      color: palette.tomatoDark,
    },
  };
  const item = config[status];
  return (
    <View style={[styles.statusPill, { backgroundColor: item.background }]}>
      <Text style={[styles.statusPillText, { color: item.color }]}>{item.label}</Text>
    </View>
  );
}

function UnavailableBookingCard({ booking }: { booking: Booking }) {
  return (
    <View style={styles.bookingCard}>
      <View style={styles.bookingTopRow}>
        <BookingStatusPill status={booking.status} />
        <Text style={styles.bookingPrice}>{formatMoney(booking.totalPriceKopecks)}</Text>
      </View>
      <Text style={styles.bookingTitle}>Данные класса недоступны</Text>
      <Text style={styles.bookingDetail}>
        Запись сохранена. Обновите данные позже, чтобы увидеть детали.
      </Text>
    </View>
  );
}

function BookingsScreen({
  classes,
  bookings,
  filter,
  onFilterChange,
  loadState,
  onRetry,
  onCancel,
  onReview,
}: {
  classes: CookingClass[];
  bookings: Booking[];
  filter: BookingFilter;
  onFilterChange: (filter: BookingFilter) => void;
  loadState: LoadState;
  onRetry: () => void;
  onCancel: (booking: Booking) => void;
  onReview: (booking: Booking) => void;
}) {
  const classById = useMemo(
    () => new Map(classes.map((item) => [item.id, item])),
    [classes],
  );
  const visible = filterBookings(bookings, filter);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={layoutStyles.screenContent}
    >
      <ScreenHeader eyebrow="Ваши планы" title="Мои классы" />
      <Segment
        value={filter}
        options={[
          { value: 'upcoming', label: 'Предстоящие' },
          { value: 'history', label: 'История' },
        ]}
        onChange={onFilterChange}
      />

      {isInitialLoad(loadState) ? (
        <ActivityIndicator color={palette.tomato} style={layoutStyles.loader} />
      ) : loadState === 'error' ? (
        <ErrorState
          title="Не удалось загрузить записи"
          text="Проверьте подключение и попробуйте ещё раз."
          onRetry={onRetry}
        />
      ) : (
        <>
          {(loadState === 'refreshing' || loadState === 'stale') && (
            <RefreshNotice stale={loadState === 'stale'} onRetry={onRetry} />
          )}
          {visible.length === 0 ? (
            <EmptyState
              title="Здесь пока пусто"
              text="Выберите класс в расписании — он появится здесь."
            />
          ) : (
            <View style={styles.bookingList}>
              {visible.map((booking) => {
                const cookingClass = classById.get(booking.classId);
                if (!cookingClass) {
                  return <UnavailableBookingCard key={booking.id} booking={booking} />;
                }
                const cancellable = canCancelBooking(booking, cookingClass);
                return (
                  <View key={booking.id} style={styles.bookingCard}>
                    <View style={styles.bookingTopRow}>
                      <BookingStatusPill status={booking.status} />
                      <Text style={styles.bookingPrice}>
                        {formatMoney(booking.totalPriceKopecks)}
                      </Text>
                    </View>
                    <Text style={styles.bookingDate}>{formatLongDate(cookingClass.startsAt)}</Text>
                    <Text style={styles.bookingTitle}>{cookingClass.title}</Text>
                    <View style={styles.bookingDetails}>
                      <Text style={styles.bookingDetail}>◷ {formatTime(cookingClass.startsAt)}</Text>
                      <Text style={styles.bookingDetail}>· {cookingClass.chef.name}</Text>
                    </View>

                    {booking.status === 'cancelled_by_studio' && (
                      <View style={styles.reasonBox}>
                        <Text style={styles.reasonLabel}>Причина отмены</Text>
                        <Text style={styles.reasonText}>{booking.studioCancellationReason}</Text>
                      </View>
                    )}

                    {booking.status === 'confirmed' && (
                      <View style={styles.bookingActionRow}>
                        <View style={styles.countdown}>
                          <Text style={styles.countdownLabel}>До встречи</Text>
                          <Text style={styles.countdownValue}>
                            {formatCountdown(cookingClass)}
                          </Text>
                        </View>
                        <Pressable
                          disabled={!cancellable}
                          onPress={() => onCancel(booking)}
                          style={[styles.ghostButton, !cancellable && styles.buttonDisabled]}
                        >
                          <Text style={styles.ghostButtonText}>
                            {cancellable ? 'Отменить запись' : 'Отмена закрыта'}
                          </Text>
                        </Pressable>
                      </View>
                    )}

                    {canReview(booking) && (
                      <Pressable onPress={() => onReview(booking)} style={styles.reviewButton}>
                        <Text style={styles.reviewButtonStars}>★★★★★</Text>
                        <Text style={styles.reviewButtonText}>Оценить шефа</Text>
                      </Pressable>
                    )}

                    {booking.rating !== null && (
                      <View>
                        <Text style={styles.savedRating}>
                          Ваша оценка: {'★'.repeat(booking.rating)}
                        </Text>
                        {booking.reviewComment && (
                          <Text style={styles.savedReviewComment}>«{booking.reviewComment}»</Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function ProfileScreen({
  bookings,
  pushStatus,
  onEnablePush,
}: {
  bookings: Booking[];
  pushStatus: PushStatus;
  onEnablePush: () => void;
}) {
  const visited = bookings.filter((item) => item.status === 'attended').length;
  return (
    <ScrollView contentContainerStyle={layoutStyles.screenContent}>
      <ScreenHeader eyebrow="Личный кабинет" title="Профиль" />
      <View style={styles.profileHero}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>АК</Text>
        </View>
        <Text style={styles.profileName}>Анна Ковалева</Text>
        <Text style={styles.profilePhone}>+7 900 123-45-67</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{visited}</Text>
          <Text style={styles.statLabel}>класс пройден</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{bookings.filter((item) => item.status === 'confirmed').length}</Text>
          <Text style={styles.statLabel}>в планах</Text>
        </View>
      </View>
      <View style={styles.profileList}>
        {[
          ['Аллергии и предпочтения', 'Указать заранее'],
          ['Помощь', 'Связаться со студией'],
        ].map(([title, subtitle]) => (
          <View key={title} style={styles.profileListItem}>
            <View>
              <Text style={styles.profileItemTitle}>{title}</Text>
              <Text style={styles.profileItemSubtitle}>{subtitle}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Включить уведомления об отмене классов"
          disabled={pushStatus === 'enabling' || pushStatus === 'enabled' || pushStatus === 'unsupported'}
          onPress={onEnablePush}
          style={styles.profileListItem}
        >
          <View>
            <Text style={styles.profileItemTitle}>Уведомления об отменах</Text>
            <Text style={styles.profileItemSubtitle}>
              {{
                idle: 'Включить push-уведомления',
                enabling: 'Подключаем…',
                enabled: 'Включены',
                denied: 'Нет разрешения — нажмите, чтобы повторить',
                unsupported: 'Доступны в Android и iOS приложении',
              }[pushStatus]}
            </Text>
          </View>
          <Text style={styles.chevron}>{pushStatus === 'enabled' ? '✓' : '›'}</Text>
        </Pressable>
      </View>
      <Text style={styles.version}>Шеф-стол · MVP 1.0</Text>
    </ScrollView>
  );
}

function ClassModal({
  cookingClass,
  busy,
  onClose,
  onBook,
}: {
  cookingClass: CookingClass | null;
  busy: boolean;
  onClose: () => void;
  onBook: (equipment: EquipmentOption, allergyNotes: string) => void;
}) {
  const [equipment, setEquipment] = useState<EquipmentOption>('own');
  const [allergies, setAllergies] = useState('');

  useEffect(() => {
    if (cookingClass) {
      setEquipment('own');
      setAllergies('');
    }
  }, [cookingClass?.id]);

  if (!cookingClass) return null;
  const total =
    cookingClass.priceKopecks +
    (equipment === 'rental' ? cookingClass.rentalPriceKopecks : 0);
  const bookable = isBookable(cookingClass) && allergies.length <= 300;
  const rentalAvailable = cookingClass.availableRentalKits > 0;
  const selectionAvailable = equipment !== 'rental' || rentalAvailable;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTopRow}>
              <View style={styles.modalTopCopy}>
                <Text style={[styles.eyebrow, { color: cookingClass.accent }]}>
                  {cookingClass.eyebrow}
                </Text>
                <Text style={styles.modalTitle}>{cookingClass.title}</Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <Text style={styles.modalDescription}>{cookingClass.description}</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>КОГДА</Text>
                <Text style={styles.infoValue}>{formatLongDate(cookingClass.startsAt)}</Text>
                <Text style={styles.infoHint}>{formatTime(cookingClass.startsAt)}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>СВОБОДНО</Text>
                <Text style={styles.infoValue}>{cookingClass.availableSeats} мест</Text>
                <Text style={styles.infoHint}>из {cookingClass.capacity}</Text>
              </View>
            </View>

            <Text style={styles.formLabel}>В меню</Text>
            <View style={styles.dishesList}>
              {cookingClass.dishes.map((dish, index) => (
                <View key={dish} style={styles.dishRow}>
                  <Text style={styles.dishIndex}>{String(index + 1).padStart(2, '0')}</Text>
                  <Text style={styles.dishText}>{dish}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.formLabel}>Ваш рабочий набор</Text>
            <View style={styles.equipmentRow}>
              <Pressable
                accessibilityRole="radio"
                accessibilityLabel="Возьму свой рабочий набор"
                accessibilityState={{ checked: equipment === 'own' }}
                onPress={() => setEquipment('own')}
                style={[styles.optionCard, equipment === 'own' && styles.optionCardActive]}
              >
                <Text style={styles.optionIcon}>◌</Text>
                <Text style={styles.optionTitle}>Возьму свой</Text>
                <Text style={styles.optionPrice}>без доплаты</Text>
              </Pressable>
              <Pressable
                accessibilityRole="radio"
                accessibilityLabel={`Арендовать рабочий набор за ${formatMoney(cookingClass.rentalPriceKopecks)}`}
                accessibilityState={{ checked: equipment === 'rental', disabled: !rentalAvailable }}
                disabled={!rentalAvailable}
                onPress={() => setEquipment('rental')}
                style={[
                  styles.optionCard,
                  equipment === 'rental' && styles.optionCardActive,
                  !rentalAvailable && styles.optionCardDisabled,
                ]}
              >
                <Text style={styles.optionIcon}>✦</Text>
                <Text style={styles.optionTitle}>Нужен набор</Text>
                <Text style={styles.optionPrice}>
                  {rentalAvailable
                    ? `+${formatMoney(cookingClass.rentalPriceKopecks)} · осталось ${cookingClass.availableRentalKits}`
                    : 'нет свободных наборов'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.formLabelRow}>
              <Text style={styles.formLabel}>Аллергии</Text>
              <Text style={[styles.charCount, allergies.length > 300 && styles.charCountError]}>
                {allergies.length}/300
              </Text>
            </View>
            <TextInput
              accessibilityLabel="Аллергии и ограничения в питании"
              multiline
              value={allergies}
              onChangeText={setAllergies}
              placeholder="Например: аллергия на орехи. Если нет — оставьте пустым"
              placeholderTextColor="#9D988F"
              style={styles.allergyInput}
            />
            <Text style={styles.privacyHint}>Передадим информацию только команде этого класса.</Text>

            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Итого</Text>
                <Text style={styles.totalHint}>оплата в студии</Text>
              </View>
              <Text style={styles.totalValue}>{formatMoney(total)}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Записаться на класс, итого ${formatMoney(total)}`}
              disabled={!bookable || !selectionAvailable || busy}
              onPress={() => onBook(equipment, allergies)}
              style={[
                styles.primaryButton,
                (!bookable || !selectionAvailable || busy) && styles.buttonDisabled,
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Записаться на класс</Text>
              )}
            </Pressable>
            <Text style={styles.cancelHint}>Бесплатная отмена не позднее чем за 12 часов.</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ReviewModal({
  booking,
  cookingClass,
  busy,
  onClose,
  onSubmit,
}: {
  booking: Booking | null;
  cookingClass: CookingClass | undefined;
  busy: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  useEffect(() => {
    setRating(0);
    setComment('');
  }, [booking]);
  return (
    <Modal visible={Boolean(booking)} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.reviewBackdrop}>
        <View style={styles.reviewModal}>
          <View style={styles.reviewIcon}>
            <Text style={styles.reviewIconText}>✦</Text>
          </View>
          <Text style={styles.reviewTitle}>Как вам шеф?</Text>
          <Text style={styles.reviewSubtitle}>
            {cookingClass?.chef.name} · {cookingClass?.title}
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityLabel={`Оценка ${value} из 5`}
                accessibilityState={{ checked: value === rating }}
                onPress={() => setRating(value)}
                style={styles.starButton}
              >
                <Text style={[styles.star, value <= rating && styles.starActive]}>★</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            accessibilityLabel="Комментарий к оценке шефа"
            multiline
            maxLength={500}
            value={comment}
            onChangeText={setComment}
            placeholder="Комментарий — по желанию"
            placeholderTextColor="#9D988F"
            style={styles.reviewCommentInput}
          />
          <Text style={styles.reviewCommentCount}>{comment.length}/500</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Отправить оценку шефу"
            disabled={rating === 0 || busy}
            onPress={() => onSubmit(rating, comment)}
            style={[styles.primaryButton, (rating === 0 || busy) && styles.buttonDisabled]}
          >
            <Text style={styles.primaryButtonText}>Отправить оценку</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.reviewClose}>
            <Text style={styles.reviewCloseText}>Не сейчас</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

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
  eyebrow: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    fontWeight: '900',
  },
  bookingList: { gap: 14, marginTop: 2 },
  bookingCard: {
    backgroundColor: palette.paper,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E9E3D9',
  },
  bookingTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 17 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusPillText: { fontSize: 10, fontWeight: '900' },
  bookingPrice: { fontSize: 13, color: palette.muted, fontWeight: '700' },
  bookingDate: { color: palette.tomato, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  bookingTitle: { fontSize: 22, fontWeight: '800', color: palette.ink, marginTop: 5 },
  bookingDetails: { flexDirection: 'row', marginTop: 8 },
  bookingDetail: { color: palette.muted, fontSize: 12, marginRight: 5 },
  reasonBox: { backgroundColor: palette.dangerSoft, borderRadius: 14, padding: 13, marginTop: 16 },
  reasonLabel: { color: palette.tomatoDark, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  reasonText: { color: '#704136', fontSize: 12, lineHeight: 17, marginTop: 4 },
  bookingActionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  countdown: { flexDirection: 'row', alignItems: 'baseline' },
  countdownLabel: { color: palette.muted, fontSize: 10, marginRight: 5 },
  countdownValue: { color: palette.ink, fontSize: 14, fontWeight: '900' },
  ghostButton: { borderWidth: 1, borderColor: palette.line, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 10 },
  ghostButtonText: { color: palette.ink, fontSize: 11, fontWeight: '800' },
  reviewButton: { backgroundColor: palette.ink, borderRadius: 14, paddingVertical: 13, marginTop: 18, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  reviewButtonStars: { color: '#F1BD5B', fontSize: 12, letterSpacing: 1 },
  reviewButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  savedRating: { color: palette.warning, fontSize: 12, fontWeight: '800', marginTop: 16 },
  savedReviewComment: { color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  profileHero: { alignItems: 'center', backgroundColor: palette.paper, borderRadius: 24, paddingVertical: 28, marginBottom: 14 },
  profileAvatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: palette.sage, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  profileAvatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  profileName: { color: palette.ink, fontWeight: '800', fontSize: 20 },
  profilePhone: { color: palette.muted, fontSize: 12, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: palette.sageSoft, borderRadius: 18, padding: 17 },
  statValue: { fontSize: 27, fontWeight: '900', color: palette.sage },
  statLabel: { color: palette.sage, fontSize: 11, marginTop: 2 },
  profileList: { backgroundColor: palette.paper, borderRadius: 22, paddingHorizontal: 17 },
  profileListItem: { minHeight: 68, borderBottomWidth: 1, borderBottomColor: '#EEE8DE', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profileItemTitle: { color: palette.ink, fontWeight: '800', fontSize: 13 },
  profileItemSubtitle: { color: palette.muted, fontSize: 10, marginTop: 3 },
  chevron: { color: '#9F998F', fontSize: 25 },
  version: { color: '#A9A399', textAlign: 'center', fontSize: 10, marginTop: 24 },
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(24,24,22,.43)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: palette.canvas,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '94%',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  modalContent: { paddingHorizontal: 22, paddingBottom: Platform.OS === 'ios' ? 36 : 24 },
  modalHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: '#CEC7BC', alignSelf: 'center', marginTop: 10, marginBottom: 17 },
  modalTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalTopCopy: { flex: 1, paddingRight: 12 },
  modalTitle: { color: palette.ink, fontSize: 30, lineHeight: 35, fontWeight: '900', marginTop: 4 },
  closeButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E9E2D7', alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { color: palette.ink, fontSize: 27, lineHeight: 28 },
  modalDescription: { color: palette.muted, fontSize: 13, lineHeight: 20, marginTop: 12 },
  infoGrid: { flexDirection: 'row', gap: 10, marginTop: 20 },
  infoCell: { flex: 1, backgroundColor: palette.paper, borderRadius: 16, padding: 14 },
  infoLabel: { color: palette.muted, fontSize: 9, letterSpacing: 1.2, fontWeight: '900' },
  infoValue: { color: palette.ink, fontSize: 13, fontWeight: '800', marginTop: 5, textTransform: 'capitalize' },
  infoHint: { color: palette.muted, fontSize: 11, marginTop: 2 },
  formLabel: { color: palette.ink, fontSize: 15, fontWeight: '900', marginTop: 24, marginBottom: 10 },
  dishesList: { backgroundColor: palette.paper, borderRadius: 18, paddingHorizontal: 15 },
  dishRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE8DE' },
  dishIndex: { color: palette.tomato, fontSize: 10, fontWeight: '900', width: 30 },
  dishText: { color: palette.ink, fontSize: 13, fontWeight: '700' },
  equipmentRow: { flexDirection: 'row', gap: 10 },
  optionCard: { flex: 1, borderWidth: 1, borderColor: palette.line, borderRadius: 17, padding: 14, backgroundColor: palette.paper },
  optionCardActive: { borderColor: palette.tomato, backgroundColor: '#FFF5F1' },
  optionCardDisabled: { opacity: 0.48 },
  optionIcon: { color: palette.tomato, fontSize: 18, marginBottom: 9 },
  optionTitle: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  optionPrice: { color: palette.muted, fontSize: 10, marginTop: 3 },
  formLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  charCount: { color: palette.muted, fontSize: 10, marginBottom: 10 },
  charCountError: { color: palette.tomato },
  allergyInput: { minHeight: 86, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, borderRadius: 16, padding: 14, color: palette.ink, fontSize: 12, textAlignVertical: 'top' },
  privacyHint: { color: palette.muted, fontSize: 10, marginTop: 7 },
  totalRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 24, marginBottom: 13 },
  totalLabel: { color: palette.ink, fontSize: 13, fontWeight: '900' },
  totalHint: { color: palette.muted, fontSize: 9, marginTop: 2 },
  totalValue: { color: palette.ink, fontSize: 24, fontWeight: '900' },
  primaryButton: { minHeight: 52, borderRadius: 16, backgroundColor: palette.tomato, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  buttonDisabled: { opacity: 0.42 },
  cancelHint: { color: palette.muted, textAlign: 'center', fontSize: 10, marginTop: 9 },
  reviewBackdrop: { flex: 1, backgroundColor: 'rgba(24,24,22,.54)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  reviewModal: { backgroundColor: palette.paper, width: '100%', maxWidth: 430, borderRadius: 26, padding: 24, alignItems: 'center' },
  reviewIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: palette.warningSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  reviewIconText: { color: palette.warning, fontSize: 24 },
  reviewTitle: { fontSize: 24, fontWeight: '900', color: palette.ink },
  reviewSubtitle: { color: palette.muted, fontSize: 12, textAlign: 'center', marginTop: 6 },
  starsRow: { flexDirection: 'row', marginVertical: 22 },
  starButton: { padding: 5 },
  star: { fontSize: 34, color: '#D8D1C6' },
  starActive: { color: '#E4A638' },
  reviewCommentInput: { width: '100%', minHeight: 82, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.canvas, borderRadius: 14, padding: 12, color: palette.ink, fontSize: 12, textAlignVertical: 'top' },
  reviewCommentCount: { width: '100%', textAlign: 'right', color: palette.muted, fontSize: 10, marginTop: 5, marginBottom: 12 },
  reviewClose: { padding: 12, marginTop: 5 },
  reviewCloseText: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  toast: { position: 'absolute', left: 16, right: 16, bottom: Platform.OS === 'ios' ? 102 : 84, backgroundColor: palette.ink, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' },
  toastMark: { color: '#9ED6B9', fontSize: 16, fontWeight: '900', marginRight: 10 },
  toastText: { color: '#FFFFFF', fontSize: 12, lineHeight: 17, flex: 1, fontWeight: '700' },
});
