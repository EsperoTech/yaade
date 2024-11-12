import KVRow from './KVRow';
import { RestResponse, WebsocketResponse } from './Response';

interface Request {
  id: number;
  collectionId: number;
  version: string;
}

interface RestRequest extends Request {
  type: 'REST';
  data: RestRequestData;
}

interface WebsocketRequest extends Request {
  type: 'WS';
  data: WebsocketRequestData;
}

interface CurrentRequest {
  id: number;
  collectionId: number;
  version: string;
  isChanged: boolean;
}

interface CurrentRestRequest extends CurrentRequest {
  type: 'REST';
  isLoading: boolean;
  data: RestRequestData;
}

interface CurrentWebsocketRequest extends CurrentRequest {
  type: 'WS';
  state: 'connected' | 'disconnected';
  data: WebsocketRequestData;
}

interface RequestData {
  name?: string;
  description?: string;
  uri?: string;
  headers?: Array<KVRow>;
  rank?: number;
  params?: Array<KVRow>;
}

interface RestRequestData extends RequestData {
  method?: string;
  body?: string;
  formDataBody?: Array<KVRow>;
  contentType?: string;
  auth?: AuthData;
  requestScript?: string;
  responseScript?: string;
  response?: RestResponse;
}

interface WebsocketRequestData extends RequestData {
  message?: string;
  contentType?: string;
  response?: WebsocketResponse;
}

interface AuthData {
  enabled?: boolean;
  type?: 'basic' | 'oauth2';
  basic?: {
    username?: string;
    password?: string;
  };
  oauth2?: {
    grantType?: 'authorization_code' | 'client_credentials' | 'password' | 'implicit';
    accessToken?: string;
    refreshToken?: string;
    authUrl?: string;
    tokenUrl?: string;
    clientId?: string;
    clientSecret?: string;
    username?: string;
    password?: string;
    scope?: string;
  };
}

interface SidebarRequest {
  id: number;
  collectionId: number;
  name: string;
  type: 'REST' | 'WS';
  method?: string;
}

export type {
  AuthData,
  CurrentRestRequest,
  CurrentWebsocketRequest,
  Request,
  RestRequest,
  RestRequestData,
  SidebarRequest,
  WebsocketRequest,
  WebsocketRequestData,
};
