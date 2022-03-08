import Request from './Request';

interface Collection {
  id: number;
  name: string;
  open: boolean;
  requests: Array<Request>;
}

export default Collection;
