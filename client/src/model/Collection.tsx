import KVRow from './KVRow';
import Request, { SidebarRequest } from './Request';

interface Collection {
  id: number;
  data: {
    name?: string;
    groups?: string[];
    envs?: {
      [key: string]: Environment;
    };
    rank?: number;
    headers?: Array<KVRow>;
    requestScript?: string;
    responseScript?: string;
  };
  open: boolean;
  ownerId: number;
  version: string;
  requests: Array<Request>;
}

interface Environment {
  data: {
    [key: string]: string;
  };
  proxy: string;
  secretKeys: string[];
}

interface SidebarCollection {
  id: number;
  name: string;
  open: boolean;
  selected: boolean;
  groups?: string[];
  requests: SidebarRequest[];
}

interface CurrentCollection {
  id: number;
  data: {
    [key: string]: any;
  };
  ownerId: number;
  version: string;
  isChanged: boolean;
}

export type { CurrentCollection, SidebarCollection };

export default Collection;
