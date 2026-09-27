import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { formatLongDate, formatMoney, formatTime, isBookable } from '../../domain/policies';
import { CookingClass, EquipmentOption } from '../../domain/types';
import { actionStyles } from '../../ui/layout';
import { palette } from '../../ui/theme';

export function ClassModal({
  cookingClass,
  busy,
  onClose,
  onBook,
}: {
  cookingClass: CookingClass;
  busy: boolean;
  onClose: () => void;
  onBook: (equipment: EquipmentOption, allergyNotes: string) => void;
}) {
  const [equipment, setEquipment] = useState<EquipmentOption>('own');
  const [allergies, setAllergies] = useState('');

  const total =
    cookingClass.priceKopecks + (equipment === 'rental' ? cookingClass.rentalPriceKopecks : 0);
  const bookable = isBookable(cookingClass) && allergies.length <= 300;
  const rentalAvailable = cookingClass.availableRentalKits > 0;
  const selectionAvailable = equipment !== 'rental' || rentalAvailable;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalContent}
          >
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
            <Text style={styles.privacyHint}>
              Передадим информацию только команде этого класса.
            </Text>

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
                actionStyles.primaryButton,
                (!bookable || !selectionAvailable || busy) && actionStyles.buttonDisabled,
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={actionStyles.primaryButtonText}>Записаться на класс</Text>
              )}
            </Pressable>
            <Text style={styles.cancelHint}>Бесплатная отмена не позднее чем за 12 часов.</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(24,24,22,.43)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: palette.canvas,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '94%',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  modalContent: {
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CEC7BC',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 17,
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTopCopy: { flex: 1, paddingRight: 12 },
  eyebrow: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    fontWeight: '900',
  },
  modalTitle: { color: palette.ink, fontSize: 30, lineHeight: 35, fontWeight: '900', marginTop: 4 },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E9E2D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: { color: palette.ink, fontSize: 27, lineHeight: 28 },
  modalDescription: { color: palette.muted, fontSize: 13, lineHeight: 20, marginTop: 12 },
  infoGrid: { flexDirection: 'row', gap: 10, marginTop: 20 },
  infoCell: { flex: 1, backgroundColor: palette.paper, borderRadius: 16, padding: 14 },
  infoLabel: { color: palette.muted, fontSize: 9, letterSpacing: 1.2, fontWeight: '900' },
  infoValue: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 5,
    textTransform: 'capitalize',
  },
  infoHint: { color: palette.muted, fontSize: 11, marginTop: 2 },
  formLabel: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 24,
    marginBottom: 10,
  },
  dishesList: { backgroundColor: palette.paper, borderRadius: 18, paddingHorizontal: 15 },
  dishRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE8DE',
  },
  dishIndex: { color: palette.tomato, fontSize: 10, fontWeight: '900', width: 30 },
  dishText: { color: palette.ink, fontSize: 13, fontWeight: '700' },
  equipmentRow: { flexDirection: 'row', gap: 10 },
  optionCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 17,
    padding: 14,
    backgroundColor: palette.paper,
  },
  optionCardActive: { borderColor: palette.tomato, backgroundColor: '#FFF5F1' },
  optionCardDisabled: { opacity: 0.48 },
  optionIcon: { color: palette.tomato, fontSize: 18, marginBottom: 9 },
  optionTitle: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  optionPrice: { color: palette.muted, fontSize: 10, marginTop: 3 },
  formLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  charCount: { color: palette.muted, fontSize: 10, marginBottom: 10 },
  charCountError: { color: palette.tomato },
  allergyInput: {
    minHeight: 86,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    borderRadius: 16,
    padding: 14,
    color: palette.ink,
    fontSize: 12,
    textAlignVertical: 'top',
  },
  privacyHint: { color: palette.muted, fontSize: 10, marginTop: 7 },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 13,
  },
  totalLabel: { color: palette.ink, fontSize: 13, fontWeight: '900' },
  totalHint: { color: palette.muted, fontSize: 9, marginTop: 2 },
  totalValue: { color: palette.ink, fontSize: 24, fontWeight: '900' },
  cancelHint: { color: palette.muted, textAlign: 'center', fontSize: 10, marginTop: 9 },
});
