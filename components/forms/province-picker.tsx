import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PROVINCES } from '@/constants/zimbabwe-data';
import { DS } from '@/constants/design-system';

interface ProvincePickerProps {
  value: string;
  onChange: (province: string) => void;
  error?: string;
}

export function ProvincePicker({ value, onChange, error }: ProvincePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = PROVINCES.find((p) => p.name === value);

  const handleSelect = (provinceName: string) => {
    onChange(provinceName);
    setOpen(false);
  };

  return (
    <View style={s.wrapper}>
      <Text style={s.label}>Province</Text>

      {/* ── Trigger button ── */}
      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        style={({ pressed }) => [
          s.trigger,
          open && s.triggerOpen,
          error && s.triggerError,
          pressed && { opacity: 0.85 },
        ]}>
        <View style={s.triggerLeft}>
          <Ionicons name="location-outline" size={18} color={selected ? DS.colors.primary : DS.colors.textSoft} style={s.triggerIcon} />
          <Text style={selected ? s.triggerSelected : s.triggerPlaceholder}>
            {selected ? selected.name : 'Select your province'}
          </Text>
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={DS.colors.textFaint}
        />
      </Pressable>

      {/* ── Inline dropdown ── */}
      {open && (
        <View style={s.dropdown}>
          <ScrollView
            style={s.dropdownScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {PROVINCES.map((province, i) => {
              const isSelected = province.name === value;
              return (
                <Pressable
                  key={province.id}
                  onPress={() => handleSelect(province.name)}
                  style={({ pressed }) => [
                    s.option,
                    i < PROVINCES.length - 1 && s.optionBorder,
                    isSelected && s.optionSelected,
                    pressed && s.optionPressed,
                  ]}>
                  <View style={s.optionContent}>
                    <Text style={[s.optionName, isSelected && s.optionNameSelected]}>
                      {province.name}
                    </Text>
                    <Text style={[s.optionCapital, isSelected && s.optionCapitalSelected]}>
                      {province.capital}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color={DS.colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: DS.colors.text, marginBottom: 7 },

  // Trigger button
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DS.colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: DS.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  triggerOpen: {
    borderColor: DS.colors.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: DS.colors.surface,
  },
  triggerError: { borderColor: DS.semantic.danger.solid },
  triggerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  triggerIcon: { marginRight: 10 },
  triggerSelected: { fontSize: 14, fontWeight: '600', color: DS.colors.text, flex: 1 },
  triggerPlaceholder: { fontSize: 14, color: DS.colors.textSoft, flex: 1 },

  // Dropdown panel
  dropdown: {
    backgroundColor: DS.colors.surface,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: DS.colors.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
    // Shadow
    shadowColor: DS.colors.text,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    zIndex: 999,
  },
  dropdownScroll: { maxHeight: 220 },

  // Each option
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: DS.colors.surface,
  },
  optionBorder: { borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight },
  optionSelected: { backgroundColor: DS.colors.primaryBg },
  optionPressed: { backgroundColor: DS.colors.primaryMid },
  optionContent: { flex: 1 },
  optionName: { fontSize: 14, fontWeight: '600', color: DS.colors.text },
  optionNameSelected: { color: DS.colors.primary },
  optionCapital: { fontSize: 11, color: DS.colors.textMuted, marginTop: 1 },
  optionCapitalSelected: { color: DS.colors.primary },

  errorText: { fontSize: 11, color: DS.semantic.danger.solid, marginTop: 6 },
});
