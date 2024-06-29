import KVRow from './KVRow';
import Request, { SidebarRequest } from './Request';

interface Collection {
  id: number;
  data: CollectionData;
  open: boolean;
  ownerId: number;
  version: string;
  children: Array<Collection>;
  requests: Array<Request>;
}

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
  settings?: CollectionSettings;
  parentId?: number;
}

interface CollectionSettings {
  webClientOptions?: Record<string, any>;
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
  parentId?: number;
  groups?: string[];
  requests: SidebarRequest[];
  children: SidebarCollection[];
}

interface CurrentCollection {
  id: number;
  data: CollectionData;
  ownerId: number;
  version: string;
  isChanged: boolean;
}

export type { CollectionSettings, CurrentCollection, SidebarCollection };

export default Collection;
