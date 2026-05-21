import { Ionicons } from '@expo/vector-icons';
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

import { DiagnosisResultCard } from '@/components/crop-health/diagnosis-result-card';
import { ScanOverlay } from '@/components/crop-health/scan-overlay';
import { ModuleHeader } from '@/components/design-system';
import Colors from '@/constants/colors';
import { DS } from '@/constants/design-system';
import { CROP_DISEASES, type CropDisease } from '@/constants/zimbabwe-data';
import { useCropPlans } from '@/hooks/useCropPlans';
import { getCropIcon } from '@/utils/crop-emoji';

function healthPercent(disease: CropDisease, matchedSymptoms: boolean): number {
  const base = disease.severity === 'high' ? 34 : disease.severity === 'medium' ? 52 : 71;
  return Math.min(95, matchedSymptoms ? base + 14 : base);
}

export default function CropHealthScreen() {
  const { plans } = useCropPlans();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState<CropDisease | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [scanning, setScanning] = useState(false);

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

  const pickPhoto = async (source: 'camera' | 'library') => {
    const ImagePicker = await import('expo-image-picker').catch(() => null);
    if (!ImagePicker) return;
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') return;
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: true, aspect: [4, 3] })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.85,
            allowsEditing: true,
            aspect: [4, 3],
          });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
      setDiagnosis(null);
      setSelectedSymptoms([]);
    }
  };

  const toggleSymptom = (symptom: string) =>
    setSelectedSymptoms((prev) => prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]);

  const runDiagnosis = () => {
    setScanning(true);
    setDiagnosis(null);
    setTimeout(() => {
      const match = relevantDiseases.find((d) =>
        d.symptoms.some((sym) => selectedSymptoms.includes(sym)),
      );
      setDiagnosis(match ?? relevantDiseases[0] ?? null);
      setScanning(false);
    }, 2200);
  };

  const allSymptoms = [...new Set(relevantDiseases.flatMap((d) => d.symptoms))];

  return (
    <SafeAreaView style={s.root} edges={['top']}>

      <ModuleHeader
        title="Crop Health"
        subtitle="AI-assisted disease scan & treatment"
        icon="medkit"
      />

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
                <Ionicons name={getCropIcon() as keyof typeof Ionicons.glyphMap} size={13} color={active ? '#fff' : Colors.primary} />
                <Text style={[s.cropChipText, active && s.cropChipTextActive]}>
                  {plan.cropName}
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
        <View style={s.photoPressable}>
          <Pressable onPress={() => pickPhoto('camera')} style={s.photoTap}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={s.photoImage} resizeMode="cover" />
            ) : (
              <View style={s.photoPlaceholder}>
                <View style={s.cameraIconWrap}>
                  <Ionicons name="scan" size={32} color={DS.colors.primary} />
                </View>
                <Text style={s.photoTitle}>Scan crop</Text>
                <Text style={s.photoHint}>Camera or gallery — point at affected leaves</Text>
              </View>
            )}
            <ScanOverlay active={scanning} />
          </Pressable>
          <View style={s.photoActions}>
            <Pressable onPress={() => pickPhoto('camera')} style={s.photoActionBtn}>
              <Ionicons name="camera" size={16} color={DS.colors.primary} />
              <Text style={s.photoActionText}>Camera</Text>
            </Pressable>
            <Pressable onPress={() => pickPhoto('library')} style={s.photoActionBtn}>
              <Ionicons name="images" size={16} color={DS.colors.primary} />
              <Text style={s.photoActionText}>Gallery</Text>
            </Pressable>
          </View>
        </View>

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
        {diagnosis && !scanning ? (
          <DiagnosisResultCard
            disease={diagnosis}
            healthPercent={healthPercent(
              diagnosis,
              diagnosis.symptoms.some((sym) => selectedSymptoms.includes(sym)),
            )}
            cropName={selectedPlan?.cropName}
          />
        ) : null}

        {/* Disease library button */}
        <Pressable onPress={() => setLibraryOpen(true)} style={s.libraryBtn}>
          <Ionicons name="library-outline" size={18} color={Colors.primary} />
          <Text style={s.libraryBtnText}>Disease Library ({CROP_DISEASES.length} diseases)</Text>
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
  root: { flex: 1, backgroundColor: DS.colors.background },

  body: { padding: 16, paddingBottom: 40, gap: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },

  chipsRow: { gap: 8, paddingRight: 4 },
  emptyChip: { backgroundColor: Colors.gray[100], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  emptyChipText: { fontSize: 12, color: Colors.textSecondary },
  cropChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: Colors.gray[200] },
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

  photoPressable: { gap: 10 },
  photoTap: {
    backgroundColor: '#fff',
    borderRadius: DS.radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: DS.colors.primaryMid,
    borderStyle: 'dashed',
    minHeight: 160,
  },
  photoActions: { flexDirection: 'row', gap: 10 },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: DS.radius.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  photoActionText: { fontSize: 13, fontWeight: '700', color: DS.colors.primary },
  photoImage: { width: '100%', height: 200 },
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
