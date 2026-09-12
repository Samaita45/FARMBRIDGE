import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/design-system';
import { HeroHeader } from '@/components/ui/hero-header';
import { DS } from '@/constants/design-system';
import { ScreenImages } from '@/constants/images';
import { CROPS, getCropsForMonth, getCurrentSeason } from '@/constants/zimbabwe-data';
import { useCropPlans } from '@/hooks/useCropPlans';
import { useFarmTasks } from '@/hooks/useFarmTasks';
import type { IconName } from '@/types/icons';

const MONTH = new Date().getMonth() + 1;

interface ModuleLink {
  href: '/crop-management/planner' | '/crop-management/tasks' | '/crop-management/health' | '/crop-management/soil';
  label: string;
  desc: string;
  icon: IconName;
  tone: keyof typeof DS.semantic;
}

const MODULES: ModuleLink[] = [
  {
    href: '/crop-management/planner',
    label: 'Crop Planner',
    desc: 'Calendar, plans and rotation',
    icon: 'calendar-outline',
    tone: 'info',
  },
  {
    href: '/crop-management/tasks',
    label: 'Tasks & Reminders',
    desc: 'Notifications and SMS alerts',
    icon: 'checkmark-done-outline',
    tone: 'success',
  },
  {
    href: '/crop-management/health',
    label: 'Crop Health',
    desc: 'Diagnose diseases and pests',
    icon: 'medkit-outline',
    tone: 'warning',
  },
  {
    href: '/crop-management/soil',
    label: 'Soil & Fertilizer',
    desc: 'NPK recommendations',
    icon: 'flask-outline',
    tone: 'neutral',
  },
];

export default function CropManagementHub() {
  const { plans } = useCropPlans();
  const { allTasks, completionRate } = useFarmTasks();
  const pendingTasks = allTasks.filter((t) => t.status !== 'completed').length;

  const season = getCurrentSeason(MONTH);

  /*
    The tip was a hardcoded paragraph about fall armyworm, under a heading that
    said "Seasonal". It gave the same advice in July as in December. It now
    comes from a crop whose planting window is actually open, using that crop's
    own `tips` field, and names the crop and the season it belongs to.
  */
  const tipCrop =
    getCropsForMonth(MONTH).find((c) => c.tips) ?? CROPS.find((c) => c.tips) ?? null;

  return (
    <View style={styles.root}>
      <HeroHeader
        image={ScreenImages.crop}
        title="Crop management"
        subtitle="Plan, track and look after what is in the ground"
        showBack
        onBack={() => router.back()}
        meta={[
          { icon: 'partly-sunny-outline', label: season.name },
          { icon: 'leaf-outline', label: `${plans.length} active plan${plans.length === 1 ? '' : 's'}` },
        ]}
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <Stat icon="leaf-outline" value={String(plans.length)} label="Active plans" />
          <Stat
            icon="time-outline"
            value={String(pendingTasks)}
            label="Pending tasks"
            tone={pendingTasks > 0 ? 'warning' : undefined}
          />
          <Stat
            icon="checkmark-circle-outline"
            value={`${completionRate}%`}
            label="Done this week"
            tone="success"
          />
        </View>

        {pendingTasks > 0 ? (
          <Pressable
            onPress={() => router.push('/crop-management/tasks')}
            accessibilityRole="button"
            accessibilityLabel={`You have ${pendingTasks} pending ${pendingTasks === 1 ? 'task' : 'tasks'}. Open the task list.`}
            style={styles.alert}>
            <Ionicons name="alert-circle" size={18} color={DS.semantic.warning.fg} />
            <Text style={styles.alertText} maxFontSizeMultiplier={DS.layout.maxFontScale}>
              {pendingTasks} pending task{pendingTasks === 1 ? '' : 's'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={DS.semantic.warning.fg} />
          </Pressable>
        ) : null}

        <Text style={styles.sectionTitle} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          Modules
        </Text>

        <View style={styles.grid}>
          {MODULES.map((item) => {
            const tone = DS.semantic[item.tone];
            return (
              <Link key={item.href} href={item.href} asChild>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`${item.label}. ${item.desc}`}
                  style={({ pressed }) => [styles.moduleCard, pressed && styles.modulePressed]}>
                  <View style={[styles.moduleIcon, { backgroundColor: tone.bg }]}>
                    <Ionicons name={item.icon} size={22} color={tone.fg} />
                  </View>
                  <Text style={styles.moduleLabel} maxFontSizeMultiplier={DS.layout.maxFontScale}>
                    {item.label}
                  </Text>
                  <Text
                    style={styles.moduleDesc}
                    numberOfLines={2}
                    maxFontSizeMultiplier={DS.layout.maxFontScale}>
                    {item.desc}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>

        <Card style={styles.tip}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb-outline" size={18} color={DS.colors.primary} />
            <Text style={styles.tipTitle} maxFontSizeMultiplier={DS.layout.maxFontScale}>
              {tipCrop ? `${tipCrop.name} · ${season.name}` : season.name}
            </Text>
          </View>
          <Text style={styles.tipBody} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            {tipCrop?.tips ?? season.description}
          </Text>
          <Pressable
            onPress={() => router.push('/tutorials')}
            accessibilityRole="link"
            accessibilityLabel="Open tutorials"
            hitSlop={8}
            style={styles.tipLink}>
            <Text style={styles.tipLinkText}>More tutorials</Text>
            <Ionicons name="arrow-forward" size={13} color={DS.colors.primary} />
          </Pressable>
        </Card>
      </ScrollView>
    </View>
  );
}

function Stat({
  icon,
  value,
  label,
  tone,
}: {
  icon: IconName;
  value: string;
  label: string;
  tone?: keyof typeof DS.semantic;
}) {
  const color = tone ? DS.semantic[tone].solid : DS.colors.primary;
  return (
    <Card style={styles.statCard} accessibilityRole="summary" accessibilityLabel={`${value} ${label}`}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.statValue, { color }]} maxFontSizeMultiplier={DS.layout.maxFontScale}>
        {value}
      </Text>
      <Text style={styles.statLabel} maxFontSizeMultiplier={DS.layout.maxFontScale}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },


  body: { padding: DS.spacing.md, paddingBottom: DS.spacing.xl, gap: DS.spacing.md },

  statsRow: { flexDirection: 'row', gap: DS.spacing.sm },
  statCard: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 8 },
  statValue: {
    fontSize: DS.typography.h2.fontSize,
    fontFamily: DS.fontFamily.bold,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    textAlign: 'center',
  },

  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    minHeight: DS.layout.touchTarget,
    backgroundColor: DS.semantic.warning.bg,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.semantic.warning.border,
    paddingHorizontal: 12,
  },
  alertText: {
    flex: 1,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.semantic.warning.fg,
  },

  sectionTitle: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
    marginBottom: -DS.spacing.sm,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: DS.spacing.sm + 4 },
  moduleCard: {
    width: '47.5%',
    flexGrow: 1,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.border,
    padding: DS.spacing.md,
    gap: 4,
  },
  modulePressed: { backgroundColor: DS.colors.surfaceMuted },
  moduleIcon: {
    width: 42,
    height: 42,
    borderRadius: DS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  moduleLabel: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  moduleDesc: {
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 16,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  tip: { gap: DS.spacing.sm },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm },
  tipTitle: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  tipBody: {
    fontSize: DS.typography.bodySm.fontSize,
    lineHeight: 20,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  tipLink: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  tipLinkText: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primary,
  },
});
