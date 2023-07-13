import Request, { SidebarRequest } from './Request';

interface Collection {
  id: number;
  data: {
    [key: string]: any;
  };
  open: boolean;
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
  isChanged: boolean;
}

export type { CurrentCollection, SidebarCollection };

export default Collection;
