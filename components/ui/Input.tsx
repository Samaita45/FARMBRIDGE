import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import Colors from '@/constants/colors';
import Typography from '@/constants/Typography';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  secureTextEntry?: boolean;
  containerStyle?: object;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  containerStyle,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.container,
          focused && styles.containerFocused,
          !!error && styles.containerError,
        ]}>
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={focused ? Colors.primary : Colors.placeholder}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.placeholder}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />

        {/* Password toggle */}
        {secureTextEntry ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            style={styles.rightIconWrapper}>
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.placeholder}
            />
          </Pressable>
        ) : rightIcon ? (
          <Pressable
            onPress={onRightIconPress}
            hitSlop={10}
            style={styles.rightIconWrapper}>
            <Ionicons name={rightIcon} size={20} color={Colors.placeholder} />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: 6,
    paddingLeft: 4,
  },
  container: {
    backgroundColor: Colors.inputBg,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  containerError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    padding: 0,
    margin: 0,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIconWrapper: {
    marginLeft: 8,
  },
  errorText: {
    ...Typography.small,
    color: Colors.error,
    marginTop: 4,
    paddingLeft: 16,
  },
});
