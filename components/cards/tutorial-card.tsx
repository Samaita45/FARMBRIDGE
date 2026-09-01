import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DS } from '@/constants/design-system';
import { asHref } from '@/lib/href';
import type { Tutorial } from '@/types/tutorials';

const DIFF_COLORS: Record<string, { bg: string; text: string }> = {
  beginner:     { bg: DS.colors.accentLight, text: DS.colors.accent },
  intermediate: { bg: DS.semantic.warning.bg, text: DS.semantic.warning.fg },
  advanced:     { bg: DS.semantic.danger.bg,  text: DS.semantic.danger.fg },
};
const LANG_LABELS: Record<string, string> = { en: 'EN', sn: 'SN', nd: 'ND' };

interface TutorialCardProps {
  tutorial: Tutorial;
  completed?: boolean;
  bookmarked?: boolean;
  onBookmark?: () => void;
}

export function TutorialCard({ tutorial, completed, bookmarked, onBookmark }: TutorialCardProps) {
  const diff = DIFF_COLORS[tutorial.difficulty] ?? DIFF_COLORS.beginner;
  return (
    <View style={[s.card, completed && s.cardDone]}>
      {/* Emoji column */}
      <View style={s.emojiCol}>
        <Text style={s.emoji}>{tutorial.emoji}</Text>
        {completed && (
          <View style={s.doneStamp}>
            <Ionicons name="checkmark-circle" size={16} color={DS.colors.accent} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={s.content}>
        <View style={s.titleRow}>
          <Link href={asHref(`/tutorials/${tutorial.id}`)} asChild>
            <Pressable style={s.titlePressable}>
              <Text style={s.title} numberOfLines={2}>{tutorial.title}</Text>
            </Pressable>
          </Link>
          {onBookmark && (
            <Pressable onPress={onBookmark} hitSlop={8} style={s.bookmarkBtn}>
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={bookmarked ? DS.colors.primary : DS.colors.textFaint}
              />
            </Pressable>
          )}
        </View>

        <Text style={s.summary} numberOfLines={2}>{tutorial.summary}</Text>

        <View style={s.meta}>
          <View style={s.metaChip}>
            <Ionicons name="time-outline" size={10} color={DS.colors.textMuted} />
            <Text style={s.metaChipText}>{tutorial.durationMin} min</Text>
          </View>
          <View style={[s.metaChip, { backgroundColor: diff.bg }]}>
            <Text style={[s.metaChipText, { color: diff.text }]}>{tutorial.difficulty.charAt(0).toUpperCase() + tutorial.difficulty.slice(1)}</Text>
          </View>
          <View style={[s.metaChip, { backgroundColor: DS.colors.primaryBg }]}>
            <Text style={[s.metaChipText, { color: DS.colors.primary }]}>{LANG_LABELS[tutorial.language] ?? 'EN'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', marginBottom: 10,
    backgroundColor: DS.colors.surface, borderRadius: 16, overflow: 'hidden',
    shadowColor: DS.colors.text, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: DS.colors.borderLight,
  },
  cardDone: { borderColor: DS.colors.accentLight },
  emojiCol: {
    width: 70, backgroundColor: DS.colors.primaryBg,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  emoji: { fontSize: 28 },
  doneStamp: {},
  content: { flex: 1, padding: 12 },
  titleRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  titlePressable: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700', color: DS.colors.text, lineHeight: 18 },
  bookmarkBtn: { padding: 2 },
  summary: { fontSize: 11, color: DS.colors.textMuted, marginTop: 4, lineHeight: 15 },
  meta: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: DS.colors.borderLight, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  metaChipText: { fontSize: 10, fontWeight: '600', color: DS.colors.textMuted },
});
