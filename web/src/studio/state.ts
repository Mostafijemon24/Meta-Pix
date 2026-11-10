'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { requestAiOptimize } from '../lib/ai';
import { loadSource, renderExport, thumbnail, type SourceImage } from '../lib/image';
import { hasPayload } from '../lib/metadata';
import {
  EXT,
  FMT_LABEL,
  PRESETS,
  emptyFields,
  estimateBytes,
  formatBytes,
  outputSize,
  slug,
  type Copyright,
  type FieldKey,
  type Fields,
  type Format,
  type MetaMode,
  type Orient,
  type Platform,
  type ResizeMode,
} from '../lib/presets';
import {
  NATIVE_FOLDER,
  canPickFolder,
  download,
  isNative,
  saveNative,
  ensureFolderPermission,
  forgetFolder,
  getSavedFolder,
  pickFolder,
  saveToFolder,
  shareFile,
} from '../lib/save';
import {
  addHistory,
  addRecent,
  idb,
  listHistory,
  listRecents,
  loadJSON,
  saveJSON,
  type HistoryRecord,
  type RecentRecord,
} from '../lib/storage';
import { suggestMetadata } from '../lib/suggest';

export type Screen = 'home' | 'import' | 'editor' | 'success' | 'history' | 'settings';
export type Tab = 'meta' | 'size' | 'format';
export type CustomPreset = { id: number; w: number; h: number };

type Settings = {
  theme: 'light' | 'dark' | null;
  defName: string;
  defFormat: Format;
  remember: boolean;
  location: 'downloads' | 'folder';
  customPresets: CustomPreset[];
  autoOptimize: boolean;
};

const DEFAULT_NAME = 'Mostafij Emon';
const SETTINGS_KEY = 'metapix.settings';
const defaults: Settings = {
  theme: null,
  defName: DEFAULT_NAME,
  defFormat: 'webp',
  remember: true,
  location: 'downloads',
  customPresets: [
    { id: 1, w: 1600, h: 840 },
    { id: 2, w: 1080, h: 1920 },
  ],
  autoOptimize: true,
};

const crFrom = (n: string): Copyright => ({ creator: n, owner: n, notice: n ? '© ' + n : '' });

export type Edit = {
  tab: Tab;
  fields: Fields;
  more: boolean;
  crOn: boolean;
  crOpen: boolean;
  cr: Copyright;
  metaMode: MetaMode;
  platform: Platform;
  orient: Orient;
  customW: number | string;
  customH: number | string;
  lock: boolean;
  ratio: number;
  resize: ResizeMode;
  format: Format;
  quality: number;
};

const freshEdit = (s: Settings, src?: { w: number; h: number }): Edit => ({
  tab: 'meta',
  fields: emptyFields(),
  more: false,
  crOn: true,
  crOpen: false,
  cr: crFrom(s.defName),
  metaMode: 'keep',
  platform: 'original',
  orient: 'h',
  customW: src?.w ?? 1200,
  customH: src?.h ?? 800,
  lock: false,
  ratio: src ? src.w / src.h : 1.5,
  resize: 'fill',
  format: s.defFormat,
  quality: 90,
});

export type LastExport = HistoryRecord & { url: string };

const safeName = (n: string) => n.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'seo-optimized-image';

export function useMetaPix() {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === 'undefined') return defaults;
    const s = loadJSON(SETTINGS_KEY, defaults);
    return { ...defaults, ...s, ...(s.remember ? {} : { location: 'downloads' as const }) };
  });
  const [screen, setScreen] = useState<Screen>('home');
  const [src, setSrc] = useState<SourceImage | null>(null);
  const [edit, setEditState] = useState<Edit>(() => freshEdit(settings));
  const [pending, setPending] = useState<Partial<Edit> | null>(null);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sheet, setSheet] = useState<null | 'location'>(null);
  const [fullscreen, setFullscreen] = useState<string | null>(null);
  const [toastMsg, setToast] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [recents, setRecents] = useState<RecentRecord[]>([]);
  const [lastExport, setLastExport] = useState<LastExport | null>(null);
  const [folder, setFolder] = useState<FileSystemDirectoryHandle | null>(null);
  const [systemDark, setSystemDark] = useState(false);
  const [aiReason, setAiReason] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const setEdit = useCallback((p: Partial<Edit> | ((e: Edit) => Partial<Edit>)) => {
    setEditState((e) => ({ ...e, ...(typeof p === 'function' ? p(e) : p) }));
  }, []);

  const toast = useCallback((m: string) => {
    setToast(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => saveJSON(SETTINGS_KEY, settings), [settings]);

  useEffect(() => {
    listHistory().then(setHistory);
    listRecents().then(setRecents);
    setSystemDark(matchMedia('(prefers-color-scheme: dark)').matches);
    if (canPickFolder && settings.remember) getSavedFolder().then((h) => h && setFolder(h));
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => setSystemDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const theme = settings.theme || (systemDark ? 'dark' : 'light');

  const applyAi = useCallback(
    async (img: SourceImage) => {
      setGenerating(true);
      setAiReason(null);
      try {
        const result = await requestAiOptimize({
          blob: img.blob,
          fileName: img.name,
          width: img.w,
          height: img.h,
        });
        setEdit({
          fields: result.fields,
          platform: result.platform,
          orient: result.orient,
          format: result.format,
          resize: result.resize,
          quality: result.quality,
          more: true,
          metaMode: 'update',
        });
        if (result.reason) setAiReason(result.reason);
        toast('AI optimized your image');
        return result;
      } catch (e) {
        const fields = suggestMetadata(img.name);
        fields.fileName = slug(fields.title) || slug(fields.fileName) || 'seo-optimized-image';
        setEdit({ fields, more: true });
        toast(e instanceof Error ? e.message : 'AI unavailable — used filename suggestions');
        return null;
      } finally {
        setGenerating(false);
      }
    },
    [setEdit, toast],
  );

  const openImage = useCallback(
    async (blob: Blob, name: string, recentId?: string) => {
      if (!blob.type.startsWith('image/')) return toast('That file is not an image');
      try {
        const img = await loadSource(blob, name, recentId);
        setSrc((old) => {
          if (old) URL.revokeObjectURL(old.url);
          return img;
        });
        setEditState({ ...freshEdit(settingsRef.current, img), ...(pending || {}) });
        setPending(null);
        setAiReason(null);
        setScreen('editor');
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
        const rec: RecentRecord = { id: img.id, name, blob, thumb: await thumbnail(blob, 220), at: Date.now() };
        await addRecent(rec);
        setRecents(await listRecents());
        if (settingsRef.current.autoOptimize) {
          await applyAi(img);
        }
      } catch {
        toast("Couldn't open this image");
      }
    },
    [pending, toast, applyAi],
  );

  const openRecent = useCallback((r: RecentRecord) => openImage(r.blob, r.name, r.id), [openImage]);

  const startImport = useCallback((p: Partial<Edit> | null) => {
    setPending(p);
    setScreen('import');
  }, []);

  const original: [number, number] = src ? [src.w, src.h] : [1200, 800];
  const out = outputSize(edit.platform, edit.orient, { w: edit.customW, h: edit.customH }, original);
  const payload = useMemo(
    () => ({ fields: edit.fields, copyright: edit.crOn ? edit.cr : null }),
    [edit.fields, edit.crOn, edit.cr],
  );

  const metaStatus =
    edit.metaMode === 'remove' ? 'Metadata removed' : hasPayload(payload) ? 'Metadata included' : 'No metadata';
  const estimate = formatBytes(estimateBytes(out[0], out[1], edit.format, edit.quality));
  // Prefer AI/SEO slug; never keep a raw camera/upload name as the export basename.
  const outName =
    safeName(
      slug(edit.fields.fileName) ||
        slug(edit.fields.title) ||
        'seo-optimized-image',
    ) + EXT[edit.format];
  const locLabel = isNative ? NATIVE_FOLDER : settings.location === 'folder' && folder ? folder.name : 'Downloads';

  const setTab = useCallback(
    (t: Tab) => {
      setEdit({ tab: t });
      const c = scrollRef.current;
      const m = c?.querySelector<HTMLElement>('[data-anchor="tabs"]');
      if (c && m && c.scrollTop > m.offsetTop) c.scrollTop = m.offsetTop;
    },
    [setEdit],
  );

  const setField = (k: FieldKey, v: string) => setEdit((e) => ({ fields: { ...e.fields, [k]: v } }));

  const generate = useCallback(async () => {
    if (generating || !src) return;
    await applyAi(src);
  }, [generating, src, applyAi]);

  const copyAll = useCallback(async () => {
    const text = Object.values(edit.fields).filter(Boolean).join('\n');
    if (!text) return toast('Nothing to copy yet');
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied');
    } catch {
      toast("Couldn't copy");
    }
  }, [edit.fields, toast]);

  const choosePlatform = (k: Platform) =>
    setEdit((e) => ({
      platform: k,
      orient: k in PRESETS && !PRESETS[k as keyof typeof PRESETS].sizes[e.orient] ? 'h' : e.orient,
    }));

  const onCustomW = (v: string) =>
    setEdit((e) => ({ customW: v, customH: e.lock && +v ? Math.round(+v / e.ratio) : e.customH }));
  const onCustomH = (v: string) =>
    setEdit((e) => ({ customH: v, customW: e.lock && +v ? Math.round(+v * e.ratio) : e.customW }));
  const toggleLock = () => setEdit((e) => ({ lock: !e.lock, ratio: (+e.customW || 1) / (+e.customH || 1) }));

  const savePreset = () => {
    const w = Math.round(+edit.customW),
      h = Math.round(+edit.customH);
    if (!w || !h) return toast('Enter a width and height first');
    if (settings.customPresets.some((p) => p.w === w && p.h === h)) return toast('Preset already saved');
    setSettings((s) => ({ ...s, customPresets: [...s.customPresets, { id: Date.now(), w, h }] }));
    toast('Preset saved');
  };
  const deletePreset = (id: number) =>
    setSettings((s) => ({ ...s, customPresets: s.customPresets.filter((p) => p.id !== id) }));

  const chooseDownloads = () => {
    setSettings((s) => ({ ...s, location: 'downloads' }));
    setSheet(null);
  };
  const chooseSavedFolder = () => {
    setSettings((s) => ({ ...s, location: 'folder' }));
    setSheet(null);
  };
  const chooseNewFolder = async () => {
    const h = await pickFolder(settings.remember);
    if (h) {
      setFolder(h);
      setSettings((s) => ({ ...s, location: 'folder' }));
    }
    setSheet(null);
  };

  const doExport = useCallback(async () => {
    if (exporting || !src) return;
    setExporting(true);
    try {
      let dir = settings.location === 'folder' ? folder : null;
      if (dir && !(await ensureFolderPermission(dir as never))) {
        dir = null;
        toast('Folder not available — saved to Downloads');
      }
      const r = await renderExport(src, {
        size: out,
        resize: edit.resize,
        format: edit.format,
        quality: edit.quality,
        metaMode: edit.metaMode,
        payload,
      });
      let file = outName.replace(/\.[^.]+$/, EXT[r.format]);
      let loc = 'Downloads';
      if (dir) {
        try {
          file = await saveToFolder(dir as never, file, r.blob);
          loc = dir.name;
        } catch {
          setFolder(null);
          await forgetFolder();
          setSettings((s) => ({ ...s, location: 'downloads' }));
          download(file, r.blob);
          toast('Folder not available — saved to Downloads');
        }
      } else if (isNative) {
        file = await saveNative(file, r.blob);
        loc = NATIVE_FOLDER;
      } else {
        download(file, r.blob);
      }
      if (r.fellBack) toast("This browser can't make WebP — saved as PNG");
      const rec: HistoryRecord = {
        id: crypto.randomUUID(),
        file,
        format: FMT_LABEL[r.format],
        w: out[0],
        h: out[1],
        bytes: r.blob.size,
        loc,
        at: Date.now(),
        thumb: await thumbnail(r.blob),
        blob: r.blob,
        resize: edit.resize,
      };
      await addHistory(rec);
      setHistory(await listHistory());
      setLastExport((old) => {
        if (old) URL.revokeObjectURL(old.url);
        return { ...rec, url: URL.createObjectURL(r.blob) };
      });
      setScreen('success');
    } catch {
      toast('Export failed — please try again');
    } finally {
      setExporting(false);
    }
  }, [exporting, src, settings.location, folder, out, edit, payload, outName, toast]);

  const share = useCallback(
    async (name: string, blob: Blob) => {
      if (!(await shareFile(name, blob))) toast("Sharing isn't supported in this browser");
    },
    [toast],
  );

  const deleteHistory = async (id: string) => {
    await idb.del('history', id);
    setHistory((h) => h.filter((x) => x.id !== id));
  };
  const clearHistory = async () => {
    await idb.clear('history');
    setHistory([]);
    toast('History cleared');
  };

  const setDefName = (v: string) => {
    setSettings((s) => ({ ...s, defName: v }));
    setEdit({ cr: crFrom(v) });
  };
  const setDefFormat = (f: Format) => {
    setSettings((s) => ({ ...s, defFormat: f }));
    setEdit({ format: f });
  };
  const setTheme = (t: 'light' | 'dark' | null) => setSettings((s) => ({ ...s, theme: t }));
  const toggleRemember = async () => {
    const on = !settings.remember;
    setSettings((s) => ({ ...s, remember: on }));
    if (!on) await forgetFolder();
    else if (folder) await idb.set('kv', 'exportDir', folder);
  };
  const toggleAutoOptimize = () => setSettings((s) => ({ ...s, autoOptimize: !s.autoOptimize }));

  return {
    screen,
    setScreen,
    theme,
    settings,
    src,
    edit,
    setEdit,
    generating,
    exporting,
    sheet,
    setSheet,
    fullscreen,
    setFullscreen,
    toastMsg,
    toast,
    history,
    recents,
    lastExport,
    folder,
    scrollRef,
    aiReason,
    out,
    metaStatus,
    estimate,
    outName,
    locLabel,
    original,
    openImage,
    openRecent,
    startImport,
    setTab,
    setField,
    generate,
    copyAll,
    choosePlatform,
    onCustomW,
    onCustomH,
    toggleLock,
    savePreset,
    deletePreset,
    chooseDownloads,
    chooseSavedFolder,
    chooseNewFolder,
    doExport,
    share,
    deleteHistory,
    clearHistory,
    setDefName,
    setDefFormat,
    setTheme,
    toggleRemember,
    toggleAutoOptimize,
  };
}

export type App = ReturnType<typeof useMetaPix>;
