interface CurrentRequest {
  id: number;
  collectionId: number;
  type: string;
  version: string;
  data: any;
  changed: boolean;
  isLoading: boolean;
}

export default CurrentRequest;
