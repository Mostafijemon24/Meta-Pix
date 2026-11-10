// Browser export destinations (no Capacitor on the website).

import { idb } from './storage';

export const isNative = false;
export const NATIVE_FOLDER = 'Downloads';

type DirHandle = FileSystemDirectoryHandle & {
  queryPermission?(o: { mode: 'readwrite' }): Promise<PermissionState>;
  requestPermission?(o: { mode: 'readwrite' }): Promise<PermissionState>;
};

export const canPickFolder = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

const KEY = 'exportDir';

export async function getSavedFolder(): Promise<DirHandle | undefined> {
  return idb.get<DirHandle>('kv', KEY);
}
export async function forgetFolder() {
  await idb.del('kv', KEY);
}

export async function pickFolder(remember: boolean): Promise<DirHandle | null> {
  try {
    const h = (await (window as unknown as { showDirectoryPicker: (o: object) => Promise<DirHandle> }).showDirectoryPicker({
      id: 'metapix',
      mode: 'readwrite',
      startIn: 'pictures',
    })) as DirHandle;
    if (remember) await idb.set('kv', KEY, h);
    return h;
  } catch {
    return null;
  }
}

export async function ensureFolderPermission(h: DirHandle): Promise<boolean> {
  try {
    if ((await h.queryPermission?.({ mode: 'readwrite' })) === 'granted') return true;
    return (await h.requestPermission?.({ mode: 'readwrite' })) === 'granted';
  } catch {
    return false;
  }
}

async function uniqueName(dir: DirHandle, name: string) {
  const dot = name.lastIndexOf('.');
  const base = name.slice(0, dot),
    ext = name.slice(dot);
  for (let i = 0; i < 1000; i++) {
    const n = i ? `${base}-${i}${ext}` : name;
    try {
      await dir.getFileHandle(n);
    } catch {
      return n;
    }
  }
  return `${base}-${Date.now()}${ext}`;
}

export async function saveToFolder(dir: DirHandle, name: string, blob: Blob) {
  const n = await uniqueName(dir, name);
  const fh = await dir.getFileHandle(n, { create: true });
  const w = await fh.createWritable();
  await w.write(blob);
  await w.close();
  return n;
}

export function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function saveNative(name: string, blob: Blob) {
  download(name, blob);
  return name;
}

export async function shareFile(name: string, blob: Blob): Promise<boolean> {
  const file = new File([blob], name, { type: blob.type });
  if (!navigator.canShare?.({ files: [file] })) return false;
  try {
    await navigator.share({ files: [file], title: name });
  } catch {
    /* dismissed */
  }
  return true;
}
