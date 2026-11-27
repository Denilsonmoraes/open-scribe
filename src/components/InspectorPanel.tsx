import { AlignCenter, ArrowDown, ArrowUp, Camera, Copy, Focus, RotateCcw, Trash2 } from 'lucide-react';
import { traceImageUrlToVectors } from '../engine/imageTracer';
import type {
  AnimationMode,
  HandStyle,
  HandwritingFont,
  MoveDirection,
  ScribeElement,
  TraceConfig,
} from '../types/scribe';

interface InspectorPanelProps {
  element: ScribeElement | null;
  editCamera: { cx: number; cy: number; zoom: number };
  onUpdateElement: (id: string, patch: Partial<ScribeElement>) => void;
  onCaptureCameraForElement: (id: string) => void;
  onFocusElementCamera: (el: ScribeElement) => void;
  onMoveOrder: (id: string, dir: -1 | 1) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function InspectorPanel({
  element,
  editCamera,
  onUpdateElement,
  onCaptureCameraForElement,
  onFocusElementCamera,
  onMoveOrder,
  onDuplicate,
  onDelete,
}: InspectorPanelProps) {
  if (!element) {
    return (
      <aside className="studio-inspector empty">
        <div className="empty-inspector">
          <h3>Inspetor da Cena</h3>
          <p>
            Toque ou clique em qualquer elemento no quadro ou na linha do tempo para ajustar velocidade de desenho, cor, traçado vetorial e enquadramento da câmera.
          </p>
        </div>
      </aside>
    );
  }

  const retrace = async (nextConfig: TraceConfig) => {
    if (!element.rasterDataUrl) return;
    const res = await traceImageUrlToVectors(element.rasterDataUrl, nextConfig);
    onUpdateElement(element.id, {
      strokes: res.strokes,
      traceConfig: nextConfig,
      fillReveal: nextConfig.revealOriginal,
    });
  };

  return (
    <aside className="studio-inspector">
      <div className="inspector-header">
        <input
          type="text"
          className="inspector-title-input"
          value={element.name}
          onChange={(e) => onUpdateElement(element.id, { name: e.target.value })}
          aria-label="Nome do elemento"
        />
        <div className="icon-btn-group">
          <button type="button" className="icon-btn-sm" onClick={() => onMoveOrder(element.id, -1)} title="Mover para antes">
            <ArrowUp size={14} />
          </button>
          <button type="button" className="icon-btn-sm" onClick={() => onMoveOrder(element.id, 1)} title="Mover para depois">
            <ArrowDown size={14} />
          </button>
          <button type="button" className="icon-btn-sm" onClick={() => onDuplicate(element.id)} title="Duplicar elemento (Ctrl+D)">
            <Copy size={14} />
          </button>
          <button type="button" className="icon-btn-sm danger" onClick={() => onDelete(element.id)} title="Excluir elemento (Del)">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="inspector-scroll">
        {element.type === 'text' && (
          <div className="inspector-group">
            <h4>Conteúdo do Texto</h4>
            <textarea
              id="inspector-text-input"
              className="studio-textarea"
              rows={3}
              value={element.text || ''}
              onChange={(e) => onUpdateElement(element.id, { text: e.target.value })}
            />
            <div className="two-col">
              <label className="field-label">
                Fonte
                <select
                  className="studio-select"
                  value={element.fontFamily || 'Caveat'}
                  onChange={(e) =>
                    onUpdateElement(element.id, { fontFamily: e.target.value as HandwritingFont })
                  }
                >
                  <option value="Caveat">Caveat</option>
                  <option value="Patrick Hand">Patrick Hand</option>
                  <option value="Architects Daughter">Architects</option>
                  <option value="Indie Flower">Indie Flower</option>
                  <option value="Plus Jakarta Sans">Jakarta Sans</option>
                  <option value="JetBrains Mono">JetBrains Mono</option>
                </select>
              </label>

              <label className="field-label">
                Alinhamento
                <select
                  className="studio-select"
                  value={element.textAlign || 'center'}
                  onChange={(e) =>
                    onUpdateElement(element.id, {
                      textAlign: e.target.value as 'left' | 'center' | 'right',
                    })
                  }
                >
                  <option value="left">Esquerda</option>
                  <option value="center">Centro</option>
                  <option value="right">Direita</option>
                </select>
              </label>
            </div>
            <label className="field-label">
              Tamanho da Fonte ({element.fontSize || 42}px)
              <input
                type="range"
                min={18}
                max={120}
                value={element.fontSize || 42}
                onChange={(e) => onUpdateElement(element.id, { fontSize: Number(e.target.value) })}
              />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={Boolean(element.textBgColor && element.textBgColor !== 'transparent')}
                onChange={(e) =>
                  onUpdateElement(element.id, {
                    textBgColor: e.target.checked ? '#fef3c7' : 'transparent',
                  })
                }
              />
              <span>Cartão de destaque atrás do texto</span>
            </label>

            {element.textBgColor && element.textBgColor !== 'transparent' && (
              <label className="field-label">
                Cor do Cartão
                <div className="color-input-wrap">
                  <input
                    type="color"
                    value={element.textBgColor}
                    onChange={(e) => onUpdateElement(element.id, { textBgColor: e.target.value })}
                  />
                  <span>{element.textBgColor}</span>
                </div>
              </label>
            )}
          </div>
        )}

        {element.type === 'traced-image' && element.traceConfig && (
          <div className="inspector-group">
            <h4>Ajuste da Auto-Vetorização</h4>
            <label className="field-label">
              Modo
              <select
                className="studio-select"
                value={element.traceConfig.mode}
                onChange={(e) =>
                  retrace({ ...element.traceConfig!, mode: e.target.value as TraceConfig['mode'] })
                }
              >
                <option value="contour">Contorno Inteligente</option>
                <option value="lineart">Esboço / LineArt</option>
              </select>
            </label>
            <label className="field-label">
              Sensibilidade ({element.traceConfig.sensitivity}%)
              <input
                type="range"
                min={12}
                max={95}
                value={element.traceConfig.sensitivity}
                onChange={(e) =>
                  retrace({ ...element.traceConfig!, sensitivity: Number(e.target.value) })
                }
              />
            </label>
            <label className="field-label">
              Simplificação ({element.traceConfig.detail.toFixed(1)}px)
              <input
                type="range"
                min={0.6}
                max={4.5}
                step={0.2}
                value={element.traceConfig.detail}
                onChange={(e) =>
                  retrace({ ...element.traceConfig!, detail: Number(e.target.value) })
                }
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={element.fillReveal}
                onChange={(e) =>
                  onUpdateElement(element.id, {
                    fillReveal: e.target.checked,
                    traceConfig: { ...element.traceConfig!, revealOriginal: e.target.checked },
                  })
                }
              />
              <span>Revelar imagem colorida ao final</span>
            </label>
          </div>
        )}

        <div className="inspector-group">
          <h4>Animação &amp; Tempo</h4>
          <label className="field-label">
            Modo de Entrada
            <select
              id="inspector-anim-mode"
              className="studio-select"
              value={element.animationMode}
              onChange={(e) =>
                onUpdateElement(element.id, { animationMode: e.target.value as AnimationMode })
              }
            >
              <option value="draw">Desenhar com a Mão</option>
              <option value="move-in">Mão Arrastando (Move-In)</option>
              <option value="fade">Surgir Suave (Fade)</option>
              <option value="pop">Pop / Zoom Elástico</option>
              <option value="slide-up">Deslizar de Baixo</option>
            </select>
          </label>

          {element.animationMode === 'move-in' && (
            <label className="field-label">
              Direção do Move-In
              <select
                id="inspector-move-dir"
                className="studio-select"
                value={element.moveInFrom || 'right'}
                onChange={(e) =>
                  onUpdateElement(element.id, { moveInFrom: e.target.value as MoveDirection })
                }
              >
                <option value="right">Puxar da Direita</option>
                <option value="left">Puxar da Esquerda</option>
                <option value="top">Descer de Cima</option>
                <option value="bottom">Subir de Baixo</option>
              </select>
            </label>
          )}

          <label className="field-label">
            Mão Nesta Cena
            <select
              id="inspector-hand-override"
              className="studio-select"
              value={element.handStyleOverride || 'inherit'}
              onChange={(e) =>
                onUpdateElement(element.id, {
                  handStyleOverride: e.target.value as HandStyle | 'inherit',
                })
              }
            >
              <option value="inherit">Usar padrão do projeto</option>
              <option value="realistic-pen">Mão Real + Caneta</option>
              <option value="marker">Mão Real + Marcador</option>
              <option value="pencil">Mão Real + Lápis</option>
              <option value="chalk">Giz de Lousa</option>
              <option value="minimal-nib">Ponta Minimalista</option>
              <option value="eraser">Borracha</option>
              <option value="none">Sem Mão</option>
            </select>
          </label>

          <label className="field-label">
            Duração do Desenho ({element.drawDuration.toFixed(1)}s)
            <input
              type="range"
              min={0.3}
              max={12}
              step={0.1}
              value={element.drawDuration}
              onChange={(e) => onUpdateElement(element.id, { drawDuration: Number(e.target.value) })}
            />
          </label>

          <label className="field-label">
            Pausa Após Desenhar ({element.pauseDuration.toFixed(1)}s)
            <input
              type="range"
              min={0}
              max={6}
              step={0.1}
              value={element.pauseDuration}
              onChange={(e) =>
                onUpdateElement(element.id, { pauseDuration: Number(e.target.value) })
              }
            />
          </label>

          <label className="field-label">
            Transição de Câmera ({element.transitionDuration.toFixed(1)}s)
            <input
              type="range"
              min={0}
              max={3}
              step={0.1}
              value={element.transitionDuration}
              onChange={(e) =>
                onUpdateElement(element.id, { transitionDuration: Number(e.target.value) })
              }
            />
          </label>
        </div>

        <div className="inspector-group">
          <h4>Traço &amp; Cor</h4>
          <div className="two-col">
            <label className="field-label">
              Cor da Tinta
              <div className="color-input-wrap">
                <input
                  type="color"
                  value={element.strokeColor}
                  onChange={(e) => onUpdateElement(element.id, { strokeColor: e.target.value })}
                />
                <span>{element.strokeColor}</span>
              </div>
            </label>

            {element.type !== 'text' && (
              <label className="field-label">
                Espessura ({element.strokeWidth.toFixed(1)}px)
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={0.5}
                  value={element.strokeWidth}
                  onChange={(e) =>
                    onUpdateElement(element.id, { strokeWidth: Number(e.target.value) })
                  }
                />
              </label>
            )}
          </div>

          {element.type === 'svg' && (
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={element.fillReveal}
                onChange={(e) => onUpdateElement(element.id, { fillReveal: e.target.checked })}
              />
              <span>Preencher cores ao finalizar o contorno</span>
            </label>
          )}
        </div>

        <div className="inspector-group">
          <h4>Posição, Escala &amp; Câmera</h4>
          <div className="meta-dims-line">
            <span>
              {Math.round(element.width)}×{Math.round(element.height)}px
            </span>
            <span>·</span>
            <span>
              X:{Math.round(element.x)} Y:{Math.round(element.y)}
            </span>
            <span>·</span>
            <span>{Math.round(element.rotation)}°</span>
          </div>
          <div className="btn-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onUpdateElement(element.id, { x: Math.round(editCamera.cx), y: Math.round(editCamera.cy) })}
              title="Centralizar objeto na visualização atual"
            >
              <AlignCenter size={14} />
              <span>Centralizar</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onUpdateElement(element.id, { rotation: 0 })}
              title="Zerar ângulo de rotação"
            >
              <RotateCcw size={14} />
              <span>0°</span>
            </button>
          </div>
          <div className="btn-row">
            <button
              id="capture-camera-btn"
              type="button"
              className="btn-secondary"
              onClick={() => onCaptureCameraForElement(element.id)}
              title="Salva o zoom e posição atuais da tela como câmera desta cena"
            >
              <Camera size={14} />
              <span>Capturar Atual</span>
            </button>
            <button
              id="focus-camera-btn"
              type="button"
              className="btn-secondary"
              onClick={() => onFocusElementCamera(element)}
              title="Ir para o enquadramento salvo desta cena"
            >
              <Focus size={14} />
              <span>Ir p/ Câmera</span>
            </button>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={element.camera.autoFit}
              onChange={(e) =>
                onUpdateElement(element.id, {
                  camera: { ...element.camera, autoFit: e.target.checked },
                })
              }
            />
            <span>Auto-enquadrar câmera no objeto</span>
          </label>
        </div>
      </div>
    </aside>
  );
}
