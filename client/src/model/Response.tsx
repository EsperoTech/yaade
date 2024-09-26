import KVRow from './KVRow';
import { JasmineReport } from './Script';

interface Response {
  status: number;
  headers: Array<KVRow>;
  body: string;
  time: number;
  size: number;
  date?: string;
  jasmineReport?: JasmineReport | null;
}

export default Response;
