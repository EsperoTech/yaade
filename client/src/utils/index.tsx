import beautify from 'beautify';

import KVRow from '../model/KVRow';
import Request from '../model/Request';
import { parseExtensionResponse, parseResponse } from './parseResponseEvent';

function cn(styles: any, name: string, variants: Array<string>): string {
  const variantCns = variants.map((v) => styles[`${name}--${v}`]).join(' ');
  return styles[name] + ' ' + variantCns;
}

function getMethodColor(method: string): any {
  switch (method) {
    case 'GET':
      return {
        color: 'var(--chakra-colors-green-500)',
      };
    case 'POST':
      return {
        color: 'var(--chakra-colors-orange-500)',
      };
    case 'PUT':
      return {
        color: 'var(--chakra-colors-blue-500)',
      };
    case 'DELETE':
      return {
        color: 'var(--chakra-colors-red-500)',
      };
    default:
      return {
        color: 'var(--chakra-colors-gray-500)',
      };
  }
}

function successToast(msg: string, toast: any) {
  toast({
    title: 'Success',
    description: msg,
    status: 'success',
    isClosable: true,
    duration: 2000,
  });
}

function errorToast(msg: string, toast: any, duration?: number, title?: string) {
  toast({
    title: title ?? 'Error',
    description: msg,
    status: 'error',
    isClosable: true,
    duration: duration ?? 2000,
  });
}

function beautifyBody(body: string, contentType: string): string {
  if (contentType?.includes('application/json')) {
    return beautify(body, { format: 'json' });
  } else if (contentType?.includes('application/xml')) {
    return beautify(body, { format: 'xml' });
  } else if (contentType?.includes('text/html')) {
    return beautify(body, { format: 'html' });
  }
  return body;
}

function appendHttpIfNoProtocol(uri?: string): string {
  if (!uri) return '';
  if (!uri.includes('://')) {
    return 'http://' + uri;
  } else {
    return uri;
  }
}

function groupsArrayToStr(groups?: Array<string>): string {
  return groups?.join(',') ?? '';
}

function groupsStrToArray(groups: string): Array<string> {
  return groups.split(',').filter((el) => el !== '');
}

function kvRowsToMap(rows: KVRow[]): Record<string, string> {
  const res: Record<string, string> = {};
  rows.forEach((row) => {
    if (row.key === '') return;
    res[row.key] = row.value;
  });
  return res;
}

function mapToKvRows(map: Record<string, string>): KVRow[] {
  return Object.entries(map).map(([key, value]) => {
    return { key, value };
  });
}

export {
  appendHttpIfNoProtocol,
  beautifyBody,
  cn,
  errorToast,
  getMethodColor,
  groupsArrayToStr,
  groupsStrToArray,
  kvRowsToMap,
  mapToKvRows,
  parseExtensionResponse,
  parseResponse,
  successToast,
};
