'use client';

import JSZip from 'jszip';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mapPool, requestAiOptimize } from '../lib/ai';
import { loadSource, renderExport, thumbnail, type SourceImage } from '../lib/image';
import {
  CORE_FIELDS,
  EXT,
  EXTRA_FIELDS,
  FMT_LABEL,
  PRESETS,
  emptyFields,
  formatBytes,
  outputSize,
  slug,
  type FieldKey,
  type Fields,
  type Format,
  type Orient,
  type Platform,
  type ResizeMode,
} from '../lib/presets';
import { download } from '../lib/save';
import { loadJSON, saveJSON } from '../lib/storage';
import { suggestMetadata } from '../lib/suggest';

export type ItemStatus = 'queued' | 'optimizing' | 'ready' | 'error' | 'exported';

export type QueueItem = {
  id: string;
  originalName: string;
  src: SourceImage;
  thumb: string;
  status: ItemStatus;
  error?: string;
  fields: Fields;
  platform: Platform;
  orient: Orient;
  format: Format;
  resize: ResizeMode;
  quality: number;
  crOn: boolean;
  creator: string;
  reason?: string;
};

type Settings = {
  theme: 'light' | 'dark' | null;
  defName: string;
  defFormat: Format;
  autoOptimize: boolean;
  concurrency: number;
};

const SETTINGS_KEY = 'metapix.web.settings';
const defaults: Settings = {
  theme: null,
  defName: 'Mostafij Emon',
  defFormat: 'webp',
  autoOptimize: true,
  concurrency: 3,
};

const safeName = (n: string) => n.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'seo-image';

function uniqueSlug(base: string, used: Set<string>) {
  const s = safeName(slug(base) || 'seo-image');
  if (!used.has(s)) {
    used.add(s);
    return s;
  }
  let i = 2;
  while (used.has(`${s}-${i}`)) i++;
  const out = `${s}-${i}`;
  used.add(out);
  return out;
}

export function useBulkStudio() {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === 'undefined') return defaults;
    return { ...defaults, ...loadJSON(SETTINGS_KEY, defaults) };
  });
  const [items, setItems] = useState<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toastMsg, setToast] = useState<string | null>(null);
  const [systemDark, setSystemDark] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const usedSlugs = useRef(new Set<string>());
  const abortRef = useRef<AbortController | null>(null);

  const toast = useCallback((m: string) => {
    setToast(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => saveJSON(SETTINGS_KEY, settings), [settings]);
  useEffect(() => {
    setSystemDark(matchMedia('(prefers-color-scheme: dark)').matches);
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => setSystemDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const theme = settings.theme || (systemDark ? 'dark' : 'light');
  const selected = items.find((i) => i.id === selectedId) || null;

  const patchItem = useCallback((id: string, patch: Partial<QueueItem> | ((item: QueueItem) => Partial<QueueItem>)) => {
    setItems((list) =>
      list.map((it) => {
        if (it.id !== id) return it;
        const p = typeof patch === 'function' ? patch(it) : patch;
        return { ...it, ...p };
      }),
    );
  }, []);

  const optimizeOne = useCallback(
    async (item: QueueItem, signal?: AbortSignal) => {
      if (item.fields.fileName) usedSlugs.current.delete(item.fields.fileName);
      patchItem(item.id, { status: 'optimizing', error: undefined });
      try {
        const result = await requestAiOptimize({
          blob: item.src.blob,
          fileName: item.originalName,
          width: item.src.w,
          height: item.src.h,
          signal,
        });
        const fileName = uniqueSlug(result.fields.fileName || result.fields.title, usedSlugs.current);
        patchItem(item.id, {
          status: 'ready',
          fields: { ...result.fields, fileName },
          platform: result.platform,
          orient: result.orient,
          format: result.format,
          resize: result.resize,
          quality: result.quality,
          reason: result.reason,
        });
        return true;
      } catch (e) {
        if (signal?.aborted) return false;
        const fields = suggestMetadata(item.originalName);
        const fileName = uniqueSlug(fields.title || fields.fileName, usedSlugs.current);
        patchItem(item.id, {
          status: 'error',
          error: e instanceof Error ? e.message : 'AI failed',
          fields: { ...fields, fileName },
        });
        return false;
      }
    },
    [patchItem],
  );

  const addFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
      if (!files.length) return toast('Select image files only');

      const created: QueueItem[] = [];
      for (const file of files) {
        try {
          const src = await loadSource(file, file.name);
          const thumb = await thumbnail(file, 180);
          created.push({
            id: src.id,
            originalName: file.name,
            src,
            thumb,
            status: 'queued',
            fields: emptyFields(),
            platform: 'instagram',
            orient: 's',
            format: settings.defFormat,
            resize: 'fill',
            quality: 88,
            crOn: true,
            creator: settings.defName,
          });
        } catch {
          /* skip bad file */
        }
      }
      if (!created.length) return toast("Couldn't open those images");

      setItems((list) => [...created, ...list]);
      setSelectedId(created[0].id);
      toast(`${created.length} image${created.length > 1 ? 's' : ''} added`);

      if (settings.autoOptimize) {
        setBusy(true);
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        await mapPool(created, settings.concurrency, async (item) => {
          if (ac.signal.aborted) return;
          await optimizeOne(item, ac.signal);
        });
        if (!ac.signal.aborted) {
          toast('Bulk SEO optimize finished');
          setBusy(false);
        }
      }
    },
    [settings.autoOptimize, settings.concurrency, settings.defFormat, settings.defName, optimizeOne, toast],
  );

  const optimizeSelected = useCallback(async () => {
    if (!selected || busy) return;
    setBusy(true);
    await optimizeOne(selected);
    setBusy(false);
    toast('SEO metadata updated');
  }, [selected, busy, optimizeOne, toast]);

  const optimizeAll = useCallback(async () => {
    if (!items.length || busy) return;
    setBusy(true);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const targets = items.filter((i) => i.status !== 'optimizing');
    await mapPool(targets, settings.concurrency, async (item) => {
      if (ac.signal.aborted) return;
      await optimizeOne(item, ac.signal);
    });
    if (!ac.signal.aborted) {
      toast('All images SEO-optimized');
      setBusy(false);
    }
  }, [items, busy, settings.concurrency, optimizeOne, toast]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setBusy(false);
    toast('Stopped');
  }, [toast]);

  const setField = useCallback(
    (key: FieldKey, value: string) => {
      if (!selectedId) return;
      patchItem(selectedId, (it) => ({
        fields: {
          ...it.fields,
          [key]: key === 'fileName' ? slug(value) : value,
        },
        status: it.status === 'error' ? 'ready' : it.status,
      }));
    },
    [selectedId, patchItem],
  );

  const setSelectedPatch = useCallback(
    (patch: Partial<QueueItem>) => {
      if (!selectedId) return;
      patchItem(selectedId, patch);
    },
    [selectedId, patchItem],
  );

  const removeItem = useCallback(
    (id: string) => {
      setItems((list) => {
        const next = list.filter((i) => i.id !== id);
        const gone = list.find((i) => i.id === id);
        if (gone) URL.revokeObjectURL(gone.src.url);
        return next;
      });
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [],
  );

  const clearAll = useCallback(() => {
    items.forEach((i) => URL.revokeObjectURL(i.src.url));
    usedSlugs.current.clear();
    setItems([]);
    setSelectedId(null);
  }, [items]);

  const exportOne = useCallback(
    async (item: QueueItem) => {
      const out = outputSize(item.platform, item.orient, { w: item.src.w, h: item.src.h }, [item.src.w, item.src.h]);
      const fileName = safeName(slug(item.fields.fileName) || slug(item.fields.title) || 'seo-image');
      const r = await renderExport(item.src, {
        size: out,
        resize: item.resize,
        format: item.format,
        quality: item.quality,
        metaMode: 'update',
        payload: {
          fields: { ...item.fields, fileName },
          copyright: item.crOn
            ? { creator: item.creator, owner: item.creator, notice: item.creator ? `© ${item.creator}` : '' }
            : null,
        },
      });
      const name = fileName + EXT[r.format];
      download(name, r.blob);
      patchItem(item.id, { status: 'exported', fields: { ...item.fields, fileName }, format: r.format });
      return { name, blob: r.blob };
    },
    [patchItem],
  );

  const exportSelected = useCallback(async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await exportOne(selected);
      toast('Exported with SEO filename');
    } catch {
      toast('Export failed');
    } finally {
      setBusy(false);
    }
  }, [selected, exportOne, toast]);

  const exportAll = useCallback(async () => {
    const ready = items.filter((i) => i.status === 'ready' || i.status === 'exported' || i.status === 'error');
    if (!ready.length) return toast('Optimize images first');
    setBusy(true);
    try {
      if (ready.length === 1) {
        await exportOne(ready[0]);
        toast('Exported 1 image');
        return;
      }
      const zip = new JSZip();
      const used = new Set<string>();
      for (const item of ready) {
        const out = outputSize(item.platform, item.orient, { w: item.src.w, h: item.src.h }, [item.src.w, item.src.h]);
        let fileName = safeName(slug(item.fields.fileName) || slug(item.fields.title) || 'seo-image');
        if (used.has(fileName)) {
          let n = 2;
          while (used.has(`${fileName}-${n}`)) n++;
          fileName = `${fileName}-${n}`;
        }
        used.add(fileName);
        const r = await renderExport(item.src, {
          size: out,
          resize: item.resize,
          format: item.format,
          quality: item.quality,
          metaMode: 'update',
          payload: {
            fields: { ...item.fields, fileName },
            copyright: item.crOn
              ? { creator: item.creator, owner: item.creator, notice: item.creator ? `© ${item.creator}` : '' }
              : null,
          },
        });
        zip.file(fileName + EXT[r.format], r.blob);
        patchItem(item.id, { status: 'exported', fields: { ...item.fields, fileName }, format: r.format });
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      download(`meta-pix-seo-${Date.now()}.zip`, blob);
      toast(`Exported ${ready.length} images as ZIP`);
    } catch {
      toast('Bulk export failed');
    } finally {
      setBusy(false);
    }
  }, [items, exportOne, patchItem, toast]);

  const stats = useMemo(() => {
    const total = items.length;
    const ready = items.filter((i) => i.status === 'ready' || i.status === 'exported').length;
    const optimizing = items.filter((i) => i.status === 'optimizing').length;
    const errors = items.filter((i) => i.status === 'error').length;
    return { total, ready, optimizing, errors };
  }, [items]);

  const selectedOut = selected
    ? outputSize(selected.platform, selected.orient, { w: selected.src.w, h: selected.src.h }, [
        selected.src.w,
        selected.src.h,
      ])
    : ([0, 0] as [number, number]);

  return {
    theme,
    settings,
    setSettings,
    items,
    selected,
    selectedId,
    setSelectedId,
    busy,
    toastMsg,
    toast,
    stats,
    selectedOut,
    fieldsList: [...CORE_FIELDS, ...EXTRA_FIELDS] as const,
    presets: PRESETS,
    fmtLabel: FMT_LABEL,
    formatBytes,
    addFiles,
    optimizeSelected,
    optimizeAll,
    stop,
    setField,
    setSelectedPatch,
    removeItem,
    clearAll,
    exportSelected,
    exportAll,
  };
}

export type BulkStudio = ReturnType<typeof useBulkStudio>;
