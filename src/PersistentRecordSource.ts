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

  delete(
    dataID: Parameters<RecordSource['delete']>[0]
  ): ReturnType<RecordSource['delete']> {
    super.delete(dataID);
    persistedStore.removeItem(dataID);
  }
}
