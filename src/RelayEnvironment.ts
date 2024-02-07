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

const source = new RecordSource();
const store = new CrossTabStore(source);
export const environment = new Environment({
  network: Network.create(fetchRelay),
  store,
});

console.log({
  source,
  store,
  environment,
});
store.broadcastChannel.onmessage = async (event) => {
  if (notifyListenerPaused.value) return;

  const {
    operation,
    sourceOperation,
    invalidateStore,
    jsonSource,
    idsMarkedForInvalidation,
  } = event.data as {
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
        store.notify();
      }

      break;
    }
    case 'publish': {
      if (jsonSource != null) {
        store.publish(new RecordSource(jsonSource), idsMarkedForInvalidation);
      }
      break;
    }
  }
};
