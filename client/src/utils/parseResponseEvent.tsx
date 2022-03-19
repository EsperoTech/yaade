import KVRow from '../model/KVRow';
import Response from '../model/Response';
import { beautifyBody } from '.';

function getSize(headers: Array<KVRow>): number {
  const lengthHeader = headers.find(
    (header) => header.key.toLowerCase() === 'content-length',
  );

  return lengthHeader ? Number.parseInt(lengthHeader.value) : 0;
}

const getContentType = (headers: Array<KVRow>) =>
  headers.find((header) => header.key.toLowerCase() === 'content-type')?.value ?? '';

export default function parseResponseEvent(event: any): Response {
  const headers: Array<KVRow> = event.data.response.headers;
  const contentType = getContentType(headers);
  let body = event.data.response.body;
  try {
    body = beautifyBody(body, contentType);
  } catch (e) {
    console.log(e);
  }
  const size = getSize(headers);

  return {
    headers,
    body,
    status: event.data.response.status,
    time: event.data.response.time,
    size,
  };
}
