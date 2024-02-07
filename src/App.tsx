import { Suspense, useState } from 'react';
import {
  RelayEnvironmentProvider,
  useMutation,
  usePreloadedQuery,
  useQueryLoader,
} from 'react-relay';
import graphql from 'babel-plugin-relay/macro';

import './App.css';
import { initRelayEnvironment } from './RelayEnvironment';
import { useAsyncResource } from 'use-async-resource';
import { readPersistedStore } from './persistedStore';

// Define a query
const GetPostQuery = graphql`
  query AppGetPostQuery($id: ID!) {
    Post(id: $id) {
      id
      title
      views
      user_id
    }
  }
`;

const RandomizePostTitleMutation = graphql`
  mutation AppRandomizePostTitleMutation($id: ID!, $title: String!) {
    updatePost(id: $id, title: $title) {
      id
      title
      views
      user_id
    }
  }
`;

function CodeViewer({
  queryReference,
}: {
  queryReference: Parameters<typeof usePreloadedQuery>[1];
}) {
  const data = usePreloadedQuery(GetPostQuery, queryReference);

  return (
    <pre style={{ textAlign: 'left' }}>
      <code>{JSON.stringify(data, null, 2)}</code>
    </pre>
  );
}

function App() {
  const [id, setId] = useState(1);
  const [queryRef, loadQuery] = useQueryLoader(GetPostQuery);

  const [randomizeTitleMutation] = useMutation(RandomizePostTitleMutation);

  const randomizeTitle = () => {
    randomizeTitleMutation({
      variables: {
        id,
        title: 'Random title ' + Math.random(),
      },
    });
  };

  return (
    <div>
      <input
        placeholder="id"
        value={id}
        type="number"
        onChange={(e) => setId(parseInt(e.target.value, 10))}
      />
      <button onClick={() => loadQuery({ id })}>Load</button>
      <button onClick={randomizeTitle}>Randomize title</button>
      <div>
        <Suspense fallback={'Loading...'}>
          {queryRef ? (
            <CodeViewer queryReference={queryRef} />
          ) : (
            <p>Press button to load</p>
          )}
        </Suspense>
      </div>
    </div>
  );
}

function RelayEnvironmentProviderLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usePersistedStore] = useAsyncResource(readPersistedStore, []);
  const persistedStore = usePersistedStore();

  return (
    <RelayEnvironmentProvider
      environment={initRelayEnvironment(persistedStore)}
    >
      {children}
    </RelayEnvironmentProvider>
  );
}

// The above component needs to know how to access the Relay environment, and we
// need to specify a fallback in case it suspends:
// - <RelayEnvironmentProvider> tells child components how to talk to the current
//   Relay Environment instance
// - <Suspense> specifies a fallback in case a child suspends.
function AppRoot() {
  return (
    <Suspense fallback={'Loading...'}>
      <RelayEnvironmentProviderLoader>
        <App />
      </RelayEnvironmentProviderLoader>
    </Suspense>
  );
}

export default AppRoot;
