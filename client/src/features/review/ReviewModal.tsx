import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CookingClass } from '../../domain/types';
import { actionStyles } from '../../ui/layout';
import { palette } from '../../ui/theme';

export function ReviewModal({
  cookingClass,
  busy,
  onClose,
  onSubmit,
}: {
  cookingClass: CookingClass | undefined;
  busy: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.reviewBackdrop}
      >
        <ScrollView
          contentContainerStyle={styles.reviewScrollContent}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
        >
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
              accessibilityState={{ disabled: rating === 0 || busy }}
              disabled={rating === 0 || busy}
              onPress={() => onSubmit(rating, comment)}
              style={[
                actionStyles.primaryButton,
                (rating === 0 || busy) && actionStyles.buttonDisabled,
              ]}
            >
              <Text style={actionStyles.primaryButtonText}>Отправить оценку</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Закрыть форму оценки"
              onPress={onClose}
              style={styles.reviewClose}
            >
              <Text style={styles.reviewCloseText}>Не сейчас</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  reviewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(24,24,22,.54)',
  },
  reviewScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  reviewModal: {
    backgroundColor: palette.paper,
    width: '100%',
    maxWidth: 430,
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
  },
  reviewIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: palette.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  reviewIconText: { color: palette.warning, fontSize: 24 },
  reviewTitle: { fontSize: 24, fontWeight: '900', color: palette.ink },
  reviewSubtitle: { color: palette.muted, fontSize: 12, textAlign: 'center', marginTop: 6 },
  starsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 22,
  },
  starButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: { fontSize: 34, color: '#D8D1C6' },
  starActive: { color: '#E4A638' },
  reviewCommentInput: {
    width: '100%',
    minHeight: 82,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.canvas,
    borderRadius: 14,
    padding: 12,
    color: palette.ink,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  reviewCommentCount: {
    width: '100%',
    textAlign: 'right',
    color: palette.muted,
    fontSize: 10,
    marginTop: 5,
    marginBottom: 12,
  },
  reviewClose: {
    minHeight: 44,
    paddingHorizontal: 12,
    marginTop: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewCloseText: { color: palette.muted, fontSize: 12, fontWeight: '700' },
});
