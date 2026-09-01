import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { ImageBackground, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/design-system';
import { AppLogo } from '@/components/ui/app-logo';
import { DS } from '@/constants/design-system';
import { AuthImages } from '@/constants/images';
import type { IconName } from '@/types/icons';

const FEATURES: { icon: IconName; label: string }[] = [
  { icon: 'leaf-outline', label: 'Crop management' },
  { icon: 'storefront-outline', label: 'Marketplace' },
  { icon: 'bus-outline', label: 'Transport' },
  { icon: 'wallet-outline', label: 'Financials' },
];

/**
 * The first screen.
 *
 * The photograph stays — it is the product, not decoration. What went is the
 * translucent "glass" panel and the blue glow behind the primary button
 * (`shadowColor: primary` at 45% over 14px), which read as consumer-app
 * styling rather than a platform people are asked to trust with money.
 *
 * The panel is now a solid surface: real contrast, readable at any brightness,
 * and legible in direct sun — which is where a farmer will actually open this.
 */
export default function OnboardingScreen() {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <ImageBackground source={AuthImages.onboardingFarm} style={styles.bg} resizeMode="cover">
        <View style={styles.scrim} />

        <SafeAreaView style={styles.safe}>
          <Animated.View entering={FadeInUp.duration(500)} style={styles.brandRow}>
            <AppLogo size={48} />
            <View style={styles.brandText}>
              <Text style={styles.brandName} maxFontSizeMultiplier={DS.layout.maxFontScale}>
                FarmBridge
              </Text>
              <Text style={styles.brandSub} maxFontSizeMultiplier={DS.layout.maxFontScale}>
                Zimbabwe’s farming platform
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.panel}>
            <Text style={styles.headline} maxFontSizeMultiplier={DS.layout.maxFontScale}>
              Grow, sell and move your harvest
            </Text>
            <Text style={styles.body} maxFontSizeMultiplier={DS.layout.maxFontScale}>
              Plan your crops, reach buyers, book transport and keep track of what your farm
              actually earns.
            </Text>

            <View style={styles.features}>
              {FEATURES.map((feature) => (
                <View key={feature.label} style={styles.feature}>
                  <Ionicons name={feature.icon} size={15} color={DS.colors.primary} />
                  <Text
                    style={styles.featureLabel}
                    maxFontSizeMultiplier={DS.layout.maxFontScale}>
                    {feature.label}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.actions}>
              <Link href="/(auth)/register" asChild>
                <Button
                  title="Create an account"
                  size="lg"
                  icon="arrow-forward"
                  iconPosition="right"
                />
              </Link>
              <Link href="/(auth)/login" asChild>
                <Button title="I already have an account" variant="outline" size="lg" />
              </Link>
            </View>
          </Animated.View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.text },
  bg: { flex: 1 },
  // Dark enough that the white brand text clears contrast over any photograph.
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.45)' },

  safe: { flex: 1, justifyContent: 'space-between', padding: DS.spacing.md },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 4,
    marginTop: DS.spacing.sm,
  },
  brandText: { flex: 1 },
  brandName: {
    fontSize: DS.typography.h1.fontSize,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.textInverse,
  },
  brandSub: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.82)',
    marginTop: 1,
  },

  panel: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.xl,
    padding: DS.spacing.lg,
    gap: DS.spacing.sm + 4,
  },
  headline: {
    fontSize: DS.typography.display.fontSize,
    lineHeight: DS.typography.display.lineHeight,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.text,
  },
  body: {
    fontSize: DS.typography.bodySm.fontSize,
    lineHeight: 21,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  features: { flexDirection: 'row', flexWrap: 'wrap', gap: DS.spacing.sm },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: DS.colors.primaryBg,
    borderRadius: DS.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  featureLabel: {
    fontSize: 11,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primaryDark,
  },

  actions: { gap: DS.spacing.sm, marginTop: DS.spacing.xs },
});
