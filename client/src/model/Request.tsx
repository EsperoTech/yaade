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
  requestScript?: string;
  responseScript?: string;
  response?: Response;
}

interface SidebarRequest {
  id: number;
  collectionId: number;
  name: string;
  method: string;
}

export type { CurrentRequest, SidebarRequest };

export default Request;
