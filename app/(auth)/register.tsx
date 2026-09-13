import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, IconButton, Input } from '@/components/design-system';
import { ProvincePicker } from '@/components/forms/province-picker';
import { RoleSelector } from '@/components/forms/role-selector';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';
import { AuthImages } from '@/constants/images';
import { asHref } from '@/lib/href';
import { registerSchema, type RegisterFormData } from '@/lib/validation';
import { isApiError } from '@/services/api/errors';
import { registerUser } from '@/services/authService';
import { useAuthStore, type AuthState } from '@/stores/authStore';
import type { UserRole } from '@/types';

export default function RegisterScreen() {
  const { showToast } = useToast();
  const login = useAuthStore((s: AuthState) => s.login);
  const setLoading = useAuthStore((s: AuthState) => s.setLoading);
  const isLoading = useAuthStore((s: AuthState) => s.isLoading);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    setError,
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

  /*
    `useWatch` rather than `watch`. `watch` hands back a function, which the
    React Compiler cannot memoize without risking stale UI — so it gives up on
    optimising the whole component. `useWatch` subscribes to the one field and
    returns its value, which also re-renders less: `watch` re-runs the component
    on every change to any field.
  */
  const role = useWatch({ control, name: 'role' }) as UserRole;

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setFormError(null);
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
      showToast('Your account is ready', 'success');
      router.replace(asHref('/(tabs)'));
    } catch (e) {
      if (isApiError(e)) {
        // Server-side field errors land on the field that caused them rather
        // than in a toast the user has to map back to an input themselves.
        for (const [field, message] of Object.entries(e.fieldErrors)) {
          if (field === 'email' || field === 'phone' || field === 'password' || field === 'name') {
            setError(field as keyof RegisterFormData, { message });
          }
        }
        setFormError(e.userMessage);
      } else {
        setFormError(e instanceof Error ? e.message : 'Could not create your account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ImageBackground source={AuthImages.registerProduce} style={styles.bg} resizeMode="cover">
        <View style={styles.scrim} />

        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.backRow}>
              <IconButton
                icon="arrow-back"
                accessibilityLabel="Go back"
                variant="onImage"
                size="sm"
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)'))}
              />
            </View>

            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {/* The same crest as the sign-in screen. See login.tsx. */}
              <View style={styles.sheetCurve} pointerEvents="none" />

              <View style={styles.sheet}>
                <View style={styles.header}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title} maxFontSizeMultiplier={DS.layout.maxFontScale}>
                      Register
                    </Text>
                    <Ionicons
                      name="leaf"
                      size={24}
                      color={DS.colors.forest[400]}
                      style={styles.titleLeaf}
                      accessibilityElementsHidden
                      importantForAccessibility="no"
                    />
                  </View>
                  <Text style={styles.subtitle} maxFontSizeMultiplier={DS.layout.maxFontScale}>
                    Create your new account
                  </Text>
                </View>

                <View style={styles.card}>
                {formError ? (
                  <View style={styles.alert} accessibilityRole="alert">
                    <Text style={styles.alertText}>{formError}</Text>
                  </View>
                ) : null}

                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      variant="filled"
                      accessibilityLabel="Full name"
                      icon="person-outline"
                      placeholder="Tendai Moyo"
                      autoComplete="name"
                      textContentType="name"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.name?.message}
                      required
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      variant="filled"
                      accessibilityLabel="Email address"
                      icon="mail-outline"
                      placeholder="you@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      textContentType="emailAddress"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.email?.message}
                      required
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      variant="filled"
                      accessibilityLabel="Mobile number"
                      icon="call-outline"
                      placeholder="077 123 4567"
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      textContentType="telephoneNumber"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.phone?.message}
                      hint="Zimbabwe mobile number"
                      required
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <PasswordField
                      label="Password"
                      placeholder="At least 12 characters"
                      hint="Longer is stronger. A short phrase beats a complicated word."
                      autoComplete="new-password"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.password?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <PasswordField
                      label="Confirm password"
                      placeholder="Type it again"
                      autoComplete="new-password"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.confirmPassword?.message}
                    />
                  )}
                />

                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Your farm</Text>

                <RoleSelector
                  value={role}
                  onChange={(r: UserRole) => setValue('role', r, { shouldValidate: true })}
                  error={errors.role?.message}
                />

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

                </View>
              </View>
            </ScrollView>

            {/*
              Pinned, not the last child of a long scrolling form. On a
              registration form this matters more than on sign-in: the fields
              run past a screen height even before the keyboard opens, so the
              submit button was never visible at the moment anyone finished
              typing.
            */}
            <View style={styles.footer}>
              <Button
                title="Create account"
                size="lg"
                icon="arrow-forward"
                iconPosition="right"
                loading={isLoading}
                onPress={handleSubmit(onSubmit)}
              />

              {/* router.push, not <Link asChild> — see the note in login.tsx. */}
              <Pressable
                onPress={() => router.push(asHref('/(auth)/login'))}
                accessibilityRole="button"
                accessibilityLabel="Sign in to an existing account"
                hitSlop={8}
                style={({ pressed }) => [styles.loginRow, pressed && styles.pressed]}>
                <Text style={styles.loginText}>
                  Already have an account? <Text style={styles.link}>Sign in</Text>
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

function PasswordField({
  label,
  placeholder,
  hint,
  autoComplete,
  value,
  onChangeText,
  onBlur,
  error,
}: {
  label: string;
  placeholder: string;
  hint?: string;
  autoComplete: 'new-password';
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  error?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <Input
      variant="filled"
      accessibilityLabel={label}
      icon="lock-closed-outline"
      placeholder={placeholder}
      hint={hint}
      secureTextEntry={!revealed}
      autoComplete={autoComplete}
      textContentType="newPassword"
      value={value}
      onChangeText={onChangeText}
      onBlur={onBlur}
      error={error}
      required
      rightIcon={revealed ? 'eye-off-outline' : 'eye-outline'}
      rightIconLabel={revealed ? 'Hide password' : 'Show password'}
      onRightIconPress={() => setRevealed((v) => !v)}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.text },
  flex: { flex: 1 },
  bg: { flex: 1 },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15, 23, 42, 0.35)' },
  safe: { flex: 1 },
  backRow: { paddingHorizontal: DS.spacing.md, paddingTop: DS.spacing.sm },
  scroll: { flexGrow: 1, paddingTop: 96 },

  // Matches login.tsx exactly — the two screens are one surface in two states.
  sheetCurve: {
    height: 64,
    marginHorizontal: -140,
    marginBottom: -1,
    borderTopLeftRadius: 400,
    borderTopRightRadius: 400,
    backgroundColor: DS.colors.surface,
  },
  sheet: {
    flexGrow: 1,
    backgroundColor: DS.colors.surface,
    paddingHorizontal: DS.spacing.lg,
    paddingBottom: DS.spacing.lg,
    gap: DS.spacing.md,
  },
  footer: {
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.sm + 4,
    paddingBottom: DS.spacing.sm + 4,
    backgroundColor: DS.colors.surface,
    borderTopWidth: DS.layout.hairline,
    borderTopColor: DS.colors.border,
  },

  header: { gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: DS.spacing.xs },
  title: {
    fontSize: DS.typography.display.fontSize,
    lineHeight: DS.typography.display.fontSize * 1.15,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.forest[700],
  },
  titleLeaf: { marginTop: 4, transform: [{ rotate: '-25deg' }] },
  subtitle: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  card: { gap: DS.spacing.sm + 2 },

  alert: {
    backgroundColor: DS.semantic.danger.bg,
    borderColor: DS.semantic.danger.border,
    borderWidth: 1,
    borderRadius: DS.radius.md,
    padding: DS.spacing.sm + 4,
  },
  alertText: {
    fontSize: DS.typography.bodySm.fontSize,
    lineHeight: 20,
    fontFamily: DS.fontFamily.regular,
    color: DS.semantic.danger.fg,
  },

  divider: { height: 1, backgroundColor: DS.colors.borderLight, marginTop: DS.spacing.xs },
  sectionTitle: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },

  pressed: { opacity: 0.7 },
  loginRow: { alignItems: 'center', paddingVertical: DS.spacing.sm },
  // White on the photograph before; the bar it lives on now is a surface, and
  // primaryLight measured 2.6:1 there.
  loginText: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  link: { fontFamily: DS.fontFamily.semibold, color: DS.colors.primary },
});
