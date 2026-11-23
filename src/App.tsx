import { PanelLeft, SlidersHorizontal } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AssetSidebar, type SidebarTab } from './components/AssetSidebar';
import { ExportModal } from './components/ExportModal';
import { InspectorPanel } from './components/InspectorPanel';
import { StageCanvas } from './components/StageCanvas';
import { TimelineDock } from './components/TimelineDock';
import { TopBar } from './components/TopBar';
import type { VectorAssetPreset } from './data/assetLibrary';
import { createBlankProject, createStarterProject } from './data/presets';
import { generateStoryboardFromScript } from './engine/scriptGenerator';
import { downloadBlob, loadProjectFromIndexedDb, saveProjectToIndexedDb } from './engine/storage';
import { parseSvgToStrokes } from './engine/svgParser';
import {
  buildTimelineSchedule,
  computeTargetCamera,
  fitElementsToVoiceDuration,
} from './engine/timeline';
import type {
  AudioTrackData,
  HandwritingFont,
  ScribeElement,
  ScribeProject,
  TraceConfig,
} from './types/scribe';

export default function App() {
  const [project, setProject] = useState<ScribeProject>(() => createStarterProject());
  const [history, setHistory] = useState<ScribeProject[]>([]);
  const [future, setFuture] = useState<ScribeProject[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>('demo-1');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('vectors');
  const [editCamera, setEditCamera] = useState({ cx: 0, cy: 0, zoom: 1.0 });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [playheadTime, setPlayheadTime] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);

  // Mobile responsive drawers
  const [mobileDrawer, setMobileDrawer] = useState<'none' | 'assets' | 'inspector'>('none');

  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const { totalDuration } = useMemo(() => buildTimelineSchedule(project), [project]);

  // Restore saved project from IndexedDB on first mount
  useEffect(() => {
    let alive = true;
    loadProjectFromIndexedDb().then((saved) => {
      if (alive && saved && saved.elements) {
        setProject(saved);
        setSelectedId(saved.elements[0]?.id ?? null);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  // Debounced auto-save to IndexedDB
  useEffect(() => {
    const t = window.setTimeout(() => {
      saveProjectToIndexedDb(project);
    }, 500);
    return () => clearTimeout(t);
  }, [project]);

  const commitProject = useCallback((updater: (prev: ScribeProject) => ScribeProject) => {
    setProject((prev) => {
      setHistory((h) => [...h.slice(-29), prev]);
      setFuture([]);
      return updater(prev);
    });
  }, []);

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const previous = h[h.length - 1];
      setProject((cur) => {
        setFuture((f) => [cur, ...f.slice(0, 29)]);
        return previous;
      });
      return h.slice(0, -1);
    });
  }, []);

  const handleRedo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setProject((cur) => {
        setHistory((h) => [...h.slice(-29), cur]);
        return next;
      });
      return f.slice(1);
    });
  }, []);

  // Manage Audio elements during playback
  const stopAudioTracks = useCallback(() => {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current = null;
    }
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current = null;
    }
  }, []);

  const startAudioTracks = useCallback(
    (fromSec: number) => {
      stopAudioTracks();
      if (project.voiceover && fromSec < project.voiceover.duration) {
        const a = new Audio(project.voiceover.dataUrl);
        a.volume = Math.max(0, Math.min(1, project.voiceover.volume));
        a.currentTime = Math.max(0, fromSec - project.voiceover.offset);
        a.play().catch(() => undefined);
        voiceAudioRef.current = a;
      }
      if (project.music) {
        const m = new Audio(project.music.dataUrl);
        m.loop = true;
        m.volume = Math.max(0, Math.min(1, project.music.volume));
        m.currentTime = fromSec % Math.max(1, project.music.duration || 1);
        m.play().catch(() => undefined);
        musicAudioRef.current = m;
      }
    },
    [project.voiceover, project.music, stopAudioTracks],
  );

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopAudioTracks();
      return;
    }

    lastTickRef.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.08, (now - lastTickRef.current) / 1000);
      lastTickRef.current = now;
      setPlayheadTime((prev) => {
        const next = prev + dt;
        if (next >= totalDuration) {
          setIsPlaying(false);
          setIsScrubbing(true);
          return totalDuration;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopAudioTracks();
    };
  }, [isPlaying, totalDuration, stopAudioTracks]);

  const togglePlay = useCallback(() => {
    setIsPlaying((playing) => {
      if (playing) {
        setIsScrubbing(true);
        return false;
      }
      const startAt = playheadTime >= totalDuration - 0.05 ? 0 : playheadTime;
      setPlayheadTime(startAt);
      setIsScrubbing(true);
      startAudioTracks(startAt);
      return true;
    });
  }, [playheadTime, totalDuration, startAudioTracks]);

  const handleStopToEdit = useCallback(() => {
    setIsPlaying(false);
    setIsScrubbing(false);
    setPlayheadTime(0);
    stopAudioTracks();
  }, [stopAudioTracks]);

  const handleScrub = useCallback((t: number) => {
    setIsPlaying(false);
    setIsScrubbing(true);
    setPlayheadTime(t);
  }, []);

  const handleUpdateMeta = (patch: Partial<ScribeProject>) => {
    commitProject((prev) => ({ ...prev, ...patch }));
  };

  const handleUpdateElement = (
    id: string,
    patch: Partial<ScribeElement>,
    recordHistory = true,
  ) => {
    const apply = (prev: ScribeProject) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)),
    });
    if (recordHistory) commitProject(apply);
    else setProject(apply);
  };

  const nextSpawnPosition = () => {
    const count = project.elements.length;
    if (count === 0) return { x: 0, y: 0 };
    return {
      x: Math.round(editCamera.cx + ((count % 3) - 1) * 40),
      y: Math.round(editCamera.cy + ((count % 2) - 0.5) * 30),
    };
  };

  const handleAddVectorAsset = (preset: VectorAssetPreset) => {
    const parsed = parseSvgToStrokes(preset.svg);
    const pos = nextSpawnPosition();
    const isDark = project.boardTheme === 'chalkboard' || project.boardTheme === 'blueprint';
    const w = 240;
    const h = Math.max(80, Math.round(w / Math.max(0.4, parsed.aspectRatio)));

    const el: ScribeElement = {
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: preset.name,
      type: 'svg',
      x: pos.x,
      y: pos.y,
      width: w,
      height: h,
      rotation: 0,
      drawDuration: 2.0,
      pauseDuration: 0.35,
      transitionDuration: project.elements.length === 0 ? 0 : 0.55,
      animationMode: 'draw',
      strokeColor: isDark ? '#f8fafc' : preset.defaultStrokeColor,
      strokeWidth: 3.4,
      fillReveal: true,
      fillColor: preset.defaultFillColor,
      opacity: 1,
      camera: { cx: editCamera.cx, cy: editCamera.cy, zoom: editCamera.zoom, autoFit: false },
      strokes: parsed.strokes,
      sourceSvg: preset.svg,
    };

    commitProject((prev) => ({ ...prev, elements: [...prev.elements, el] }));
    setSelectedId(el.id);
    setIsScrubbing(false);
    setMobileDrawer('none');
  };

  const handleImportSvgText = (name: string, svgText: string) => {
    const parsed = parseSvgToStrokes(svgText);
    if (parsed.strokes.length === 0) {
      alert('Nenhum caminho vetorial encontrado nesse arquivo SVG.');
      return;
    }
    const pos = nextSpawnPosition();
    const w = 260;
    const h = Math.max(80, Math.round(w / Math.max(0.3, parsed.aspectRatio)));
    const isDark = project.boardTheme === 'chalkboard' || project.boardTheme === 'blueprint';

    const el: ScribeElement = {
      id: `el-svg-${Date.now()}`,
      name,
      type: 'svg',
      x: pos.x,
      y: pos.y,
      width: w,
      height: h,
      rotation: 0,
      drawDuration: Math.min(6, Math.max(1.8, parsed.strokes.length * 0.14)),
      pauseDuration: 0.4,
      transitionDuration: project.elements.length === 0 ? 0 : 0.55,
      animationMode: 'draw',
      strokeColor: isDark ? '#f8fafc' : '#18181b',
      strokeWidth: 3,
      fillReveal: true,
      fillColor: '#fed7aa',
      opacity: 1,
      camera: { cx: editCamera.cx, cy: editCamera.cy, zoom: editCamera.zoom, autoFit: false },
      strokes: parsed.strokes,
      sourceSvg: svgText,
    };

    commitProject((prev) => ({ ...prev, elements: [...prev.elements, el] }));
    setSelectedId(el.id);
    setIsScrubbing(false);
    setMobileDrawer('none');
  };

  const handleAddTracedImage = (params: {
    name: string;
    dataUrl: string;
    strokes: ScribeElement['strokes'];
    aspectRatio: number;
    traceConfig: TraceConfig;
  }) => {
    const pos = nextSpawnPosition();
    const w = 280;
    const h = Math.max(80, Math.round(w / Math.max(0.35, params.aspectRatio)));
    const isDark = project.boardTheme === 'chalkboard' || project.boardTheme === 'blueprint';

    const el: ScribeElement = {
      id: `el-img-${Date.now()}`,
      name: params.name,
      type: 'traced-image',
      x: pos.x,
      y: pos.y,
      width: w,
      height: h,
      rotation: 0,
      drawDuration: Math.min(6.5, Math.max(2.0, params.strokes.length * 0.08)),
      pauseDuration: 0.5,
      transitionDuration: project.elements.length === 0 ? 0 : 0.6,
      animationMode: 'draw',
      strokeColor: isDark ? '#f8fafc' : '#18181b',
      strokeWidth: 2.6,
      fillReveal: params.traceConfig.revealOriginal,
      fillColor: '#ffffff',
      opacity: 1,
      camera: { cx: editCamera.cx, cy: editCamera.cy, zoom: editCamera.zoom, autoFit: false },
      strokes: params.strokes,
      rasterDataUrl: params.dataUrl,
      traceConfig: params.traceConfig,
    };

    commitProject((prev) => ({ ...prev, elements: [...prev.elements, el] }));
    setSelectedId(el.id);
    setIsScrubbing(false);
    setMobileDrawer('none');
  };

  const handleAddText = (text: string, fontFamily: HandwritingFont, fontSize: number) => {
    const clean = text.trim() || 'Novo Texto';
    const pos = nextSpawnPosition();
    const isDark = project.boardTheme === 'chalkboard' || project.boardTheme === 'blueprint';
    const ink = isDark ? '#f8fafc' : '#18181b';

    const el: ScribeElement = {
      id: `el-txt-${Date.now()}`,
      name: clean.slice(0, 24),
      type: 'text',
      x: pos.x,
      y: pos.y,
      width: 460,
      height: 180,
      rotation: 0,
      drawDuration: Math.max(1.2, Math.min(5, clean.split(/\s+/).length * 0.35)),
      pauseDuration: 0.45,
      transitionDuration: project.elements.length === 0 ? 0 : 0.45,
      animationMode: 'draw',
      strokeColor: ink,
      strokeWidth: 3,
      fillReveal: false,
      fillColor: ink,
      opacity: 1,
      camera: { cx: editCamera.cx, cy: editCamera.cy, zoom: editCamera.zoom, autoFit: false },
      strokes: [],
      text: clean,
      fontFamily,
      fontSize,
      textAlign: 'center',
    };

    commitProject((prev) => ({ ...prev, elements: [...prev.elements, el] }));
    setSelectedId(el.id);
    setIsScrubbing(false);
    setMobileDrawer('none');
  };

  const handleGenerateScript = (script: string, replaceBoard: boolean) => {
    const isDark = project.boardTheme === 'chalkboard' || project.boardTheme === 'blueprint';
    const generated = generateStoryboardFromScript(script, { isDarkBoard: isDark });
    if (generated.length === 0) return;

    commitProject((prev) => ({
      ...prev,
      elements: replaceBoard ? generated : [...prev.elements, ...generated],
    }));
    setSelectedId(generated[0].id);
    setEditCamera({
      cx: generated[0].camera.cx,
      cy: generated[0].camera.cy,
      zoom: generated[0].camera.zoom,
    });
    setIsScrubbing(false);
    setPlayheadTime(0);
    setMobileDrawer('none');
  };

  const handleMoveOrder = (id: string, dir: -1 | 1) => {
    commitProject((prev) => {
      const idx = prev.elements.findIndex((e) => e.id === id);
      const nextIdx = idx + dir;
      if (idx === -1 || nextIdx < 0 || nextIdx >= prev.elements.length) return prev;
      const copy = [...prev.elements];
      const [item] = copy.splice(idx, 1);
      copy.splice(nextIdx, 0, item);
      return { ...prev, elements: copy };
    });
  };

  const handleDuplicate = (id: string) => {
    const src = project.elements.find((e) => e.id === id);
    if (!src) return;
    const copy: ScribeElement = {
      ...src,
      id: `el-copy-${Date.now()}`,
      name: `${src.name} (cópia)`,
      x: src.x + 50,
      y: src.y + 40,
    };
    commitProject((prev) => ({ ...prev, elements: [...prev.elements, copy] }));
    setSelectedId(copy.id);
  };

  const handleDelete = useCallback(
    (id: string) => {
      commitProject((prev) => ({
        ...prev,
        elements: prev.elements.filter((e) => e.id !== id),
      }));
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [commitProject],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' && selectedId) {
        handleDelete(selectedId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, handleUndo, handleRedo, handleDelete]);

  const selectedElement = useMemo(
    () => project.elements.find((e) => e.id === selectedId) ?? null,
    [project.elements, selectedId],
  );

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const safe = (project.title || 'projeto').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadBlob(blob, `${safe}.openscribe.json`);
  };

  const handleImportJson = async (file: File) => {
    try {
      const txt = await file.text();
      const parsed = JSON.parse(txt) as ScribeProject;
      if (!parsed || !Array.isArray(parsed.elements)) throw new Error('Formato inválido');
      commitProject(() => parsed);
      setSelectedId(parsed.elements[0]?.id ?? null);
      setPlayheadTime(0);
      setIsScrubbing(false);
    } catch {
      alert('Arquivo de projeto OpenScribe inválido.');
    }
  };

  const handleSyncToVoice = () => {
    if (!project.voiceover) return;
    commitProject((prev) => ({
      ...prev,
      elements: fitElementsToVoiceDuration(prev.elements, prev.voiceover!.duration),
    }));
  };

  return (
    <div className="studio-app">
      <TopBar
        project={project}
        isPlaying={isPlaying}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        onUpdateProjectMeta={handleUpdateMeta}
        onTogglePlay={togglePlay}
        onStop={handleStopToEdit}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onLoadDemo={() => {
          const demo = createStarterProject();
          commitProject(() => demo);
          setSelectedId(demo.elements[0]?.id ?? null);
          setEditCamera({ cx: 0, cy: 0, zoom: 1 });
          setIsScrubbing(false);
          setPlayheadTime(0);
        }}
        onNewBlank={() => {
          const blank = createBlankProject();
          commitProject(() => blank);
          setSelectedId(null);
          setEditCamera({ cx: 0, cy: 0, zoom: 1 });
          setIsScrubbing(false);
          setPlayheadTime(0);
        }}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onOpenExportModal={() => {
          setIsPlaying(false);
          setExportOpen(true);
        }}
      />

      <main className="studio-workspace">
        <div className={`drawer-slot left ${mobileDrawer === 'assets' ? 'mobile-open' : ''}`}>
          <AssetSidebar
            project={project}
            activeTab={sidebarTab}
            onChangeTab={setSidebarTab}
            onAddVectorAsset={handleAddVectorAsset}
            onImportSvgText={handleImportSvgText}
            onAddTracedImage={handleAddTracedImage}
            onAddText={handleAddText}
            onGenerateScript={handleGenerateScript}
            onSetVoiceover={(t: AudioTrackData | null) => handleUpdateMeta({ voiceover: t })}
            onSetMusic={(m: AudioTrackData | null) => handleUpdateMeta({ music: m })}
            onSyncScenesToVoice={handleSyncToVoice}
          />
        </div>

        <StageCanvas
          project={project}
          isPlaying={isPlaying}
          isScrubbing={isScrubbing}
          playheadTime={playheadTime}
          totalDuration={totalDuration}
          selectedId={selectedId}
          editCamera={editCamera}
          onChangeEditCamera={setEditCamera}
          onSelectElement={(id) => {
            setSelectedId(id);
            if (isScrubbing && !isPlaying) setIsScrubbing(false);
          }}
          onUpdateElement={handleUpdateElement}
          onTogglePlay={togglePlay}
          onResetView={() => {
            setIsPlaying(false);
            setIsScrubbing(false);
            setEditCamera({ cx: 0, cy: 0, zoom: 1 });
          }}
        />

        <div className={`drawer-slot right ${mobileDrawer === 'inspector' ? 'mobile-open' : ''}`}>
          <InspectorPanel
            element={selectedElement}
            editCamera={editCamera}
            onUpdateElement={(id, patch) => handleUpdateElement(id, patch, true)}
            onCaptureCameraForElement={(id) =>
              handleUpdateElement(
                id,
                {
                  camera: {
                    cx: Math.round(editCamera.cx),
                    cy: Math.round(editCamera.cy),
                    zoom: Number(editCamera.zoom.toFixed(2)),
                    autoFit: false,
                  },
                },
                true,
              )
            }
            onFocusElementCamera={(el) => {
              setIsScrubbing(false);
              const cam = computeTargetCamera(el, project.aspectRatio);
              setEditCamera(cam);
            }}
            onMoveOrder={handleMoveOrder}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
        </div>
      </main>

      <div className="mobile-drawer-bar">
        <button
          type="button"
          className={`mobile-drawer-btn ${mobileDrawer === 'assets' ? 'active' : ''}`}
          onClick={() => setMobileDrawer((d) => (d === 'assets' ? 'none' : 'assets'))}
        >
          <PanelLeft size={15} />
          <span>Adicionar &amp; Áudio</span>
        </button>
        <button
          type="button"
          className={`mobile-drawer-btn ${mobileDrawer === 'inspector' ? 'active' : ''}`}
          onClick={() => setMobileDrawer((d) => (d === 'inspector' ? 'none' : 'inspector'))}
        >
          <SlidersHorizontal size={15} />
          <span>Propriedades</span>
        </button>
      </div>

      <TimelineDock
        project={project}
        playheadTime={playheadTime}
        selectedId={selectedId}
        onSelectElement={(id) => setSelectedId(id)}
        onScrub={handleScrub}
        onMoveOrder={handleMoveOrder}
      />

      {exportOpen && <ExportModal project={project} onClose={() => setExportOpen(false)} />}
    </div>
  );
}
