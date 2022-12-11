import KVRow from './KVRow';

interface Response {
  status: number;
  headers: Array<KVRow>;
  body: string;
  time: number;
  size: number;
}

export default Response;
