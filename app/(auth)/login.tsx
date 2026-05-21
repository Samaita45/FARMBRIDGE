import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ForgotPasswordModal } from "@/components/auth/forgot-password-modal";
import { AppLogo } from "@/components/ui/app-logo";
import { useToast } from "@/components/ui/toast-provider";
import Colors from "@/constants/colors";
import { AuthImages } from "@/constants/images";
import { asHref } from "@/lib/href";
import { loginSchema, type LoginFormData } from "@/lib/validation";
import {
  getRememberedCredentials,
  loginUser,
  setRememberMe,
} from "@/services/authService";
import { useAuthStore, type AuthState } from "@/stores/authStore";

export default function LoginScreen() {
  const { showToast } = useToast();
  const login = useAuthStore((s: AuthState) => s.login);
  const setLoading = useAuthStore((s: AuthState) => s.setLoading);
  const isLoading = useAuthStore((s: AuthState) => s.isLoading);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const rememberMe = Boolean(watch("rememberMe"));

  useEffect(() => {
    void (async () => {
      const saved = await getRememberedCredentials();
      if (saved) {
        setValue("email", saved.email);
        setValue("password", saved.password);
        setValue("rememberMe", true);
      }
    })();
  }, [setValue]);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const user = await loginUser(data.email, data.password);
      await setRememberMe(data.email, data.password, !!data.rememberMe);
      login(user);
      showToast(`Welcome back, ${user.name.split(" ")[0]}!`, "success");
      router.replace(asHref("/(tabs)"));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const onBiometricLogin = async () => {
    const saved = await getRememberedCredentials();
    if (!saved) {
      showToast('Enable "Remember me" first to use quick login', "warning");
      return;
    }
    setValue("email", saved.email);
    setValue("password", saved.password);
    await onSubmit({
      email: saved.email,
      password: saved.password,
      rememberMe: true,
    });
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      <ImageBackground
        source={AuthImages.loginProduce}
        style={s.bg}
        resizeMode="cover"
      >
        <View style={s.overlay} />

        <SafeAreaView style={s.safe}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={s.kav}
          >
            <ScrollView
              contentContainerStyle={s.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* ── Header ── */}
              <View style={s.header}>
                <AppLogo size={72} style={s.logo} />
                <Text style={s.title}>Welcome Back!</Text>
                <Text style={s.subtitle}>
                  Sign in to your FarmBridge account
                </Text>
              </View>

              {/* ── Form card ── */}
              <View style={s.card}>
                {/* Email */}
                <Text style={s.label}>Email Address</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[s.inputRow, errors.email && s.inputError]}>
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color={Colors.gray[400]}
                        style={s.inputIcon}
                      />
                      <TextInput
                        style={s.input}
                        placeholder="you@example.com"
                        placeholderTextColor={Colors.placeholder}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    </View>
                  )}
                />
                {errors.email ? (
                  <Text style={s.errorText}>{errors.email.message}</Text>
                ) : null}

                {/* Password */}
                <Text style={[s.label, { marginTop: 14 }]}>Password</Text>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[s.inputRow, errors.password && s.inputError]}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={Colors.gray[400]}
                        style={s.inputIcon}
                      />
                      <TextInput
                        style={s.input}
                        placeholder="Enter your password"
                        placeholderTextColor={Colors.placeholder}
                        secureTextEntry={!showPw}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                      <Pressable
                        onPress={() => setShowPw(!showPw)}
                        style={s.eyeBtn}
                      >
                        <Ionicons
                          name={showPw ? "eye-outline" : "eye-off-outline"}
                          size={20}
                          color={Colors.gray[400]}
                        />
                      </Pressable>
                    </View>
                  )}
                />
                {errors.password ? (
                  <Text style={s.errorText}>{errors.password.message}</Text>
                ) : null}

                {/* Remember me + Forgot */}
                <View style={s.rememberRow}>
                  <View style={s.rememberLeft}>
                    <Switch
                      value={rememberMe}
                      onValueChange={(v) => setValue("rememberMe", v)}
                      trackColor={{
                        false: Colors.gray[300],
                        true: Colors.primaryLight,
                      }}
                      thumbColor={rememberMe ? Colors.primary : Colors.white}
                    />
                    <Text style={s.rememberText}>Remember me</Text>
                  </View>
                  <Pressable onPress={() => setForgotOpen(true)}>
                    <Text style={s.forgotText}>Forgot Password?</Text>
                  </Pressable>
                </View>

                {/* Login button */}
                <Pressable
                  onPress={handleSubmit(onSubmit)}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    s.btnPrimary,
                    (pressed || isLoading) && { opacity: 0.82 },
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.btnPrimaryText}>Login</Text>
                  )}
                </Pressable>

                {/* Quick login (biometric) */}
                <Pressable
                  onPress={onBiometricLogin}
                  style={({ pressed }) => [
                    s.btnOutline,
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Ionicons
                    name="finger-print"
                    size={20}
                    color={Colors.primary}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={s.btnOutlineText}>Quick Login</Text>
                </Pressable>
              </View>

              {/* Demo account hint */}
              <Pressable
                onPress={() => {
                  setValue("email", "demo@farmbridge.zw");
                  setValue("password", "demo1234");
                }}
                style={({ pressed }) => [
                  s.demoBtn,
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Ionicons
                  name="flask-outline"
                  size={15}
                  color={Colors.primaryLight}
                  style={{ marginRight: 6 }}
                />
                <Text style={s.demoText}>Use Demo Account</Text>
                <Text style={s.demoHint}> demo@farmbridge.zw · demo1234</Text>
              </Pressable>

              {/* Register link — proper button, NOT plain text */}
              <Link href="/(auth)/register" asChild>
                <Pressable
                  style={({ pressed }) => [
                    s.registerBtn,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={s.registerText}>
                    Don't have an account?{"  "}
                    <Text style={s.registerLink}>Register</Text>
                  </Text>
                </Pressable>
              </Link>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>

      <ForgotPasswordModal
        visible={forgotOpen}
        onClose={() => setForgotOpen(false)}
      />
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
  safe: { flex: 1 },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 24,
  },

  // Header
  header: { alignItems: "center", marginBottom: 28 },
  logo: { marginBottom: 14 },
  title: { fontSize: 28, fontWeight: "800", color: "#fff", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.92)" },

  // Card
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  // Labels
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 7,
  },

  // Input
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputError: { borderColor: Colors.error },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  eyeBtn: { padding: 4 },
  errorText: { fontSize: 12, color: Colors.error, marginTop: 5 },

  // Remember row
  rememberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  rememberLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  rememberText: { fontSize: 13, color: Colors.textSecondary },
  forgotText: { fontSize: 13, fontWeight: "600", color: Colors.primary },

  // Primary button
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Outline button
  btnOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  btnOutlineText: { color: Colors.primary, fontSize: 15, fontWeight: "600" },

  // Demo account button
  demoBtn: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    flexWrap: "wrap",
  },
  demoText: { fontSize: 13, fontWeight: "700", color: Colors.primaryLight },
  demoHint: { fontSize: 11, color: "rgba(255,255,255,0.55)" },

  // Register link — styled as a proper touch target
  registerBtn: {
    marginTop: 22,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  registerText: { fontSize: 14, color: "#fff" },
  registerLink: { fontWeight: "700", color: Colors.accentLight },
});
