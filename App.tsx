import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
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
  canCancelBooking,
  canReview,
  filterClasses,
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
  Level,
  StudioApiError,
} from './src/domain/types';

const api = createStudioApi();

const palette = {
  canvas: '#F5F0E8',
  paper: '#FFFDF8',
  ink: '#21211F',
  muted: '#77736B',
  line: '#E3DDD2',
  tomato: '#C64F33',
  tomatoDark: '#A43F28',
  sage: '#355C50',
  sageSoft: '#E0EBE5',
  warning: '#985C20',
  warningSoft: '#FAECD8',
  dangerSoft: '#F8DFD8',
};

type Tab = 'discover' | 'bookings' | 'profile';
type BookingFilter = 'upcoming' | 'history';

type DayOption = {
  key: string;
  weekday: string;
  day: string;
  month: string;
};

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDays(length: number): DayOption[] {
  const formatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });
  const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'short' });
  return Array.from({ length }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return {
      key: toDateKey(date),
      weekday: index === 0 ? 'Сегодня' : formatter.format(date).replace('.', ''),
      day: String(date.getDate()),
      month: monthFormatter.format(date).replace('.', ''),
    };
  });
}

function formatCountdown(cookingClass: CookingClass): string {
  const hours = hoursUntilClass(cookingClass);
  if (hours < 24) return 'сегодня';
  return `${Math.ceil(hours / 24)} дн.`;
}

function ScreenHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerEyebrow}>{eyebrow}</Text>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>АК</Text>
        <View style={styles.onlineDot} />
      </View>
    </View>
  );
}

function ClassCard({
  item,
  onPress,
}: {
  item: CookingClass;
  onPress: () => void;
}) {
  const almostFull = item.availableSeats <= 2;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${formatTime(item.startsAt)}, ${item.availableSeats} мест`}
      onPress={onPress}
      style={({ pressed }) => [styles.classCard, pressed && styles.pressed]}
    >
      <View style={[styles.classVisual, { backgroundColor: item.softAccent }]}>
        <View style={[styles.visualOrb, { backgroundColor: item.accent }]} />
        <Text style={[styles.visualMonogram, { color: item.accent }]}>ШС</Text>
        <View style={styles.timePill}>
          <Text style={styles.timePillText}>{formatTime(item.startsAt)}</Text>
        </View>
      </View>
      <View style={styles.classBody}>
        <Text style={[styles.eyebrow, { color: item.accent }]}>{item.eyebrow}</Text>
        <Text style={styles.classTitle}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{item.chef.name}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{item.durationMinutes / 60} ч</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.price}>{formatMoney(item.priceKopecks)}</Text>
          <View
            style={[
              styles.seatsPill,
              almostFull ? styles.seatsPillUrgent : styles.seatsPillCalm,
            ]}
          >
            <Text
              style={[
                styles.seatsText,
                almostFull ? styles.seatsTextUrgent : styles.seatsTextCalm,
              ]}
            >
              {almostFull ? `Осталось ${item.availableSeats}` : `${item.availableSeats} мест`}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function Segment<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityState={{ selected: value === option.value }}
          onPress={() => onChange(option.value)}
          style={[styles.segmentItem, value === option.value && styles.segmentItemActive]}
        >
          <Text
            style={[
              styles.segmentText,
              value === option.value && styles.segmentTextActive,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>⌁</Text>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function DiscoverScreen({
  classes,
  loading,
  onSelect,
  horizonDays,
  onHorizonChange,
}: {
  classes: CookingClass[];
  loading: boolean;
  onSelect: (item: CookingClass) => void;
  horizonDays: number;
  onHorizonChange: (days: number) => void;
}) {
  const days = useMemo(() => getDays(horizonDays), [horizonDays]);
  const [selectedDay, setSelectedDay] = useState(days[0]!.key);
  const [level, setLevel] = useState<Level | 'all'>('all');
  const visibleClasses = useMemo(
    () => filterClasses(classes, selectedDay, level),
    [classes, selectedDay, level],
  );

  useEffect(() => {
    if (!days.some((day) => day.key === selectedDay)) setSelectedDay(days[0]!.key);
  }, [days, selectedDay]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.screenContent}
    >
      <ScreenHeader eyebrow="Кулинарная студия" title="Что приготовим?" />

      <View style={styles.heroNote}>
        <View style={styles.heroMark}>
          <Text style={styles.heroMarkText}>✦</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Готовим вместе, едим за одним столом</Text>
          <Text style={styles.heroText}>Все продукты уже ждут. Возьмите только настроение.</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Период расписания</Text>
      <Segment
        value={String(horizonDays)}
        options={[
          { value: '7', label: '7 дней' },
          { value: '14', label: '14 дней' },
          { value: '30', label: '30 дней' },
        ]}
        onChange={(value) => onHorizonChange(Number(value))}
      />
      <Text style={styles.sectionLabel}>Выберите дату</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysRow}
      >
        {days.map((day) => {
          const active = day.key === selectedDay;
          return (
            <Pressable
              key={day.key}
              accessibilityRole="button"
              accessibilityLabel={`${day.weekday}, ${day.day} ${day.month}`}
              accessibilityState={{ selected: active }}
              onPress={() => setSelectedDay(day.key)}
              style={[styles.dayCard, active && styles.dayCardActive]}
            >
              <Text style={[styles.dayWeekday, active && styles.dayTextActive]}>
                {day.weekday}
              </Text>
              <Text style={[styles.dayNumber, active && styles.dayTextActive]}>{day.day}</Text>
              <Text style={[styles.dayMonth, active && styles.dayTextActive]}>{day.month}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHeadingRow}>
        <Text style={styles.sectionTitle}>Классы</Text>
        <Text style={styles.resultCount}>{visibleClasses.length}</Text>
      </View>
      <Segment
        value={level}
        options={[
          { value: 'all', label: 'Все' },
          { value: 'beginner', label: 'Новичкам' },
          { value: 'advanced', label: 'С опытом' },
        ]}
        onChange={setLevel}
      />

      {loading ? (
        <ActivityIndicator color={palette.tomato} style={styles.loader} />
      ) : visibleClasses.length === 0 ? (
        <EmptyState
          title="Пока нет доступных классов"
          text="Попробуйте другой день или измените уровень."
        />
      ) : (
        <View style={styles.cardsList}>
          {visibleClasses.map((item) => (
            <ClassCard key={item.id} item={item} onPress={() => onSelect(item)} />
          ))}
        </View>
      )}
    </ScrollView>
  );
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

function BookingsScreen({
  classes,
  bookings,
  onCancel,
  onReview,
}: {
  classes: CookingClass[];
  bookings: Booking[];
  onCancel: (booking: Booking) => void;
  onReview: (booking: Booking) => void;
}) {
  const [filter, setFilter] = useState<BookingFilter>('upcoming');
  const classById = useMemo(
    () => new Map(classes.map((item) => [item.id, item])),
    [classes],
  );
  const visible = filterBookings(bookings, filter);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.screenContent}
    >
      <ScreenHeader eyebrow="Ваши планы" title="Мои классы" />
      <Segment
        value={filter}
        options={[
          { value: 'upcoming', label: 'Предстоящие' },
          { value: 'history', label: 'История' },
        ]}
        onChange={setFilter}
      />

      {visible.length === 0 ? (
        <EmptyState title="Здесь пока пусто" text="Выберите класс в расписании — он появится здесь." />
      ) : (
        <View style={styles.bookingList}>
          {visible.map((booking) => {
            const cookingClass = classById.get(booking.classId);
            if (!cookingClass) return null;
            const cancellable = canCancelBooking(booking, cookingClass);
            return (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingTopRow}>
                  <BookingStatusPill status={booking.status} />
                  <Text style={styles.bookingPrice}>{formatMoney(booking.totalPriceKopecks)}</Text>
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

                {booking.rating !== undefined && (
                  <View>
                    <Text style={styles.savedRating}>Ваша оценка: {'★'.repeat(booking.rating)}</Text>
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
    </ScrollView>
  );
}

function ProfileScreen({ bookings }: { bookings: Booking[] }) {
  const visited = bookings.filter((item) => item.status === 'attended').length;
  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
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
          ['Уведомления', 'Напоминания включены'],
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
  }, [cookingClass]);

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
  const [tab, setTab] = useState<Tab>('discover');
  const [classes, setClasses] = useState<CookingClass[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedClass, setSelectedClass] = useState<CookingClass | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [horizonDays, setHorizonDays] = useState(7);

  const refresh = async (days = horizonDays) => {
    const [scheduleClasses, nextBookings] = await Promise.all([
      api.getClasses(getScheduleQuery(days)),
      api.getBookings(),
    ]);
    const scheduledIds = new Set(scheduleClasses.map((item) => item.id));
    const missingClassIds = [
      ...new Set(nextBookings.map((item) => item.classId).filter((id) => !scheduledIds.has(id))),
    ];
    const bookingClasses = await Promise.all(
      missingClassIds.map((classId) => api.getClass(classId)),
    );
    setClasses([...scheduleClasses, ...bookingClasses]);
    setBookings(nextBookings);
  };

  useEffect(() => {
    setLoading(true);
    refresh(horizonDays)
      .catch(() => setToast('Не удалось загрузить данные. Попробуйте ещё раз.'))
      .finally(() => setLoading(false));
  }, [horizonDays]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timeout);
  }, [toast]);

  const handleBook = async (equipment: EquipmentOption, allergyNotes: string) => {
    if (!selectedClass) return;
    setBusy(true);
    try {
      await api.createBooking({
        classId: selectedClass.id,
        equipmentOption: equipment,
        allergyNotes,
      });
      await refresh();
      setSelectedClass(null);
      setTab('bookings');
      setToast('Готово! Класс добавлен в ваши планы.');
    } catch (error) {
      setToast(
        error instanceof StudioApiError
          ? error.message
          : 'Не удалось оформить запись. Попробуйте ещё раз.',
      );
    } finally {
      setBusy(false);
    }
  };

  const performCancel = async (booking: Booking) => {
    setBusy(true);
    try {
      await api.cancelBooking(booking.id);
      await refresh();
      setToast('Запись отменена, место вернулось в расписание.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Не удалось отменить запись.');
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
      await api.submitReview({ bookingId: reviewBooking.id, rating, comment });
      await refresh();
      setReviewBooking(null);
      setToast('Спасибо! Оценка поможет команде студии.');
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
              classes={classes}
              loading={loading}
              onSelect={setSelectedClass}
              horizonDays={horizonDays}
              onHorizonChange={setHorizonDays}
            />
          )}
          {tab === 'bookings' && (
            <BookingsScreen
              classes={classes}
              bookings={bookings}
              onCancel={handleCancel}
              onReview={setReviewBooking}
            />
          )}
          {tab === 'profile' && <ProfileScreen bookings={bookings} />}
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
  screenContent: {
    paddingTop: Platform.OS === 'ios' ? 58 : 38,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerEyebrow: {
    color: palette.tomato,
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.7,
    marginBottom: 4,
  },
  headerTitle: { color: palette.ink, fontSize: 31, lineHeight: 35, fontWeight: '800' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: palette.sage,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  onlineDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#74A56F',
    borderWidth: 2,
    borderColor: palette.canvas,
  },
  heroNote: {
    backgroundColor: palette.sage,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    overflow: 'hidden',
  },
  heroMark: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  heroMarkText: { color: '#F4CC8B', fontSize: 24 },
  heroCopy: { flex: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  heroText: { color: '#D9E4DE', fontSize: 12, lineHeight: 17 },
  sectionLabel: {
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 12,
  },
  daysRow: { gap: 9, paddingBottom: 28 },
  dayCard: {
    width: 64,
    height: 86,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCardActive: { backgroundColor: palette.ink, borderColor: palette.ink },
  dayWeekday: { fontSize: 10, color: palette.muted, textTransform: 'capitalize', marginBottom: 2 },
  dayNumber: { fontSize: 24, color: palette.ink, fontWeight: '800', lineHeight: 28 },
  dayMonth: { fontSize: 10, color: palette.muted, textTransform: 'lowercase' },
  dayTextActive: { color: '#FFFFFF' },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 23, fontWeight: '800', color: palette.ink },
  resultCount: {
    marginLeft: 9,
    backgroundColor: '#E8E1D6',
    color: palette.muted,
    fontWeight: '800',
    minWidth: 24,
    height: 24,
    lineHeight: 24,
    borderRadius: 12,
    textAlign: 'center',
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    backgroundColor: '#E9E3D9',
    marginBottom: 18,
  },
  segmentItem: { flex: 1, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segmentItemActive: {
    backgroundColor: palette.paper,
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 7px rgba(57,48,35,.10)' } : { elevation: 2 }),
  },
  segmentText: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  segmentTextActive: { color: palette.ink },
  cardsList: { gap: 14 },
  classCard: {
    backgroundColor: palette.paper,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EBE5DB',
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.995 }] },
  classVisual: { height: 112, position: 'relative', overflow: 'hidden', justifyContent: 'center' },
  visualOrb: {
    position: 'absolute',
    right: -24,
    top: -54,
    width: 154,
    height: 154,
    borderRadius: 77,
    opacity: 0.13,
  },
  visualMonogram: { fontSize: 42, fontWeight: '900', marginLeft: 22, letterSpacing: -4, opacity: 0.9 },
  timePill: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  timePillText: { fontSize: 13, fontWeight: '900', color: palette.ink },
  classBody: { padding: 18 },
  eyebrow: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.3, fontWeight: '900' },
  classTitle: { color: palette.ink, fontSize: 22, fontWeight: '800', marginTop: 4, marginBottom: 7 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: palette.muted, fontSize: 12 },
  metaDot: { color: '#B0AAA0', marginHorizontal: 7 },
  cardFooter: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 17, color: palette.ink, fontWeight: '900' },
  seatsPill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  seatsPillUrgent: { backgroundColor: palette.warningSoft },
  seatsPillCalm: { backgroundColor: palette.sageSoft },
  seatsText: { fontSize: 10, fontWeight: '800' },
  seatsTextUrgent: { color: palette.warning },
  seatsTextCalm: { color: palette.sage },
  loader: { marginVertical: 50 },
  emptyState: { paddingVertical: 56, alignItems: 'center', paddingHorizontal: 30 },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E7E0D5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconText: { fontSize: 30, color: palette.muted },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: palette.ink, marginBottom: 7 },
  emptyText: { color: palette.muted, lineHeight: 20, textAlign: 'center', fontSize: 13 },
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
