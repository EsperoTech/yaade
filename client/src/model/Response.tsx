import KVRow from './KVRow';
import { JasmineReport } from './Script';

interface RestResponse {
  status: number;
  headers: Array<KVRow>;
  body: string;
  time: number;
  size: number;
  date?: string;
  jasmineReport?: JasmineReport | null;
}

interface WebsocketResponse {
  messages: Array<WebsocketResponseMessage>;
}

interface WebsocketResponseMessage {
  message: string;
  date: number;
  type: 'incoming' | 'outgoing';
}

export type { RestResponse, WebsocketResponse };
