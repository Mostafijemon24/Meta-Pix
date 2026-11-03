// Export destinations. "Downloads" uses a normal browser download.
// A custom folder uses the File System Access API where the browser has it
// (Chrome on desktop / ChromeOS); the folder handle is remembered in IndexedDB.

import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { idb } from './storage';

/** True inside the Android app (APK). */
export const isNative = Capacitor.isNativePlatform();
export const NATIVE_FOLDER = 'Documents / MetaPix';

type DirHandle = FileSystemDirectoryHandle & {
  queryPermission?(o: { mode: 'readwrite' }): Promise<PermissionState>;
  requestPermission?(o: { mode: 'readwrite' }): Promise<PermissionState>;
};

export const canPickFolder = !isNative && typeof window !== 'undefined' && 'showDirectoryPicker' in window;

const KEY = 'exportDir';

export async function getSavedFolder(): Promise<DirHandle | undefined> {
  return idb.get<DirHandle>('kv', KEY);
}
export async function forgetFolder() {
  await idb.del('kv', KEY);
}

export async function pickFolder(remember: boolean): Promise<DirHandle | null> {
  try {
    const h = (await (window as any).showDirectoryPicker({ id: 'metapix', mode: 'readwrite', startIn: 'pictures' })) as DirHandle;
    if (remember) await idb.set('kv', KEY, h);
    return h;
  } catch {
    return null; // user cancelled
  }
}

/** Must be called from a click handler (needs user activation). */
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
  const base = name.slice(0, dot), ext = name.slice(dot);
  for (let i = 0; i < 1000; i++) {
    const n = i ? `${base}-${i}${ext}` : name;
    try { await dir.getFileHandle(n); } catch { return n; }
  }
  return `${base}-${Date.now()}${ext}`;
}

/** Returns the file name actually written. Throws if the folder is gone. */
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

const toBase64 = (blob: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1]);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });

/** Android app: write into the phone's Documents/MetaPix folder. Returns the file name used. */
export async function saveNative(name: string, blob: Blob) {
  try {
    if ((await Filesystem.checkPermissions()).publicStorage !== 'granted') await Filesystem.requestPermissions();
  } catch { /* Android 11+ needs no permission for its own files */ }
  const dot = name.lastIndexOf('.');
  const base = name.slice(0, dot), ext = name.slice(dot);
  let n = name;
  for (let i = 1; i < 1000; i++) {
    try {
      await Filesystem.stat({ path: `MetaPix/${n}`, directory: Directory.Documents });
      n = `${base}-${i}${ext}`;
    } catch {
      break; // name is free
    }
  }
  await Filesystem.writeFile({ path: `MetaPix/${n}`, data: await toBase64(blob), directory: Directory.Documents, recursive: true });
  return n;
}

/** Opens the system share sheet with the file. Returns false if unsupported. */
export async function shareFile(name: string, blob: Blob): Promise<boolean> {
  if (isNative) {
    const f = await Filesystem.writeFile({ path: name, data: await toBase64(blob), directory: Directory.Cache });
    try { await Share.share({ files: [f.uri], title: name }); } catch { /* dismissed */ }
    return true;
  }
  const file = new File([blob], name, { type: blob.type });
  if (!navigator.canShare?.({ files: [file] })) return false;
  try {
    await navigator.share({ files: [file], title: name });
  } catch {
    /* user dismissed */
  }
  return true;
}
