import type { ProjectSummary, ScribeProject } from '../types/scribe';

const DB_NAME = 'openscribe-studio-db';
const DB_VERSION = 2;
const STORE_PROJECTS = 'projects';
const STORE_META = 'meta';
const ACTIVE_KEY = 'active-project';
const ACTIVE_ID_KEY = 'active-project-id';

interface TauriInternals {
  invoke?: <T = unknown>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
}

export function isTauriRuntime(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as { __TAURI_INTERNALS__?: TauriInternals }).__TAURI_INTERNALS__?.invoke === 'function'
  );
}

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const internals = (window as unknown as { __TAURI_INTERNALS__?: TauriInternals }).__TAURI_INTERNALS__;
  if (!internals?.invoke) throw new Error('Tauri runtime indisponível');
  return internals.invoke<T>(cmd, args);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS);
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function toSummary(project: ScribeProject, source: ProjectSummary['source']): ProjectSummary {
  return {
    id: project.id,
    title: project.title || 'Projeto sem nome',
    updatedAt: project.updatedAt || Date.now(),
    elementCount: project.elements?.length ?? 0,
    aspectRatio: project.aspectRatio,
    boardTheme: project.boardTheme,
    source,
  };
}

export async function saveProjectToIndexedDb(
  project: ScribeProject,
): Promise<{ savedAt: number; target: 'local-db' | 'desktop-disk' }> {
  const stamped: ScribeProject = { ...project, updatedAt: Date.now() };

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_PROJECTS, STORE_META], 'readwrite');
      const pStore = tx.objectStore(STORE_PROJECTS);
      const mStore = tx.objectStore(STORE_META);
      pStore.put(stamped, stamped.id);
      pStore.put(stamped, ACTIVE_KEY);
      mStore.put(stamped.id, ACTIVE_ID_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Graceful ignore in restricted incognito contexts
  }

  if (isTauriRuntime()) {
    try {
      await tauriInvoke('save_project_file', {
        id: stamped.id,
        json: JSON.stringify(stamped, null, 2),
      });
      return { savedAt: stamped.updatedAt, target: 'desktop-disk' };
    } catch {
      // Fallback status still succeeds via IndexedDB
    }
  }

  return { savedAt: stamped.updatedAt, target: 'local-db' };
}

export async function loadProjectFromIndexedDb(): Promise<ScribeProject | null> {
  try {
    const db = await openDb();
    const res = await new Promise<ScribeProject | null>((resolve, reject) => {
      const tx = db.transaction([STORE_PROJECTS, STORE_META], 'readonly');
      const mReq = tx.objectStore(STORE_META).get(ACTIVE_ID_KEY);
      mReq.onsuccess = () => {
        const activeId = mReq.result as string | undefined;
        const pStore = tx.objectStore(STORE_PROJECTS);
        const targetReq = pStore.get(activeId || ACTIVE_KEY);
        targetReq.onsuccess = () => {
          const hit = targetReq.result as ScribeProject | undefined;
          if (hit) {
            resolve(hit);
          } else {
            const fallbackReq = pStore.get(ACTIVE_KEY);
            fallbackReq.onsuccess = () => resolve((fallbackReq.result as ScribeProject | undefined) ?? null);
            fallbackReq.onerror = () => reject(fallbackReq.error);
          }
        };
        targetReq.onerror = () => reject(targetReq.error);
      };
      mReq.onerror = () => reject(mReq.error);
    });
    db.close();
    if (res) return res;
  } catch {
    // Try Tauri disk if IndexedDB unavailable
  }

  if (isTauriRuntime()) {
    try {
      const summaries = await listSavedProjects();
      if (summaries.length > 0) {
        return await loadSavedProjectById(summaries[0].id);
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export async function listSavedProjects(): Promise<ProjectSummary[]> {
  const byId = new Map<string, ProjectSummary>();

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) {
          resolve();
          return;
        }
        const key = String(cursor.key);
        const val = cursor.value as ScribeProject | undefined;
        if (key !== ACTIVE_KEY && val && val.id && Array.isArray(val.elements)) {
          byId.set(val.id, toSummary(val, 'local-db'));
        }
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
    db.close();
  } catch {
    // ignore
  }

  if (isTauriRuntime()) {
    try {
      const diskItems = await tauriInvoke<Array<{ id: string; json: string }>>('list_saved_projects');
      for (const item of diskItems) {
        const parsed = JSON.parse(item.json) as ScribeProject;
        if (parsed && parsed.id && Array.isArray(parsed.elements)) {
          byId.set(parsed.id, toSummary(parsed, 'desktop-disk'));
        }
      }
    } catch {
      // ignore
    }
  }

  return Array.from(byId.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadSavedProjectById(id: string): Promise<ScribeProject | null> {
  if (isTauriRuntime()) {
    try {
      const json = await tauriInvoke<string>('load_project_file', { id });
      const parsed = JSON.parse(json) as ScribeProject;
      if (parsed && Array.isArray(parsed.elements)) {
        await saveProjectToIndexedDb(parsed);
        return parsed;
      }
    } catch {
      // Fallback to IndexedDB
    }
  }

  try {
    const db = await openDb();
    const proj = await new Promise<ScribeProject | null>((resolve, reject) => {
      const tx = db.transaction([STORE_PROJECTS, STORE_META], 'readwrite');
      const req = tx.objectStore(STORE_PROJECTS).get(id);
      req.onsuccess = () => {
        const result = (req.result as ScribeProject | undefined) ?? null;
        if (result) {
          tx.objectStore(STORE_PROJECTS).put(result, ACTIVE_KEY);
          tx.objectStore(STORE_META).put(result.id, ACTIVE_ID_KEY);
        }
        resolve(result);
      };
      req.onerror = () => reject(req.error);
    });
    db.close();
    return proj;
  } catch {
    return null;
  }
}

export async function deleteSavedProjectById(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      tx.objectStore(STORE_PROJECTS).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }

  if (isTauriRuntime()) {
    try {
      await tauriInvoke('delete_project_file', { id });
    } catch {
      // ignore
    }
  }
}

export async function saveVideoOutput(
  blob: Blob,
  filename: string,
): Promise<{ savedPath?: string }> {
  if (isTauriRuntime()) {
    try {
      const bytes = Array.from(new Uint8Array(await blob.arrayBuffer()));
      const savedPath = await tauriInvoke<string>('save_exported_video', {
        filename,
        bytes,
      });
      return { savedPath };
    } catch {
      // Fall back to standard WebView2/browser download
    }
  }

  downloadBlob(blob, filename);
  return {};
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
