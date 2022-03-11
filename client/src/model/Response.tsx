import KVRow from './KVRow';

interface Response {
  uri: string;
  status: number;
  headers: Array<KVRow>;
  body: string;
  time: number;
  size: number;
}

export default Response;
