import Request from './Request';

interface Collection {
  id: number;
  data: {
    [key: string]: any;
  };
  open: boolean;
  requests: Array<Request>;
}

export default Collection;
