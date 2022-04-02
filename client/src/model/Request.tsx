interface Request {
  id: number;
  collectionId: number;
  type: string;
  version: string;
  data: any;
}

export default Request;
