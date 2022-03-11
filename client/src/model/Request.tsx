interface Request {
  id: number;
  collectionId: number;
  type: string;
  data: any;
  selected: boolean;
  isLoading: boolean;
}

export default Request;
