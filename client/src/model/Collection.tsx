import KVRow from './KVRow';
import { AuthData, RestRequest, SidebarRequest, WebsocketRequest } from './Request';
import Script, { SidebarScript } from './Script';

interface Collection {
  id: number;
  data: CollectionData;
  open: boolean;
  ownerId: number;
  version: string;
  children: Array<Collection>;
  requests: Array<RestRequest | WebsocketRequest>;
  scripts: Array<Script>;
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
  auth?: AuthData;
}

interface CollectionSettings {
  extensionOptions?: Record<string, any>;
  webClientOptions?: Record<string, any>;
}

interface Environment {
  data: {
    [key: string]: string;
  };
  proxy: string;
  secretKeys: string[];
  parentEnvName?: string;
}

interface SidebarCollection {
  id: number;
  name: string;
  open: boolean;
  selected: boolean;
  index: number;
  parentId?: number;
  groups?: string[];
  requests: SidebarRequest[];
  scripts: SidebarScript[];
  children: SidebarCollection[];
  depth: number;
}

interface CurrentCollection {
  id: number;
  data: CollectionData;
  ownerId: number;
  version: string;
  isChanged: boolean;
}

export type { CollectionSettings, CurrentCollection, Environment, SidebarCollection };

export default Collection;
