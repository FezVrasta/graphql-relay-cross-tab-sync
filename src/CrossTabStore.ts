import { Store } from 'relay-runtime';

export const notifyListenerPaused = { value: false };
export const notifyBroadcasterPaused = { value: false };

export class CrossTabStore extends Store {
  broadcastChannel: BroadcastChannel;

  constructor(
    source: ConstructorParameters<typeof Store>[0],
    options?: ConstructorParameters<typeof Store>[1]
  ) {
    super(source, options);
    this.broadcastChannel = new BroadcastChannel('relay-cross-tab-store');
  }

  notifyListenerTimeout: number | undefined;

  notify(
    sourceOperation?: Parameters<Store['notify']>[0],
    invalidateStore?: Parameters<Store['notify']>[1]
  ): ReturnType<Store['notify']> {
    notifyListenerPaused.value = true;

    clearTimeout(this.notifyListenerTimeout);
    this.notifyListenerTimeout = setTimeout(() => {
      notifyListenerPaused.value = false;
    }, 2000);

    if (!notifyBroadcasterPaused.value) {
      this.broadcastChannel.postMessage({
        operation: 'notify',
        sourceOperation,
        invalidateStore,
      });
    }

    return super.notify(sourceOperation, invalidateStore);
  }
}