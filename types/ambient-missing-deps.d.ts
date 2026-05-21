/**
 * Fallback typings when packages are missing from node_modules (incomplete install).
 * Real packages from `npm install` override these via normal module resolution.
 */

declare module 'zustand' {
  export interface UseBoundStore<T> {
    (): T;
    <U>(selector: (state: T) => U, equalityFn?: (a: U, b: U) => boolean): U;
    getState: () => T;
    setState: (partial: Partial<T> | ((state: T) => Partial<T> | void)) => void;
    subscribe: (listener: (state: T, prevState: T) => void) => () => void;
  }

  export function create<T>(
    initializer: (
      set: (partial: Partial<T> | ((state: T) => Partial<T> | void)) => void,
      get: () => T
    ) => T
  ): UseBoundStore<T>;
}

declare module 'zod' {
  export type infer<T = unknown> = any;
  export const z: any;
}

declare module 'react-hook-form' {
  export type FieldValues = Record<string, unknown>;
  export type Resolver<T extends FieldValues = FieldValues> = any;
  export type Control<T extends FieldValues = FieldValues> = unknown;
  export type FieldErrors<T extends FieldValues = FieldValues> = Partial<
    Record<keyof T & string, { message?: string }>
  >;

  export function useForm<T extends FieldValues = FieldValues>(options?: unknown): {
    control: Control<T>;
    handleSubmit: (
      onValid: (data: T) => void | Promise<void>,
      onInvalid?: (errors: FieldErrors<T>) => void
    ) => (e?: unknown) => Promise<void>;
    formState: { errors: FieldErrors<T> };
    watch: (...args: unknown[]) => unknown;
    setValue: (...args: unknown[]) => void;
    register: (...args: unknown[]) => unknown;
    reset: (values?: Partial<T> | Record<string, unknown>) => void;
  };

  export function Controller(props: {
    control: Control<FieldValues>;
    name: string;
    render: (args: {
      field: {
        onChange: (...args: unknown[]) => void;
        onBlur: () => void;
        value: any;
      };
    }) => any;
  }): any;
}

declare module '@hookform/resolvers/zod' {
  export function zodResolver(schema: unknown): any;
}

declare module 'expo-sqlite' {
  export interface SQLiteDatabase {
    execAsync(query: string): Promise<void>;
    getAllAsync<T = Record<string, unknown>>(query: string, ...params: unknown[]): Promise<T[]>;
    runAsync(query: string, ...params: unknown[]): Promise<unknown>;
    getFirstAsync<T = Record<string, unknown>>(query: string, ...params: unknown[]): Promise<T | null>;
  }
  export function openDatabaseAsync(name: string, directory?: unknown): Promise<SQLiteDatabase>;
}

declare module 'expo-notifications' {
  export const SchedulableTriggerInputTypes: { readonly DATE: string };
  export function setNotificationHandler(handler: unknown): void;
  export function getPermissionsAsync(): Promise<{ status: string }>;
  export function requestPermissionsAsync(): Promise<{ status: string }>;
  export function scheduleNotificationAsync(request: {
    content: Record<string, unknown>;
    trigger: Record<string, unknown>;
  }): Promise<string>;
  export function cancelScheduledNotificationAsync(id: string): Promise<void>;
}

declare module 'expo-sms' {
  export function isAvailableAsync(): Promise<boolean>;
  export function sendSMSAsync(
    addresses: string[],
    message: string
  ): Promise<{ result: 'sent' | 'cancelled' | 'unknown' }>;
}

declare module 'expo-location' {
  export enum Accuracy {
    Lowest = 1,
    Low = 2,
    Balanced = 3,
    High = 4,
    Highest = 5,
    BestForNavigation = 6,
  }
  export function requestForegroundPermissionsAsync(): Promise<{ status: string }>;
  export function getCurrentPositionAsync(options?: {
    accuracy?: Accuracy;
  }): Promise<{
    coords: {
      latitude: number;
      longitude: number;
      altitude: number | null;
      accuracy: number | null;
    };
  }>;
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
  };
  export default AsyncStorage;
}

declare module '@react-native-community/netinfo' {
  export interface NetInfoState {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    type?: string;
  }

  const NetInfo: {
    fetch(): Promise<NetInfoState>;
    addEventListener(listener: (state: NetInfoState) => void): () => void;
  };
  export default NetInfo;
}

declare module 'expo-image-picker' {
  export function requestCameraPermissionsAsync(): Promise<{ status: string }>;
  export function launchCameraAsync(options?: Record<string, unknown>): Promise<{
    canceled: boolean;
    assets?: { uri: string }[];
  }>;
  export function launchImageLibraryAsync(options?: Record<string, unknown>): Promise<{
    canceled: boolean;
    assets?: { uri: string }[];
  }>;
}

declare module '@expo-google-fonts/fraunces' {
  export const Fraunces_700Bold: number;
}

declare module '@expo-google-fonts/plus-jakarta-sans' {
  export const PlusJakartaSans_400Regular: number;
  export const PlusJakartaSans_600SemiBold: number;
  export const PlusJakartaSans_700Bold: number;
}
