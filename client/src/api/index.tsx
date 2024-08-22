import Collection, { CurrentCollection } from '../model/Collection';
import Request, { AuthData } from '../model/Request';
import { BASE_PATH, groupsArrayToStr } from '../utils';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

const importOpenApi = (
  basePath: string,
  groups: string[],
  data: FormData,
  parentId?: number,
): Promise<Response> => {
  const params = new URLSearchParams();

  params.append('basePath', basePath);

  if (groups.length > 0) {
    params.append('groups', groupsArrayToStr(groups));
  }

  if (parentId) {
    params.append('parentId', parentId.toString());
  }

  return fetch(BASE_PATH + 'api/collection/importOpenApi?' + params.toString(), {
    method: 'POST',
    body: data,
  });
};

const importPostman = (
  groups: string[],
  data: FormData,
  parentId?: number,
): Promise<Response> => {
  const params = new URLSearchParams();

  if (groups.length > 0) {
    params.append('groups', groupsArrayToStr(groups));
  }

  if (parentId) {
    params.append('parentId', parentId.toString());
  }

  return fetch(BASE_PATH + 'api/collection/importPostman?' + params.toString(), {
    method: 'POST',
    body: data,
  });
};

const createCollection = (
  name: string,
  groups: string[],
  parentId?: number,
): Promise<Response> =>
  fetch(BASE_PATH + 'api/collection', {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      name: name,
      groups: groups,
      parentId,
    }),
  });

const duplicateCollection = (id: number, name: string): Promise<Response> =>
  fetch(BASE_PATH + `api/collection/${id}/duplicate`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      name: name,
    }),
  });

const moveCollection = (
  id: number,
  newRank?: number,
  newParentId?: number,
): Promise<Response> =>
  fetch(BASE_PATH + `api/collection/${id}/move`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      newRank,
      newParentId,
    }),
  });

const moveRequest = (
  id: number,
  newRank: number,
  newCollectionId?: number,
): Promise<Response> =>
  fetch(BASE_PATH + `api/request/${id}/move`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      newRank,
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
      data: data,
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

const exchangeOAuthToken = (tokenUrl: string, data: string): Promise<Response> =>
  fetch(BASE_PATH + 'api/oauth2/token', {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      tokenUrl,
      data,
    }),
  });

const getFiles = (): Promise<Response> => fetch(BASE_PATH + 'api/files');

const uploadFile = (data: FormData): Promise<Response> =>
  fetch(BASE_PATH + 'api/files', {
    method: 'POST',
    body: data,
  });

const deleteFile = (id: number): Promise<Response> =>
  fetch(BASE_PATH + `api/files/${id}`, {
    method: 'DELETE',
  });

export default {
  exchangeOAuthToken,
  createCollection,
  duplicateCollection,
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
  getFiles,
  uploadFile,
  deleteFile,
};
