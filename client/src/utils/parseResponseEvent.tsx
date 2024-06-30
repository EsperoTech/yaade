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


  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    timeZoneName: 'short'
  };
  const date = new Date().toLocaleString('en-GB', options);


  return {
    headers,
    body,
    status: res.status,
    time: res.time,
    size,
    date,
  };
}

export { parseResponse };
