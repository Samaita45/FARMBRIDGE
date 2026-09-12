import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DS } from '@/constants/design-system';
import { PLACES, type Place } from '@/constants/zimbabwe-data/places';

interface PlaceFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  /** Extra detail people add after the town, e.g. "Harare, Mbare Musika". */
  hint?: string;
}

/**
 * A location field that suggests towns as you type.
 *
 * WHY IT IS NOT A PLAIN TEXT BOX. Pickup and destination were free text, and
 * everything downstream — the route map, the distance, and therefore every
 * quoted price — needs to resolve them to a place. A typed "Chegutu" that the
 * app cannot find silently produced no map and a made-up distance, with
 * nothing on screen explaining why.
 *
 * Free text still goes through, because "Harare, Mbare Musika" is more useful
 * to a driver than "Harare". The field just makes sure a town the app knows is
 * in there somewhere, and says so with a tick.
 */
export function PlaceField({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  error,
  hint,
}: PlaceFieldProps) {
  const [focused, setFocused] = useState(false);

  const matched = useMemo(() => matchPlace(value), [value]);

  const suggestions = useMemo(() => {
    if (!focused) return [];
    const query = value.trim().toLowerCase();
    // Once a town is in the string the suggestions have done their job and
    // would only get in the way of typing the rest of the address.
    if (matched || query.length < 2) return [];
    return PLACES.filter((p) => p.name.toLowerCase().startsWith(query)).slice(0, 5);
  }, [focused, value, matched]);

  const borderColor = error
    ? DS.semantic.danger.solid
    : focused
      ? DS.colors.primary
      : DS.colors.borderControl;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      <View style={[styles.field, { borderColor }]}>
        <Ionicons name="location-outline" size={18} color={DS.colors.textSoft} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          // Delayed so a tap on a suggestion lands before the list closes.
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          placeholder={placeholder}
          placeholderTextColor={DS.colors.textMuted}
          autoCorrect={false}
          accessibilityLabel={label}
          maxFontSizeMultiplier={DS.layout.maxFontScale}
        />
        {matched ? (
          <Ionicons name="checkmark-circle" size={18} color={DS.colors.primary} />
        ) : null}
      </View>

      {suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          {suggestions.map((p) => (
            <Pressable
              key={p.name}
              onPress={() => onChangeText(p.name)}
              accessibilityRole="button"
              accessibilityLabel={`Use ${p.name}, ${p.province}`}
              style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}>
              <Ionicons name="location" size={14} color={DS.colors.primary} />
              <Text style={styles.suggestionName}>{p.name}</Text>
              <Text style={styles.suggestionProvince}>{p.province}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : matched && hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

/** The town inside a free-text location, longest name first. */
export function matchPlace(text: string): Place | null {
  const query = text.trim().toLowerCase();
  if (!query) return null;
  const byLength = [...PLACES].sort((a, b) => b.name.length - a.name.length);
  return byLength.find((p) => query.includes(p.name.toLowerCase())) ?? null;
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  required: { color: DS.semantic.danger.solid },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    minHeight: DS.layout.touchTarget,
    paddingHorizontal: 14,
    borderRadius: DS.radius.md,
    borderWidth: DS.layout.hairline,
    backgroundColor: DS.colors.surface,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: DS.typography.body.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.text,
  },

  suggestions: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.md,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    overflow: 'hidden',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  suggestionPressed: { backgroundColor: DS.colors.surfaceMuted },
  suggestionName: {
    flex: 1,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  suggestionProvince: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  error: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.semantic.danger.fg,
  },
  hint: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
});
