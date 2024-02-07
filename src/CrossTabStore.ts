import { Store } from 'relay-runtime';

export class CrossTabStore extends Store {
  broadcastChannel: BroadcastChannel;

  constructor(
    source: ConstructorParameters<typeof Store>[0],
    options?: ConstructorParameters<typeof Store>[1]
  ) {
    super(source, options);
    this.broadcastChannel = new BroadcastChannel('relay-cross-tab-store');
  }

  notify(
    sourceOperation?: Parameters<Store['notify']>[0],
    invalidateStore?: Parameters<Store['notify']>[1]
  ): ReturnType<Store['notify']> {
    this.broadcastChannel.postMessage({
      operation: 'notify',
      sourceOperation,
      invalidateStore,
    });

    return this.localNotify(sourceOperation, invalidateStore);
  }

  localNotify(
    sourceOperation?: Parameters<Store['notify']>[0],
    invalidateStore?: Parameters<Store['notify']>[1]
  ): ReturnType<Store['notify']> {
    return super.notify(sourceOperation, invalidateStore);
  }

  publish(
    source: Parameters<Store['publish']>[0],
    idsMarkedForInvalidation?: Parameters<Store['publish']>[1]
  ): ReturnType<Store['publish']> {
    this.broadcastChannel.postMessage({
      operation: 'publish',
      jsonSource: source.toJSON(),
    });

    return this.localPublish(source, idsMarkedForInvalidation);
  }

  localPublish(
    source: Parameters<Store['publish']>[0],
    idsMarkedForInvalidation?: Parameters<Store['publish']>[1]
  ): ReturnType<Store['publish']> {
    return super.publish(source, idsMarkedForInvalidation);
  }
}
