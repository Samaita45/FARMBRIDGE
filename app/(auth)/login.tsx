import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ForgotPasswordModal } from '@/components/auth/forgot-password-modal';
import { Button, IconButton, Input } from '@/components/design-system';
import { AppLogo } from '@/components/ui/app-logo';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';
import { AuthImages } from '@/constants/images';
import { asHref } from '@/lib/href';
import { loginSchema, type LoginFormData } from '@/lib/validation';
import { isApiError } from '@/services/api/errors';
import {
  getDemoCredentials,
  getRememberedEmail,
  loginUser,
  setRememberMe,
} from '@/services/authService';
import { useAuthStore, type AuthState } from '@/stores/authStore';

export default function LoginScreen() {
  const { showToast } = useToast();
  const login = useAuthStore((s: AuthState) => s.login);
  const setLoading = useAuthStore((s: AuthState) => s.setLoading);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  /*
    THE BUTTON'S OWN BUSY FLAG, NOT THE STORE'S.

    It was reading `isLoading` from the auth store, which is app-wide state also
    set during session hydration and by the route guards. Anything else that
    left it true turned this button into a disabled spinner at 45% opacity, and
    the person looking at the screen just sees a sign-in button that has gone
    faint and stopped responding. A submit spinner belongs to the submit.
  */
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  /*
    `useWatch` rather than `watch`. `watch` hands back a function, which the
    React Compiler cannot memoize without risking stale UI — so it gives up on
    optimising the whole component. `useWatch` subscribes to the one field and
    returns its value, which also re-renders less: `watch` re-runs the component
    on every change to any field.
  */
  const rememberMe = Boolean(useWatch({ control, name: 'rememberMe' }));
  const demoCredentials = getDemoCredentials();

  useEffect(() => {
    void (async () => {
      const email = await getRememberedEmail();
      if (email) {
        setValue('email', email);
        setValue('rememberMe', true);
      }
    })();
  }, [setValue]);

  const onSubmit = async (data: LoginFormData) => {
    setSubmitting(true);
    setLoading(true);
    setFormError(null);
    try {
      const user = await loginUser(data.email, data.password);
      await setRememberMe(data.email, !!data.rememberMe);
      login(user);
      showToast(`Welcome back, ${user.name.split(' ')[0]}`, 'success');
      router.replace(asHref('/(tabs)'));
    } catch (e) {
      // The API layer classifies failures, so a dropped connection and a wrong
      // password no longer produce the same unhelpful message. Field-level
      // errors from the server are attached to the field that caused them.
      if (isApiError(e)) {
        for (const [field, message] of Object.entries(e.fieldErrors)) {
          if (field === 'email' || field === 'password') {
            setError(field, { message });
          }
        }
        setFormError(e.userMessage);
      } else {
        setFormError(e instanceof Error ? e.message : 'Could not sign you in.');
      }
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ImageBackground source={AuthImages.loginProduce} style={styles.bg} resizeMode="cover">
        <View style={styles.scrim} />

        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/*
              The auth stack hides its header, so screens pushed onto it carry
              their own way back. Without this, a user who taps "Sign in" from
              the welcome screen is stuck unless they know the OS gesture.
            */}
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
              <View style={styles.header}>
                <AppLogo size={56} />
                <Text style={styles.title} maxFontSizeMultiplier={DS.layout.maxFontScale}>
                  Welcome back
                </Text>
                <Text style={styles.subtitle} maxFontSizeMultiplier={DS.layout.maxFontScale}>
                  Sign in to your FarmBridge account
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
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Email address"
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
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <PasswordField
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.password?.message}
                    />
                  )}
                />

                <View style={styles.rememberRow}>
                  <View style={styles.rememberLeft}>
                    <Switch
                      value={rememberMe}
                      onValueChange={(v) => setValue('rememberMe', v)}
                      accessibilityLabel="Remember my email address"
                      trackColor={{ false: DS.colors.border, true: DS.colors.primaryLight }}
                      thumbColor={rememberMe ? DS.colors.primary : DS.colors.surface}
                    />
                    {/* Only the email is remembered. The password never is. */}
                    <Text style={styles.rememberText}>Remember my email</Text>
                  </View>
                  <Pressable
                    onPress={() => setForgotOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel="I forgot my password"
                    hitSlop={8}>
                    <Text style={styles.link}>Forgot password?</Text>
                  </Pressable>
                </View>

                {demoCredentials ? (
                  <Pressable
                    onPress={() => {
                      setValue('email', demoCredentials.email);
                      setValue('password', demoCredentials.password);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Fill in the demo account credentials"
                    style={styles.demo}>
                    <Text style={styles.demoText}>
                      Development build · use {demoCredentials.email}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

            </ScrollView>

            {/*
              THE ACTION LIVES OUTSIDE THE SCROLL VIEW ON PURPOSE.

              It used to be the last child of a card inside a ScrollView whose
              content was centred (`justifyContent: 'center'`). Once the
              keyboard opened, the viewport shrank, the centred content was
              clipped at both ends, and the button was below the fold with no
              reliable way to scroll to it — which is why it read as missing
              after you filled the form in. It is now pinned above the keyboard
              and is always on screen.
            */}
            <View style={styles.footer}>
              <Button
                title="Sign in"
                size="lg"
                icon="log-in-outline"
                loading={submitting}
                onPress={handleSubmit(onSubmit)}
                accessibilityLabel="Sign in to your FarmBridge account"
              />

              {/*
                Navigated with router.push rather than <Link asChild>. The two
                hand-rolled pills on the onboarding screen used asChild and came
                out unstyled on device; there is no reason for the way out of a
                sign-in screen to depend on that, and a plain Pressable keeps
                its own styles no matter what the router does with cloned props.
              */}
              <Pressable
                onPress={() => router.push(asHref('/(auth)/register'))}
                accessibilityRole="button"
                accessibilityLabel="Create a new account"
                hitSlop={8}
                style={({ pressed }) => [styles.registerRow, pressed && styles.pressed]}>
                <Text style={styles.registerText}>
                  New to FarmBridge? <Text style={styles.link}>Create an account</Text>
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>

      <ForgotPasswordModal visible={forgotOpen} onClose={() => setForgotOpen(false)} />
    </View>
  );
}

function PasswordField({
  value,
  onChangeText,
  onBlur,
  error,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  error?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <Input
      label="Password"
      icon="lock-closed-outline"
      placeholder="Enter your password"
      secureTextEntry={!revealed}
      autoComplete="password"
      textContentType="password"
      value={value}
      onChangeText={onChangeText}
      onBlur={onBlur}
      error={error}
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
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15, 23, 42, 0.55)' },
  safe: { flex: 1 },
  backRow: { paddingHorizontal: DS.spacing.md, paddingTop: DS.spacing.sm },
  scroll: {
    flexGrow: 1,
    // Not `justifyContent: 'center'`. Centring inside a container the keyboard
    // shrinks pushes the ends of the content out of reach.
    padding: DS.spacing.md,
    paddingBottom: DS.spacing.md,
    gap: DS.spacing.lg,
  },
  footer: {
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.md,
    paddingBottom: DS.spacing.md,
    backgroundColor: DS.colors.surface,
    borderTopWidth: DS.layout.hairline,
    borderTopColor: DS.colors.border,
  },
  pressed: { opacity: 0.7 },

  header: { alignItems: 'center', gap: 4 },
  title: {
    fontSize: DS.typography.display.fontSize,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.textInverse,
    marginTop: DS.spacing.sm,
  },
  subtitle: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.82)',
  },

  card: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.xl,
    padding: DS.spacing.lg,
    gap: DS.spacing.md,
  },

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

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DS.spacing.sm,
  },
  rememberLeft: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm },
  rememberText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  link: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primary,
  },

  demo: { alignItems: 'center', paddingVertical: 6 },
  demoText: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },

  registerRow: { alignItems: 'center', paddingVertical: DS.spacing.sm },
  // White when it sat on the photograph; the bar it lives on now is a surface.
  registerText: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
});
