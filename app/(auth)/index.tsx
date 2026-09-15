import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SlideToAct, type SlideToActHandle } from '@/components/design-system';
import { AppLogo } from '@/components/ui/app-logo';
import { DS } from '@/constants/design-system';
import { asHref } from '@/lib/href';
import { AuthImages, RemoteImages } from '@/constants/images';
import { imageSourceFor } from '@/constants/produce-imagery';

/**
 * Onboarding. One screen.
 *
 * IT USED TO BE TWO, AND THE SECOND ONE EARNED ITS REMOVAL. Sliding to get
 * started scrolled a pager to a card offering "Create an account" and "Sign
 * in" — a second decision to reach the decision, with a swipe in between that
 * fought the slide control badly enough to need the pager locked while the
 * thumb was down. Getting started now goes where getting started goes: the
 * register form.
 *
 * SIGNING IN IS STILL HERE. It was on the deleted card, and dropping it would
 * have stranded every returning user behind a form for an account they already
 * have. It sits under the slide, worded as what it is.
 *
 * THE HERO IS REMOTE WITH A BUNDLED FALLBACK. The Unsplash photograph is the
 * one the reference uses — a tractor working a green field — but this is the
 * screen someone opens before the app has ever had a network, on a new phone
 * or a new SIM. `placeholder` holds the bundled photo underneath, so the screen
 * is never empty and is at its best when there is signal.
 */
export default function OnboardingScreen() {
  const slide = useRef<SlideToActHandle>(null);

  /*
    Re-arm the slide every time this screen comes back into view.

    Sliding through to register does not unmount this screen — expo-router
    pushes on top of it — so the control kept the `finished` flag it set on the
    way out. Anyone who backed out of registration found a slide that no longer
    moved, with nothing on screen to explain why. Focus is the right moment
    because it covers the back gesture, the header button and a programmatic
    pop alike.
  */
  useFocusEffect(
    useCallback(() => {
      slide.current?.reset();
    }, [])
  );

  return (
    <View style={styles.root}>
      {/* The top half is a white sheet, so the clock has to be dark. */}
      <StatusBar barStyle="dark-content" />

      <SafeAreaView edges={['top']} style={styles.introTopSafe}>
        <View style={styles.introTop}>
          <AppLogo size={40} />

          <Text style={styles.headline} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            <Text style={styles.headlineAccent}>Smart</Text> tools for
          </Text>

          <View style={styles.headlineRow}>
            {/* Decorative: the words either side carry the meaning. */}
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
              modern <Text style={styles.headlineAccent}>farmers</Text>
            </Text>
          </View>

          <Text style={styles.body} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            Plan your crops, reach buyers, book transport, and keep track of what your farm
            actually earns.
          </Text>
        </View>
      </SafeAreaView>

      <View style={styles.heroWrap}>
        <Image
          source={RemoteImages.onboardingTractor}
          placeholder={AuthImages.onboardingFarm}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={400}
          cachePolicy="memory-disk"
        />
        <View style={styles.heroScrim} />

        <SafeAreaView edges={['bottom']} style={styles.heroSafe}>
          <SlideToAct
            ref={slide}
            label="Slide to get started"
            accessibilityLabel="Get started and create an account"
            onComplete={() => router.push(asHref('/(auth)/register'))}
          />
          <Pressable
            onPress={() => router.push(asHref('/(auth)/login'))}
            accessibilityRole="button"
            accessibilityLabel="Sign in to an existing account"
            hitSlop={10}
            style={({ pressed }) => [styles.signInLink, pressed && styles.pressed]}>
            <Text style={styles.signInLinkText}>Already have an account? Sign in</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.surface },
  pressed: { opacity: 0.75 },

  introTopSafe: { backgroundColor: DS.colors.surface },
  introTop: {
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
    ...StyleSheet.absoluteFill,
    top: '50%',
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
  },
  heroSafe: {
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.md,
    paddingBottom: DS.spacing.xl,
    gap: DS.spacing.sm,
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: DS.spacing.sm,
  },
  signInLinkText: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },
});
