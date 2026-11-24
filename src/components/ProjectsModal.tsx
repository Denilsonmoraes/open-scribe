import { Check, FilePlus2, FolderOpen, HardDrive, Layers, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { deleteSavedProjectById, listSavedProjects } from '../engine/storage';
import type { ProjectSummary } from '../types/scribe';

interface ProjectsModalProps {
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateBlank: () => void;
  onLoadDemo: () => void;
  onImportJson: (file: File) => void;
  onClose: () => void;
}

export function ProjectsModal({
  activeProjectId,
  onSelectProject,
  onCreateBlank,
  onLoadDemo,
  onImportJson,
  onClose,
}: ProjectsModalProps) {
  const [items, setItems] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await listSavedProjects();
      setItems(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    listSavedProjects()
      .then((list) => {
        if (active) setItems(list);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleDelete = async (id: string) => {
    await deleteSavedProjectById(id);
    await refresh();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="projects-modal-title">
      <div className="modal-card projects-modal-card">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <HardDrive size={18} />
            <h2 id="projects-modal-title">Projetos Salvos Localmente</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="projects-actions-bar">
            <button
              id="create-blank-project-btn"
              type="button"
              className="btn-primary"
              onClick={() => {
                onCreateBlank();
                onClose();
              }}
            >
              <FilePlus2 size={15} />
              <span>Novo Projeto</span>
            </button>

            <button
              id="create-demo-project-btn"
              type="button"
              className="btn-secondary"
              onClick={() => {
                onLoadDemo();
                onClose();
              }}
            >
              <Sparkles size={15} />
              <span>Novo Demo</span>
            </button>

            <label className="btn-secondary">
              <Upload size={14} />
              <span>Importar .openscribe.json</span>
              <input
                id="modal-import-json-input"
                type="file"
                accept=".json,application/json"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onImportJson(file);
                    onClose();
                  }
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          {loading ? (
            <p className="panel-hint">Carregando biblioteca local...</p>
          ) : items.length === 0 ? (
            <p className="panel-hint">
              Nenhum projeto extra salvo ainda. Suas edições são salvas automaticamente aqui.
            </p>
          ) : (
            <div className="projects-list" id="saved-projects-list">
              {items.map((item) => {
                const isActive = item.id === activeProjectId;
                return (
                  <div
                    key={item.id}
                    className={`project-row ${isActive ? 'active' : ''}`}
                    data-project-id={item.id}
                  >
                    <div className="project-row-main">
                      <div className="project-row-title">
                        <strong>{item.title}</strong>
                        {isActive && (
                          <span className="project-badge active">
                            <Check size={11} /> Aberto
                          </span>
                        )}
                        <span className="project-badge">
                          {item.source === 'desktop-disk' ? 'Disco Local' : 'IndexedDB'}
                        </span>
                      </div>
                      <div className="project-row-meta">
                        <span>
                          <Layers size={12} /> {item.elementCount} cenas
                        </span>
                        <span>{item.aspectRatio}</span>
                        <span>{new Date(item.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="project-row-actions">
                      {!isActive && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            onSelectProject(item.id);
                            onClose();
                          }}
                        >
                          <FolderOpen size={14} />
                          <span>Abrir</span>
                        </button>
                      )}
                      {items.length > 1 && (
                        <button
                          type="button"
                          className="icon-btn-sm danger"
                          onClick={() => void handleDelete(item.id)}
                          title="Excluir do armazenamento local"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
