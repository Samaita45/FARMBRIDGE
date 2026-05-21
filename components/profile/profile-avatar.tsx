import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import Colors from '@/constants/colors';
import { resolveAvatarUri } from '@/lib/profile-photo';

interface ProfileAvatarProps {
  uri?: string | null;
  initials: string;
  size?: number;
  onPress?: () => void;
  showCameraBadge?: boolean;
  /** When true, omits the default white ring (e.g. inside hero header ring). */
  embedded?: boolean;
  style?: ViewStyle;
}

export function ProfileAvatar({
  uri,
  initials,
  size = 80,
  onPress,
  showCameraBadge = true,
  embedded = false,
  style,
}: ProfileAvatarProps) {
  const [displayUri, setDisplayUri] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void resolveAvatarUri(uri).then((resolved) => {
      if (active) setDisplayUri(resolved);
    });
    return () => {
      active = false;
    };
  }, [uri]);

  const radius = size / 2;
  const badgeSize = Math.max(22, Math.round(size * 0.32));

  const content = displayUri ? (
    <Image
      source={{ uri: displayUri }}
      style={{ width: size, height: size, borderRadius: radius }}
      contentFit="cover"
      accessibilityLabel="Profile photo"
    />
  ) : (
    <View
      style={[
        styles.fallback,
        embedded && styles.fallbackEmbedded,
        { width: size, height: size, borderRadius: radius },
      ]}>
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.wrap, { width: size, height: size }, style]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? 'Change profile photo' : undefined}>
      {content}
      {showCameraBadge && onPress ? (
        <View
          style={[
            styles.cameraBtn,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
            },
          ]}>
          <Ionicons name="camera" size={Math.round(badgeSize * 0.54)} color={Colors.primary} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  fallback: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackEmbedded: {
    borderWidth: 0,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  initials: { fontWeight: '800', color: '#fff' },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primaryBg,
  },
});
