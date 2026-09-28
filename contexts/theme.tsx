import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Appearance } from 'react-native';
import { colorScheme as nativewindScheme } from 'nativewind';

import { tokensFor, type Scheme, type Tokens } from '@/constants/design-system';
import { fastGetAsync, fastSetAsync } from '@/services/fastStorage';

/** What the person chose. `system` follows the OS and is the default. */
export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'farmbridge.theme';

interface ThemeValue {
  /** The stored choice. */
  preference: ThemePreference;
  /** What that choice resolves to right now. */
  scheme: Scheme;
  tokens: Tokens;
  setPreference: (next: ThemePreference) => void;
  /** False until the stored choice has been read, so nothing flashes. */
  isHydrated: boolean;
}

const ThemeContext = createContext<ThemeValue>({
  preference: 'system',
  scheme: 'light',
  tokens: tokensFor('light'),
  setPreference: () => {},
  isHydrated: false,
});

function isPreference(v: unknown): v is ThemePreference {
  return v === 'light' || v === 'dark' || v === 'system';
}

/**
 * Holds the colour scheme for the whole app.
 *
 * WHY THIS IS NOT IN THE SETTINGS STORE. Settings hydrate per user, after
 * login. The theme has to be right on the sign-in screen, before anyone is
 * logged in, so it is stored on the device rather than against an account.
 *
 * WHY IT SUBSCRIBES TO `Appearance` DIRECTLY rather than calling
 * `useColorScheme`: the OS scheme only matters while the preference is
 * `system`, and a hook would re-render this provider — and therefore the whole
 * tree — on every OS change even when the person has pinned light or dark.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemScheme, setSystemScheme] = useState<Scheme>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );
  const [isHydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fastGetAsync(STORAGE_KEY).then((stored) => {
      if (cancelled) return;
      if (isPreference(stored)) setPreferenceState(stored);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (preference !== 'system') return;
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    if (next === 'system') {
      setSystemScheme(Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
    }
    void fastSetAsync(STORAGE_KEY, next);
  }, []);

  const scheme: Scheme = preference === 'system' ? systemScheme : preference;

  /*
    NativeWind keeps its own idea of the scheme, and `dark:` utilities read
    that one rather than this context. Pushing it here is what keeps the
    className half of the app in step with the StyleSheet half — without it a
    screen styled with utilities stays light under a dark palette.
  */
  useEffect(() => {
    nativewindScheme.set(scheme);
  }, [scheme]);

  const value = useMemo<ThemeValue>(
    () => ({ preference, scheme, tokens: tokensFor(scheme), setPreference, isHydrated }),
    [preference, scheme, setPreference, isHydrated]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}

/**
 * The active token set.
 *
 * Deliberately named so it can shadow the module-level `DS` import inside a
 * component — `const DS = useDS();` — which makes every `DS.colors.x` already
 * written in that component follow the scheme without being rewritten.
 */
export function useDS(): Tokens {
  return useContext(ThemeContext).tokens;
}
