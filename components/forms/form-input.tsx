import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import Colors from '@/constants/colors';
import { Typography } from '@/constants/Typography';

interface FormInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  prefix?: ReactNode;
  isPassword?: boolean;
}

export function FormInput({
  label,
  error,
  icon,
  prefix,
  isPassword,
  style,
  ...props
}: FormInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={s.wrap}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={[s.row, error ? s.rowError : null]}>
        {icon ? (
          <Ionicons name={icon} size={20} color={Colors.gray[400]} style={s.icon} />
        ) : null}
        {prefix}
        <TextInput
          style={[s.input, style]}
          placeholderTextColor={Colors.placeholder}
          secureTextEntry={isPassword && !visible}
          {...props}
        />
        {isPassword ? (
          <Pressable onPress={() => setVisible((v) => !v)} hitSlop={8}>
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={Colors.gray[400]}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { ...Typography.label, color: Colors.textSecondary, marginBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  rowError: { borderColor: Colors.error },
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: Colors.textPrimary,
  },
  error: { marginTop: 4, paddingHorizontal: 8, fontSize: 12, color: Colors.error },
});
