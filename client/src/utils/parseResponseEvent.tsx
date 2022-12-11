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

function parseExtensionResponse(event: any): Response {
  const res = event.data.response;
  return parseResponse(res);
}

function parseResponse(res: any): Response {
  const headers: Array<KVRow> = res.headers;
  const contentType = getContentType(headers);
  let body = res.body;
  try {
    body = beautifyBody(body, contentType);
  } catch (e) {
    console.log(e);
  }
  const size = res.size ?? getSize(headers);

  const date = new Date().toUTCString();

  return {
    headers,
    body,
    status: res.status,
    time: res.time,
    size,
    date,
  };
}

export { parseExtensionResponse, parseResponse };
