import { fastGet, fastSet } from './fastStorage';

const QUEUE_KEY = 'zimfarm_sync_queue';

export type SyncOperationKind =
  | 'task_complete'
  | 'income_add'
  | 'expense_add'
  | 'community_post'
  | 'generic';

export interface SyncOperation {
  id: string;
  kind: SyncOperationKind;
  payload: unknown;
  createdAt: number;
}

function readQueue(): SyncOperation[] {
  try {
    const raw = fastGet(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SyncOperation[];
  } catch {
    return [];
  }
}

function writeQueue(ops: SyncOperation[]): void {
  fastSet(QUEUE_KEY, JSON.stringify(ops));
}

export function enqueueSync(op: Omit<SyncOperation, 'id' | 'createdAt'>): void {
  const q = readQueue();
  q.push({
    ...op,
    id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  });
  writeQueue(q);
}

/** Last-write-wins demo: clear queue after "sync". Returns number of cleared items. */
export async function flushSyncQueue(): Promise<number> {
  const q = readQueue();
  if (q.length === 0) return 0;
  writeQueue([]);
  return q.length;
}

async function getNetInfo() {
  try {
    const mod = await import('@react-native-community/netinfo');
    return (mod as unknown as { default: typeof import('@react-native-community/netinfo').default }).default;
  } catch {
    return null;
  }
}

export async function isOnline(): Promise<boolean> {
  const NetInfo = await getNetInfo();
  if (!NetInfo) return true; // assume online if package missing
  const state = await NetInfo.fetch();
  if (state.isConnected !== true) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

export function subscribeNetwork(onChange: (connected: boolean) => void): () => void {
  let unsub: (() => void) | null = null;
  void getNetInfo().then((NetInfo) => {
    if (!NetInfo) {
      onChange(true);
      return;
    }
    unsub = NetInfo.addEventListener(
      (state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => {
        const connected = state.isConnected === true && state.isInternetReachable !== false;
        onChange(connected);
      }
    );
  });
  return () => unsub?.();
}
