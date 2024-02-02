import { RecordSource } from 'relay-runtime';
import { persistedStore } from './persistedStore';

const sourceId = Math.random();

export class CrossTabRecordSource extends RecordSource {
  broadcastChannel: BroadcastChannel;
  constructor(records?: ConstructorParameters<typeof RecordSource>[0]) {
    super(records);
    this.broadcastChannel = new BroadcastChannel(
      'relay-cross-tab-record-source'
    );

    this.broadcastChannel.onmessage = (event) => {
      if (event.data.sourceId === sourceId) {
        return;
      }

      const { operation, dataID, record } = event.data;

      switch (operation) {
        case 'set':
          super.set(dataID, record);
          break;
        case 'delete':
          super.delete(dataID);
          break;
      }
    };
  }

  set(
    dataID: Parameters<RecordSource['set']>[0],
    record: Parameters<RecordSource['set']>[1]
  ): ReturnType<RecordSource['set']> {
    super.set(dataID, record);
    this.broadcastChannel.postMessage({
      sourceId,
      operation: 'set',
      dataID,
      record,
    });
    persistedStore.setItem(dataID, record);
  }

  delete(
    dataID: Parameters<RecordSource['delete']>[0]
  ): ReturnType<RecordSource['delete']> {
    super.delete(dataID);
    this.broadcastChannel.postMessage({
      sourceId,
      operation: 'delete',
      dataID,
    });
    persistedStore.removeItem(dataID);
  }
}
