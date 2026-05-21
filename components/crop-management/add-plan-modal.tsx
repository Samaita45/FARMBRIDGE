import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Colors from '@/constants/colors';
import { CROPS } from '@/constants/zimbabwe-data';
import type { Crop } from '@/types';
import { getCropEmoji } from '@/utils/crop-emoji';

interface AddPlanModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (cropId: string, plantDate: string, hectares: number) => Promise<void>;
  loading?: boolean;
}

export function AddPlanModal({ visible, onClose, onSubmit, loading }: AddPlanModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [plantDate, setPlantDate] = useState(new Date().toISOString().slice(0, 10));
  const [hectares, setHectares] = useState('1');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return CROPS.filter((c) => c.name.toLowerCase().includes(q) || c.localName.toLowerCase().includes(q));
  }, [search]);

  const handleSubmit = async () => {
    if (!selectedCrop) return;
    const ha = parseFloat(hectares);
    if (isNaN(ha) || ha <= 0) return;
    await onSubmit(selectedCrop.id, plantDate, ha);
    setSelectedCrop(null);
    setSearch('');
    setHectares('1');
    onClose();
  };

  const autoHarvestDate = (() => {
    if (!selectedCrop) return '';
    try {
      const d = new Date(plantDate);
      d.setDate(d.getDate() + selectedCrop.harvestDays);
      return d.toISOString().slice(0, 10);
    } catch { return ''; }
  })();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={s.root}>

        {/* ── Header ── */}
        <View style={s.header}>
          <Pressable onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </Pressable>
          <View style={s.headerText}>
            <Text style={s.headerTitle}>{selectedCrop ? 'Configure Plan' : 'Choose a Crop'}</Text>
            <Text style={s.headerSub}>{selectedCrop ? selectedCrop.name : 'Search from 20+ crops'}</Text>
          </View>
          {selectedCrop && (
            <View style={s.stepIndicator}>
              <View style={[s.step, s.stepDone]} />
              <View style={s.step} />
            </View>
          )}
        </View>

        {/* ── Step 1: Crop picker ── */}
        {!selectedCrop ? (
          <>
            <View style={s.searchWrap}>
              <Ionicons name="search" size={17} color={Colors.textSecondary} />
              <TextInput
                style={s.searchInput}
                placeholder="Search crops... (e.g. Maize, Tomato)"
                value={search}
                onChangeText={setSearch}
                placeholderTextColor={Colors.placeholder}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={17} color={Colors.textSecondary} />
                </Pressable>
              )}
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={s.listContent}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setSelectedCrop(item)}
                  style={({ pressed }) => [s.cropRow, pressed && { opacity: 0.8 }]}>
                  <View style={s.cropEmojiWrap}>
                    <Text style={s.cropEmoji}>{getCropEmoji(item.id, item.category)}</Text>
                  </View>
                  <View style={s.cropInfo}>
                    <Text style={s.cropName}>{item.name}</Text>
                    <Text style={s.cropMeta}>{item.localName} · {item.harvestDays} days</Text>
                  </View>
                  <View style={s.cropPrice}>
                    <Text style={s.cropPriceUSD}>${item.currentPriceUSD.toFixed(2)}/kg</Text>
                    <View style={[s.demandPill, { backgroundColor: item.demandLevel === 'very_high' ? '#FFEBEE' : Colors.primaryBg }]}>
                      <Text style={[s.demandText, { color: item.demandLevel === 'very_high' ? Colors.error : Colors.primary }]}>
                        {item.demandLevel.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.gray[400]} />
                </Pressable>
              )}
            />
          </>
        ) : (

          /* ── Step 2: Configure ── */
          <View style={s.configure}>
            {/* Selected crop card */}
            <View style={s.selectedCropCard}>
              <View style={s.selectedEmojiWrap}>
                <Text style={{ fontSize: 36 }}>{getCropEmoji(selectedCrop.id, selectedCrop.category)}</Text>
              </View>
              <View style={s.selectedInfo}>
                <Text style={s.selectedName}>{selectedCrop.name}</Text>
                <Text style={s.selectedMeta}>{selectedCrop.harvestDays} days to harvest · {selectedCrop.waterRequirements} water</Text>
                <Pressable onPress={() => setSelectedCrop(null)} style={s.changeBtn}>
                  <Ionicons name="swap-horizontal" size={12} color={Colors.accent} />
                  <Text style={s.changeBtnText}>Change crop</Text>
                </Pressable>
              </View>
            </View>

            {/* Form fields */}
            <Text style={s.fieldLabel}>Planting Date</Text>
            <View style={s.inputWrap}>
              <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
              <TextInput
                style={s.fieldInput}
                value={plantDate}
                onChangeText={setPlantDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.placeholder}
              />
            </View>

            <Text style={s.fieldLabel}>Field Size (hectares)</Text>
            <View style={s.inputWrap}>
              <Ionicons name="resize-outline" size={16} color={Colors.textSecondary} />
              <TextInput
                style={s.fieldInput}
                value={hectares}
                onChangeText={setHectares}
                keyboardType="decimal-pad"
                placeholder="1.0"
                placeholderTextColor={Colors.placeholder}
              />
            </View>

            {/* Auto-calculated info */}
            <View style={s.forecastCard}>
              <View style={s.forecastRow}>
                <Ionicons name="calendar" size={14} color={Colors.primary} />
                <Text style={s.forecastLabel}>Expected harvest</Text>
                <Text style={s.forecastValue}>{autoHarvestDate}</Text>
              </View>
              <View style={s.forecastRow}>
                <Ionicons name="cash" size={14} color={Colors.success} />
                <Text style={s.forecastLabel}>Market price</Text>
                <Text style={[s.forecastValue, { color: Colors.success }]}>${selectedCrop.currentPriceUSD}/kg</Text>
              </View>
              <View style={s.forecastRow}>
                <Ionicons name="leaf" size={14} color={Colors.accent} />
                <Text style={s.forecastLabel}>Best planted</Text>
                <Text style={s.forecastValue}>{selectedCrop.bestPlantingMonths.map((m) => new Date(2024, m - 1).toLocaleString('en', { month: 'short' })).join(', ')}</Text>
              </View>
            </View>

            {/* Save button */}
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [s.saveBtn, (loading || !selectedCrop) && s.saveBtnDisabled, pressed && { opacity: 0.85 }]}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={s.saveBtnText}>Save Crop Plan</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryBg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.primaryMid,
  },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.gray[100], alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  stepIndicator: { flexDirection: 'row', gap: 4 },
  step: { width: 20, height: 4, borderRadius: 2, backgroundColor: Colors.gray[200] },
  stepDone: { backgroundColor: Colors.primary },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', margin: 14, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.inputBorder,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },

  // Crop list
  listContent: { paddingHorizontal: 14, paddingBottom: 40, gap: 8 },
  cropRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.primaryMid,
  },
  cropEmojiWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  cropEmoji: { fontSize: 24 },
  cropInfo: { flex: 1 },
  cropName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  cropMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  cropPrice: { alignItems: 'flex-end', gap: 4 },
  cropPriceUSD: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  demandPill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  demandText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },

  // Configure step
  configure: { padding: 16, gap: 0 },
  selectedCropCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 18,
    borderWidth: 1.5, borderColor: Colors.primaryMid,
    shadowColor: Colors.primary, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
  },
  selectedEmojiWrap: { width: 60, height: 60, borderRadius: 18, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  selectedInfo: { flex: 1 },
  selectedName: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  selectedMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 3, lineHeight: 16 },
  changeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  changeBtnText: { fontSize: 12, fontWeight: '700', color: Colors.accent },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.4 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.inputBorder,
  },
  fieldInput: { flex: 1, fontSize: 14, color: Colors.textPrimary, paddingVertical: 12 },

  forecastCard: {
    backgroundColor: Colors.primaryBg, borderRadius: 14, padding: 14,
    marginTop: 14, marginBottom: 4,
    borderWidth: 1, borderColor: Colors.primaryMid, gap: 8,
  },
  forecastRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  forecastLabel: { flex: 1, fontSize: 12, color: Colors.textSecondary },
  forecastValue: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, marginTop: 16,
    shadowColor: Colors.primaryDark, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  saveBtnDisabled: { backgroundColor: Colors.gray[300], shadowOpacity: 0 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
