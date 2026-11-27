import {
  FileCode2,
  ImagePlus,
  Layers,
  Mic,
  MicOff,
  Music,
  Shapes,
  Sparkles,
  Trash2,
  Type,
  Upload,
  Wand2,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { VECTOR_ASSETS, type VectorAssetPreset } from '../data/assetLibrary';
import { decodeAudioTrack } from '../engine/audio';
import { fileToDataUrl, traceImageUrlToVectors } from '../engine/imageTracer';
import type { AudioTrackData, HandwritingFont, ScribeProject, TraceConfig } from '../types/scribe';

export type SidebarTab = 'vectors' | 'trace' | 'text' | 'script' | 'audio';

interface AssetSidebarProps {
  project: ScribeProject;
  activeTab: SidebarTab;
  onChangeTab: (tab: SidebarTab) => void;
  onAddVectorAsset: (preset: VectorAssetPreset) => void;
  onImportSvgText: (name: string, svgText: string) => void;
  onAddTracedImage: (params: {
    name: string;
    dataUrl: string;
    strokes: ReturnType<typeof Array.from> extends never ? never : any;
    aspectRatio: number;
    traceConfig: TraceConfig;
  }) => void;
  onAddText: (text: string, fontFamily: HandwritingFont, fontSize: number) => void;
  onGenerateScript: (script: string, replaceBoard: boolean) => void;
  onSetVoiceover: (track: AudioTrackData | null) => void;
  onSetMusic: (track: AudioTrackData | null) => void;
  onSyncScenesToVoice: () => void;
}

const CATEGORIES = [
  'Todos',
  'Ideias & Negócios',
  'Marketing & Educação',
  'Tech & 3D',
  'Pessoas & Ação',
  'Diagramas & Setas',
  'Engenharia',
] as const;

export function AssetSidebar({
  project,
  activeTab,
  onChangeTab,
  onAddVectorAsset,
  onImportSvgText,
  onAddTracedImage,
  onAddText,
  onGenerateScript,
  onSetVoiceover,
  onSetMusic,
  onSyncScenesToVoice,
}: AssetSidebarProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('Todos');

  // Text creation state
  const [newText, setNewText] = useState('Sua mensagem escrita à mão!');
  const [textFont, setTextFont] = useState<HandwritingFont>('Caveat');
  const [textSize, setTextSize] = useState(48);

  // Script generator state
  const [scriptText, setScriptText] = useState(
    '1. Toda grande ideia começa simples\n2. Desenhe no celular ou PC sem travar\n3. Exporte em MP4 pronto para publicar',
  );
  const [replaceOnScript, setReplaceOnScript] = useState(true);

  // Image auto-vectorizer preview state
  const [tracePreview, setTracePreview] = useState<{
    name: string;
    dataUrl: string;
    strokes: any[];
    aspectRatio: number;
  } | null>(null);
  const [traceConfig, setTraceConfig] = useState<TraceConfig>({
    mode: 'contour',
    sensitivity: 58,
    detail: 1.6,
    invert: false,
    revealOriginal: true,
  });
  const [isTracing, setIsTracing] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef = useRef<number | null>(null);

  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return VECTOR_ASSETS.filter((a) => {
      const catOk = category === 'Todos' || a.category === category;
      const qOk = !q || a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [search, category]);

  const runTracePreview = async (dataUrl: string, name: string, cfg: TraceConfig) => {
    setIsTracing(true);
    try {
      const res = await traceImageUrlToVectors(dataUrl, cfg);
      setTracePreview({
        name,
        dataUrl,
        strokes: res.strokes,
        aspectRatio: res.aspectRatio,
      });
    } finally {
      setIsTracing(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    await runTracePreview(dataUrl, file.name.replace(/\.[^.]+$/, ''), traceConfig);
  };

  const handleSvgUpload = async (file: File) => {
    const txt = await file.text();
    onImportSvgText(file.name.replace(/\.[^.]+$/, ''), txt);
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
        setIsRecording(false);
        setRecordSeconds(0);
        const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
        const decoded = await decodeAudioTrack(blob, `Narração ${new Date().toLocaleTimeString()}`, 1);
        onSetVoiceover(decoded);
      };
      mediaRecorderRef.current = rec;
      rec.start(200);
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch {
      alert('Não foi possível acessar o microfone. Você também pode enviar um arquivo MP3/WAV.');
    }
  };

  const stopVoiceRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const tabs: Array<{ id: SidebarTab; label: string; icon: typeof Shapes }> = [
    { id: 'vectors', label: 'Vetores', icon: Shapes },
    { id: 'trace', label: 'PNG→Vetor', icon: ImagePlus },
    { id: 'text', label: 'Texto', icon: Type },
    { id: 'script', label: 'Roteiro', icon: Sparkles },
    { id: 'audio', label: 'Áudio', icon: Music },
  ];

  return (
    <aside className="studio-sidebar">
      <nav className="rail-tabs" aria-label="Ferramentas de criação">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`tab-${id}`}
            type="button"
            className={`rail-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => onChangeTab(id)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-body">
        {activeTab === 'vectors' && (
          <div className="panel-section">
            <div className="panel-heading">
              <h3>Biblioteca Vetorial</h3>
              <label className="chip-btn" title="Importar arquivo SVG externo">
                <FileCode2 size={14} />
                <span>Subir SVG</span>
                <input
                  type="file"
                  accept=".svg,image/svg+xml"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleSvgUpload(f);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            <input
              type="search"
              className="studio-input"
              placeholder="Buscar desenho..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="studio-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filtrar categoria"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="asset-grid">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  className="asset-tile"
                  onClick={() => onAddVectorAsset(asset)}
                  title={`Adicionar ${asset.name}`}
                >
                  <div
                    className="asset-thumb"
                    dangerouslySetInnerHTML={{ __html: asset.svg }}
                  />
                  <span className="asset-label">{asset.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trace' && (
          <div className="panel-section">
            <div className="panel-heading">
              <h3>Auto-Vetorizador PNG/JPG</h3>
            </div>
            <p className="panel-hint">
              Converta fotos, logos ou rascunhos em <strong>traços vetoriais reais</strong> desenhados pela mão (sem rabisco falso!).
            </p>

            <label className="upload-dropzone">
              <Upload size={20} />
              <span>Escolher PNG, JPG ou WebP</span>
              <input
                id="trace-image-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageUpload(f);
                  e.target.value = '';
                }}
              />
            </label>

            {tracePreview && (
              <div className="trace-config-box">
                <div className="trace-preview-box">
                  <svg
                    viewBox="0 0 1 1"
                    preserveAspectRatio="xMidYMid meet"
                    className="trace-svg-preview"
                  >
                    {tracePreview.strokes.map((s, idx) => (
                      <polyline
                        key={idx}
                        fill="none"
                        stroke="#18181b"
                        strokeWidth={0.008}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={s.points.map((p: { x: number; y: number }) => `${p.x},${p.y}`).join(' ')}
                      />
                    ))}
                  </svg>
                  <div className="trace-meta">
                    <span>{isTracing ? 'Vetorizando...' : `${tracePreview.strokes.length} traços gerados`}</span>
                  </div>
                </div>

                <label className="field-label">
                  Modo de Traçado
                  <select
                    className="studio-select"
                    value={traceConfig.mode}
                    onChange={(e) => {
                      const next = { ...traceConfig, mode: e.target.value as TraceConfig['mode'] };
                      setTraceConfig(next);
                      runTracePreview(tracePreview.dataUrl, tracePreview.name, next);
                    }}
                  >
                    <option value="contour">Contorno Inteligente (Fotos &amp; Logos)</option>
                    <option value="lineart">Esboço / LineArt (Desenhos P&amp;B)</option>
                  </select>
                </label>

                <label className="field-label">
                  Sensibilidade ({traceConfig.sensitivity}%)
                  <input
                    type="range"
                    min={12}
                    max={95}
                    value={traceConfig.sensitivity}
                    onChange={(e) => {
                      const next = { ...traceConfig, sensitivity: Number(e.target.value) };
                      setTraceConfig(next);
                      runTracePreview(tracePreview.dataUrl, tracePreview.name, next);
                    }}
                  />
                </label>

                <label className="field-label">
                  Simplificação ({traceConfig.detail.toFixed(1)}px)
                  <input
                    type="range"
                    min={0.6}
                    max={4.5}
                    step={0.2}
                    value={traceConfig.detail}
                    onChange={(e) => {
                      const next = { ...traceConfig, detail: Number(e.target.value) };
                      setTraceConfig(next);
                      runTracePreview(tracePreview.dataUrl, tracePreview.name, next);
                    }}
                  />
                </label>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={traceConfig.revealOriginal}
                    onChange={(e) =>
                      setTraceConfig({ ...traceConfig, revealOriginal: e.target.checked })
                    }
                  />
                  <span>Revelar cores originais após desenhar</span>
                </label>

                <button
                  id="insert-traced-btn"
                  type="button"
                  className="btn-primary full-width"
                  onClick={() =>
                    onAddTracedImage({
                      ...tracePreview,
                      traceConfig,
                    })
                  }
                >
                  <Wand2 size={15} />
                  <span>Inserir no Quadro</span>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'text' && (
          <div className="panel-section">
            <div className="panel-heading">
              <h3>Texto Manuscrito</h3>
            </div>

            <label className="field-label">
              Texto
              <textarea
                id="new-text-input"
                className="studio-textarea"
                rows={4}
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Digite o texto da cena..."
              />
            </label>

            <label className="field-label">
              Fonte
              <select
                className="studio-select"
                value={textFont}
                onChange={(e) => setTextFont(e.target.value as HandwritingFont)}
              >
                <option value="Caveat">Caveat (Manuscrita Fluida)</option>
                <option value="Patrick Hand">Patrick Hand (Marcador Limpo)</option>
                <option value="Architects Daughter">Architects Daughter (Técnica)</option>
                <option value="Indie Flower">Indie Flower (Leve)</option>
                <option value="Plus Jakarta Sans">Plus Jakarta Sans (Moderna)</option>
                <option value="JetBrains Mono">JetBrains Mono (Código/Dados)</option>
              </select>
            </label>

            <label className="field-label">
              Tamanho ({textSize}px)
              <input
                type="range"
                min={24}
                max={96}
                value={textSize}
                onChange={(e) => setTextSize(Number(e.target.value))}
              />
            </label>

            <button
              id="add-text-btn"
              type="button"
              className="btn-primary full-width"
              onClick={() => onAddText(newText, textFont, textSize)}
            >
              <Type size={15} />
              <span>Adicionar Texto ao Quadro</span>
            </button>
          </div>
        )}

        {activeTab === 'script' && (
          <div className="panel-section">
            <div className="panel-heading">
              <h3>Roteiro → Storyboard</h3>
            </div>
            <p className="panel-hint">
              Escreva 1 ideia por linha. O estúdio escolhe ícones vetoriais compatíveis, distribui no quadro infinito e cria os movimentos de câmera.
            </p>

            <textarea
              id="script-generator-textarea"
              className="studio-textarea"
              rows={7}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Linha 1: Problema&#10;Linha 2: Solução&#10;Linha 3: Resultado"
            />

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={replaceOnScript}
                onChange={(e) => setReplaceOnScript(e.target.checked)}
              />
              <span>Substituir cenas atuais do quadro</span>
            </label>

            <button
              id="generate-storyboard-btn"
              type="button"
              className="btn-primary full-width"
              onClick={() => onGenerateScript(scriptText, replaceOnScript)}
            >
              <Layers size={15} />
              <span>Gerar Cenas Automaticamente</span>
            </button>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="panel-section">
            <div className="panel-heading">
              <h3>Narração &amp; Trilha</h3>
            </div>

            <div className="audio-card">
              <div className="audio-card-head">
                <strong>Voz / Narração</strong>
                {project.voiceover && (
                  <button
                    type="button"
                    className="icon-btn-sm"
                    onClick={() => onSetVoiceover(null)}
                    title="Remover narração"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="btn-row">
                {!isRecording ? (
                  <button type="button" className="btn-teal" onClick={startVoiceRecording}>
                    <Mic size={14} />
                    <span>Gravar Voz</span>
                  </button>
                ) : (
                  <button type="button" className="btn-danger" onClick={stopVoiceRecording}>
                    <MicOff size={15} />
                    <span>Parar ({recordSeconds}s)</span>
                  </button>
                )}

                <label className="btn-secondary">
                  <Upload size={14} />
                  <span>Subir Áudio</span>
                  <input
                    type="file"
                    accept="audio/*"
                    hidden
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const track = await decodeAudioTrack(f, f.name, 1);
                        onSetVoiceover(track);
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>

              {project.voiceover && (
                <div className="audio-meta">
                  <span>
                    {project.voiceover.name} ({project.voiceover.duration.toFixed(1)}s)
                  </span>
                  <label className="field-label">
                    Volume ({Math.round(project.voiceover.volume * 100)}%)
                    <input
                      type="range"
                      min={0}
                      max={1.5}
                      step={0.05}
                      value={project.voiceover.volume}
                      onChange={(e) =>
                        onSetVoiceover({
                          ...project.voiceover!,
                          volume: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="btn-secondary full-width"
                    onClick={onSyncScenesToVoice}
                  >
                    <Wand2 size={14} />
                    <span>Sincronizar Duração à Voz</span>
                  </button>
                </div>
              )}
            </div>

            <div className="audio-card">
              <div className="audio-card-head">
                <strong>Música de Fundo</strong>
                {project.music && (
                  <button
                    type="button"
                    className="icon-btn-sm"
                    onClick={() => onSetMusic(null)}
                    title="Remover música"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <label className="btn-secondary full-width">
                <Music size={14} />
                <span>{project.music ? 'Trocar Música' : 'Carregar Música (MP3/WAV)'}</span>
                <input
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const track = await decodeAudioTrack(f, f.name, 0.28);
                      onSetMusic(track);
                    }
                    e.target.value = '';
                  }}
                />
              </label>

              {project.music && (
                <div className="audio-meta">
                  <span>{project.music.name}</span>
                  <label className="field-label">
                    Volume ({Math.round(project.music.volume * 100)}%)
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={project.music.volume}
                      onChange={(e) =>
                        onSetMusic({
                          ...project.music!,
                          volume: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
