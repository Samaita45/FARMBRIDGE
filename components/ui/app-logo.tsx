import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppImages } from '@/constants/images';

interface AppLogoProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/** FarmBridge logo — square source cropped to a circle for consistent iOS/Android display. */
export function AppLogo({ size = 64, style }: AppLogoProps) {
  const radius = size / 2;

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
        style,
      ]}>
      <Image
        source={AppImages.logo}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
        }}
        resizeMode="cover"
        accessibilityLabel="FarmBridge logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
});
