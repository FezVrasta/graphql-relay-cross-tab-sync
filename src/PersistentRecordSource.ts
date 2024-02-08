import { RecordSource } from 'relay-runtime';
import { persistedStore } from './persistedStore';

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
}
