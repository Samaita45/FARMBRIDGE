import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/design-system/AppText';
import { FadeInView } from '@/components/design-system/FadeInView';
import { GlassCard } from '@/components/design-system/GlassCard';
import { DS } from '@/constants/design-system';
import type { CropDisease } from '@/constants/zimbabwe-data';

interface DiagnosisResultCardProps {
  disease: CropDisease;
  healthPercent: number;
  cropName?: string;
}

function riskLevel(percent: number): { label: string; color: string } {
  if (percent >= 70) return { label: 'Low risk', color: DS.colors.success };
  if (percent >= 45) return { label: 'Moderate', color: DS.colors.warning };
  return { label: 'High risk', color: DS.colors.red };
}

export function DiagnosisResultCard({
  disease,
  healthPercent,
  cropName,
}: DiagnosisResultCardProps) {
  const risk = riskLevel(healthPercent);

  return (
    <FadeInView>
      <GlassCard elevated style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.healthRing, { borderColor: risk.color }]}>
            <AppText variant="h2" color={risk.color}>
              {healthPercent}%
            </AppText>
            <AppText variant="caption" muted>
              health
            </AppText>
          </View>
          <View style={styles.headerText}>
            <AppText variant="h2">{disease.name}</AppText>
            {cropName ? (
              <AppText variant="caption" muted>
                {cropName}
              </AppText>
            ) : null}
            <View style={[styles.riskPill, { backgroundColor: risk.color + '22' }]}>
              <Ionicons name="warning" size={12} color={risk.color} />
              <AppText variant="label" color={risk.color}>
                {risk.label}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="label" muted>
            TREATMENT
          </AppText>
          <AppText variant="bodySm" style={styles.body}>
            {disease.treatment}
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="label" muted>
            PREVENTION
          </AppText>
          <AppText variant="bodySm" style={styles.body}>
            {disease.prevention}
          </AppText>
        </View>

        <View style={styles.tipRow}>
          <Ionicons name="flask" size={16} color={DS.colors.primary} />
          <AppText variant="caption" color={DS.colors.primary}>
            Apply recommended fungicide within 48h for best results
          </AppText>
        </View>
      </GlassCard>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: DS.spacing.md },
  header: { flexDirection: 'row', gap: DS.spacing.md, marginBottom: DS.spacing.md },
  healthRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 4 },
  riskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: DS.radius.full,
    marginTop: 6,
  },
  section: { marginTop: DS.spacing.md },
  body: { marginTop: 4 },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: DS.spacing.md,
    padding: DS.spacing.sm,
    backgroundColor: DS.colors.primaryBg,
    borderRadius: DS.radius.sm,
  },
});
