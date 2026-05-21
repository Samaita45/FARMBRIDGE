import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProvincePicker } from '@/components/forms/province-picker';
import { RoleSelector } from '@/components/forms/role-selector';
import { useToast } from '@/components/ui/toast-provider';
import { AuthImages } from '@/constants/images';
import Colors from '@/constants/colors';
import { registerSchema, type RegisterFormData } from '@/lib/validation';
import { asHref } from '@/lib/href';
import { registerUser } from '@/services/authService';
import { useAuthStore, type AuthState } from '@/stores/authStore';
import type { UserRole } from '@/types';

export default function RegisterScreen() {
  const { showToast } = useToast();
  const login = useAuthStore((s: AuthState) => s.login);
  const setLoading = useAuthStore((s: AuthState) => s.setLoading);
  const isLoading = useAuthStore((s: AuthState) => s.isLoading);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'farmer',
      province: '',
    },
  });

  const role = watch('role') as UserRole;

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      const user = await registerUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role,
        province: data.province,
      });
      login(user);
      showToast('Welcome to FarmBridge!', 'success');
      router.replace(asHref('/(tabs)'));
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      <ImageBackground source={AuthImages.registerProduce} style={s.bg} resizeMode="cover">
        <View style={s.overlay} />

        <SafeAreaView style={s.safe}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={s.kav}>
            <ScrollView
              contentContainerStyle={s.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>

              {/* ── Header ── */}
              <View style={s.header}>
                <View style={s.logoCircle}>
                  <Text style={s.logoEmoji}>🌿</Text>
                </View>
                <Text style={s.title}>Create Account</Text>
                <Text style={s.subtitle}>Join Zimbabwe's farming community</Text>
              </View>

              {/* ── Form card ── */}
              <View style={s.card}>
                <Text style={s.sectionTitle}>Personal Details</Text>

                {/* Full name */}
                <Text style={s.label}>Full Name</Text>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[s.inputRow, errors.name && s.inputError]}>
                      <Ionicons name="person-outline" size={20} color={Colors.gray[400]} style={s.icon} />
                      <TextInput
                        style={s.input}
                        placeholder="Your full name"
                        placeholderTextColor={Colors.placeholder}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    </View>
                  )}
                />
                {errors.name ? <Text style={s.errorText}>{errors.name.message}</Text> : null}

                {/* Email */}
                <Text style={[s.label, s.labelGap]}>Email Address</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[s.inputRow, errors.email && s.inputError]}>
                      <Ionicons name="mail-outline" size={20} color={Colors.gray[400]} style={s.icon} />
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
                {errors.email ? <Text style={s.errorText}>{errors.email.message}</Text> : null}

                {/* Phone */}
                <Text style={[s.label, s.labelGap]}>Phone Number</Text>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[s.inputRow, errors.phone && s.inputError]}>
                      <View style={s.prefixPill}>
                        <Text style={s.prefixFlag}>🇿🇼</Text>
                        <Text style={s.prefixCode}>+263</Text>
                      </View>
                      <TextInput
                        style={s.input}
                        placeholder="77 123 4567"
                        placeholderTextColor={Colors.placeholder}
                        keyboardType="phone-pad"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    </View>
                  )}
                />
                {errors.phone ? <Text style={s.errorText}>{errors.phone.message}</Text> : null}

                {/* Password */}
                <Text style={[s.label, s.labelGap]}>Password</Text>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[s.inputRow, errors.password && s.inputError]}>
                      <Ionicons name="lock-closed-outline" size={20} color={Colors.gray[400]} style={s.icon} />
                      <TextInput
                        style={s.input}
                        placeholder="Create a strong password"
                        placeholderTextColor={Colors.placeholder}
                        secureTextEntry={!showPw}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                      <Pressable onPress={() => setShowPw(!showPw)} style={s.eyeBtn}>
                        <Ionicons name={showPw ? 'eye-outline' : 'eye-off-outline'} size={20} color={Colors.gray[400]} />
                      </Pressable>
                    </View>
                  )}
                />
                {errors.password ? <Text style={s.errorText}>{errors.password.message}</Text> : null}

                {/* Confirm password */}
                <Text style={[s.label, s.labelGap]}>Confirm Password</Text>
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[s.inputRow, errors.confirmPassword && s.inputError]}>
                      <Ionicons name="lock-closed-outline" size={20} color={Colors.gray[400]} style={s.icon} />
                      <TextInput
                        style={s.input}
                        placeholder="Repeat your password"
                        placeholderTextColor={Colors.placeholder}
                        secureTextEntry={!showConfirmPw}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                      <Pressable onPress={() => setShowConfirmPw(!showConfirmPw)} style={s.eyeBtn}>
                        <Ionicons name={showConfirmPw ? 'eye-outline' : 'eye-off-outline'} size={20} color={Colors.gray[400]} />
                      </Pressable>
                    </View>
                  )}
                />
                {errors.confirmPassword ? <Text style={s.errorText}>{errors.confirmPassword.message}</Text> : null}

                {/* Divider */}
                <View style={s.divider} />
                <Text style={s.sectionTitle}>Farm Profile</Text>

                {/* Role selector */}
                <RoleSelector
                  value={role}
                  onChange={(r: UserRole) => setValue('role', r, { shouldValidate: true })}
                  error={errors.role?.message}
                />

                {/* Province picker */}
                <Controller
                  control={control}
                  name="province"
                  render={({ field: { onChange, value } }) => (
                    <ProvincePicker
                      value={value}
                      onChange={onChange}
                      error={errors.province?.message}
                    />
                  )}
                />

                {/* Register button */}
                <Pressable
                  onPress={handleSubmit(onSubmit)}
                  disabled={isLoading}
                  style={({ pressed }) => [s.btnPrimary, (pressed || isLoading) && { opacity: 0.82 }]}>
                  {isLoading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.btnPrimaryText}>Create Account</Text>}
                </Pressable>
              </View>

              {/* Login link — proper styled button */}
              <Link href={asHref('/(auth)/login')} asChild>
                <Pressable style={({ pressed }) => [s.loginBtn, pressed && { opacity: 0.8 }]}>
                  <Text style={s.loginText}>
                    Already have an account?{'  '}
                    <Text style={s.loginLink}>Sign In</Text>
                  </Text>
                </Pressable>
              </Link>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,18,38,0.52)' },
  safe: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingVertical: 24 },

  // Header
  header: { alignItems: 'center', marginBottom: 22 },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  logoEmoji: { fontSize: 26 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },

  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },

  // Labels
  label: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 7 },
  labelGap: { marginTop: 14 },

  // Inputs
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  inputError: { borderColor: Colors.error },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  eyeBtn: { padding: 4 },
  errorText: { fontSize: 11, color: Colors.error, marginTop: 4 },

  // Phone prefix
  prefixPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMid,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 10,
    gap: 4,
  },
  prefixFlag: { fontSize: 14 },
  prefixCode: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  // Divider
  divider: { height: 1, backgroundColor: Colors.gray[200], marginVertical: 20 },

  // Primary button
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  // Login link — proper button
  loginBtn: {
    marginTop: 18,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: 8,
  },
  loginText: { fontSize: 14, color: '#fff' },
  loginLink: { fontWeight: '700', color: Colors.accentLight },
});
