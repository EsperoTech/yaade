interface Request {
  id: number;
  collectionId: number;
  type: string;
  version: string;
  data: {
    [key: string]: any;
  };
}

export default Request;
