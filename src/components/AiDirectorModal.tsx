import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Play,
  Sparkles,
  Volume2,
  Wand2,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import {
  GEMINI_VOICES,
  loadStoredGoogleApiKey,
  previewGeminiVoice,
  produceFullAiVideo,
  saveStoredGoogleApiKey,
  type AiDirectorOptions,
  type AiDirectorProgress,
  type AiVideoTone,
} from '../engine/aiDirector';
import type { AspectRatio, ScribeProject } from '../types/scribe';

interface AiDirectorModalProps {
  open: boolean;
  defaultAspectRatio: AspectRatio;
  onClose: () => void;
  onProjectReady: (project: ScribeProject, autoSave: boolean) => Promise<void>;
  onPlayNow: () => void;
  onOpenExport: () => void;
}

const TOPIC_SUGGESTIONS = [
  { label: 'IA escolhe o tema', value: '' },
  { label: 'Finanças & Investimentos', value: 'Como organizar finanças pessoais e começar a investir do zero' },
  { label: 'Produtividade & Foco', value: 'Os 5 hábitos científicos para dobrar o foco e vencer a procrastinação' },
  { label: 'Engenharia & Obras', value: 'Como funciona o planejamento estrutural de uma construção moderna' },
  { label: 'Marketing Digital', value: 'Como transformar seguidores em clientes usando funil de vendas simples' },
];

function formatSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function AiDirectorModal({
  open,
  defaultAspectRatio,
  onClose,
  onProjectReady,
  onPlayNow,
  onOpenExport,
}: AiDirectorModalProps) {
  const [apiKey, setApiKey] = useState<string>(() => loadStoredGoogleApiKey());
  const [showKey, setShowKey] = useState(false);

  const [topic, setTopic] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<1 | 3 | 5 | 7 | 10>(5);
  const [tone, setTone] = useState<AiVideoTone>('educativo');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(defaultAspectRatio);
  const [voiceName, setVoiceName] = useState<string>('Aoede');
  const [generateVoiceover, setGenerateVoiceover] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [isProducing, setIsProducing] = useState(false);
  const [progress, setProgress] = useState<AiDirectorProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedProject, setCompletedProject] = useState<ScribeProject | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  if (!open) return null;

  const handleApiKeyChange = (next: string) => {
    setApiKey(next);
    saveStoredGoogleApiKey(next);
  };

  const handleTestVoice = async () => {
    if (!apiKey.trim()) {
      setErrorMsg('Cole sua chave de API do Google (AIza...) antes de testar a voz.');
      return;
    }
    setErrorMsg(null);
    setIsTestingVoice(true);
    try {
      const url = await previewGeminiVoice(apiKey, voiceName);
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      const audio = new Audio(url);
      previewAudioRef.current = audio;
      await audio.play();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao testar voz na API do Google.');
    } finally {
      setIsTestingVoice(false);
    }
  };

  const handleStartProduction = async () => {
    if (!apiKey.trim()) {
      setErrorMsg('Cole sua chave de API do Google (Google AI Studio / Gemini) para iniciar.');
      return;
    }

    setErrorMsg(null);
    setCompletedProject(null);
    setIsProducing(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const opts: AiDirectorOptions = {
      topic,
      durationMinutes,
      tone,
      aspectRatio,
      voiceName,
      generateVoiceover,
      language: 'Português do Brasil',
    };

    try {
      const { project } = await produceFullAiVideo(
        apiKey,
        opts,
        (p) => setProgress(p),
        controller.signal,
      );
      await onProjectReady(project, autoSave);
      setCompletedProject(project);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setErrorMsg('Produção cancelada pelo usuário.');
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Erro inesperado ao gerar vídeo com IA.');
      }
    } finally {
      setIsProducing(false);
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  const handleSafeClose = () => {
    if (isProducing) return;
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleSafeClose}>
      <div
        id="ai-director-modal"
        className="modal-card ai-director-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Diretor IA — Criar Vídeo Completo"
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Wand2 size={18} className="accent-icon" />
            <div>
              <h3>Diretor IA — Vídeo Completo (5 a 10 min)</h3>
              <p className="modal-subtitle">
                A IA escolhe o tema, escreve o roteiro, seleciona os desenhos, grava voz natural e salva tudo pronto.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn-sm"
            onClick={handleSafeClose}
            disabled={isProducing}
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body ai-director-body">
          {/* Google API Key */}
          <div className="ai-key-box">
            <label className="field-label" htmlFor="google-api-key-input">
              <span className="inline-label-row">
                <KeyRound size={13} />
                Chave de API do Google (Google AI Studio / Google One AI)
              </span>
              <div className="api-key-input-row">
                <input
                  id="google-api-key-input"
                  type={showKey ? 'text' : 'password'}
                  className="studio-input"
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="Cole sua chave AIza..."
                  disabled={isProducing}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowKey((s) => !s)}
                  title={showKey ? 'Ocultar chave' : 'Mostrar chave'}
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>
            <p className="ai-key-hint">
              Salva apenas no seu dispositivo. A mesma chave gera o roteiro (<code>gemini-2.5-flash</code>) e a voz natural (<code>gemini-2.5-flash-preview-tts</code>).{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                Obter chave no Google AI Studio ↗
              </a>
            </p>
          </div>

          {/* Topic + Quick Chips */}
          <label className="field-label" htmlFor="ai-topic-input">
            Tema do Vídeo (opcional — deixe vazio para a IA escolher tudo)
            <input
              id="ai-topic-input"
              type="text"
              className="studio-input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex.: Como construir uma casa econômica passo a passo (ou deixe em branco)..."
              disabled={isProducing}
            />
          </label>

          <div className="ai-chip-row">
            {TOPIC_SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                type="button"
                className={`ai-chip ${topic === s.value ? 'active' : ''}`}
                onClick={() => setTopic(s.value)}
                disabled={isProducing}
              >
                {s.value === '' && <Sparkles size={11} />}
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Duration + Tone + Aspect Ratio */}
          <div className="ai-grid-3">
            <label className="field-label">
              Duração Alvo
              <select
                id="ai-duration-select"
                className="studio-select"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value) as 1 | 3 | 5 | 7 | 10)}
                disabled={isProducing}
              >
                <option value={1}>1 min (Teste rápido · 4 cenas)</option>
                <option value={3}>3 min (12 cenas)</option>
                <option value={5}>5 min (Completo · 20 cenas)</option>
                <option value={7}>7 min (Aprofundado · 28 cenas)</option>
                <option value={10}>10 min (Masterclass · 36 cenas)</option>
              </select>
            </label>

            <label className="field-label">
              Estilo / Tom
              <select
                id="ai-tone-select"
                className="studio-select"
                value={tone}
                onChange={(e) => setTone(e.target.value as AiVideoTone)}
                disabled={isProducing}
              >
                <option value="educativo">Educativo & Didático</option>
                <option value="negocios">Negócios & Vendas</option>
                <option value="storytelling">Storytelling Envolvente</option>
                <option value="engenharia">Engenharia & Técnico</option>
                <option value="motivacional">Motivacional & Impacto</option>
              </select>
            </label>

            <label className="field-label">
              Formato
              <select
                id="ai-aspect-select"
                className="studio-select"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                disabled={isProducing}
              >
                <option value="16:9">16:9 (YouTube / PC)</option>
                <option value="9:16">9:16 (Reels / TikTok)</option>
                <option value="1:1">1:1 (Feed Quadrado)</option>
              </select>
            </label>
          </div>

          {/* Voice Selection + Test Button */}
          <div className="ai-voice-row">
            <label className="field-label" style={{ flex: 1 }}>
              Voz Natural (Google Gemini TTS)
              <select
                id="ai-voice-select"
                className="studio-select"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                disabled={isProducing || !generateVoiceover}
              >
                {GEMINI_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label} — {v.description}
                  </option>
                ))}
              </select>
            </label>

            <button
              id="ai-test-voice-btn"
              type="button"
              className="btn-secondary ai-test-voice-btn"
              onClick={() => void handleTestVoice()}
              disabled={isProducing || isTestingVoice || !generateVoiceover}
              title="Ouvir uma amostra de 2 segundos desta voz"
            >
              {isTestingVoice ? <Loader2 size={14} className="spin" /> : <Volume2 size={14} />}
              <span>{isTestingVoice ? 'Gerando...' : 'Testar Voz'}</span>
            </button>
          </div>

          {/* Toggles */}
          <div className="ai-toggles-row">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={generateVoiceover}
                onChange={(e) => setGenerateVoiceover(e.target.checked)}
                disabled={isProducing}
              />
              <span>Gerar locução natural cena por cena (sincronia exata)</span>
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                disabled={isProducing}
              />
              <span>Salvar projeto automaticamente no disco/local</span>
            </label>
          </div>

          {/* Error Banner */}
          {errorMsg && <div className="ai-error-box">{errorMsg}</div>}

          {/* Live Progress Box */}
          {(isProducing || (progress && completedProject)) && progress && (
            <div className={`ai-progress-box ${completedProject ? 'done' : ''}`}>
              <div className="ai-progress-top">
                <span className="ai-progress-msg">
                  {completedProject ? <CheckCircle2 size={15} /> : <Loader2 size={15} className="spin" />}
                  {progress.message}
                </span>
                <strong>{Math.round(progress.progress * 100)}%</strong>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${Math.round(progress.progress * 100)}%` }} />
              </div>
              {progress.plan && (
                <div className="ai-plan-meta">
                  <span>
                    <strong>Projeto:</strong> {progress.plan.title}
                  </span>
                  <span>
                    <strong>Quadro:</strong> {progress.plan.boardTheme}
                  </span>
                  <span>
                    <strong>Cenas:</strong> {progress.completedScenes ?? 0}/{progress.totalScenes ?? progress.plan.scenes.length}
                  </span>
                  {typeof progress.accumulatedAudioSec === 'number' && progress.accumulatedAudioSec > 0 && (
                    <span>
                      <strong>Áudio:</strong> {formatSec(progress.accumulatedAudioSec)}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {isProducing ? (
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Cancelar Produção
            </button>
          ) : completedProject ? (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  onClose();
                  onPlayNow();
                }}
              >
                <Play size={15} />
                <span>Reproduzir Agora</span>
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  onClose();
                  onOpenExport();
                }}
              >
                <span>Exportar MP4</span>
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-secondary" onClick={handleSafeClose}>
                Fechar
              </button>
              <button
                id="ai-start-produce-btn"
                type="button"
                className="btn-primary"
                onClick={() => void handleStartProduction()}
              >
                <Wand2 size={15} />
                <span>Criar Vídeo Completo ({durationMinutes} min)</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
