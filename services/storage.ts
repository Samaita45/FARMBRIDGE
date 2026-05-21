const PREFIX = 'zimfarm:';

async function getAS() {
  try {
    const mod = await import('@react-native-async-storage/async-storage');
    return (mod as unknown as { default: typeof import('@react-native-async-storage/async-storage').default }).default;
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  const AS = await getAS();
  await AS?.setItem(`${PREFIX}${key}`, value);
}

export async function getItem(key: string): Promise<string | null> {
  const AS = await getAS();
  return AS?.getItem(`${PREFIX}${key}`) ?? null;
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  await setItem(key, JSON.stringify(value));
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function removeItem(key: string): Promise<void> {
  const AS = await getAS();
  await AS?.removeItem(`${PREFIX}${key}`);
}
