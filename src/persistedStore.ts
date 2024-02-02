import localforage from 'localforage';
import { RecordMap } from 'relay-runtime/lib/store/RelayStoreTypes';

export const persistedStore = localforage.createInstance({
  storeName: 'relay-persisted-store',
});

export async function readPersistedStore(): Promise<RecordMap> {
  const keys = await persistedStore.keys();
  const records: Record<string, object> = {};
  for (const key of keys) {
    const record = (await persistedStore.getItem(key)) as object;
    records[key] = record;
  }

  // Not exactly the same but close enough for our purposes
  return records as RecordMap;
}
