import { Suspense, useState } from 'react';
import {
  RelayEnvironmentProvider,
  graphql,
  loadQuery as loadQueryRelay,
  useMutation,
  usePreloadedQuery,
  useQueryLoader,
  useRelayEnvironment,
} from 'react-relay';

import './App.css';
import { environment } from './RelayEnvironment';
import { useHydrateStore } from './PersistentRecordSource';

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

const DeletePostMutation = graphql`
  mutation AppDeletePostMutation($id: ID!) {
    removePost(id: $id) {
      id @deleteRecord
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

const PreloadButton = ({ id }: { id: number }) => {
  const environment = useRelayEnvironment();
  const preload = (variables: { id: number }) => {
    loadQueryRelay(environment, GetPostQuery, variables);
  };

  return <button onClick={() => preload({ id })}>Preload</button>;
};

function App() {
  useHydrateStore();
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

  const [deleteMutation] = useMutation(DeletePostMutation);

  const deletePost = () => {
    deleteMutation({
      variables: {
        id,
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input
        placeholder="id"
        value={id}
        type="number"
        onChange={(e) => setId(parseInt(e.target.value, 10))}
      />
      <div style={{ display: 'flex', gap: 10 }}>
        <PreloadButton id={id} />
        <button onClick={() => loadQuery({ id })}>Load</button>
        <button onClick={randomizeTitle}>Randomize title</button>
        <button onClick={deletePost}>Delete</button>
      </div>

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
  return (
    <RelayEnvironmentProvider environment={environment}>
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
