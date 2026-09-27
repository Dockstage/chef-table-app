import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Booking } from '../../domain/types';
import { PushStatus } from '../../shared/viewTypes';
import { layoutStyles } from '../../ui/layout';
import { ScreenHeader } from '../../ui/primitives';
import { palette } from '../../ui/theme';

export function ProfileScreen({
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
          <Text style={styles.statValue}>
            {bookings.filter((item) => item.status === 'confirmed').length}
          </Text>
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
          disabled={
            pushStatus === 'enabling' || pushStatus === 'enabled' || pushStatus === 'unsupported'
          }
          onPress={onEnablePush}
          style={styles.profileListItem}
        >
          <View>
            <Text style={styles.profileItemTitle}>Уведомления об отменах</Text>
            <Text style={styles.profileItemSubtitle}>
              {
                {
                  idle: 'Включить push-уведомления',
                  enabling: 'Подключаем…',
                  enabled: 'Включены',
                  denied: 'Нет разрешения — нажмите, чтобы повторить',
                  unsupported: 'Доступны в Android и iOS приложении',
                }[pushStatus]
              }
            </Text>
          </View>
          <Text style={styles.chevron}>{pushStatus === 'enabled' ? '✓' : '›'}</Text>
        </Pressable>
      </View>
      <Text style={styles.version}>Шеф-стол · MVP 1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  profileHero: {
    alignItems: 'center',
    backgroundColor: palette.paper,
    borderRadius: 24,
    paddingVertical: 28,
    marginBottom: 14,
  },
  profileAvatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: palette.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  profileAvatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  profileName: { color: palette.ink, fontWeight: '800', fontSize: 20 },
  profilePhone: { color: palette.muted, fontSize: 12, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: palette.sageSoft, borderRadius: 18, padding: 17 },
  statValue: { fontSize: 27, fontWeight: '900', color: palette.sage },
  statLabel: { color: palette.sage, fontSize: 11, marginTop: 2 },
  profileList: { backgroundColor: palette.paper, borderRadius: 22, paddingHorizontal: 17 },
  profileListItem: {
    minHeight: 68,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE8DE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileItemTitle: { color: palette.ink, fontWeight: '800', fontSize: 13 },
  profileItemSubtitle: { color: palette.muted, fontSize: 10, marginTop: 3 },
  chevron: { color: '#9F998F', fontSize: 25 },
  version: { color: '#A9A399', textAlign: 'center', fontSize: 10, marginTop: 24 },
});
