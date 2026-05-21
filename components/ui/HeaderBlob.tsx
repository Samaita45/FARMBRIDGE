import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Colors from '@/constants/colors';
import Typography from '@/constants/Typography';

export interface HeaderBlobProps {
  children?: ReactNode;
  height?: number;
  showBackButton?: boolean;
  title?: string;
  subtitle?: string;
  rightElement?: ReactNode;
}

export function HeaderBlob({
  children,
  height = 130,
  showBackButton = false,
  title,
  subtitle,
  rightElement,
}: HeaderBlobProps) {
  const router = useRouter();

  return (
    <View style={[styles.container, { minHeight: height }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.primaryBg} />

      {/* Decorative blob circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      {/* Top row: back button + right element */}
      {(showBackButton || rightElement) && (
        <View style={styles.topRow}>
          {showBackButton ? (
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={12}>
              <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          {rightElement ?? <View style={styles.backPlaceholder} />}
        </View>
      )}

      {/* Title block */}
      {(title || subtitle) && (
        <View style={styles.titleBlock}>
          {title ? (
            <Text style={styles.title}>{title}</Text>
          ) : null}
          {subtitle ? (
            <Text style={styles.subtitle}>{subtitle}</Text>
          ) : null}
        </View>
      )}

      {/* Custom children */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primaryBg,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  // Circle 1: large, top-right
  circle1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primary,
    opacity: 0.85,
    top: -40,
    right: -30,
  },
  // Circle 2: medium, slightly inset
  circle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    opacity: 0.6,
    top: 10,
    right: 60,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backPlaceholder: {
    width: 38,
    height: 38,
  },
  titleBlock: {
    marginTop: 4,
  },
  title: {
    ...Typography.heading1,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
