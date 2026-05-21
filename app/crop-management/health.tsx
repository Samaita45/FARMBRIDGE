import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { CROP_DISEASES, type CropDisease } from '@/constants/zimbabwe-data';
import { useCropPlans } from '@/hooks/useCropPlans';
import { getCropEmoji } from '@/utils/crop-emoji';

export default function CropHealthScreen() {
  const { plans } = useCropPlans();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState<CropDisease | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? plans[0];
  const cropId = selectedPlan?.cropId;

  const relevantDiseases = useMemo(() => {
    if (!cropId) return CROP_DISEASES;
    return CROP_DISEASES.filter((d) => d.affectedCrops.includes(cropId));
  }, [cropId]);

  const libraryFiltered = useMemo(() => {
    const q = search.toLowerCase();
    return CROP_DISEASES.filter(
      (d) => d.name.toLowerCase().includes(q) || d.affectedCrops.some((c) => c.includes(q))
    );
  }, [search]);

  const capturePhoto = async () => {
    const ImagePicker = await import('expo-image-picker').catch(() => null);
    if (!ImagePicker) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
      setDiagnosis(null);
    }
  };

  const toggleSymptom = (symptom: string) =>
    setSelectedSymptoms((prev) => prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]);

  const runDiagnosis = () => {
    const match = relevantDiseases.find((d) => d.symptoms.some((s) => selectedSymptoms.includes(s)));
    setDiagnosis(match ?? relevantDiseases[0] ?? null);
  };

  const allSymptoms = [...new Set(relevantDiseases.flatMap((d) => d.symptoms))];

  return (
    <SafeAreaView style={s.root} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <View>
          <Text style={s.headerTitle}>🔬 Crop Health</Text>
          <Text style={s.headerSub}>Diagnose diseases & pests</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        {/* My crops chips */}
        <Text style={s.sectionTitle}>My Crops</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
          {plans.length === 0 ? (
            <View style={s.emptyChip}>
              <Text style={s.emptyChipText}>Add a crop plan first</Text>
            </View>
          ) : plans.map((plan) => {
            const active = selectedPlan?.id === plan.id;
            return (
              <Pressable
                key={plan.id}
                onPress={() => setSelectedPlanId(plan.id)}
                style={[s.cropChip, active && s.cropChipActive]}>
                <Text style={[s.cropChipText, active && s.cropChipTextActive]}>
                  {getCropEmoji(plan.cropId)} {plan.cropName}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Weather alert */}
        <View style={s.alertCard}>
          <Ionicons name="partly-sunny" size={18} color="#f59e0b" />
          <View style={s.alertBody}>
            <Text style={s.alertTitle}>Weather alert</Text>
            <Text style={s.alertSub}>
              High humidity today — watch for fungal diseases in your {selectedPlan?.cropName ?? 'crops'}.
            </Text>
          </View>
        </View>

        {/* Photo diagnosis */}
        <Text style={s.sectionTitle}>Diagnose Problem</Text>
        <Pressable onPress={capturePhoto} style={s.photoPressable}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={s.photoImage} resizeMode="cover" />
          ) : (
            <View style={s.photoPlaceholder}>
              <View style={s.cameraIconWrap}>
                <Ionicons name="camera" size={32} color={Colors.primary} />
              </View>
              <Text style={s.photoTitle}>Take a Photo</Text>
              <Text style={s.photoHint}>Point camera at diseased leaves, stems, or roots</Text>
            </View>
          )}
        </Pressable>

        {photoUri && (
          <View style={s.symptomsCard}>
            <Text style={s.symptomsTitle}>Select matching symptoms</Text>
            <View style={s.symptomsList}>
              {allSymptoms.map((symptom) => {
                const active = selectedSymptoms.includes(symptom);
                return (
                  <Pressable
                    key={symptom}
                    onPress={() => toggleSymptom(symptom)}
                    style={[s.symptomChip, active && s.symptomChipActive]}>
                    {active && <Ionicons name="checkmark" size={12} color="#fff" />}
                    <Text style={[s.symptomText, active && s.symptomTextActive]}>{symptom}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable onPress={runDiagnosis} style={s.diagBtn}>
              <Ionicons name="flask" size={16} color="#fff" />
              <Text style={s.diagBtnText}>Get Diagnosis</Text>
            </Pressable>
          </View>
        )}

        {/* Diagnosis result */}
        {diagnosis && (
          <View style={s.resultCard}>
            <View style={s.resultHeader}>
              <View style={s.resultIcon}><Ionicons name="warning" size={20} color={Colors.error} /></View>
              <View style={s.resultHeaderText}>
                <Text style={s.resultTitle}>{diagnosis.name}</Text>
                <Text style={s.resultSeverity}>Severity: {diagnosis.severity}</Text>
              </View>
            </View>
            <View style={s.resultSection}>
              <Text style={s.resultSectionTitle}>Treatment</Text>
              <Text style={s.resultSectionBody}>{diagnosis.treatment}</Text>
            </View>
            <View style={s.resultSection}>
              <Text style={s.resultSectionTitle}>Prevention</Text>
              <Text style={s.resultSectionBody}>{diagnosis.prevention}</Text>
            </View>
          </View>
        )}

        {/* Disease library button */}
        <Pressable onPress={() => setLibraryOpen(true)} style={s.libraryBtn}>
          <Ionicons name="library-outline" size={18} color={Colors.primary} />
          <Text style={s.libraryBtnText}>📚 Disease Library ({CROP_DISEASES.length} diseases)</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
        </Pressable>
      </ScrollView>

      {/* Disease library modal */}
      <Modal visible={libraryOpen} animationType="slide">
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Disease Library</Text>
            <Pressable onPress={() => setLibraryOpen(false)} style={s.modalCloseBtn}>
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </Pressable>
          </View>
          <View style={s.modalSearch}>
            <Ionicons name="search" size={16} color={Colors.gray[400]} />
            <TextInput
              style={s.modalSearchInput}
              placeholder="Search diseases or crops..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={Colors.gray[400]}
            />
          </View>
          <ScrollView contentContainerStyle={s.modalBody}>
            {libraryFiltered.map((d) => (
              <Pressable
                key={d.id}
                onPress={() => { setDiagnosis(d); setLibraryOpen(false); }}
                style={s.diseaseCard}>
                <Text style={s.diseaseName}>{d.name}</Text>
                <Text style={s.diseaseAffects}>Affects: {d.affectedCrops.join(', ')}</Text>
                <Text style={s.diseaseSymptom} numberOfLines={2}>{d.symptoms[0]}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryBg },

  header: {
    backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16,
  },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  body: { padding: 16, paddingBottom: 40, gap: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },

  chipsRow: { gap: 8, paddingRight: 4 },
  emptyChip: { backgroundColor: Colors.gray[100], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  emptyChipText: { fontSize: 12, color: Colors.textSecondary },
  cropChip: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: Colors.gray[200] },
  cropChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  cropChipText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  cropChipTextActive: { color: '#fff' },

  alertCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#fffbeb', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#fef3c7',
  },
  alertBody: { flex: 1 },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#92400e' },
  alertSub: { fontSize: 12, color: '#a16207', marginTop: 2, lineHeight: 17 },

  photoPressable: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1.5, borderColor: Colors.primaryMid, borderStyle: 'dashed',
    minHeight: 140,
  },
  photoImage: { width: '100%', height: 180, borderRadius: 14 },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 8 },
  cameraIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  photoTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  photoHint: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },

  symptomsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.gray[100] },
  symptomsTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  symptomsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  symptomChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.gray[100], borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: Colors.gray[200],
  },
  symptomChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  symptomText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  symptomTextActive: { color: '#fff' },
  diagBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12 },
  diagBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  resultCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#fca5a5',
    borderLeftWidth: 4, borderLeftColor: Colors.error,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  resultIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  resultHeaderText: { flex: 1 },
  resultTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  resultSeverity: { fontSize: 12, color: Colors.error, fontWeight: '600', marginTop: 2 },
  resultSection: { marginTop: 10 },
  resultSectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  resultSectionBody: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  libraryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.primaryMid,
  },
  libraryBtnText: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.primary },

  modal: { flex: 1, backgroundColor: Colors.primaryBg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.gray[100], alignItems: 'center', justifyContent: 'center' },
  modalSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.gray[200],
  },
  modalSearchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  modalBody: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  diseaseCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.gray[100],
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  diseaseName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  diseaseAffects: { fontSize: 11, color: Colors.textSecondary, marginTop: 3 },
  diseaseSymptom: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, lineHeight: 16 },
});
