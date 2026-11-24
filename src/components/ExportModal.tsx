import { CheckCircle2, Download, Film, Loader2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { exportProjectVideo } from '../engine/exporter';
import { downloadBlob, saveVideoOutput } from '../engine/storage';
import { buildTimelineSchedule } from '../engine/timeline';
import type { ExportConfig, ExportProgress, ScribeProject } from '../types/scribe';

interface ExportModalProps {
  project: ScribeProject;
  onClose: () => void;
}

export function ExportModal({ project, onClose }: ExportModalProps) {
  const [config, setConfig] = useState<ExportConfig>({
    resolution: '1080p',
    fps: 30,
    format: 'mp4',
  });
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [result, setResult] = useState<{
    blob: Blob;
    filename: string;
    method: string;
    savedPath?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { totalDuration } = buildTimelineSchedule(project);
  const webCodecsAvailable = typeof VideoEncoder !== 'undefined';

  const startExport = async () => {
    setExporting(true);
    setErrorMsg(null);
    setResult(null);
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const out = await exportProjectVideo(project, config, setProgress, ac.signal);
      const saved = await saveVideoOutput(out.blob, out.filename);
      setResult({
        blob: out.blob,
        filename: out.filename,
        method: out.method,
        savedPath: saved.savedPath,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao exportar vídeo.');
    } finally {
      setExporting(false);
    }
  };

  const cancelExport = () => {
    abortRef.current?.abort();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="export-modal-title">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Film size={18} />
            <h2 id="export-modal-title">Exportar Vídeo Local (Zero Servidor)</h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={exporting ? cancelExport : onClose}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="panel-hint">
            Renderizado quadro a quadro direto na GPU do seu dispositivo via{' '}
            <strong>{webCodecsAvailable ? 'WebCodecs H.264 + MP4 Muxer' : 'MediaRecorder WebM'}</strong>. Sem marca d&apos;água.
          </p>

          <div className="two-col">
            <label className="field-label">
              Resolução
              <select
                className="studio-select"
                value={config.resolution}
                disabled={exporting}
                onChange={(e) =>
                  setConfig({ ...config, resolution: e.target.value as ExportConfig['resolution'] })
                }
              >
                <option value="1080p">Full HD (1080p)</option>
                <option value="720p">HD Rápido (720p)</option>
              </select>
            </label>

            <label className="field-label">
              Taxa de Quadros
              <select
                className="studio-select"
                value={config.fps}
                disabled={exporting}
                onChange={(e) =>
                  setConfig({ ...config, fps: Number(e.target.value) as 30 | 60 })
                }
              >
                <option value={30}>30 FPS (Padrão)</option>
                <option value={60}>60 FPS (Fluido)</option>
              </select>
            </label>
          </div>

          <label className="field-label">
            Formato de Saída
            <select
              className="studio-select"
              value={config.format}
              disabled={exporting}
              onChange={(e) =>
                setConfig({ ...config, format: e.target.value as ExportConfig['format'] })
              }
            >
              <option value="mp4">MP4 H.264 (Compatível com WhatsApp/Reels/YouTube)</option>
              <option value="webm">WebM (Fallback universal de navegador)</option>
            </select>
          </label>

          <div className="export-summary-box">
            <div>
              <span>Proporção:</span> <strong>{project.aspectRatio}</strong>
            </div>
            <div>
              <span>Duração:</span> <strong>{totalDuration.toFixed(1)}s</strong>
            </div>
            <div>
              <span>Cenas:</span> <strong>{project.elements.length}</strong>
            </div>
          </div>

          {progress && (
            <div className="progress-box">
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.round(progress.progress * 100)}%` }}
                />
              </div>
              <div className="progress-caption">
                <span>{progress.message}</span>
                <strong>{Math.round(progress.progress * 100)}%</strong>
              </div>
            </div>
          )}

          {errorMsg && <div className="error-banner">{errorMsg}</div>}

          {result && (
            <div className="success-banner">
              <CheckCircle2 size={18} />
              <div>
                <strong>{result.filename}</strong> ({(result.blob.size / (1024 * 1024)).toFixed(2)} MB)
                {result.savedPath && <div className="saved-path-note">Salvo em: {result.savedPath}</div>}
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => downloadBlob(result.blob, result.filename)}
              >
                Baixar de novo
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {exporting ? (
            <button type="button" className="btn-danger" onClick={cancelExport}>
              <Loader2 size={15} className="spin" />
              <span>Cancelar Exportação</span>
            </button>
          ) : (
            <>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Fechar
              </button>
              <button
                id="confirm-export-btn"
                type="button"
                className="btn-primary"
                onClick={startExport}
                disabled={project.elements.length === 0}
              >
                <Download size={15} />
                <span>Renderizar e Baixar</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
