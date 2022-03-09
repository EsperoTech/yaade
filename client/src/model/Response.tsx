import KVRow from './KVRow';

interface Response {
  uri: string;
  method: string;
  status: number;
  headers: Array<KVRow>;
  body: string;
}

export default Response;
