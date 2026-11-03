// Local persistence: small settings in localStorage, blobs in IndexedDB.

const DB_NAME = 'metapix';
const STORES = ['recents', 'history', 'kv'] as const;
type Store = (typeof STORES)[number];

let dbp: Promise<IDBDatabase> | null = null;
function db() {
  if (!dbp)
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => {
        for (const s of STORES) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s);
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  return dbp;
}

const req = <T>(r: IDBRequest<T>) =>
  new Promise<T>((res, rej) => ((r.onsuccess = () => res(r.result)), (r.onerror = () => rej(r.error))));

async function tx(store: Store, mode: IDBTransactionMode) {
  return (await db()).transaction(store, mode).objectStore(store);
}

export const idb = {
  async get<T>(store: Store, key: string): Promise<T | undefined> {
    try { return await req((await tx(store, 'readonly')).get(key)); } catch { return undefined; }
  },
  async set(store: Store, key: string, val: unknown) {
    try { await req((await tx(store, 'readwrite')).put(val, key)); } catch { /* storage unavailable */ }
  },
  async del(store: Store, key: string) {
    try { await req((await tx(store, 'readwrite')).delete(key)); } catch { /* ignore */ }
  },
  async all<T>(store: Store): Promise<T[]> {
    try { return await req((await tx(store, 'readonly')).getAll()); } catch { return []; }
  },
  async clear(store: Store) {
    try { await req((await tx(store, 'readwrite')).clear()); } catch { /* ignore */ }
  },
};

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? { ...fallback, ...JSON.parse(v) } : fallback;
  } catch {
    return fallback;
  }
}
export function saveJSON(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
}

// ───────── Records ─────────

export type RecentRecord = { id: string; name: string; blob: Blob; thumb: string; at: number };
export type HistoryRecord = {
  id: string; file: string; format: string; w: number; h: number; bytes: number;
  loc: string; at: number; thumb: string; blob: Blob; resize: 'fill' | 'fit';
};

export const MAX_RECENTS = 8;
export const MAX_HISTORY = 30;

export async function addRecent(r: RecentRecord) {
  await idb.set('recents', r.id, r);
  const all = (await idb.all<RecentRecord>('recents')).sort((a, b) => b.at - a.at);
  for (const old of all.slice(MAX_RECENTS)) await idb.del('recents', old.id);
}
export async function listRecents() {
  return (await idb.all<RecentRecord>('recents')).sort((a, b) => b.at - a.at);
}

export async function addHistory(r: HistoryRecord) {
  await idb.set('history', r.id, r);
  const all = (await idb.all<HistoryRecord>('history')).sort((a, b) => b.at - a.at);
  for (const old of all.slice(MAX_HISTORY)) await idb.del('history', old.id);
}
export async function listHistory() {
  return (await idb.all<HistoryRecord>('history')).sort((a, b) => b.at - a.at);
}
