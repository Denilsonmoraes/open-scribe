import {
  Hand,
  LocateFixed,
  Maximize2,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { hitTestElement, renderProjectFrame, screenToWorld } from '../engine/renderer';
import { getStageDimensions } from '../engine/timeline';
import type { ScribeElement, ScribeProject } from '../types/scribe';

interface StageCanvasProps {
  project: ScribeProject;
  isPlaying: boolean;
  isScrubbing: boolean;
  playheadTime: number;
  totalDuration: number;
  selectedId: string | null;
  editCamera: { cx: number; cy: number; zoom: number };
  onChangeEditCamera: (cam: { cx: number; cy: number; zoom: number }) => void;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, patch: Partial<ScribeElement>, recordHistory?: boolean) => void;
  onGestureStart: () => void;
  onTogglePlay: () => void;
  onResetView: () => void;
  onFitAll: () => void;
}

type DragAction =
  | { kind: 'pan'; startX: number; startY: number; origCx: number; origCy: number }
  | {
      kind: 'move';
      id: string;
      startWX: number;
      startWY: number;
      origX: number;
      origY: number;
      recorded: boolean;
    }
  | {
      kind: 'resize';
      id: string;
      corner: 'nw' | 'ne' | 'se' | 'sw';
      startWX: number;
      startWY: number;
      origW: number;
      origH: number;
      rotation: number;
      recorded: boolean;
    }
  | { kind: 'rotate'; id: string; centerX: number; centerY: number; recorded: boolean };

export function StageCanvas({
  project,
  isPlaying,
  isScrubbing,
  playheadTime,
  totalDuration,
  selectedId,
  editCamera,
  onChangeEditCamera,
  onSelectElement,
  onUpdateElement,
  onGestureStart,
  onTogglePlay,
  onResetView,
  onFitAll,
}: StageCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState({ width: 960, height: 540 });
  const [panTool, setPanTool] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [imgLoadTick, setImgLoadTick] = useState(0);
  const dragRef = useRef<DragAction | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(240, Math.floor(entry.contentRect.width));
        const h = Math.max(200, Math.floor(entry.contentRect.height));
        setSize({ width: w, height: h });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        setSpacePressed(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpacePressed(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Render frame whenever state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const targetW = Math.floor(size.width * dpr);
    const targetH = Math.floor(size.height * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    const renderMode = isPlaying || isScrubbing ? 'play' : 'edit';
    renderProjectFrame(ctx, project, {
      width: size.width,
      height: size.height,
      time: playheadTime,
      mode: renderMode,
      editCamera,
      selectedId: renderMode === 'edit' ? selectedId : null,
      onImageLoad: () => setImgLoadTick((v) => v + 1),
    });
    ctx.restore();
  }, [project, size, isPlaying, isScrubbing, playheadTime, editCamera, selectedId, imgLoadTick]);

  const getLocalScreenCoords = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      sx: e.clientX - rect.left,
      sy: e.clientY - rect.top,
    };
  };

  const detectGizmoHandle = (
    sx: number,
    sy: number,
    el: ScribeElement,
  ): 'rotate' | 'nw' | 'ne' | 'se' | 'sw' | null => {
    const stage = getStageDimensions(project.aspectRatio);
    const stageScale = Math.min(size.width / stage.width, size.height / stage.height);
    const ez = editCamera.zoom * stageScale;

    const ex = size.width / 2 + (el.x - editCamera.cx) * ez;
    const ey = size.height / 2 + (el.y - editCamera.cy) * ez;
    const sw = el.width * ez;
    const sh = el.height * ez;

    const rad = (-el.rotation * Math.PI) / 180;
    const dx = sx - ex;
    const dy = sy - ey;
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ly = dx * Math.sin(rad) + dy * Math.cos(rad);

    if (Math.hypot(lx - 0, ly - (-sh / 2 - 26)) <= 14) return 'rotate';
    if (Math.hypot(lx - -sw / 2, ly - -sh / 2) <= 14) return 'nw';
    if (Math.hypot(lx - sw / 2, ly - -sh / 2) <= 14) return 'ne';
    if (Math.hypot(lx - sw / 2, ly - sh / 2) <= 14) return 'se';
    if (Math.hypot(lx - -sw / 2, ly - sh / 2) <= 14) return 'sw';
    return null;
  };

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (isPlaying) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { sx, sy } = getLocalScreenCoords(e);

    if (panTool || spacePressed || e.button === 1) {
      dragRef.current = {
        kind: 'pan',
        startX: sx,
        startY: sy,
        origCx: editCamera.cx,
        origCy: editCamera.cy,
      };
      return;
    }

    const selected = selectedId ? project.elements.find((el) => el.id === selectedId) : null;
    if (selected) {
      const handle = detectGizmoHandle(sx, sy, selected);
      if (handle === 'rotate') {
        dragRef.current = {
          kind: 'rotate',
          id: selected.id,
          centerX: selected.x,
          centerY: selected.y,
          recorded: false,
        };
        return;
      }
      if (handle) {
        const wpt = screenToWorld(sx, sy, size.width, size.height, project.aspectRatio, editCamera);
        dragRef.current = {
          kind: 'resize',
          id: selected.id,
          corner: handle,
          startWX: wpt.x,
          startWY: wpt.y,
          origW: selected.width,
          origH: selected.height,
          rotation: selected.rotation,
          recorded: false,
        };
        return;
      }
    }

    const wpt = screenToWorld(sx, sy, size.width, size.height, project.aspectRatio, editCamera);
    const hit = hitTestElement(project, wpt.x, wpt.y);

    if (hit) {
      onSelectElement(hit.id);
      dragRef.current = {
        kind: 'move',
        id: hit.id,
        startWX: wpt.x,
        startWY: wpt.y,
        origX: hit.x,
        origY: hit.y,
        recorded: false,
      };
    } else {
      onSelectElement(null);
      dragRef.current = {
        kind: 'pan',
        startX: sx,
        startY: sy,
        origCx: editCamera.cx,
        origCy: editCamera.cy,
      };
    }
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const { sx, sy } = getLocalScreenCoords(e);
    const stage = getStageDimensions(project.aspectRatio);
    const stageScale = Math.min(size.width / stage.width, size.height / stage.height);
    const ez = editCamera.zoom * stageScale;

    if (drag.kind === 'pan') {
      const dx = (sx - drag.startX) / ez;
      const dy = (sy - drag.startY) / ez;
      onChangeEditCamera({
        ...editCamera,
        cx: drag.origCx - dx,
        cy: drag.origCy - dy,
      });
      return;
    }

    const wpt = screenToWorld(sx, sy, size.width, size.height, project.aspectRatio, editCamera);

    if (!drag.recorded) {
      onGestureStart();
      drag.recorded = true;
    }

    if (drag.kind === 'move') {
      const dx = wpt.x - drag.startWX;
      const dy = wpt.y - drag.startWY;
      onUpdateElement(
        drag.id,
        { x: Math.round(drag.origX + dx), y: Math.round(drag.origY + dy) },
        false,
      );
    } else if (drag.kind === 'resize') {
      const rawDx = wpt.x - drag.startWX;
      const rawDy = wpt.y - drag.startWY;
      const rad = (-drag.rotation * Math.PI) / 180;
      const ldx = rawDx * Math.cos(rad) - rawDy * Math.sin(rad);
      const ldy = rawDx * Math.sin(rad) + rawDy * Math.cos(rad);
      const signX = drag.corner.includes('e') ? 1 : -1;
      const signY = drag.corner.includes('s') ? 1 : -1;
      const aspect = drag.origW / Math.max(10, drag.origH);
      const deltaW = (ldx * signX + ldy * signY * aspect) * 0.7;
      const newW = Math.max(48, Math.round(drag.origW + deltaW));
      const newH = Math.max(36, Math.round(newW / aspect));
      onUpdateElement(drag.id, { width: newW, height: newH }, false);
    } else if (drag.kind === 'rotate') {
      const deg = (Math.atan2(wpt.y - drag.centerY, wpt.x - drag.centerX) * 180) / Math.PI + 90;
      onUpdateElement(drag.id, { rotation: Math.round(deg) }, false);
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleWheel = (e: WheelEvent<HTMLCanvasElement>) => {
    if (isPlaying) return;
    const factor = e.deltaY < 0 ? 1.09 : 0.92;
    const nextZoom = Math.max(0.2, Math.min(4, Number((editCamera.zoom * factor).toFixed(3))));
    onChangeEditCamera({ ...editCamera, zoom: nextZoom });
  };

  return (
    <div className="stage-shell" ref={containerRef}>
      <canvas
        id="whiteboard-canvas"
        ref={canvasRef}
        className={`stage-canvas ${panTool || spacePressed ? 'cursor-grab' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      />

      <div className="stage-hud-top">
        <div className="hud-pill">
          <button
            type="button"
            className={`hud-btn ${!panTool ? 'active' : ''}`}
            onClick={() => setPanTool(false)}
            title="Ferramenta Selecionar / Mover Objetos"
          >
            <MousePointer2 size={14} />
          </button>
          <button
            type="button"
            className={`hud-btn ${panTool ? 'active' : ''}`}
            onClick={() => setPanTool(true)}
            title="Arrastar Quadro Infinito (ou segure Espaço)"
          >
            <Hand size={14} />
          </button>
          <span className="hud-sep" />
          <button
            id="zoom-out-btn"
            type="button"
            className="hud-btn"
            onClick={() =>
              onChangeEditCamera({
                ...editCamera,
                zoom: Math.max(0.2, Number((editCamera.zoom * 0.85).toFixed(2))),
              })
            }
            title="Reduzir zoom"
          >
            <ZoomOut size={14} />
          </button>
          <span className="hud-zoom-readout">{Math.round(editCamera.zoom * 100)}%</span>
          <button
            id="zoom-in-btn"
            type="button"
            className="hud-btn"
            onClick={() =>
              onChangeEditCamera({
                ...editCamera,
                zoom: Math.min(4, Number((editCamera.zoom * 1.18).toFixed(2))),
              })
            }
            title="Aumentar zoom"
          >
            <ZoomIn size={14} />
          </button>
          <button id="fit-all-btn" type="button" className="hud-btn" onClick={onFitAll} title="Enquadrar todos os elementos">
            <Maximize2 size={14} />
          </button>
          <button id="reset-view-btn" type="button" className="hud-btn" onClick={onResetView} title="Centralizar na origem (100%)">
            <LocateFixed size={14} />
          </button>
        </div>
      </div>

      <div className="stage-hud-bottom">
        <button
          id="stage-play-toggle"
          type="button"
          className="stage-play-pill"
          onClick={onTogglePlay}
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          <span>
            {isPlaying ? 'Pausar Prévia' : isScrubbing ? 'Continuar Prévia' : 'Assistir Animação'}
          </span>
          <span className="mono-time">
            {playheadTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
          </span>
        </button>

        {isScrubbing && !isPlaying && (
          <button id="exit-preview-btn" type="button" className="hud-btn-exit" onClick={onResetView} title="Voltar ao modo de edição">
            <RotateCcw size={13} />
            <span>Editar Quadro</span>
          </button>
        )}
      </div>
    </div>
  );
}
