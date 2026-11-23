import {
  Download,
  FilePlus2,
  FolderOpen,
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
  onUpdateProjectMeta: (patch: Partial<ScribeProject>) => void;
  onTogglePlay: () => void;
  onStop: () => void;
  onUndo: () => void;
  onRedo: () => void;
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
  onUpdateProjectMeta,
  onTogglePlay,
  onStop,
  onUndo,
  onRedo,
  onLoadDemo,
  onNewBlank,
  onExportJson,
  onImportJson,
  onOpenExportModal,
}: TopBarProps) {
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

        <div className="topbar-divider" />

        <div className="icon-btn-group" aria-label="Histórico">
          <button
            type="button"
            className="icon-btn"
            onClick={onUndo}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
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
          <button type="button" className="icon-btn" onClick={onNewBlank} title="Novo projeto em branco">
            <FilePlus2 size={16} />
          </button>
          <button type="button" className="icon-btn" onClick={onLoadDemo} title="Carregar cena demo">
            <Sparkles size={16} />
          </button>
          <button type="button" className="icon-btn" onClick={onExportJson} title="Salvar backup (.json)">
            <Save size={16} />
          </button>
          <label className="icon-btn" title="Abrir backup (.json)">
            <FolderOpen size={16} />
            <input
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
