import { Environment, Network } from 'relay-runtime';
import type { FetchFunction, Store } from 'relay-runtime';
import { fetchGraphQL } from './fetchGraphQL';
import { RecordMap } from 'relay-runtime/lib/store/RelayStoreTypes';
import { CrossTabStore } from './CrossTabStore';
import { PersistentRecordSource } from './PersistentRecordSource';

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

const source = new PersistentRecordSource();

const store = new CrossTabStore(source);

export const environment = new Environment({
  network: Network.create(fetchRelay),
  store,
});

store.broadcastChannel.onmessage = async (event) => {
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
    jsonSource: RecordMap;
    idsMarkedForInvalidation: Parameters<Store['publish']>[1];
  };
  switch (operation) {
    case 'notify': {
      if (sourceOperation != null) {
        store.localNotify(sourceOperation, invalidateStore);
      }

      break;
    }
    case 'publish': {
      if (jsonSource != null) {
        store.localPublish(
          new PersistentRecordSource(jsonSource),
          idsMarkedForInvalidation
        );
      }
      break;
    }
  }
};

await source.hydrate();
