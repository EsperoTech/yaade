import Collection, { Environment } from '../model/Collection';
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

  let result: {
    [key: string]: string;
  } = {};

  let currentEnvName = envName;
  for (let i = 0; i < tree.length; i++) {
    const c = tree[i];
    const env = c.data?.envs?.[currentEnvName];
    if (!env) break;
    result = {
      ...result,
      ...env.data,
    };
    if (!env.parentEnvName) break;
    currentEnvName = env.parentEnvName;
  }

  return result;
}

export default getMergedEnvData;
