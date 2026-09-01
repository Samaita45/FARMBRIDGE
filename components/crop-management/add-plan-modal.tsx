import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, Card, EmptyState, IconButton, Input } from '@/components/design-system';
import { DS } from '@/constants/design-system';
import { CROPS } from '@/constants/zimbabwe-data';
import type { Crop } from '@/types';
import { getCropImage } from '@/utils/crop-emoji';

interface AddPlanModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (cropId: string, plantDate: string, hectares: number) => Promise<void>;
  loading?: boolean;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function validateDate(value: string): string | undefined {
  if (!ISO_DATE.test(value)) return 'Use the format YYYY-MM-DD';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'That is not a real date';
  return undefined;
}

function validateHectares(value: string): string | undefined {
  const ha = Number(value);
  if (!value.trim()) return 'Enter your field size';
  if (Number.isNaN(ha)) return 'Enter a number, for example 1.5';
  if (ha <= 0) return 'Field size must be greater than zero';
  if (ha > 10_000) return 'That looks too large — check the value';
  return undefined;
}

export function AddPlanModal({ visible, onClose, onSubmit, loading }: AddPlanModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [plantDate, setPlantDate] = useState(new Date().toISOString().slice(0, 10));
  const [hectares, setHectares] = useState('1');
  const [touched, setTouched] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CROPS;
    return CROPS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.localName.toLowerCase().includes(q)
    );
  }, [search]);

  const dateError = validateDate(plantDate);
  const hectaresError = validateHectares(hectares);
  const canSubmit = !dateError && !hectaresError && Boolean(selectedCrop);

  const autoHarvestDate = useMemo(() => {
    if (!selectedCrop || dateError) return '';
    const d = new Date(plantDate);
    d.setDate(d.getDate() + selectedCrop.harvestDays);
    return d.toISOString().slice(0, 10);
  }, [selectedCrop, plantDate, dateError]);

  const reset = () => {
    setSelectedCrop(null);
    setSearch('');
    setHectares('1');
    setPlantDate(new Date().toISOString().slice(0, 10));
    setTouched(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setTouched(true);
    if (!canSubmit || !selectedCrop) return;
    await onSubmit(selectedCrop.id, plantDate, Number(hectares));
    reset();
    onClose();
  };

  const renderCrop = useCallback(
    ({ item }: { item: Crop }) => {
      const hot = item.demandLevel === 'very_high';
      const tone = hot ? DS.semantic.danger : DS.semantic.info;
      return (
        <Pressable
          onPress={() => setSelectedCrop(item)}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, ${item.localName}. ${item.harvestDays} days to harvest. $${item.currentPriceUSD.toFixed(2)} per kilogram. ${item.demandLevel.replace('_', ' ')} demand.`}
          style={({ pressed }) => [styles.cropRow, pressed && styles.pressed]}>
          <Image
            source={getCropImage(item.id, item.category)}
            style={styles.cropImage}
            contentFit="cover"
            transition={150}
          />
          <View style={styles.flex}>
            <Text style={styles.cropName}>{item.name}</Text>
            <Text style={styles.cropMeta}>
              {item.localName} · {item.harvestDays} days
            </Text>
          </View>
          <View style={styles.cropPrice}>
            <Text style={styles.cropPriceValue}>${item.currentPriceUSD.toFixed(2)}/kg</Text>
            <View style={[styles.demandPill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
              <Text style={[styles.demandText, { color: tone.fg }]}>
                {item.demandLevel.replace('_', ' ')}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={DS.colors.textFaint} />
        </Pressable>
      );
    },
    []
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <IconButton
            icon="close"
            accessibilityLabel="Close without saving"
            variant="outline"
            size="sm"
            onPress={handleClose}
          />
          <View style={styles.flex}>
            <Text style={styles.headerTitle}>
              {selectedCrop ? 'Configure the plan' : 'Choose a crop'}
            </Text>
            <Text style={styles.headerSub}>
              {selectedCrop ? selectedCrop.name : `${CROPS.length} crops available`}
            </Text>
          </View>
          <View style={styles.steps} accessibilityLabel={selectedCrop ? 'Step 2 of 2' : 'Step 1 of 2'}>
            <View style={[styles.step, styles.stepDone]} />
            <View style={[styles.step, selectedCrop ? styles.stepDone : null]} />
          </View>
        </View>

        {!selectedCrop ? (
          <>
            <View style={styles.searchWrap}>
              <Input
                icon="search-outline"
                placeholder="Search crops, e.g. maize or chibage"
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                returnKeyType="search"
                rightIcon={search ? 'close-circle' : undefined}
                rightIconLabel="Clear the search"
                onRightIconPress={() => setSearch('')}
              />
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={renderCrop}
              contentContainerStyle={[
                styles.list,
                filtered.length === 0 && styles.listEmpty,
              ]}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={10}
              windowSize={9}
              ListEmptyComponent={
                <EmptyState
                  icon="search-outline"
                  title="No crops found"
                  description={`Nothing matches “${search.trim()}”. Try the local name.`}
                />
              }
            />
          </>
        ) : (
          <ScrollView
            contentContainerStyle={styles.configure}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Card style={styles.selectedCard}>
              <Image
                source={getCropImage(selectedCrop.id, selectedCrop.category)}
                style={styles.selectedImage}
                contentFit="cover"
                transition={150}
              />
              <View style={styles.flex}>
                <Text style={styles.selectedName}>{selectedCrop.name}</Text>
                <Text style={styles.selectedMeta}>
                  {selectedCrop.harvestDays} days to harvest · {selectedCrop.waterRequirements} water
                </Text>
                <Pressable
                  onPress={() => setSelectedCrop(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Choose a different crop"
                  hitSlop={8}
                  style={styles.changeBtn}>
                  <Ionicons name="swap-horizontal" size={12} color={DS.colors.primary} />
                  <Text style={styles.changeBtnText}>Change crop</Text>
                </Pressable>
              </View>
            </Card>

            <Input
              label="Planting date"
              icon="calendar-outline"
              value={plantDate}
              onChangeText={setPlantDate}
              placeholder="YYYY-MM-DD"
              autoCorrect={false}
              required
              error={touched ? dateError : undefined}
              hint="Tasks are scheduled from this date"
            />

            <Input
              label="Field size"
              icon="resize-outline"
              value={hectares}
              onChangeText={setHectares}
              keyboardType="decimal-pad"
              placeholder="1.0"
              required
              error={touched ? hectaresError : undefined}
              hint="In hectares"
            />

            <Card variant="flat" style={styles.forecast}>
              <ForecastRow
                icon="calendar-outline"
                label="Expected harvest"
                value={autoHarvestDate || '—'}
              />
              <ForecastRow
                icon="cash-outline"
                label="Market price"
                value={`$${selectedCrop.currentPriceUSD.toFixed(2)}/kg`}
                tone="success"
              />
              <ForecastRow
                icon="leaf-outline"
                label="Best planted"
                value={selectedCrop.bestPlantingMonths
                  .map((m) => new Date(2024, m - 1).toLocaleString('en', { month: 'short' }))
                  .join(', ')}
              />
            </Card>

            <Button
              title="Save crop plan"
              icon="checkmark-circle-outline"
              loading={loading}
              disabled={touched && !canSubmit}
              onPress={handleSubmit}
              accessibilityHint="Creates the plan and schedules its watering, fertilising and harvest tasks"
            />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ForecastRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: 'calendar-outline' | 'cash-outline' | 'leaf-outline';
  label: string;
  value: string;
  tone?: 'success';
}) {
  return (
    <View style={styles.forecastRow}>
      <Ionicons name={icon} size={14} color={DS.colors.textSoft} />
      <Text style={styles.forecastLabel}>{label}</Text>
      <Text
        style={[styles.forecastValue, tone ? { color: DS.semantic[tone].fg } : null]}
        numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  flex: { flex: 1 },
  pressed: { opacity: 0.8 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 4,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.sm + 4,
    backgroundColor: DS.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.borderLight,
  },
  headerTitle: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  headerSub: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 1,
  },
  steps: { flexDirection: 'row', gap: 4 },
  step: {
    width: 18,
    height: 3,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.border,
  },
  stepDone: { backgroundColor: DS.colors.primary },

  searchWrap: { padding: DS.spacing.md, paddingBottom: DS.spacing.sm },
  list: { paddingHorizontal: DS.spacing.md, paddingBottom: DS.spacing.xl, gap: DS.spacing.sm },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },

  cropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 4,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.border,
    padding: DS.spacing.sm + 2,
  },
  cropImage: {
    width: 46,
    height: 46,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.surfaceMuted,
  },
  cropName: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  cropMeta: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 1,
  },
  cropPrice: { alignItems: 'flex-end', gap: 3 },
  cropPriceValue: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  demandPill: {
    borderRadius: DS.radius.xs,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  demandText: {
    fontSize: 9,
    fontFamily: DS.fontFamily.semibold,
    textTransform: 'capitalize',
  },

  configure: { padding: DS.spacing.md, paddingBottom: DS.spacing.xl, gap: DS.spacing.md },
  selectedCard: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm + 4 },
  selectedImage: {
    width: 64,
    height: 64,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.surfaceMuted,
  },
  selectedName: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  selectedMeta: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 2,
  },
  changeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  changeBtnText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primary,
  },

  forecast: { gap: DS.spacing.sm },
  forecastRow: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm },
  forecastLabel: {
    flex: 1,
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  forecastValue: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
    maxWidth: '55%',
  },
});
