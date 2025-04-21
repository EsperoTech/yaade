import Collection, { Environment } from '../model/Collection';
import KVRow from '../model/KVRow';
import { RestRequest } from '../model/Request';
import { findCollection } from '../state/collections';

function getParentTree(collections: Collection[], collectionId: number): Collection[] {
  const c = findCollection(collections, collectionId);
  if (!c) return [];

  if (!c.data?.parentId) return [c];

  return [c, ...getParentTree(collections, c.data?.parentId)];
}

function getMergedEnvData(
  collections: Collection[],
  collectionId: number,
  envName?: string,
): Record<string, string> | undefined {
  if (!envName) return undefined;
  const collection = findCollection(collections, collectionId);
  if (!collection) return undefined;
  const tree = getParentTree(collections, collectionId);
  const env = collection?.data?.envs?.[envName];
  if (!env) return undefined;

  const envs: Record<string, string>[] = [];

  let currentEnvName = envName;
  for (const c of tree) {
    const env = c.data?.envs?.[currentEnvName];
    if (!env) break;
    envs.push(env.data);
    if (!env.parentEnvName) break;
    currentEnvName = env.parentEnvName;
  }

  return envs.reverse().reduce((acc, env) => ({ ...acc, ...env }), {});
}

function getMergedHeaders(request: RestRequest, collections: Collection[]): KVRow[] {
  const tree = getParentTree(collections, request.collectionId);
  const headers = tree.flatMap((c) => c.data?.headers ?? []);
  headers.push(...(request.data.headers ?? []));
  return headers.filter((h) => h.isEnabled !== false);
}

export { getMergedEnvData, getMergedHeaders };
