import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from './theme';

export function ScreenHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
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

export function Segment<T extends string>({
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
          accessibilityRole="tab"
          accessibilityLabel={option.label}
          accessibilityState={{ selected: value === option.value }}
          onPress={() => onChange(option.value)}
          style={[styles.segmentItem, value === option.value && styles.segmentItemActive]}
        >
          <Text style={[styles.segmentText, value === option.value && styles.segmentTextActive]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
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

export function ErrorState({
  title,
  text,
  onRetry,
}: {
  title: string;
  text: string;
  onRetry: () => void;
}) {
  return (
    <View accessibilityRole="alert" style={styles.emptyState}>
      <View style={[styles.emptyIcon, styles.errorIcon]}>
        <Text style={styles.emptyIconText}>!</Text>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryButtonText}>Повторить</Text>
      </Pressable>
    </View>
  );
}

export function RefreshNotice({ stale, onRetry }: { stale: boolean; onRetry: () => void }) {
  return (
    <View accessibilityRole={stale ? 'alert' : undefined} style={styles.refreshNotice}>
      {stale ? (
        <>
          <Text style={styles.refreshNoticeText}>Показаны сохранённые данные.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Повторить обновление данных"
            onPress={onRetry}
            style={styles.refreshNoticeButton}
          >
            <Text style={styles.refreshNoticeAction}>Повторить</Text>
          </Pressable>
        </>
      ) : (
        <>
          <ActivityIndicator color={palette.tomato} size="small" />
          <Text style={styles.refreshNoticeText}>Обновляем данные…</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerCopy: { flex: 1, minWidth: 0, paddingRight: 12 },
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
  segment: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    backgroundColor: '#E9E3D9',
    marginBottom: 18,
  },
  segmentItem: {
    flex: 1,
    minHeight: 44,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: palette.paper,
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 7px rgba(57,48,35,.10)' } : { elevation: 2 }),
  },
  segmentText: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  segmentTextActive: { color: palette.ink },
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
  errorIcon: { backgroundColor: palette.dangerSoft },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: palette.ink, marginBottom: 7 },
  emptyText: { color: palette.muted, lineHeight: 20, textAlign: 'center', fontSize: 13 },
  retryButton: {
    minHeight: 44,
    marginTop: 18,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: palette.tomato,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  refreshNotice: {
    minHeight: 44,
    marginTop: 14,
    marginBottom: 4,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: palette.warningSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshNoticeText: { color: palette.warning, fontSize: 12, flex: 1 },
  refreshNoticeButton: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshNoticeAction: { color: palette.tomatoDark, fontSize: 12, fontWeight: '900' },
});
