import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  canCancelBooking,
  canReview,
  filterBookings,
  formatLongDate,
  formatMoney,
  formatTime,
  hoursUntilClass,
} from '../../domain/policies';
import { Booking, CookingClass } from '../../domain/types';
import { isInitialLoad, LoadState } from '../../shared/loadState';
import { BookingFilter } from '../../shared/viewTypes';
import { layoutStyles } from '../../ui/layout';
import { EmptyState, ErrorState, RefreshNotice, ScreenHeader, Segment } from '../../ui/primitives';
import { palette } from '../../ui/theme';

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

export function BookingsScreen({
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
  const classById = useMemo(() => new Map(classes.map((item) => [item.id, item])), [classes]);
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
                      <Text style={styles.bookingDetail}>
                        ◷ {formatTime(cookingClass.startsAt)}
                      </Text>
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
                          <Text style={styles.countdownValue}>{formatCountdown(cookingClass)}</Text>
                        </View>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={
                            cancellable
                              ? `Отменить запись на ${cookingClass.title}`
                              : `Отмена записи на ${cookingClass.title} недоступна`
                          }
                          accessibilityState={{ disabled: !cancellable }}
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
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Оценить шефа класса ${cookingClass.title}`}
                        onPress={() => onReview(booking)}
                        style={styles.reviewButton}
                      >
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

const styles = StyleSheet.create({
  bookingList: { gap: 14, marginTop: 2 },
  bookingCard: {
    backgroundColor: palette.paper,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E9E3D9',
  },
  bookingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 17,
  },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusPillText: { fontSize: 10, fontWeight: '900' },
  bookingPrice: { fontSize: 13, color: palette.muted, fontWeight: '700' },
  bookingDate: {
    color: palette.tomato,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bookingTitle: { fontSize: 22, fontWeight: '800', color: palette.ink, marginTop: 5 },
  bookingDetails: { flexDirection: 'row', marginTop: 8 },
  bookingDetail: { color: palette.muted, fontSize: 12, marginRight: 5 },
  reasonBox: {
    backgroundColor: palette.dangerSoft,
    borderRadius: 14,
    padding: 13,
    marginTop: 16,
  },
  reasonLabel: {
    color: palette.tomatoDark,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reasonText: { color: '#704136', fontSize: 12, lineHeight: 17, marginTop: 4 },
  bookingActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  countdown: { flexDirection: 'row', alignItems: 'baseline' },
  countdownLabel: { color: palette.muted, fontSize: 10, marginRight: 5 },
  countdownValue: { color: palette.ink, fontSize: 14, fontWeight: '900' },
  ghostButton: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  ghostButtonText: { color: palette.ink, fontSize: 11, fontWeight: '800' },
  buttonDisabled: { opacity: 0.42 },
  reviewButton: {
    minHeight: 44,
    backgroundColor: palette.ink,
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  reviewButtonStars: { color: '#F1BD5B', fontSize: 12, letterSpacing: 1 },
  reviewButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  savedRating: { color: palette.warning, fontSize: 12, fontWeight: '800', marginTop: 16 },
  savedReviewComment: { color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
});
