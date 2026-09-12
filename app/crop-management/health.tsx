import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DiagnosisResultCard } from '@/components/crop-health/diagnosis-result-card';
import { ScanOverlay } from '@/components/crop-health/scan-overlay';
import { Button, ButtonRow, Card, EmptyState, IconButton, Input } from '@/components/design-system';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';
import { CROP_DISEASES, type CropDisease } from '@/constants/zimbabwe-data';
import { useCropPlans } from '@/hooks/useCropPlans';

/**
 * Symptom-based diagnosis against the offline disease library.
 *
 * This is deliberately not described as AI: it matches the symptoms the farmer
 * selects against a curated table. The photo is captured and kept for the
 * farmer's own record and for the image model that will be wired in behind a
 * DiagnosisService later.
 */
function healthPercent(disease: CropDisease, matchedSymptoms: boolean): number {
  const base = disease.severity === 'high' ? 34 : disease.severity === 'medium' ? 52 : 71;
  return Math.min(95, matchedSymptoms ? base + 14 : base);
}

export default function CropHealthScreen() {
  const { plans } = useCropPlans();
  const { showToast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState<CropDisease | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [scanning, setScanning] = useState(false);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? plans[0];
  const cropId = selectedPlan?.cropId;

  const relevantDiseases = useMemo(
    () => (cropId ? CROP_DISEASES.filter((d) => d.affectedCrops.includes(cropId)) : CROP_DISEASES),
    [cropId]
  );

  const libraryFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CROP_DISEASES;
    return CROP_DISEASES.filter(
      (d) => d.name.toLowerCase().includes(q) || d.affectedCrops.some((c) => c.includes(q))
    );
  }, [search]);

  const allSymptoms = useMemo(
    () => [...new Set(relevantDiseases.flatMap((d) => d.symptoms))],
    [relevantDiseases]
  );

  const pickPhoto = async (source: 'camera' | 'library') => {
    const ImagePicker = await import('expo-image-picker').catch(() => null);
    if (!ImagePicker) {
      showToast('Photo capture is unavailable on this device', 'error');
      return;
    }

    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    // Previously this returned silently, so a denied permission looked like a
    // broken button.
    if (perm.status !== 'granted') {
      showToast(
        source === 'camera'
          ? 'Allow camera access in Settings to scan a crop'
          : 'Allow photo access in Settings to choose an image',
        'warning'
      );
      return;
    }

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
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );

  const runDiagnosis = () => {
    setScanning(true);
    setDiagnosis(null);
    setTimeout(() => {
      const match = relevantDiseases.find((d) =>
        d.symptoms.some((sym) => selectedSymptoms.includes(sym))
      );
      setDiagnosis(match ?? relevantDiseases[0] ?? null);
      setScanning(false);
    }, 1600);
  };

  const renderDisease = useCallback(
    ({ item }: { item: CropDisease }) => (
      <Pressable
        onPress={() => {
          setDiagnosis(item);
          setLibraryOpen(false);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}. Affects ${item.affectedCrops.join(', ')}.`}
        style={({ pressed }) => [styles.diseaseCard, pressed && styles.diseaseCardPressed]}>
        <Text style={styles.diseaseName}>{item.name}</Text>
        <Text style={styles.diseaseAffects}>Affects {item.affectedCrops.join(', ')}</Text>
        <Text style={styles.diseaseSymptom} numberOfLines={2}>
          {item.symptoms[0]}
        </Text>
      </Pressable>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {plans.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>My crops</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}>
              {plans.map((plan) => {
                const active = selectedPlan?.id === plan.id;
                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => setSelectedPlanId(plan.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Diagnose ${plan.cropName}`}
                    style={[styles.cropChip, active && styles.cropChipActive]}>
                    <Ionicons
                      name="leaf-outline"
                      size={13}
                      color={active ? DS.colors.textInverse : DS.colors.primary}
                    />
                    <Text style={[styles.cropChipText, active && styles.cropChipTextActive]}>
                      {plan.cropName}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.alert} accessibilityRole="alert">
          <Ionicons name="partly-sunny-outline" size={18} color={DS.semantic.warning.fg} />
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>Weather alert</Text>
            <Text style={styles.alertText}>
              High humidity today — watch for fungal disease in your{' '}
              {selectedPlan?.cropName ?? 'crops'}.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Diagnose a problem</Text>

        <View style={styles.photoBlock}>
          <Pressable
            onPress={() => void pickPhoto('camera')}
            accessibilityRole="imagebutton"
            accessibilityLabel={photoUri ? 'Replace the crop photo' : 'Take a photo of the crop'}
            style={styles.photoTap}>
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={styles.photoImage}
                contentFit="cover"
                transition={180}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <View style={styles.photoIcon}>
                  <Ionicons name="scan-outline" size={26} color={DS.colors.primary} />
                </View>
                <Text style={styles.photoTitle}>Photograph the affected area</Text>
                <Text style={styles.photoHint}>
                  Get close to the leaves showing symptoms, in good light
                </Text>
              </View>
            )}
            <ScanOverlay active={scanning} />
          </Pressable>

          <ButtonRow>
            <Button
              title="Camera"
              variant="outline"
              size="sm"
              icon="camera-outline"
              onPress={() => void pickPhoto('camera')}
              style={styles.flex}
            />
            <Button
              title="Gallery"
              variant="outline"
              size="sm"
              icon="images-outline"
              onPress={() => void pickPhoto('library')}
              style={styles.flex}
            />
          </ButtonRow>
        </View>

        {photoUri ? (
          <Card style={styles.symptomsCard}>
            <Text style={styles.symptomsTitle}>Which symptoms do you see?</Text>
            <View style={styles.symptomsList}>
              {allSymptoms.map((symptom) => {
                const active = selectedSymptoms.includes(symptom);
                return (
                  <Pressable
                    key={symptom}
                    onPress={() => toggleSymptom(symptom)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={symptom}
                    style={[styles.symptomChip, active && styles.symptomChipActive]}>
                    {active ? (
                      <Ionicons name="checkmark" size={12} color={DS.colors.textInverse} />
                    ) : null}
                    <Text style={[styles.symptomText, active && styles.symptomTextActive]}>
                      {symptom}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Button
              title={scanning ? 'Checking symptoms' : 'Get diagnosis'}
              icon="flask-outline"
              loading={scanning}
              disabled={selectedSymptoms.length === 0}
              onPress={runDiagnosis}
              accessibilityHint={
                selectedSymptoms.length === 0 ? 'Select at least one symptom first' : undefined
              }
            />
          </Card>
        ) : null}

        {diagnosis && !scanning ? (
          <DiagnosisResultCard
            disease={diagnosis}
            healthPercent={healthPercent(
              diagnosis,
              diagnosis.symptoms.some((sym) => selectedSymptoms.includes(sym))
            )}
            cropName={selectedPlan?.cropName}
          />
        ) : null}

        <Button
          title={`Disease library · ${CROP_DISEASES.length} entries`}
          variant="outline"
          icon="library-outline"
          onPress={() => setLibraryOpen(true)}
        />
      </ScrollView>

      <Modal
        visible={libraryOpen}
        animationType="slide"
        onRequestClose={() => setLibraryOpen(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Disease library</Text>
            <IconButton
              icon="close"
              accessibilityLabel="Close the disease library"
              variant="outline"
              size="sm"
              onPress={() => setLibraryOpen(false)}
            />
          </View>

          <View style={styles.modalSearch}>
            <Input
              icon="search-outline"
              placeholder="Search diseases or crops"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>

          <FlatList
            data={libraryFiltered}
            keyExtractor={(item) => item.id}
            renderItem={renderDisease}
            contentContainerStyle={[
              styles.modalList,
              libraryFiltered.length === 0 && styles.modalListEmpty,
            ]}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <EmptyState
                icon="search-outline"
                title="No matches"
                description={`Nothing in the library matches “${search.trim()}”.`}
              />
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  body: { padding: DS.spacing.md, paddingBottom: DS.spacing.xl, gap: DS.spacing.md },
  flex: { flex: 1 },

  sectionTitle: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.sm,
  },

  chipsRow: { gap: DS.spacing.sm, paddingRight: DS.spacing.xs },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 38,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.sm,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  cropChipActive: { backgroundColor: DS.colors.primary, borderColor: DS.colors.primary },
  cropChipText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  cropChipTextActive: { color: DS.colors.textInverse },

  alert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DS.spacing.sm + 4,
    backgroundColor: DS.semantic.warning.bg,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.semantic.warning.border,
    padding: DS.spacing.sm + 4,
  },
  alertBody: { flex: 1, gap: 2 },
  alertTitle: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.semantic.warning.fg,
  },
  alertText: {
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 17,
    fontFamily: DS.fontFamily.regular,
    color: DS.semantic.warning.fg,
  },

  photoBlock: { gap: DS.spacing.sm + 2 },
  photoTap: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DS.colors.border,
    borderStyle: 'dashed',
    minHeight: 168,
    justifyContent: 'center',
  },
  photoImage: { width: '100%', height: 200 },
  photoPlaceholder: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  photoIcon: {
    width: 56,
    height: 56,
    borderRadius: DS.radius.lg,
    backgroundColor: DS.colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTitle: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  photoHint: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: DS.spacing.lg,
  },

  symptomsCard: { gap: DS.spacing.sm + 4 },
  symptomsTitle: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  symptomsList: { flexDirection: 'row', flexWrap: 'wrap', gap: DS.spacing.sm },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 36,
    paddingHorizontal: 12,
    backgroundColor: DS.colors.surfaceMuted,
    borderRadius: DS.radius.sm,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  symptomChipActive: { backgroundColor: DS.colors.primary, borderColor: DS.colors.primary },
  symptomText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  symptomTextActive: { color: DS.colors.textInverse },

  modal: { flex: 1, backgroundColor: DS.colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.sm + 4,
  },
  modalTitle: {
    fontSize: DS.typography.h2.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },
  modalSearch: { paddingHorizontal: DS.spacing.md, paddingBottom: DS.spacing.sm + 4 },
  modalList: { paddingHorizontal: DS.spacing.md, paddingBottom: DS.spacing.xl, gap: DS.spacing.sm + 2 },
  modalListEmpty: { flexGrow: 1, justifyContent: 'center' },

  diseaseCard: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.border,
    padding: DS.spacing.sm + 4,
    gap: 3,
  },
  diseaseCardPressed: { backgroundColor: DS.colors.surfaceMuted },
  diseaseName: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  diseaseAffects: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
  diseaseSymptom: {
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 16,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
});
