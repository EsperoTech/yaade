import Collection, { CurrentCollection } from '../model/Collection';
import {
  AuthData,
  RestRequest,
  RestRequestData,
  WebsocketRequest,
  WebsocketRequestData,
} from '../model/Request';
import Script, { CurrentScript, ScriptData } from '../model/Script';
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

const createRestRequest = (
  collectionId: number,
  data: RestRequestData,
): Promise<Response> => createRequest(collectionId, 'REST', data);

const createWebsocketRequest = (
  collectionId: number,
  data: WebsocketRequestData,
): Promise<Response> => createRequest(collectionId, 'WS', data);

const createRequest = (
  collectionId: number,
  type: 'REST' | 'WS',
  data: RestRequestData | WebsocketRequestData,
): Promise<Response> =>
  fetch(BASE_PATH + 'api/request', {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      collectionId,
      type,
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

const updateRequest = (request: RestRequest | WebsocketRequest): Promise<Response> =>
  fetch(BASE_PATH + 'api/request', {
    method: 'PUT',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(request),
  });

const invoke = (request: RestRequest, envName: string) =>
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

const getScript = (id: number): Promise<Response> =>
  fetch(BASE_PATH + `api/scripts/${id}`);

const createScript = (collectionId: number, data: ScriptData): Promise<Response> =>
  fetch(BASE_PATH + 'api/scripts', {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      collectionId,
      data,
    }),
  });

const updateScript = (script: Script | CurrentScript): Promise<Response> =>
  fetch(BASE_PATH + 'api/scripts', {
    method: 'PUT',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(script),
  });

const moveScript = (
  id: number,
  newRank: number,
  newCollectionId: number,
): Promise<Response> =>
  fetch(BASE_PATH + `api/scripts/${id}/move`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      newRank,
      newCollectionId,
    }),
  });

const deleteScript = (id: number): Promise<Response> =>
  fetch(BASE_PATH + `api/scripts/${id}`, {
    method: 'DELETE',
  });

const runScript = (script: Script, envName?: string): Promise<Response> =>
  fetch(BASE_PATH + `api/run-script`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ script, envName }),
  });

const takeScriptOwnership = (id: number): Promise<Response> =>
  fetch(BASE_PATH + `api/scripts/${id}/take-ownership`, {
    method: 'POST',
  });

const exchangeOAuthToken = (
  tokenUrl: string,
  data: string,
  collectionId: number,
  envName?: string,
): Promise<Response> =>
  fetch(BASE_PATH + 'api/oauth2/token', {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      tokenUrl,
      data,
      collectionId,
      envName,
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
  createRestRequest,
  createWebsocketRequest,
  deleteRequest,
  deleteCollection,
  importOpenApi,
  importPostman,
  moveCollection,
  moveRequest,
  updateRequest,
  invoke,
  runScript,
  updateCollection,
  getFiles,
  uploadFile,
  deleteFile,
  updateScript,
  moveScript,
  createScript,
  deleteScript,
  getScript,
  takeScriptOwnership,
};
