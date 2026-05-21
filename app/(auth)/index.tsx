import { Link } from "expo-router";
import {
    ImageBackground,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppLogo } from "@/components/ui/app-logo";
import Colors from "@/constants/colors";
import { AuthImages } from "@/constants/images";

const FEATURES = [
  { icon: "🌾", label: "Crop Management" },
  { icon: "🛒", label: "Marketplace" },
  { icon: "🚛", label: "Transport" },
  { icon: "💰", label: "Financials" },
];

export default function OnboardingScreen() {
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      <ImageBackground
        source={AuthImages.onboardingFarm}
        style={s.bg}
        resizeMode="cover"
      >
        {/* Gradient-like dark overlay */}
        <View style={s.overlay} />

        <SafeAreaView style={s.safe}>
          {/* ── Brand header ── */}
          <Animated.View
            entering={FadeInUp.delay(100).duration(700)}
            style={s.brandRow}
          >
            <AppLogo size={56} />
            <View>
              <Text style={s.brandName}>FarmBridge</Text>
              <Text style={s.brandSub}>Zimbabwe's Farming Platform</Text>
            </View>
          </Animated.View>

          {/* ── Feature pills ── */}
          <Animated.View
            entering={FadeInUp.delay(250).duration(600)}
            style={s.featureRow}
          >
            {FEATURES.map((f) => (
              <View key={f.label} style={s.featurePill}>
                <Text style={s.featureIcon}>{f.icon}</Text>
                <Text style={s.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* ── CTA card ── */}
          <Animated.View
            entering={FadeInDown.delay(350).duration(700)}
            style={s.card}
          >
            <Text style={s.headline}>Empower Your{"\n"}Farming Journey!</Text>
            <Text style={s.sub}>
              Buy and sell crops, book transport, track finances, and connect
              with fellow farmers — all in one trusted platform.
            </Text>

            {/* Get Started button */}
            <Link href="/(auth)/register" asChild>
              <Pressable
                style={({ pressed }) => [s.btnPrimary, pressed && s.pressed]}
              >
                <Text style={s.btnPrimaryText}>Get Started →</Text>
              </Pressable>
            </Link>

            {/* Login link — styled as an outline button, NOT plain text */}
            <Link href="/(auth)/login" asChild>
              <Pressable
                style={({ pressed }) => [
                  s.btnOutline,
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Text style={s.btnOutlineText}>
                  Already have an account? Login
                </Text>
              </Pressable>
            </Link>
          </Animated.View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,18,38,0.38)",
  },
  safe: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: "space-between",
    paddingBottom: 8,
  },

  // Brand
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 20,
  },
  brandName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.4,
  },
  brandSub: { fontSize: 12, color: "rgba(255,255,255,0.70)", marginTop: 2 },

  // Feature pills
  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  featureIcon: { fontSize: 16 },
  featureLabel: { fontSize: 12, fontWeight: "600", color: "#fff" },

  // CTA card
  card: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    marginBottom: 12,
  },
  headline: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: 36,
    marginBottom: 12,
  },
  sub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.80)",
    lineHeight: 22,
    marginBottom: 24,
  },

  // Primary button
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  btnPrimaryText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  pressed: { opacity: 0.85 },

  // Outline button
  btnOutline: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.50)",
  },
  btnOutlineText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
