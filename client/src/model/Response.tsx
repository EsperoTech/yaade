import KVRow from './KVRow';

interface Response {
  uri: string;
  method: string;
  status: number;
  params: Array<KVRow>;
  headers: Array<KVRow>;
  body: string;
}

export default Response;
