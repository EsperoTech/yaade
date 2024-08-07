import beautify from 'beautify';
import { Location } from 'react-router-dom';

import Collection from '../model/Collection';
import KVRow from '../model/KVRow';
import Request, { AuthData, CurrentRequest } from '../model/Request';
import { parseResponse } from './parseResponseEvent';
import { getSelectedEnvs } from './store';

const BASE_PATH =
  import.meta.env.BASE_URL === '/'
    ? window.location.origin + '/'
    : import.meta.env.BASE_URL;

function cn(styles: any, name: string, variants: Array<string>): string {
  const variantCns = variants
    .map((v) => styles[`${name}--${v}`] ?? '')
    .join(' ')
    .trim();
  return `${styles[name] ?? ''} ${variantCns}`.trim();
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
    // TODO: this currently requires some regex magic to ignore the interpolations in beautify-js
    // it probably contains some bugs, but it works for now
    // if there is a more elegant way to do this, please do so
    let bodyWithInterpolations = body;
    bodyWithInterpolations = bodyWithInterpolations.replace(
      /\$\{([^}]+)\}/g,
      '/* beautify ignore:start */$&/* beautify ignore:end */',
    );
    let res = beautify(bodyWithInterpolations, { format: 'json' });
    if (res.includes('/* beautify ignore:start */')) {
      res = res.replace(/\/\* beautify ignore:end \*\//g, '');
      // for `"hello": ${world} a newline gets inserted after the `:`, this removes it
      res = res.replace(/(\s+)\/\* beautify ignore:start \*\//g, ' ');
      res = res.replace(/\/\* beautify ignore:start \*\//g, '');
      // for `"hello": ${world},` the comma gets beautified into the next line
      // this moves the comma back to the previous line
      res = res.replace(/\n\s*,/g, ',');
    }
    return res;
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
  if (!rows) return res;
  rows.forEach((row) => {
    if (row.key === '') return;
    if (res[row.key]) return;
    res[row.key] = row.value;
  });
  return res;
}

function mapToKvRows(map: Record<string, string>): KVRow[] {
  return Object.entries(map).map(([key, value]) => {
    return { key, value };
  });
}

function parseLocation(location: Location): { requestId: number; collectionId: number } {
  const split = location.pathname.split('/');
  const res = { requestId: -1, collectionId: -1 };
  try {
    res.collectionId = parseInt(split[1]);
    res.requestId = parseInt(split[2]);
    return res;
  } catch (e) {
    return res;
  }
}

function getMinorVersion(version?: string): number {
  if (!version) return -1;
  const s = version.split('.');
  if (s.length < 2) return -1;
  return parseInt(s[1]) || -1;
}

function getRequestIdFromMessageId(messageId: string): number {
  const split = messageId.split('_');
  if (split.length < 2) return -1;
  return parseInt(split[0]) || -1;
}

function createMessageId(requestId: number): string {
  return `${requestId}_${Date.now()}`;
}

function currentRequestToRequest(currentRequest: CurrentRequest): Request {
  return {
    id: currentRequest.id,
    collectionId: currentRequest.collectionId,
    type: currentRequest.type,
    version: currentRequest.version,
    data: { ...currentRequest.data },
  };
}

function extractAuthorizationHeader(auth: AuthData): string | undefined {
  if (!auth || !auth.enabled) return;

  switch (auth.type) {
    case 'basic':
      return `Basic ${btoa(`${auth.basic?.username}:${auth.basic?.password}`)}`;
    case 'oauth2':
      return `Bearer ${auth.oauth2?.accessToken}`;
  }
}

const reservedWords = new Set([
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'let',
  'new',
  'null',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
]);

// checks if a string is a valid variable name. used to validate environment variables
function isValidVariableName(value: string): boolean {
  // Check if name is a reserved word
  if (reservedWords.has(value)) {
    return false;
  }

  // Check if the name starts with a letter, underscore, or dollar sign
  if (!/^[a-zA-Z_$]/.test(value)) {
    return false;
  }

  // Check if the name contains only letters, digits, underscores, or dollar signs
  if (!/^[a-zA-Z0-9_$]*$/.test(value)) {
    return false;
  }

  return true;
}

function findParentTree(
  collectionId: number,
  collections: Collection[],
): Collection[] | undefined {
  for (const collection of collections) {
    if (collection.id === collectionId) {
      return [collection];
    } else if (collection.children) {
      const res = findParentTree(collectionId, collection.children);
      if (res) {
        return [collection, ...res];
      }
    }
  }

  return undefined;
}

function mergeParentEnvironments(
  collectionId: number,
  collections: Collection[],
): Record<string, string> {
  const parentTree = findParentTree(collectionId, collections);
  if (!parentTree) {
    return {};
  }

  const selectedEnvs = getSelectedEnvs();

  const envs = parentTree.map((c) => {
    if (!selectedEnvs[c.id]) {
      return {};
    }
    return c.data?.envs?.[selectedEnvs[c.id]]?.data ?? {};
  });

  return envs.reduce((acc, env) => ({ ...acc, ...env }), {});
}

export {
  appendHttpIfNoProtocol,
  BASE_PATH,
  beautifyBody,
  cn,
  createMessageId,
  currentRequestToRequest,
  errorToast,
  extractAuthorizationHeader,
  getMethodColor,
  getMinorVersion,
  getRequestIdFromMessageId,
  groupsArrayToStr,
  groupsStrToArray,
  isValidVariableName,
  kvRowsToMap,
  mapToKvRows,
  mergeParentEnvironments,
  parseLocation,
  parseResponse,
  successToast,
};
