import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Colors } from '@/constants/colors';

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
  ...props
}: FormInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="mb-4">
      {label ? (
        <Text className="mb-1.5 font-sans text-sm text-gray-600">{label}</Text>
      ) : null}
      <View
        className={`flex-row items-center rounded-full border bg-white px-4 ${
          error ? 'border-error' : 'border-gray-200'
        }`}>
        {icon ? (
          <Ionicons name={icon} size={20} color={Colors.gray[400]} style={{ marginRight: 10 }} />
        ) : null}
        {prefix}
        <TextInput
          className="flex-1 py-3.5 font-sans text-base text-gray-900"
          placeholderTextColor={Colors.gray[400]}
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
      {error ? <Text className="mt-1 px-2 font-sans text-sm text-error">{error}</Text> : null}
    </View>
  );
}
