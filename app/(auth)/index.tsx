import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/ui/app-logo';
import { DS } from '@/constants/design-system';
import { AuthImages } from '@/constants/images';
import { imageSourceFor } from '@/constants/produce-imagery';

/**
 * The first screen, laid out to the Farm UI reference: the promise in large
 * type on a clean ground, a photograph filling the lower two thirds, and the
 * way in sitting on top of it.
 *
 * THE PHOTOGRAPH IS BUNDLED, NOT FETCHED. Everything else in the app now pulls
 * its imagery from Unsplash, but this screen is the one a farmer opens before
 * the app has ever had a network — on a new phone, on a new SIM, in a field.
 * A remote hero would be a grey rectangle exactly then. The Unsplash photograph
 * loads over the top when it can, so the screen is never empty and is at its
 * best when there is signal.
 *
 * BOTH WAYS IN STAY VISIBLE. The reference has a single "Get Started". This has
 * two labelled routes, because the version that offered only "sign in" left new
 * users to work out for themselves that registering was somewhere else.
 */
export default function OnboardingScreen() {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <Animated.View entering={FadeInUp.duration(450)} style={styles.top}>
          <AppLogo size={40} />

          <Text style={styles.headline} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            <Text style={styles.headlineAccent}>Grow</Text>, sell and move
          </Text>

          <View style={styles.headlineRow}>
            {/* The inline photo chip from the reference. Decorative: the words
                either side carry the meaning, so it is hidden from screen readers. */}
            <Image
              source={imageSourceFor('tomato vegetables')}
              style={styles.headlineChip}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={styles.headline} maxFontSizeMultiplier={DS.layout.maxFontScale}>
              your <Text style={styles.headlineAccent}>harvest</Text>
            </Text>
          </View>

          <Text style={styles.body} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            Plan your crops, reach buyers, book transport, and keep track of what your farm
            actually earns.
          </Text>
        </Animated.View>
      </SafeAreaView>

      <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.heroWrap}>
        <Image
          source={AuthImages.onboardingFarm}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
        />
        {/* Bottom-weighted scrim so the actions stay legible over any frame. */}
        <View style={styles.heroScrim} />

        <SafeAreaView style={styles.heroSafe} edges={['bottom']}>
          <View style={styles.actions}>
            <Link href="/(auth)/register" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create an account"
                style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
                <Text style={styles.primaryActionText}>Create an account</Text>
                <View style={styles.primaryActionIcon}>
                  <Ionicons name="arrow-forward" size={17} color={DS.colors.primary} />
                </View>
              </Pressable>
            </Link>

            <Link href="/(auth)/login" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign in to an existing account"
                style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}>
                <Text style={styles.secondaryActionText}>I already have an account</Text>
              </Pressable>
            </Link>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.surface },
  safe: { backgroundColor: DS.colors.surface },
  pressed: { opacity: 0.9 },

  top: {
    paddingHorizontal: DS.spacing.lg,
    paddingTop: DS.spacing.md,
    paddingBottom: DS.spacing.lg,
    gap: DS.spacing.xs,
  },
  headline: {
    fontSize: 32,
    lineHeight: 39,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.text,
  },
  headlineAccent: { color: DS.colors.primary },
  headlineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headlineChip: {
    width: 62,
    height: 34,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.surfaceMuted,
  },
  body: {
    fontSize: DS.typography.bodySm.fontSize,
    lineHeight: 21,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: DS.spacing.sm,
  },

  heroWrap: {
    flex: 1,
    backgroundColor: DS.colors.surfaceMuted,
    borderTopLeftRadius: DS.radius.xxl,
    borderTopRightRadius: DS.radius.xxl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    top: '45%',
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
  },
  heroSafe: { padding: DS.spacing.md },

  actions: { gap: DS.spacing.sm },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DS.spacing.sm,
    minHeight: 58,
    paddingLeft: DS.spacing.lg,
    paddingRight: 6,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.primary,
  },
  primaryActionText: {
    flex: 1,
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },
  primaryActionIcon: {
    width: 46,
    height: 46,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surface,
  },

  secondaryAction: {
    minHeight: DS.layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DS.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  secondaryActionText: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },
});
