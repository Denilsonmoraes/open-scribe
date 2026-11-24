import {
  CheckCircle2,
  Download,
  FilePlus2,
  FolderKanban,
  FolderOpen,
  HardDriveDownload,
  Monitor,
  Pause,
  Play,
  Redo2,
  Save,
  Smartphone,
  Sparkles,
  Square,
  SquareStop,
  Undo2,
} from 'lucide-react';
import type { AspectRatio, BoardTheme, HandStyle, ScribeProject } from '../types/scribe';

interface TopBarProps {
  project: ScribeProject;
  isPlaying: boolean;
  canUndo: boolean;
  canRedo: boolean;
  saveState: 'saved' | 'saving';
  lastSavedAt: number | null;
  saveTarget: 'local-db' | 'desktop-disk';
  onUpdateProjectMeta: (patch: Partial<ScribeProject>) => void;
  onTogglePlay: () => void;
  onStop: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSaveNow: () => void;
  onOpenProjectsModal: () => void;
  onLoadDemo: () => void;
  onNewBlank: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onOpenExportModal: () => void;
}

export function TopBar({
  project,
  isPlaying,
  canUndo,
  canRedo,
  saveState,
  lastSavedAt,
  saveTarget,
  onUpdateProjectMeta,
  onTogglePlay,
  onStop,
  onUndo,
  onRedo,
  onSaveNow,
  onOpenProjectsModal,
  onLoadDemo,
  onNewBlank,
  onExportJson,
  onImportJson,
  onOpenExportModal,
}: TopBarProps) {
  const savedLabel =
    saveState === 'saving'
      ? 'Salvando...'
      : lastSavedAt
        ? `${saveTarget === 'desktop-disk' ? 'Disco' : 'Local'} ${new Date(lastSavedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })}`
        : 'Local';

  return (
    <header className="studio-topbar">
      <div className="topbar-left">
        <div className="brand-mark" aria-label="OpenScribe Studio">
          <img src="./favicon.svg" alt="" width={26} height={26} />
          <span className="brand-name">OpenScribe</span>
        </div>

        <input
          id="project-title-input"
          className="title-input"
          type="text"
          value={project.title}
          onChange={(e) => onUpdateProjectMeta({ title: e.target.value })}
          aria-label="Nome do projeto"
          placeholder="Nome do projeto"
        />

        <button
          id="save-status-pill"
          type="button"
          className={`save-pill ${saveState}`}
          onClick={onSaveNow}
          title="Salvar agora localmente (Ctrl+S)"
        >
          <CheckCircle2 size={12} />
          <span>{savedLabel}</span>
        </button>

        <div className="topbar-divider" />

        <div className="icon-btn-group" aria-label="Histórico">
          <button
            id="undo-btn"
            type="button"
            className="icon-btn"
            onClick={onUndo}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            id="redo-btn"
            type="button"
            className="icon-btn"
            onClick={onRedo}
            disabled={!canRedo}
            title="Refazer (Ctrl+Y)"
          >
            <Redo2 size={16} />
          </button>
        </div>
      </div>

      <div className="topbar-center">
        <div className="segmented-control" role="group" aria-label="Proporção do vídeo">
          {(
            [
              { val: '16:9', label: '16:9', icon: Monitor },
              { val: '9:16', label: '9:16', icon: Smartphone },
              { val: '1:1', label: '1:1', icon: Square },
            ] as const
          ).map(({ val, label, icon: Icon }) => (
            <button
              key={val}
              type="button"
              className={`seg-btn ${project.aspectRatio === val ? 'active' : ''}`}
              onClick={() => onUpdateProjectMeta({ aspectRatio: val as AspectRatio })}
              title={`Proporção ${label}`}
            >
              <Icon size={13} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <select
          id="board-theme-select"
          className="compact-select"
          value={project.boardTheme}
          onChange={(e) => {
            const theme = e.target.value as BoardTheme;
            const bg =
              theme === 'chalkboard'
                ? '#182621'
                : theme === 'blueprint'
                  ? '#0f2847'
                  : theme === 'dotgrid'
                    ? '#fcfbf7'
                    : '#faf9f5';
            onUpdateProjectMeta({ boardTheme: theme, backgroundColor: bg });
          }}
          aria-label="Fundo do quadro"
          title="Tipo de quadro"
        >
          <option value="whiteboard">Quadro Branco</option>
          <option value="dotgrid">Papel Pontilhado</option>
          <option value="chalkboard">Lousa Escura</option>
          <option value="blueprint">Blueprint Técnico</option>
        </select>

        <select
          id="hand-style-select"
          className="compact-select"
          value={project.defaultHandStyle}
          onChange={(e) => onUpdateProjectMeta({ defaultHandStyle: e.target.value as HandStyle })}
          aria-label="Estilo da mão e caneta"
          title="Estilo da mão"
        >
          <option value="realistic-pen">Mão + Caneta Fina</option>
          <option value="marker">Mão + Marcador</option>
          <option value="pencil">Mão + Lápis</option>
          <option value="chalk">Mão + Giz</option>
          <option value="minimal-nib">Ponta Minimalista</option>
          <option value="eraser">Borracha</option>
          <option value="none">Sem Mão (Traço Puro)</option>
        </select>
      </div>

      <div className="topbar-right">
        <div className="icon-btn-group">
          <button
            id="open-projects-btn"
            type="button"
            className="icon-btn"
            onClick={onOpenProjectsModal}
            title="Meus projetos salvos"
          >
            <FolderKanban size={16} />
          </button>
          <button id="new-blank-btn" type="button" className="icon-btn" onClick={onNewBlank} title="Novo projeto em branco">
            <FilePlus2 size={16} />
          </button>
          <button id="load-demo-btn" type="button" className="icon-btn" onClick={onLoadDemo} title="Carregar cena demo">
            <Sparkles size={16} />
          </button>
          <button id="save-now-btn" type="button" className="icon-btn" onClick={onSaveNow} title="Salvar projeto localmente (Ctrl+S)">
            <Save size={16} />
          </button>
          <button id="export-json-btn" type="button" className="icon-btn" onClick={onExportJson} title="Baixar backup (.openscribe.json)">
            <HardDriveDownload size={16} />
          </button>
          <label className="icon-btn" title="Abrir arquivo (.openscribe.json)">
            <FolderOpen size={16} />
            <input
              id="import-json-input"
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportJson(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>

        <button
          id="topbar-play-btn"
          type="button"
          className="btn-secondary"
          onClick={onTogglePlay}
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          <span>{isPlaying ? 'Pausar' : 'Reproduzir'}</span>
        </button>

        {isPlaying && (
          <button type="button" className="icon-btn" onClick={onStop} title="Parar e voltar ao editor">
            <SquareStop size={16} />
          </button>
        )}

        <button
          id="open-export-btn"
          type="button"
          className="btn-primary"
          onClick={onOpenExportModal}
        >
          <Download size={15} />
          <span>Exportar Vídeo</span>
        </button>
      </div>
    </header>
  );
}
