import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/ui/app-logo';
import { DS } from '@/constants/design-system';
import { AuthImages, RemoteImages } from '@/constants/images';
import { imageSourceFor } from '@/constants/produce-imagery';
import type { IconName } from '@/types/icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FEATURES: { icon: IconName; label: string }[] = [
  { icon: 'leaf-outline', label: 'Crop management' },
  { icon: 'storefront-outline', label: 'Marketplace' },
  { icon: 'bus-outline', label: 'Transport' },
  { icon: 'wallet-outline', label: 'Financials' },
];

/**
 * Onboarding, in two pages you swipe between.
 *
 * The first is the Farm UI reference as drawn: large type on a clean ground
 * with an inline photo chip, a photograph filling the lower two thirds under a
 * rounded top edge, and a translucent Get Started bar with the circular arrow.
 * The second is the choice of route in — create an account, or sign in.
 *
 * WHY TWO PAGES RATHER THAN ONE. The reference has a single Get Started, which
 * works when there is one way in. FarmBridge has two, and the version that
 * offered only "sign in" left new users to work out that registering lived
 * somewhere else. Splitting them keeps the reference's uncluttered first
 * screen and still puts both routes in front of you, each labelled.
 *
 * THE HERO IS REMOTE WITH A BUNDLED FALLBACK. The Unsplash photograph is the
 * one the reference uses — a tractor working a green field — but this is the
 * screen someone opens before the app has ever had a network, on a new phone
 * or a new SIM. `placeholder` holds the bundled photo underneath, so the screen
 * is never empty and is at its best when there is signal.
 */
export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (next !== page) setPage(next);
  };

  const goToChoice = () => scrollRef.current?.scrollTo({ x: SCREEN_WIDTH, animated: true });

  return (
    <View style={styles.root}>
      {/*
        Page one is white at the top and page two is a dark photograph, so a
        single bar style would hide the clock on one of them.
      */}
      <StatusBar barStyle={page === 0 ? 'dark-content' : 'light-content'} />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}>
        <Intro width={SCREEN_WIDTH} onStart={goToChoice} />
        <Choice width={SCREEN_WIDTH} />
      </ScrollView>

      <View style={styles.dots} pointerEvents="none">
        {[0, 1].map((i) => (
          <View key={i} style={[styles.dot, page === i && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

/** Page one — the reference. */
function Intro({ width, onStart }: { width: number; onStart: () => void }) {
  return (
    <View style={[styles.page, { width }]}>
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
          <Pressable
            onPress={onStart}
            accessibilityRole="button"
            accessibilityLabel="Get started"
            accessibilityHint="Moves to the sign in and register options"
            style={({ pressed }) => [styles.startBar, pressed && styles.pressed]}>
            <View style={styles.startIcon}>
              <Ionicons name="arrow-forward" size={20} color={DS.colors.textInverse} />
            </View>
            <Text style={styles.startText}>Get started</Text>
            <Ionicons name="chevron-forward" size={16} color={DS.colors.textSoft} />
          </Pressable>
        </SafeAreaView>
      </View>
    </View>
  );
}

/** Page two — the two ways in. */
function Choice({ width }: { width: number }) {
  return (
    <View style={[styles.page, styles.choicePage, { width }]}>
      <Image
        source={AuthImages.onboardingFarm}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={250}
      />
      <View style={styles.choiceScrim} />

      <SafeAreaView style={styles.choiceSafe}>
        <View style={styles.choiceBrand}>
          <AppLogo size={44} />
          <View style={styles.flex}>
            <Text style={styles.choiceBrandName}>FarmBridge</Text>
            <Text style={styles.choiceBrandSub}>Zimbabwe’s farming platform</Text>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            Grow, sell and move your harvest
          </Text>
          <Text style={styles.panelBody} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            Everything in one place, and it works offline when the signal does not.
          </Text>

          <View style={styles.features}>
            {FEATURES.map((feature) => (
              <View key={feature.label} style={styles.feature}>
                <Ionicons name={feature.icon} size={15} color={DS.colors.primary} />
                <Text style={styles.featureLabel} maxFontSizeMultiplier={DS.layout.maxFontScale}>
                  {feature.label}
                </Text>
              </View>
            ))}
          </View>

          {/*
            Both routes as equal, explicitly labelled actions. A new user should
            not have to infer that "sign in" implies a separate place to register.
          */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.surface },
  page: { flex: 1 },
  flex: { flex: 1 },
  pressed: { opacity: 0.9 },

  dots: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: { width: 18, backgroundColor: DS.colors.textInverse },

  // ── Page one ──────────────────────────────────────────────────────────────
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
    ...StyleSheet.absoluteFillObject,
    top: '55%',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  heroSafe: { padding: DS.spacing.md, paddingBottom: DS.spacing.lg },

  /*
    The reference's frosted bar: light fill, dark label.

    It was a 0.16-white fill with white text, which is what the bar looks like
    at a glance — but that measured 3.07:1 over a bright frame of the
    photograph. A heavy light fill is both closer to the reference and readable
    over anything, because the label no longer depends on what is behind it:
    0.88 white sits between 224 and 255 whatever the photo does, and near-black
    on that clears 13:1.
  */
  startBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 4,
    minHeight: 64,
    paddingLeft: 6,
    paddingRight: DS.spacing.md,
    borderRadius: DS.radius.full,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  startIcon: {
    width: 52,
    height: 52,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.primary,
  },
  startText: {
    flex: 1,
    textAlign: 'center',
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },

  // ── Page two ──────────────────────────────────────────────────────────────
  choicePage: { backgroundColor: DS.colors.text },
  choiceScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.55)' },
  choiceSafe: { flex: 1, justifyContent: 'space-between', padding: DS.spacing.md },

  choiceBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 4,
    marginTop: DS.spacing.sm,
  },
  choiceBrandName: {
    fontSize: DS.typography.h1.fontSize,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.textInverse,
  },
  choiceBrandSub: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textInverse,
    marginTop: 1,
  },

  panel: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.xxl,
    padding: DS.spacing.lg,
    gap: DS.spacing.sm + 4,
    marginBottom: DS.spacing.md,
  },
  panelTitle: {
    fontSize: DS.typography.display.fontSize,
    lineHeight: DS.typography.display.lineHeight,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.text,
  },
  panelBody: {
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
    borderRadius: DS.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  featureLabel: {
    fontSize: 11,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primaryDark,
  },

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
    marginTop: DS.spacing.xs,
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
    borderColor: DS.colors.borderControl,
  },
  secondaryActionText: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primary,
  },
});
