import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  filterClasses,
  formatMoney,
  formatTime,
  getStudioDateKeys,
  STUDIO_TIME_ZONE,
} from '../../domain/policies';
import { CookingClass, Level } from '../../domain/types';
import { isInitialLoad, LoadState } from '../../shared/loadState';
import { layoutStyles } from '../../ui/layout';
import { EmptyState, ErrorState, RefreshNotice, ScreenHeader, Segment } from '../../ui/primitives';
import { palette } from '../../ui/theme';

type DayOption = {
  key: string;
  weekday: string;
  day: string;
  month: string;
};

function getDays(length: number): DayOption[] {
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    timeZone: STUDIO_TIME_ZONE,
    weekday: 'short',
  });
  const dayFormatter = new Intl.DateTimeFormat('ru-RU', {
    timeZone: STUDIO_TIME_ZONE,
    day: 'numeric',
  });
  const monthFormatter = new Intl.DateTimeFormat('ru-RU', {
    timeZone: STUDIO_TIME_ZONE,
    month: 'short',
  });
  return getStudioDateKeys(length).map((key, index) => {
    const date = new Date(`${key}T12:00:00Z`);
    return {
      key,
      weekday: index === 0 ? 'Сегодня' : formatter.format(date).replace('.', ''),
      day: dayFormatter.format(date),
      month: monthFormatter.format(date).replace('.', ''),
    };
  });
}

function ClassCard({ item, onPress }: { item: CookingClass; onPress: () => void }) {
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
            style={[styles.seatsPill, almostFull ? styles.seatsPillUrgent : styles.seatsPillCalm]}
          >
            <Text
              style={[styles.seatsText, almostFull ? styles.seatsTextUrgent : styles.seatsTextCalm]}
            >
              {almostFull ? `Осталось ${item.availableSeats}` : `${item.availableSeats} мест`}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function DiscoverScreen({
  classes,
  loadState,
  onRetry,
  onSelect,
  horizonDays,
  onHorizonChange,
}: {
  classes: CookingClass[];
  loadState: LoadState;
  onRetry: () => void;
  onSelect: (item: CookingClass) => void;
  horizonDays: number;
  onHorizonChange: (days: number) => void;
}) {
  const days = useMemo(() => getDays(horizonDays), [horizonDays]);
  const [selectedDay, setSelectedDay] = useState(days[0]!.key);
  const [level, setLevel] = useState<Level | 'all'>('all');
  const selectedDayKey = days.some((day) => day.key === selectedDay) ? selectedDay : days[0]!.key;
  const visibleClasses = useMemo(
    () => filterClasses(classes, selectedDayKey, level),
    [classes, selectedDayKey, level],
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={layoutStyles.screenContent}
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
        onChange={(value) => {
          const nextHorizon = Number(value);
          const nextDays = getDays(nextHorizon);
          if (!nextDays.some((day) => day.key === selectedDay)) {
            setSelectedDay(nextDays[0]!.key);
          }
          onHorizonChange(nextHorizon);
        }}
      />
      <Text style={styles.sectionLabel}>Выберите дату</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysRow}
      >
        {days.map((day) => {
          const active = day.key === selectedDayKey;
          return (
            <Pressable
              key={day.key}
              accessibilityRole="button"
              accessibilityLabel={`${day.weekday}, ${day.day} ${day.month}`}
              accessibilityState={{ selected: active }}
              onPress={() => setSelectedDay(day.key)}
              style={[styles.dayCard, active && styles.dayCardActive]}
            >
              <Text style={[styles.dayWeekday, active && styles.dayTextActive]}>{day.weekday}</Text>
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

      {isInitialLoad(loadState) ? (
        <ActivityIndicator color={palette.tomato} style={layoutStyles.loader} />
      ) : loadState === 'error' ? (
        <ErrorState
          title="Не удалось загрузить расписание"
          text="Проверьте подключение и попробуйте ещё раз."
          onRetry={onRetry}
        />
      ) : (
        <>
          {(loadState === 'refreshing' || loadState === 'stale') && (
            <RefreshNotice stale={loadState === 'stale'} onRetry={onRetry} />
          )}
          {visibleClasses.length === 0 ? (
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
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  dayWeekday: {
    fontSize: 10,
    color: palette.muted,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
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
  cardsList: { gap: 14 },
  classCard: {
    backgroundColor: palette.paper,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EBE5DB',
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.995 }] },
  classVisual: {
    height: 112,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  visualOrb: {
    position: 'absolute',
    right: -24,
    top: -54,
    width: 154,
    height: 154,
    borderRadius: 77,
    opacity: 0.13,
  },
  visualMonogram: {
    fontSize: 42,
    fontWeight: '900',
    marginLeft: 22,
    letterSpacing: -4,
    opacity: 0.9,
  },
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
  eyebrow: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    fontWeight: '900',
  },
  classTitle: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 7,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: palette.muted, fontSize: 12 },
  metaDot: { color: '#B0AAA0', marginHorizontal: 7 },
  cardFooter: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: { fontSize: 17, color: palette.ink, fontWeight: '900' },
  seatsPill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  seatsPillUrgent: { backgroundColor: palette.warningSoft },
  seatsPillCalm: { backgroundColor: palette.sageSoft },
  seatsText: { fontSize: 10, fontWeight: '800' },
  seatsTextUrgent: { color: palette.warning },
  seatsTextCalm: { color: palette.sage },
});
