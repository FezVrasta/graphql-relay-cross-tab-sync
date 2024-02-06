import { Environment, Network, RecordSource } from 'relay-runtime';
import type { FetchFunction, Store } from 'relay-runtime';
import { fetchGraphQL } from './fetchGraphQL';
import { CrossTabRecordSource } from './CrossTabRecordSource';
import { RecordMap } from 'relay-runtime/lib/store/RelayStoreTypes';
import {
  CrossTabStore,
  notifyBroadcasterPaused,
  notifyListenerPaused,
} from './CrossTabStore';

// Relay passes a "params" object with the query name and text. So we define a helper function
// to call our fetchGraphQL utility with params.text.
async function fetchRelay(
  params: Parameters<FetchFunction>[0],
  variables: Parameters<FetchFunction>[1]
) {
  console.log(
    `fetching query ${params.name} with ${JSON.stringify(variables)}`
  );
  if (params.text == null) {
    throw new Error('params.text is null');
  }
  return fetchGraphQL(params.text, variables);
}

export function initRelayEnvironment(records: RecordMap) {
  const source = new CrossTabRecordSource(records);
  const store = new CrossTabStore(source);
  const environment = new Environment({
    network: Network.create(fetchRelay),
    store,
    log: (...args) => console.log('Relay log:', ...args),
  });

  store.broadcastChannel.onmessage = async (event) => {
    if (notifyListenerPaused.value) return;

    const { operation, sourceOperation, invalidateStore, jsonSource } =
      event.data as {
        operation: string;
        sourceOperation: Parameters<Store['notify']>[0];
        invalidateStore: Parameters<Store['notify']>[1];
      };
    switch (operation) {
      case 'notify': {
        notifyBroadcasterPaused.value = true;
        setTimeout(() => {
          notifyBroadcasterPaused.value = false;
        }, 2000);

        if (sourceOperation != null) {
          // applyOptimisticMutation(environment, {
          //   mutation: sourceOperation.request.node,
          //   variables: sourceOperation.request.variables,
          // });

          const data = source.get(sourceOperation.fragment.dataID);
          if (data) {
            const ref =
              Object.values(data)[Object.keys(data).length - 1]?.__ref;
            const payload = source.get(ref);
            console.log(ref, payload);

            console.log(sourceOperation, data);

            environment.commitPayload(sourceOperation, {
              updatePost: payload,
            });
          }

          store.notify(sourceOperation, invalidateStore);
        }

        break;
      }
      case 'publish': {
        if (jsonSource != null) {
          store.publish(new CrossTabRecordSource(jsonSource), invalidateStore);
        }
        break;
      }
    }
  };

  return environment;
}
