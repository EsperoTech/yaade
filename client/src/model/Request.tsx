interface Request {
  id: number;
  collectionId: number;
  type: string;
  data: any;
  changed: boolean;
  isLoading: boolean;
}

export default Request;
