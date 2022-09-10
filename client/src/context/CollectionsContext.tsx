import {
  createContext,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useState,
} from 'react';

import Collection from '../model/Collection';
import Request from '../model/Request';

interface ICollectionsContext {
  collections: Collection[];
  setCollections: Dispatch<SetStateAction<Collection[]>>;
}

const CollectionsContext = createContext<ICollectionsContext>({
  collections: [],
  setCollections: () => {},
});

const CollectionsProvider: FunctionComponent = ({ children }) => {
  const [collections, setCollections] = useState<Collection[]>([]);

  function writeRequestToCollections(request: Request) {
    const collectionIndex = collections.findIndex((c) => c.id === request.collectionId);
    if (collectionIndex === -1) return;

    const requestIndex = collections[collectionIndex].requests.findIndex(
      (r) => r.id === request.id,
    );
    if (requestIndex === -1) {
      const newCollections = [...collections];
      newCollections[collectionIndex].requests.push(JSON.parse(JSON.stringify(request)));
      setCollections(newCollections);
    } else {
      collections[collectionIndex].requests[requestIndex] = JSON.parse(
        JSON.stringify(request),
      );
    }
  }

  function removeRequest(request: Request) {
    const collectionIndex = collections.findIndex(
      (c) => c.id.get() === request.collectionId,
    );
    if (collectionIndex === -1) return;

    const requestIndex = collections[collectionIndex].requests.findIndex(
      (r) => r.id.get() === request.id,
    );
    if (requestIndex === -1) return;

    collections[collectionIndex].requests[requestIndex].set(none);
  }

  function removeCollection(collectionId: number) {
    const collectionIndex = collections.findIndex((c) => c.id.get() === collectionId);
    if (collectionIndex === -1) return;

    collections[collectionIndex].set(none);
  }

  function saveCollection(collection: Collection) {
    const collectionIndex = collections.findIndex((c) => c.id.get() === collection.id);
    if (collectionIndex === -1) {
      collections.merge([collection]);
    } else {
      collections[collectionIndex].set(collection);
    }
  }

  return (
    <CollectionsContext.Provider
      value={{
        collections,
        setCollections,
      }}
    >
      {children}
    </CollectionsContext.Provider>
  );
};

export { CollectionsContext };

export default CollectionsProvider;
