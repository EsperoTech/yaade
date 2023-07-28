import Request, { SidebarRequest } from './Request';

interface Collection {
  id: number;
  data: {
    [key: string]: any;
  };
  open: boolean;
  ownerId: number;
  version: string;
  requests: Array<Request>;
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
