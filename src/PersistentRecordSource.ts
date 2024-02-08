import { RecordSource } from 'relay-runtime';
import { persistedStore, readPersistedStore } from './persistedStore';
import { loadQuery as $loadQuery } from 'react-relay';

export class Deferred<T = unknown> {
  promise: Promise<T>;
  reject: (args: T) => void = () => null;
  resolve: (args: T) => void = () => null;
  fullfilled: boolean = false;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = (...args) => {
        resolve(...args);
        this.fullfilled = true;
      };
    });
  }
}

const hydratePromise = new Deferred<void>();

export class PersistentRecordSource extends RecordSource {
  set(
    dataID: Parameters<RecordSource['set']>[0],
    record: Parameters<RecordSource['set']>[1]
  ): ReturnType<RecordSource['set']> {
    super.set(dataID, record);
    persistedStore.setItem(dataID, record);
  }

  /**
   * `delete` is called when a record is deleted because of a mutation.
   * We override it to also remove the record from the persisted store.
   * There is also a `remove` method that is called when a record is deleted
   * because of a GC run. We don't override it because we don't want to
   * remove the record from the persisted store in that case.
   */
  delete(
    dataID: Parameters<RecordSource['delete']>[0]
  ): ReturnType<RecordSource['delete']> {
    super.delete(dataID);
    persistedStore.removeItem(dataID);
  }

  async _hydrate(): Promise<void> {
    const records = await readPersistedStore();
    for (const dataID in records) {
      const record = records[dataID];
      if (record == null) {
        this.delete(dataID);
      } else {
        this.set(dataID, record);
      }
    }
  }

  async hydrate(): Promise<void> {
    if (hydratePromise.fullfilled) {
      return;
    }

    await this._hydrate();
    hydratePromise.resolve();
  }
}

export function useHydrateStore() {
  enum Status {
    PENDING,
    SUCCESS,
  }

  let status = Status.PENDING;

  const promise = hydratePromise.promise.then(() => {
    status = Status.SUCCESS;
  });

  return () => {
    switch (status) {
      case Status.PENDING:
        throw promise;
      case Status.SUCCESS:
        return;
    }
  };
}

export async function loadQuery(
  ...args: Parameters<typeof $loadQuery>
): Promise<ReturnType<typeof $loadQuery>> {
  await hydratePromise.promise;
  return $loadQuery(...args);
}
