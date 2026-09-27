import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { StudioApi } from '../domain/types';
import { ClassModal } from '../features/booking/ClassModal';
import { BookingsScreen } from '../features/bookings/BookingsScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { ReviewModal } from '../features/review/ReviewModal';
import { DiscoverScreen } from '../features/schedule/DiscoverScreen';
import { Tab } from '../shared/viewTypes';
import { palette } from '../ui/theme';
import { useStudioApp } from './useStudioApp';

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
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(tab.value)}
            style={styles.navItem}
          >
            <Text style={[styles.navIcon, active && styles.navActive]}>{tab.icon}</Text>
            <Text style={[styles.navLabel, active && styles.navActive]}>{tab.label}</Text>
            {active && <View style={styles.navIndicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

export function StudioApp({ api }: { api: StudioApi }) {
  const app = useStudioApp(api);
  const insets = useSafeAreaInsets();
  const retry = () => void app.refresh(app.horizonDays).catch(() => undefined);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.phoneFrame}>
        <View style={styles.page}>
          {app.tab === 'discover' && (
            <DiscoverScreen
              classes={app.scheduleClasses}
              loadState={app.scheduleLoadState}
              onRetry={retry}
              onSelect={app.setSelectedClass}
              horizonDays={app.horizonDays}
              onHorizonChange={app.setHorizonDays}
            />
          )}
          {app.tab === 'bookings' && (
            <BookingsScreen
              classes={app.classes}
              bookings={app.bookings}
              filter={app.bookingFilter}
              onFilterChange={app.setBookingFilter}
              loadState={app.bookingsLoadState}
              onRetry={retry}
              onCancel={app.handleCancel}
              onReview={app.setReviewBooking}
            />
          )}
          {app.tab === 'profile' && (
            <ProfileScreen
              bookings={app.bookings}
              pushStatus={app.pushStatus}
              onEnablePush={() => void app.handleEnablePush()}
            />
          )}
        </View>
        <SafeAreaView edges={['bottom']} style={styles.navSafeArea}>
          <BottomNav value={app.tab} onChange={app.setTab} />
        </SafeAreaView>

        {app.toast && (
          <View accessibilityRole="alert" style={[styles.toast, { bottom: 84 + insets.bottom }]}>
            <Text style={styles.toastMark}>✓</Text>
            <Text style={styles.toastText}>{app.toast}</Text>
          </View>
        )}
      </SafeAreaView>

      {app.selectedClass && (
        <ClassModal
          cookingClass={app.selectedClass}
          busy={app.busy}
          onClose={() => app.setSelectedClass(null)}
          onBook={app.handleBook}
        />
      )}
      {app.reviewBooking && (
        <ReviewModal
          cookingClass={app.reviewClass}
          busy={app.busy}
          onClose={() => app.setReviewBooking(null)}
          onSubmit={app.handleReview}
        />
      )}
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
  navSafeArea: { backgroundColor: palette.paper },
  nav: {
    height: 70,
    flexDirection: 'row',
    backgroundColor: palette.paper,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  navItem: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navIcon: { fontSize: 22, color: '#99938A', lineHeight: 23 },
  navLabel: { fontSize: 9, fontWeight: '700', color: '#99938A', marginTop: 3 },
  navActive: { color: palette.tomato },
  navIndicator: {
    position: 'absolute',
    top: 0,
    width: 26,
    height: 3,
    backgroundColor: palette.tomato,
    borderRadius: 2,
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: palette.ink,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastMark: { color: '#9ED6B9', fontSize: 16, fontWeight: '900', marginRight: 10 },
  toastText: { color: '#FFFFFF', fontSize: 12, lineHeight: 17, flex: 1, fontWeight: '700' },
});
