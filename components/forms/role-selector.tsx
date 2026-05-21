import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '@/constants/colors';
import type { UserRole } from '@/types';

const ROLES: { value: UserRole; label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }[] = [
  { value: 'farmer', label: 'Farmer',  icon: 'leaf',       desc: 'I grow crops' },
  { value: 'buyer',  label: 'Buyer',   icon: 'cart',        desc: 'I buy produce' },
  { value: 'both',   label: 'Both',    icon: 'swap-horizontal', desc: 'I do both' },
];

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  error?: string;
}

export function RoleSelector({ value, onChange, error }: RoleSelectorProps) {
  return (
    <View style={s.container}>
      <Text style={s.label}>I am a</Text>
      <View style={s.row}>
        {ROLES.map((role) => {
          const active = value === role.value;
          return (
            <Pressable
              key={role.value}
              onPress={() => onChange(role.value)}
              style={({ pressed }) => [
                s.roleBtn,
                active ? s.roleBtnActive : s.roleBtnInactive,
                pressed && !active && { opacity: 0.75 },
              ]}>
              <View style={[s.roleIconCircle, active ? s.roleIconCircleActive : s.roleIconCircleInactive]}>
                <Ionicons name={role.icon} size={16} color={active ? '#fff' : Colors.primary} />
              </View>
              <Text style={[s.roleLabel, active ? s.roleLabelActive : s.roleLabelInactive]}>
                {role.label}
              </Text>
              <Text style={[s.roleDesc, active ? s.roleDescActive : s.roleDescInactive]}>
                {role.desc}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8 },

  roleBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
  },
  roleBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  roleBtnInactive: {
    backgroundColor: '#fff',
    borderColor: Colors.inputBorder,
  },

  roleIconCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  roleIconCircleActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  roleIconCircleInactive: { backgroundColor: Colors.primaryBg },

  roleLabel: { fontSize: 13, fontWeight: '700' },
  roleLabelActive: { color: '#fff' },
  roleLabelInactive: { color: Colors.textPrimary },

  roleDesc: { fontSize: 10, textAlign: 'center' },
  roleDescActive: { color: 'rgba(255,255,255,0.80)' },
  roleDescInactive: { color: Colors.textSecondary },

  errorText: { fontSize: 11, color: Colors.error, marginTop: 6 },
});
