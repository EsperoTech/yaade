import {
  createContext,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useState,
} from 'react';

import Collection from '../../model/Collection';
import Request from '../../model/Request';

interface ICollectionContext {
  collections: Array<Collection>;
  setCollections: Dispatch<SetStateAction<Collection[]>>;
  writeRequestToCollections: (request: Request) => void;
  removeRequest: (request: Request) => void;
  removeCollection: (collectionId: number) => void;
  saveCollection: (collection: Collection) => void;
}

const CollectionsContext = createContext<ICollectionContext>({
  collections: [],
  setCollections: () => {},
  writeRequestToCollections: () => {},
  removeRequest: () => {},
  removeCollection: () => {},
  saveCollection: () => {},
});

const CollectionsProvider: FunctionComponent = ({ children }) => {
  const [collections, setCollections] = useState<Array<Collection>>([]);

  function writeRequestToCollections(request: Request) {
    const newCollections = [...collections].map((collection) => {
      if (collection.id !== request.collectionId) {
        return collection;
      }

      const requests = [...collection.requests];
      const idx = collection.requests.findIndex((req) => req.id === request.id);

      if (idx === -1) {
        requests.push(request);
      } else {
        requests[idx] = request;
      }

      return {
        ...collection,
        requests,
      };
    });

    setCollections(newCollections);
  }

  function removeRequest(request: Request) {
    const newCollections = [...collections].map((collection) => {
      if (collection.id !== request.collectionId) {
        return collection;
      }
      const requests = [...collection.requests];
      const idx = collection.requests.findIndex((req) => req.id === request.id);
      requests.splice(idx, 1);

      return {
        ...collection,
        requests,
      };
    });

    setCollections(newCollections);
  }

  function removeCollection(collectionId: number) {
    const newCollections = [...collections];
    const i = newCollections.findIndex((c) => c.id === collectionId);
    newCollections.splice(i, 1);
    setCollections(newCollections);
  }

  function saveCollection(collection: Collection) {
    const newCollections = [...collections];
    const idx = collections.findIndex((c) => c.id === collection.id);

    if (idx === -1) {
      newCollections.push(collection);
    } else {
      newCollections[idx] = collection;
    }
    setCollections(newCollections);
  }

  return (
    <CollectionsContext.Provider
      value={{
        collections,
        setCollections,
        writeRequestToCollections,
        removeRequest,
        removeCollection,
        saveCollection,
      }}
    >
      {children}
    </CollectionsContext.Provider>
  );
};

export { CollectionsContext };

export default CollectionsProvider;
