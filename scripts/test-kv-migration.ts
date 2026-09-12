/**
 * Verification for the namespace key migration.
 *
 * Run with the server's ts-node; the module under test has no React Native
 * imports precisely so this is possible.
 */
import {
  migrateKeyPrefix,
  type KeyValueStore,
} from '../services/migrations/kv-migration';

class FakeStore implements KeyValueStore {
  data = new Map<string, string>();
  /** Keys whose write should silently fail, to simulate a partial failure. */
  dropWrites = new Set<string>();

  constructor(seed: Record<string, string> = {}) {
    for (const [k, v] of Object.entries(seed)) this.data.set(k, v);
  }

  async getAllKeys() {
    return [...this.data.keys()];
  }
  async multiGet(keys: string[]) {
    return keys.map((k) => [k, this.data.has(k) ? this.data.get(k)! : null] as const);
  }
  async multiSet(entries: [string, string][]) {
    for (const [k, v] of entries) {
      if (this.dropWrites.has(k)) continue;
      this.data.set(k, v);
    }
  }
  async multiRemove(keys: string[]) {
    for (const k of keys) this.data.delete(k);
  }
}

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`);
  }
}

async function main() {
  console.log('\nnamespace key migration\n');

  // 1. The ordinary case.
  {
    const store = new FakeStore({
      'zimfarm:users': '[{"id":"u1"}]',
      'zimfarm:farm_profile:u1': '{"hectares":3}',
      'zimfarm:cache:weather': '{"temp":24}',
      'unrelated:key': 'left alone',
    });
    const result = await migrateKeyPrefix(store, 'zimfarm:', 'farmbridge:');

    check('moves every namespaced key', result.moved === 3, `moved ${result.moved}`);
    check('reports complete', result.complete);
    check('values survive intact', store.data.get('farmbridge:users') === '[{"id":"u1"}]');
    check('nested key names are preserved',
      store.data.get('farmbridge:farm_profile:u1') === '{"hectares":3}');
    check('old keys are gone', ![...store.data.keys()].some((k) => k.startsWith('zimfarm:')));
    check('other namespaces are untouched', store.data.get('unrelated:key') === 'left alone');
  }

  // 2. Idempotence — the migration may run again after a crash.
  {
    const store = new FakeStore({ 'zimfarm:a': '1' });
    await migrateKeyPrefix(store, 'zimfarm:', 'farmbridge:');
    const second = await migrateKeyPrefix(store, 'zimfarm:', 'farmbridge:');

    check('second run is a no-op', second.moved === 0 && second.complete);
    check('data still present after two runs', store.data.get('farmbridge:a') === '1');
  }

  // 3. A fresh install has nothing to migrate.
  {
    const store = new FakeStore({ 'farmbridge:a': '1' });
    const result = await migrateKeyPrefix(store, 'zimfarm:', 'farmbridge:');
    check('fresh install reports complete', result.complete && result.moved === 0);
  }

  // 4. THE IMPORTANT ONE: a failed write must not delete the original.
  {
    const store = new FakeStore({ 'zimfarm:critical': 'crop plans', 'zimfarm:ok': 'fine' });
    store.dropWrites.add('farmbridge:critical');

    const result = await migrateKeyPrefix(store, 'zimfarm:', 'farmbridge:');

    check('reports the failure', result.failed === 1, `failed ${result.failed}`);
    check('does NOT report complete', !result.complete);
    check('unwritable data is still under the old key',
      store.data.get('zimfarm:critical') === 'crop plans');
    check('the key that did write is migrated', store.data.get('farmbridge:ok') === 'fine');
  }

  // 5. A retry after a partial failure finishes the job.
  {
    const store = new FakeStore({ 'zimfarm:critical': 'crop plans' });
    store.dropWrites.add('farmbridge:critical');
    await migrateKeyPrefix(store, 'zimfarm:', 'farmbridge:');

    store.dropWrites.clear();
    const retry = await migrateKeyPrefix(store, 'zimfarm:', 'farmbridge:');

    check('retry completes', retry.complete && retry.moved === 1);
    check('data arrives intact', store.data.get('farmbridge:critical') === 'crop plans');
  }

  // 6. An empty-string value is data, not absence.
  {
    const store = new FakeStore({ 'zimfarm:empty': '' });
    await migrateKeyPrefix(store, 'zimfarm:', 'farmbridge:');
    check('empty string values are preserved', store.data.get('farmbridge:empty') === '');
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
