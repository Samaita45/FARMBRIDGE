import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, SlideToAct } from '@/components/design-system';
import { AppLogo } from '@/components/ui/app-logo';
import { DS } from '@/constants/design-system';
import { asHref } from '@/lib/href';
import { AuthImages, RemoteImages } from '@/constants/images';
import { imageSourceFor } from '@/constants/produce-imagery';
import type { IconName } from '@/types/icons';

const INITIAL = Dimensions.get('window');

interface PageSize {
  width: number;
  height: number;
}

const FEATURES: { icon: IconName; label: string }[] = [
  { icon: 'leaf-outline', label: 'Crops' },
  { icon: 'storefront-outline', label: 'Market' },
  { icon: 'bus-outline', label: 'Transport' },
  { icon: 'wallet-outline', label: 'Money' },
];

/**
 * Onboarding, in two pages you swipe between.
 *
 * Page one: brand + slide to continue.
 * Page two: create an account or sign in — both as full-width buttons.
 */
export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState({ width: INITIAL.width, height: INITIAL.height });
  const [pagerLocked, setPagerLocked] = useState(false);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / size.width);
    if (next !== page) setPage(next);
  };

  const goToChoice = () => scrollRef.current?.scrollTo({ x: size.width, animated: true });

  return (
    <View style={styles.root} onLayout={onLayout}>
      <StatusBar barStyle={page === 0 ? 'dark-content' : 'light-content'} />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={!pagerLocked}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        // Keep the pager from fighting the slide control on Android.
        nestedScrollEnabled={false}
        style={styles.pager}>
        <Intro
          size={size}
          onStart={goToChoice}
          onSlidingChange={setPagerLocked}
          onSignIn={() => router.push(asHref('/(auth)/login'))}
        />
        <Choice size={size} />
      </ScrollView>

      <View style={[styles.dots, page === 0 && styles.dotsOnLight]} pointerEvents="none">
        {[0, 1].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              page === 0 && styles.dotOnLight,
              page === i && (page === 0 ? styles.dotActiveOnLight : styles.dotActive),
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function Intro({
  size,
  onStart,
  onSlidingChange,
  onSignIn,
}: {
  size: PageSize;
  onStart: () => void;
  onSlidingChange: (sliding: boolean) => void;
  onSignIn: () => void;
}) {
  return (
    <View style={[styles.page, size]}>
      <SafeAreaView edges={['top']} style={styles.introTopSafe}>
        <View style={styles.introTop}>
          <AppLogo size={40} />

          <Text style={styles.headline} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            <Text style={styles.headlineAccent}>Smart</Text> tools for
          </Text>

          <View style={styles.headlineRow}>
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
            label="Slide to get started"
            accessibilityLabel="Get started"
            onComplete={onStart}
            onSlidingChange={onSlidingChange}
          />
          <Pressable
            onPress={onSignIn}
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

function Choice({ size }: { size: PageSize }) {
  return (
    <View style={[styles.page, styles.choicePage, size]}>
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
                <Ionicons name={feature.icon} size={14} color={DS.colors.primary} />
                <Text style={styles.featureLabel} maxFontSizeMultiplier={DS.layout.maxFontScale}>
                  {feature.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Button
              title="Create an account"
              variant="success"
              size="lg"
              icon="arrow-forward"
              iconPosition="right"
              onPress={() => router.push(asHref('/(auth)/register'))}
              accessibilityLabel="Create a new FarmBridge account"
            />
            <Button
              title="Sign in"
              variant="success"
              size="lg"
              icon="log-in-outline"
              onPress={() => router.push(asHref('/(auth)/login'))}
              accessibilityLabel="Sign in to an existing account"
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.surface },
  pager: { flex: 1 },
  page: {},
  flex: { flex: 1 },
  pressed: { opacity: 0.75 },

  dots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dotsOnLight: { bottom: 14 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotOnLight: { backgroundColor: 'rgba(15, 23, 42, 0.2)' },
  dotActive: { width: 18, backgroundColor: DS.colors.textInverse },
  dotActiveOnLight: { width: 18, backgroundColor: DS.colors.primary },

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

  choicePage: { backgroundColor: DS.colors.text },
  choiceScrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15, 23, 42, 0.55)' },
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
    marginBottom: DS.spacing.lg,
    ...DS.shadow.elevated,
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
    fontSize: 12,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primaryDark,
  },

  actions: { gap: DS.spacing.sm, marginTop: DS.spacing.sm },
});
