import KVRow from './KVRow';

interface Request {
  id: number;
  name: string;
  uri: string;
  method: string;
  params: Array<KVRow>;
  headers: Array<KVRow>;
  body: string;
}

export default Request;
