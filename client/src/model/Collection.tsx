import KVRow from './KVRow';
import Request, { SidebarRequest } from './Request';

interface CollectionData {
  name?: string;
  description?: string;
  groups?: string[];
  envs?: {
    [key: string]: Environment;
  };
  rank?: number;
  headers?: Array<KVRow>;
  requestScript?: string;
  responseScript?: string;
}

interface Collection {
  id: number;
  data: CollectionData;
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
  data: CollectionData;
  ownerId: number;
  version: string;
  isChanged: boolean;
}

export type { CurrentCollection, SidebarCollection };

export default Collection;
