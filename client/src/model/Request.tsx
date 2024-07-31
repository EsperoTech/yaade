import KVRow from './KVRow';
import Response from './Response';

interface Request {
  id: number;
  collectionId: number;
  type: string;
  version: string;
  data: RequestData;
}

interface CurrentRequest {
  id: number;
  collectionId: number;
  type: string;
  version: string;
  data: RequestData;
  isChanged: boolean;
  isLoading: boolean;
}

interface RequestData {
  name?: string;
  description?: string;
  uri?: string;
  method?: string;
  headers?: Array<KVRow>;
  body?: string;
  rank?: number;
  formDataBody?: Array<KVRow>;
  contentType?: string;
  auth?: AuthData;
  requestScript?: string;
  responseScript?: string;
  response?: Response;
  params?: Array<KVRow>;
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
  method: string;
}

export type { AuthData, CurrentRequest, SidebarRequest };

export default Request;
