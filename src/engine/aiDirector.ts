import { VECTOR_ASSETS, type VectorAssetPreset } from '../data/assetLibrary';
import type {
  AnimationMode,
  AspectRatio,
  AudioTrackData,
  BoardTheme,
  HandStyle,
  ScribeElement,
  ScribeProject,
} from '../types/scribe';
import { parseSvgToStrokes } from './svgParser';

const API_KEY_STORAGE = 'openscribe_google_api_key';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface GeminiVoiceOption {
  id: string;
  label: string;
  description: string;
}

export const GEMINI_VOICES: GeminiVoiceOption[] = [
  { id: 'Kore', label: 'Kore (Feminina · Firme)', description: 'Clara, profissional e didática' },
  { id: 'Aoede', label: 'Aoede (Feminina · Natural)', description: 'Calorosa, fluida e envolvente' },
  { id: 'Zephyr', label: 'Zephyr (Feminina · Dinâmica)', description: 'Jovem, leve e energética' },
  { id: 'Charon', label: 'Charon (Masculina · Grave)', description: 'Informativa, calma e confiante' },
  { id: 'Fenrir', label: 'Fenrir (Masculina · Forte)', description: 'Impactante, ideal para vendas e hooks' },
  { id: 'Puck', label: 'Puck (Masculina · Carismática)', description: 'Descontraída, ótima para storytelling' },
  { id: 'Orus', label: 'Orus (Masculina · Corporativa)', description: 'Séries técnicas, engenharia e negócios' },
];

export type AiVideoTone =
  | 'educativo'
  | 'negocios'
  | 'storytelling'
  | 'engenharia'
  | 'motivacional';

export interface AiDirectorOptions {
  /** Leave empty to let Gemini choose a compelling topic autonomously */
  topic: string;
  /** Target video duration in minutes (1, 3, 5, 7, or 10) */
  durationMinutes: 1 | 3 | 5 | 7 | 10;
  tone: AiVideoTone;
  aspectRatio: AspectRatio;
  voiceName: string;
  generateVoiceover: boolean;
  language: string;
}

export interface AiScenePlan {
  heading: string;
  caption: string;
  narration: string;
  assetId: string;
  animationMode: 'draw' | 'move-in';
  accentColor?: string;
}

export interface AiStoryboardPlan {
  title: string;
  chosenTopic: string;
  boardTheme: BoardTheme;
  handStyle: HandStyle;
  scenes: AiScenePlan[];
}

export interface AiDirectorProgress {
  phase: 'planning' | 'voiceover' | 'assembling' | 'done';
  progress: number; // 0..1
  message: string;
  plan?: AiStoryboardPlan;
  completedScenes?: number;
  totalScenes?: number;
  accumulatedAudioSec?: number;
}

export function loadStoredGoogleApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function saveStoredGoogleApiKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(API_KEY_STORAGE, trimmed);
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
    }
  } catch {
    // Ignore storage quota errors
  }
}

function getTargetSceneCount(durationMinutes: AiDirectorOptions['durationMinutes']): number {
  switch (durationMinutes) {
    case 1:
      return 4;
    case 3:
      return 12;
    case 5:
      return 20;
    case 7:
      return 28;
    case 10:
      return 36;
  }
}

function getToneInstruction(tone: AiVideoTone): string {
  switch (tone) {
    case 'negocios':
      return 'Tom de negócios, persuasivo, claro e orientado a resultados práticos.';
    case 'storytelling':
      return 'Tom de storytelling envolvente, com gancho forte, conflito, virada e lição memorável.';
    case 'engenharia':
      return 'Tom técnico-didático de engenharia e arquitetura, preciso e visual.';
    case 'motivacional':
      return 'Tom inspirador, energético e transformador, com frases de impacto.';
    default:
      return 'Tom educativo, didático, curioso e fácil de acompanhar passo a passo.';
  }
}

function stripJsonFences(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return trimmed;
}

function pickValidAsset(assetId: string, fallbackIndex: number): VectorAssetPreset {
  const exact = VECTOR_ASSETS.find((a) => a.id === assetId);
  if (exact) return exact;
  const fuzzy = VECTOR_ASSETS.find(
    (a) =>
      a.id.includes(assetId.toLowerCase()) ||
      a.name.toLowerCase().includes(assetId.toLowerCase()),
  );
  return fuzzy || VECTOR_ASSETS[fallbackIndex % VECTOR_ASSETS.length];
}

function sanitizeBoardTheme(theme: unknown): BoardTheme {
  if (theme === 'whiteboard' || theme === 'chalkboard' || theme === 'blueprint' || theme === 'dotgrid') {
    return theme;
  }
  return 'whiteboard';
}

function sanitizeHandStyle(style: unknown): HandStyle {
  if (style === 'realistic-pen' || style === 'pencil' || style === 'marker' || style === 'chalk') {
    return style;
  }
  return 'realistic-pen';
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (init.signal?.aborted) {
      throw new DOMException('Cancelado pelo usuário', 'AbortError');
    }
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;

      // Do not retry auth or bad request errors
      if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404) {
        const errText = await res.text().catch(() => '');
        let detail = errText.slice(0, 260);
        try {
          const parsed = JSON.parse(errText) as { error?: { message?: string } };
          if (parsed.error?.message) detail = parsed.error.message;
        } catch {
          // Keep raw snippet
        }
        throw new Error(`Google API (${res.status}): ${detail || res.statusText}`);
      }

      // Retryable rate-limit or transient server error
      if (attempt < maxRetries && (res.status === 429 || res.status >= 500)) {
        const delayMs = Math.min(12_000, 1500 * Math.pow(2, attempt));
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }

      const errText = await res.text().catch(() => '');
      throw new Error(`Google API (${res.status}): ${errText.slice(0, 220) || res.statusText}`);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        const delayMs = Math.min(8000, 1200 * Math.pow(2, attempt));
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastError || new Error('Falha de conexão com a API do Google.');
}

/**
 * Uses Gemini 2.5 Flash to autonomously plan a complete 1..10 minute whiteboard video:
 * topic selection (if blank), visual board theme, hand style, SVG assets, and full narration script.
 */
export async function generateAiStoryboard(
  apiKey: string,
  options: AiDirectorOptions,
  signal?: AbortSignal,
): Promise<AiStoryboardPlan> {
  const sceneCount = getTargetSceneCount(options.durationMinutes);
  const wordsPerScene = options.durationMinutes >= 5 ? 36 : 32;
  const catalogSummary = VECTOR_ASSETS.map((a) => `${a.id} (${a.name} · ${a.category})`).join(', ');

  const topicPrompt = options.topic.trim()
    ? `Tema escolhido pelo usuário: "${options.topic.trim()}".`
    : `O usuário deixou o tema livre: ESCOLHA VOCÊ um tema fascinante, altamente educativo e envolvente para um vídeo whiteboard viral em ${options.language}.`;

  const prompt = `Você é o Diretor Criativo de vídeos Whiteboard (estilo VideoScribe) do OpenScribe Studio.
${topicPrompt}
Duração alvo: ${options.durationMinutes} minutos (${sceneCount} cenas).
Estilo: ${getToneInstruction(options.tone)}
Idioma: ${options.language}.

Catálogo de ilustrações vetoriais disponíveis (use EXCLUSIVAMENTE estes IDs no campo assetId):
${catalogSummary}

Regras obrigatórias:
1. Crie EXATAMENTE ${sceneCount} cenas sequenciais (Introdução/Gancho -> Desenvolvimento em capítulos claros -> Exemplos práticos -> Conclusão e Chamada para Ação).
2. Cada cena deve ter:
   - "heading": título curto e marcante para aparecer desenhado no quadro (máximo 42 caracteres).
   - "caption": 1 frase curta complementar no quadro (máximo 75 caracteres).
   - "narration": texto falado natural, fluido e sem marcações/emojis, com aproximadamente ${wordsPerScene} palavras por cena (para que o vídeo completo tenha cerca de ${options.durationMinutes} minutos de voz natural).
   - "assetId": um ID exato da lista acima que ilustre perfeitamente a cena (varie bastante os ícones!).
   - "animationMode": "draw" na maioria das cenas, ou "move-in" em ~20% das cenas para variar o ritmo visual.
3. Escolha o melhor "boardTheme" ("whiteboard", "dotgrid", "chalkboard" ou "blueprint") e o melhor "handStyle" ("realistic-pen", "pencil" ou "marker") para o tema.
4. Responda APENAS com um objeto JSON válido seguindo exatamente esta estrutura:
{
  "title": "Título do Vídeo",
  "chosenTopic": "Resumo do tema escolhido",
  "boardTheme": "whiteboard",
  "handStyle": "realistic-pen",
  "scenes": [
    {
      "heading": "1. Título da Cena",
      "caption": "Resumo curto no quadro",
      "narration": "Texto natural da locução desta cena...",
      "assetId": "lightbulb",
      "animationMode": "draw"
    }
  ]
}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.85,
      maxOutputTokens: 8192,
    },
  };

  const res = await fetchWithRetry(
    `${GEMINI_BASE}/gemini-2.5-flash:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim(),
      },
      body: JSON.stringify(body),
      signal,
    },
    2,
  );

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('A IA não retornou um roteiro válido. Tente novamente.');
  }

  let parsed: Partial<AiStoryboardPlan>;
  try {
    parsed = JSON.parse(stripJsonFences(rawText)) as Partial<AiStoryboardPlan>;
  } catch {
    throw new Error('Falha ao interpretar o roteiro JSON retornado pela IA. Tente novamente.');
  }

  if (!Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
    throw new Error('O roteiro gerado veio sem cenas.');
  }

  const sanitizedScenes: AiScenePlan[] = parsed.scenes.map((sc, idx) => ({
    heading: String(sc.heading || `Cena ${idx + 1}`).trim().slice(0, 64),
    caption: String(sc.caption || '').trim().slice(0, 110),
    narration: String(sc.narration || sc.heading || `Cena ${idx + 1}`).trim(),
    assetId: pickValidAsset(String(sc.assetId || 'lightbulb'), idx).id,
    animationMode: sc.animationMode === 'move-in' ? 'move-in' : 'draw',
    accentColor: typeof sc.accentColor === 'string' ? sc.accentColor : undefined,
  }));

  return {
    title: String(parsed.title || options.topic || 'Vídeo Whiteboard IA').trim().slice(0, 80),
    chosenTopic: String(parsed.chosenTopic || options.topic || parsed.title || 'Tema gerado por IA').trim(),
    boardTheme: sanitizeBoardTheme(parsed.boardTheme),
    handStyle: sanitizeHandStyle(parsed.handStyle),
    scenes: sanitizedScenes,
  };
}

function base64ToUint8Array(base64: string): Uint8Array {
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

/**
 * Extracts raw 16-bit signed little-endian PCM samples from either raw L16 PCM or a 44-byte RIFF WAV buffer.
 */
export function extractPcm16Samples(bytes: Uint8Array): { samples: Int16Array; sampleRate: number } {
  let offset = 0;
  let sampleRate = 24000;

  // Detect RIFF/WAVE header
  if (
    bytes.length > 44 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    sampleRate = dv.getUint32(24, true) || 24000;
    // Locate "data" chunk
    let pos = 12;
    while (pos + 8 < bytes.length) {
      const id = String.fromCharCode(bytes[pos], bytes[pos + 1], bytes[pos + 2], bytes[pos + 3]);
      const size = dv.getUint32(pos + 4, true);
      if (id === 'data') {
        offset = pos + 8;
        break;
      }
      pos += 8 + size;
    }
    if (offset === 0) offset = 44;
  }

  const pcmBytes = bytes.subarray(offset);
  const sampleCount = Math.floor(pcmBytes.byteLength / 2);
  const samples = new Int16Array(sampleCount);
  const dv = new DataView(pcmBytes.buffer, pcmBytes.byteOffset, sampleCount * 2);
  for (let i = 0; i < sampleCount; i++) {
    samples[i] = dv.getInt16(i * 2, true);
  }
  return { samples, sampleRate };
}

/**
 * Clean linear resampler for keeping long 5–10 minute WAV voiceovers lightweight (16kHz mono).
 */
export function resamplePcm16(
  input: Int16Array,
  fromRate: number,
  toRate: number,
): Int16Array {
  if (fromRate === toRate || input.length === 0) return input;
  const ratio = fromRate / toRate;
  const outLen = Math.max(1, Math.round(input.length / ratio));
  const out = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcPos = i * ratio;
    const i0 = Math.floor(srcPos);
    const i1 = Math.min(input.length - 1, i0 + 1);
    const frac = srcPos - i0;
    out[i] = Math.round(input[i0] * (1 - frac) + input[i1] * frac);
  }
  return out;
}

/**
 * Encodes 16-bit mono PCM samples into a standard RIFF WAV Blob.
 */
export function encodePcm16ToWavBlob(samples: Int16Array, sampleRate: number): Blob {
  const dataSize = samples.length * 2;
  const buf = new ArrayBuffer(44 + dataSize);
  const dv = new DataView(buf);

  const writeStr = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) dv.setUint8(off + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  dv.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  dv.setUint32(16, 16, true); // PCM chunk size
  dv.setUint16(20, 1, true); // PCM format
  dv.setUint16(22, 1, true); // Mono
  dv.setUint32(24, sampleRate, true);
  dv.setUint32(28, sampleRate * 2, true); // Byte rate
  dv.setUint16(32, 2, true); // Block align
  dv.setUint16(34, 16, true); // Bits per sample
  writeStr(36, 'data');
  dv.setUint32(40, dataSize, true);

  let pos = 44;
  for (let i = 0; i < samples.length; i++) {
    dv.setInt16(pos, samples[i], true);
    pos += 2;
  }

  return new Blob([buf], { type: 'audio/wav' });
}

export function computeWaveformFromPcm16(samples: Int16Array, bars = 90): number[] {
  if (samples.length === 0) return new Array(bars).fill(0.15);
  const blockSize = Math.max(1, Math.floor(samples.length / bars));
  const out: number[] = [];
  let maxVal = 0.01;
  for (let b = 0; b < bars; b++) {
    const start = b * blockSize;
    const end = Math.min(samples.length, start + blockSize);
    let sumSq = 0;
    for (let i = start; i < end; i++) {
      const v = samples[i] / 32768;
      sumSq += v * v;
    }
    const rms = Math.sqrt(sumSq / Math.max(1, end - start));
    out.push(rms);
    if (rms > maxVal) maxVal = rms;
  }
  return out.map((v) => Math.max(0.08, Math.min(1, v / maxVal)));
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Falha ao converter áudio WAV.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Calls Gemini 2.5 Flash Preview TTS for a single scene narration, returning raw PCM16 samples and exact duration.
 */
export async function synthesizeGeminiSpeechPcm(
  apiKey: string,
  narrationText: string,
  voiceName: string,
  language = 'Português do Brasil',
  signal?: AbortSignal,
): Promise<{ samples: Int16Array; sampleRate: number; durationSec: number }> {
  // Note: Gemini TTS preview models require director notes inline (systemInstruction returns HTTP 400)
  // and default temperature (1.0) for reliable output.
  const promptText = `Fale em ${language} com voz natural, clara, expressiva e ritmo fluido de apresentação profissional:\n\n${narrationText}`;

  const body = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voiceName || 'Kore',
          },
        },
      },
    },
  };

  const res = await fetchWithRetry(
    `${GEMINI_BASE}/gemini-2.5-flash-preview-tts:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim(),
      },
      body: JSON.stringify(body),
      signal,
    },
    3,
  );

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { mimeType?: string; data?: string };
        }>;
      };
    }>;
  };

  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData?.data) {
    throw new Error('A API de voz Gemini não retornou áudio para esta cena.');
  }

  const bytes = base64ToUint8Array(part.inlineData.data);
  const { samples, sampleRate } = extractPcm16Samples(bytes);
  const durationSec = samples.length / sampleRate;
  return { samples, sampleRate, durationSec };
}

/**
 * Generates a short 2-second voice test sample so the user can audition any Gemini voice.
 */
export async function previewGeminiVoice(
  apiKey: string,
  voiceName: string,
  signal?: AbortSignal,
): Promise<string> {
  const res = await synthesizeGeminiSpeechPcm(
    apiKey,
    'Olá! Esta é a minha voz natural para narrar o seu vídeo completo no OpenScribe Studio.',
    voiceName,
    'Português do Brasil',
    signal,
  );
  const wavBlob = encodePcm16ToWavBlob(res.samples, res.sampleRate);
  return URL.createObjectURL(wavBlob);
}

/**
 * Builds a complete, tightly synchronized ScribeProject from an AI storyboard plan and exact per-scene durations.
 */
export function buildProjectFromAiPlan(
  plan: AiStoryboardPlan,
  sceneDurationsSec: number[],
  voiceover: AudioTrackData | null,
  aspectRatio: AspectRatio,
): ScribeProject {
  const isDark = plan.boardTheme === 'chalkboard' || plan.boardTheme === 'blueprint';
  const bgColor =
    plan.boardTheme === 'chalkboard'
      ? '#182621'
      : plan.boardTheme === 'blueprint'
        ? '#0f2847'
        : plan.boardTheme === 'dotgrid'
          ? '#fcfbf7'
          : '#faf9f5';
  const defaultInk = isDark ? '#f8fafc' : '#18181b';

  const elements: ScribeElement[] = [];
  const cols = 3;
  const colSpacing = 1340;
  const rowSpacing = 820;

  for (let i = 0; i < plan.scenes.length; i++) {
    const scene = plan.scenes[i];
    const asset = pickValidAsset(scene.assetId, i);
    const parsed = parseSvgToStrokes(asset.svg);

    // Snake layout across infinite canvas for smooth cinematic camera pans
    const row = Math.floor(i / cols);
    const colInRow = i % cols;
    const col = row % 2 === 0 ? colInRow : cols - 1 - colInRow;
    const cx = col * colSpacing;
    const cy = row * rowSpacing;

    // Exact scene budget matching spoken audio duration (or estimated duration if voiceover disabled)
    const sceneBudget = Math.max(4.5, sceneDurationsSec[i] || 12);
    const transitionDur = i === 0 ? 0.0 : 0.65;
    const remaining = Math.max(3.5, sceneBudget - transitionDur);

    // Split scene time: ~42% drawing SVG + short beat, ~58% writing text + short hold
    const svgDrawDur = Number(Math.max(1.2, Math.min(4.5, remaining * 0.34)).toFixed(2));
    const svgPauseDur = Number(Math.max(0.15, remaining * 0.06).toFixed(2));
    const textDrawDur = Number(Math.max(1.4, Math.min(5.5, remaining * 0.36)).toFixed(2));
    const textPauseDur = Number(Math.max(0.3, remaining - svgDrawDur - svgPauseDur - textDrawDur).toFixed(2));

    const svgId = `ai-scene-${i + 1}-svg`;
    const textId = `ai-scene-${i + 1}-txt`;

    const svgWidth = 250;
    const svgHeight = Math.round(svgWidth / Math.max(0.5, parsed.aspectRatio));
    const animMode: AnimationMode = scene.animationMode === 'move-in' ? 'move-in' : 'draw';

    const adaptedStrokes = isDark
      ? parsed.strokes.map((s) => ({
          ...s,
          color:
            !s.color || s.color.toLowerCase() === '#18181b' || s.color.toLowerCase() === '#000000'
              ? '#f8fafc'
              : s.color,
        }))
      : parsed.strokes;

    elements.push({
      id: svgId,
      name: `${i + 1}. ${asset.name}`,
      type: 'svg',
      x: cx - 220,
      y: cy - 10,
      width: svgWidth,
      height: svgHeight,
      rotation: 0,
      drawDuration: svgDrawDur,
      pauseDuration: svgPauseDur,
      transitionDuration: transitionDur,
      animationMode: animMode,
      moveInFrom: i % 2 === 0 ? 'left' : 'right',
      strokeColor: defaultInk,
      strokeWidth: 3.3,
      fillReveal: true,
      fillColor: asset.defaultFillColor,
      opacity: 1,
      handStyleOverride: 'inherit',
      camera: { cx, cy, zoom: 1.0, autoFit: false },
      strokes: adaptedStrokes,
      sourceSvg: asset.svg,
    });

    const fullText = scene.caption ? `${scene.heading}\n${scene.caption}` : scene.heading;

    elements.push({
      id: textId,
      name: `${i + 1}. ${scene.heading}`,
      type: 'text',
      x: cx + 195,
      y: cy - 6,
      width: 500,
      height: 220,
      rotation: 0,
      drawDuration: textDrawDur,
      pauseDuration: textPauseDur,
      transitionDuration: 0,
      animationMode: 'draw',
      strokeColor: defaultInk,
      strokeWidth: 3,
      fillReveal: false,
      fillColor: 'transparent',
      opacity: 1,
      handStyleOverride: 'inherit',
      camera: { cx, cy, zoom: 1.0, autoFit: false },
      strokes: [],
      text: fullText,
      fontFamily: plan.boardTheme === 'blueprint' ? 'Architects Daughter' : 'Caveat',
      fontSize: 40,
      textAlign: 'left',
      textBgColor: 'transparent',
    });
  }

  return {
    id: `ai-project-${Date.now()}`,
    title: plan.title,
    updatedAt: Date.now(),
    boardTheme: plan.boardTheme,
    backgroundColor: bgColor,
    aspectRatio,
    defaultHandStyle: plan.handStyle,
    elements,
    voiceover,
    music: null,
  };
}

/**
 * End-to-end AI Director pipeline:
 * 1) Plans full 1..10 min storyboard + chooses theme/hand/SVGs
 * 2) Synthesizes natural studio voiceover scene-by-scene with Gemini TTS
 * 3) Builds a perfectly audio-synced ScribeProject ready for playback, auto-save, and MP4 export
 */
export async function produceFullAiVideo(
  apiKey: string,
  options: AiDirectorOptions,
  onProgress: (p: AiDirectorProgress) => void,
  signal?: AbortSignal,
): Promise<{ project: ScribeProject; plan: AiStoryboardPlan }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('Informe sua chave de API do Google (Google AI Studio / Gemini) para continuar.');
  }

  onProgress({
    phase: 'planning',
    progress: 0.06,
    message: options.topic.trim()
      ? `Diretor IA planejando roteiro de ${options.durationMinutes} min sobre "${options.topic.trim()}"...`
      : `Diretor IA escolhendo tema, estilo visual e roteiro de ${options.durationMinutes} min...`,
  });

  const plan = await generateAiStoryboard(cleanKey, options, signal);
  const totalScenes = plan.scenes.length;

  onProgress({
    phase: options.generateVoiceover ? 'voiceover' : 'assembling',
    progress: 0.16,
    message: `Roteiro pronto: "${plan.title}" (${totalScenes} cenas). ${
      options.generateVoiceover ? 'Iniciando gravação da voz natural...' : 'Montando cenas no quadro...'
    }`,
    plan,
    completedScenes: 0,
    totalScenes,
    accumulatedAudioSec: 0,
  });

  let voiceoverTrack: AudioTrackData | null = null;
  const sceneDurationsSec: number[] = [];

  if (options.generateVoiceover) {
    // Use 16kHz for long 5-10 min videos to keep WAV compact (~9-19 MB) and fast to save/export
    const targetSampleRate = options.durationMinutes >= 5 ? 16000 : 24000;
    const pauseSamplesCount = Math.round(targetSampleRate * 0.35);
    const silencePad = new Int16Array(pauseSamplesCount);

    const chunks: Int16Array[] = [];
    let totalSamples = 0;
    let accumulatedSec = 0;

    for (let i = 0; i < totalScenes; i++) {
      if (signal?.aborted) {
        throw new DOMException('Produção cancelada pelo usuário.', 'AbortError');
      }

      const scene = plan.scenes[i];
      onProgress({
        phase: 'voiceover',
        progress: 0.16 + (i / totalScenes) * 0.74,
        message: `Gravando voz natural (${options.voiceName}) — Cena ${i + 1}/${totalScenes}: "${scene.heading}"`,
        plan,
        completedScenes: i,
        totalScenes,
        accumulatedAudioSec: accumulatedSec,
      });

      const speech = await synthesizeGeminiSpeechPcm(
        cleanKey,
        scene.narration,
        options.voiceName,
        options.language,
        signal,
      );

      const resampled = resamplePcm16(speech.samples, speech.sampleRate, targetSampleRate);
      chunks.push(resampled);
      totalSamples += resampled.length;

      const isLast = i === totalScenes - 1;
      if (!isLast) {
        chunks.push(silencePad);
        totalSamples += silencePad.length;
      }

      const sceneAudioSec = resampled.length / targetSampleRate + (isLast ? 0 : 0.35);
      sceneDurationsSec.push(sceneAudioSec);
      accumulatedSec += sceneAudioSec;
    }

    onProgress({
      phase: 'assembling',
      progress: 0.92,
      message: 'Finalizando masterização da locução e sincronizando todas as cenas...',
      plan,
      completedScenes: totalScenes,
      totalScenes,
      accumulatedAudioSec: accumulatedSec,
    });

    const merged = new Int16Array(totalSamples);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const wavBlob = encodePcm16ToWavBlob(merged, targetSampleRate);
    const dataUrl = await blobToDataUrl(wavBlob);
    const waveform = computeWaveformFromPcm16(merged, 90);

    voiceoverTrack = {
      id: `ai-voice-${Date.now()}`,
      name: `Locução IA (${options.voiceName}) · ${plan.title.slice(0, 26)}`,
      dataUrl,
      duration: merged.length / targetSampleRate,
      volume: 1,
      offset: 0,
      waveform,
    };
  } else {
    // Estimate natural speaking duration (~2.3 words/sec) when voiceover is unchecked
    for (const scene of plan.scenes) {
      const words = scene.narration.split(/\s+/).filter(Boolean).length;
      sceneDurationsSec.push(Math.max(5.5, words / 2.3 + 0.5));
    }
  }

  onProgress({
    phase: 'assembling',
    progress: 0.96,
    message: 'Construindo quadro infinito, câmera e salvando projeto localmente...',
    plan,
    completedScenes: totalScenes,
    totalScenes,
    accumulatedAudioSec: voiceoverTrack?.duration ?? sceneDurationsSec.reduce((a, b) => a + b, 0),
  });

  const project = buildProjectFromAiPlan(plan, sceneDurationsSec, voiceoverTrack, options.aspectRatio);

  onProgress({
    phase: 'done',
    progress: 1,
    message: `Vídeo completo pronto e salvo! (${totalScenes} cenas · ${Math.round(
      (voiceoverTrack?.duration ?? sceneDurationsSec.reduce((a, b) => a + b, 0)) / 60,
    )} min)`,
    plan,
    completedScenes: totalScenes,
    totalScenes,
    accumulatedAudioSec: voiceoverTrack?.duration ?? sceneDurationsSec.reduce((a, b) => a + b, 0),
  });

  return { project, plan };
}
