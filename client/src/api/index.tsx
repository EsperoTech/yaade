import Collection, { CurrentCollection } from '../model/Collection';
import Request from '../model/Request';
import { BASE_PATH, groupsArrayToStr } from '../utils';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

const importOpenApi = (
  basePath: string,
  groups: string[],
  data: FormData,
): Promise<Response> =>
  fetch(
    BASE_PATH +
      `api/collection/importOpenApi?basePath=${basePath}&groups=${groupsArrayToStr(
        groups,
      )}`,
    {
      method: 'POST',
      body: data,
    },
  );

const importPostman = (groups: string[], data: FormData): Promise<Response> =>
  fetch(BASE_PATH + `api/collection/importPostman?groups=${groupsArrayToStr(groups)}`, {
    method: 'POST',
    body: data,
  });

const createCollection = (name: string, groups: string[]): Promise<Response> =>
  fetch(BASE_PATH + 'api/collection', {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      name: name,
      groups: groups,
    }),
  });

const moveCollection = (id: number, newRank: number): Promise<Response> =>
  fetch(BASE_PATH + `api/collection/${id}/move`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      newRank: newRank,
    }),
  });

const moveRequest = (id: number, newRank: number): Promise<Response> =>
  fetch(BASE_PATH + `api/request/${id}/move`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      newRank,
    }),
  });

const changeRequestCollection = (
  id: number,
  newCollectionId: number,
): Promise<Response> =>
  fetch(BASE_PATH + `api/request/${id}/move`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      newCollectionId,
    }),
  });

const createRequest = (collectionId: number, data?: any): Promise<Response> =>
  fetch(BASE_PATH + 'api/request', {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      collectionId: collectionId,
      type: 'REST',
      version: '1.0.0',
      data: { ...data, method: 'GET' },
    }),
  });

const deleteCollection = (id: number): Promise<Response> =>
  fetch(BASE_PATH + `api/collection/${id}`, {
    method: 'DELETE',
  });

const deleteRequest = (id: number): Promise<Response> =>
  fetch(BASE_PATH + `api/request/${id}`, {
    method: 'DELETE',
  });

const updateRequest = (request: Request): Promise<Response> =>
  fetch(BASE_PATH + 'api/request', {
    method: 'PUT',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(request),
  });

const invoke = (request: Request, envName: string) =>
  fetch(BASE_PATH + 'api/invoke', {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ request, envName }),
  });

const updateCollection = (
  collection: Collection | CurrentCollection,
): Promise<Response> =>
  fetch(BASE_PATH + 'api/collection', {
    method: 'PUT',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(collection),
  });

export default {
  changeRequestCollection,
  createCollection,
  createRequest,
  deleteRequest,
  deleteCollection,
  importOpenApi,
  importPostman,
  moveCollection,
  moveRequest,
  updateRequest,
  invoke,
  updateCollection,
};
