interface Request {
  id: number;
  collectionId: number;
  type: string;
  version: string;
  data: {
    [key: string]: any;
  };
}

interface SidebarRequest {
  id: number;
  name: string;
  method: string;
}

interface CurrentRequest {
  id: number;
  collectionId: number;
  type: string;
  version: string;
  data: {
    [key: string]: any;
  };
  isChanged: boolean;
  isLoading: boolean;
}

export type { CurrentRequest, SidebarRequest };

export default Request;
