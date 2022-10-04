import Collection from '../model/Collection';

function getSelectedEnvs(): Record<number, string> {
  return JSON.parse(localStorage.getItem('selectedEnvs') ?? '{}');
}

function getSelectedEnv(collection: Collection): any {
  const selectedEnvName = getSelectedEnvs()[collection.id];

  if (!selectedEnvName) return {};

  return collection.data?.envs?.[selectedEnvName] ?? {};
}

function saveSelectedEnv(collectionId: number, name: string) {
  const newSelectedEnvs = getSelectedEnvs();
  newSelectedEnvs[collectionId] = name;
  localStorage.setItem('selectedEnvs', JSON.stringify(newSelectedEnvs));
}

export { getSelectedEnv, getSelectedEnvs, saveSelectedEnv };
