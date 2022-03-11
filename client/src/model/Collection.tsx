import Request from './Request';

interface Collection {
  id: number;
  data: any;
  open: boolean;
  requests: Array<Request>;
}

export default Collection;
