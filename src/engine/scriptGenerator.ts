import { VECTOR_ASSETS } from '../data/assetLibrary';
import { parseSvgToStrokes } from './svgParser';
import type { HandwritingFont, ScribeElement } from '../types/scribe';

const KEYWORD_ASSET_MAP: Array<{ keys: string[]; assetId: string }> = [
  { keys: ['ideia', 'insight', 'luz', 'pensa', 'inova', 'dica'], assetId: 'lightbulb' },
  { keys: ['cresce', 'venda', 'lucro', 'escala', 'grafico', 'dados', 'resultado'], assetId: 'growth-chart' },
  { keys: ['lanca', 'foguete', 'rapido', 'velocidade', 'decol', 'startup'], assetId: 'rocket' },
  { keys: ['meta', 'alvo', 'foco', 'objetivo', 'precis'], assetId: 'target' },
  { keys: ['tempo', 'hora', 'prazo', 'minuto', 'atraso', 'relogio'], assetId: 'clock' },
  { keys: ['premio', 'vence', 'campe', 'sucesso', 'trofeu'], assetId: 'trophy' },
  { keys: ['celular', 'mobile', 'app', 'pwa', 'android', 'telefone'], assetId: 'smartphone' },
  { keys: ['3d', 'cubo', 'render', 'modelo', 'geometr', 'mesh'], assetId: 'cube-3d' },
  { keys: ['blockchain', 'rede', 'bloco', 'web3', 'depin', 'crypto', 'p2p'], assetId: 'blockchain-nodes' },
  { keys: ['gpu', 'chip', 'memoria', 'rom', 'processa', 'motor', 'engine'], assetId: 'gpu-chip' },
  { keys: ['nuvem', 'cloud', 'sincron', 'upload', 'arquivo'], assetId: 'cloud-sync' },
  { keys: ['sistema', 'autom', 'engrenag', 'processo', 'ferramenta'], assetId: 'gears' },
  { keys: ['casa', 'obra', 'constru', 'arquitet', 'imovel', 'reforma'], assetId: 'house-blueprint' },
  { keys: ['ponte', 'estrutur', 'engenh', 'treli'], assetId: 'bridge-structure' },
  { keys: ['equipe', 'time', 'grupo', 'cliente', 'publico', 'pessoa'], assetId: 'team-network' },
  { keys: ['apresenta', 'aula', 'explica', 'ensina', 'curso'], assetId: 'presenter' },
  { keys: ['duvida', 'pergunta', 'problema', 'como', 'porque'], assetId: 'person-thinking' },
  { keys: ['check', 'aprov', 'pronto', 'certo', 'ok', 'conclu'], assetId: 'check-badge' },
];

function pickAssetForLine(line: string, idx: number) {
  const lower = line.toLowerCase();
  for (const entry of KEYWORD_ASSET_MAP) {
    if (entry.keys.some((k) => lower.includes(k))) {
      const found = VECTOR_ASSETS.find((a) => a.id === entry.assetId);
      if (found) return found;
    }
  }
  return VECTOR_ASSETS[idx % VECTOR_ASSETS.length];
}

export function generateStoryboardFromScript(
  scriptText: string,
  options?: {
    fontFamily?: HandwritingFont;
    inkColor?: string;
    isDarkBoard?: boolean;
  },
): ScribeElement[] {
  const lines = scriptText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const ink = options?.inkColor ?? (options?.isDarkBoard ? '#f8fafc' : '#18181b');
  const fontFamily = options?.fontFamily ?? 'Caveat';
  const elements: ScribeElement[] = [];

  // Arrange scenes in a clean 2D grid across the infinite whiteboard so camera pans smoothly
  const cols = Math.min(3, Math.max(2, Math.ceil(Math.sqrt(lines.length))));
  const cellW = 1100;
  const cellH = 680;

  lines.forEach((line, idx) => {
    const row = Math.floor(idx / cols);
    const col = row % 2 === 0 ? idx % cols : cols - 1 - (idx % cols); // Snake zig-zag camera!
    const sceneX = col * cellW;
    const sceneY = row * cellH;

    const preset = pickAssetForLine(line, idx);
    const parsed = parseSvgToStrokes(preset.svg);
    const words = line.split(/\s+/).length;
    const textDur = Math.max(1.4, Math.min(4.2, words * 0.28));

    // Icon element on left of scene
    elements.push({
      id: `el-icon-${Date.now()}-${idx}`,
      name: `${preset.name} (${idx + 1})`,
      type: 'svg',
      x: sceneX - 180,
      y: sceneY,
      width: 240,
      height: Math.round(240 / Math.max(0.5, parsed.aspectRatio)),
      rotation: 0,
      drawDuration: 2.0,
      pauseDuration: 0.2,
      transitionDuration: idx === 0 ? 0 : 0.65,
      animationMode: 'draw',
      strokeColor: options?.isDarkBoard ? '#f8fafc' : preset.defaultStrokeColor,
      strokeWidth: 3.4,
      fillReveal: true,
      fillColor: preset.defaultFillColor,
      opacity: 1,
      camera: {
        cx: sceneX,
        cy: sceneY,
        zoom: 1.05,
        autoFit: false,
      },
      strokes: parsed.strokes,
      sourceSvg: preset.svg,
    });

    // Handwritten text paired to the right inside the same camera frame
    elements.push({
      id: `el-text-${Date.now()}-${idx}`,
      name: line.slice(0, 24),
      type: 'text',
      x: sceneX + 165,
      y: sceneY,
      width: 440,
      height: 220,
      rotation: 0,
      drawDuration: Number(textDur.toFixed(2)),
      pauseDuration: 0.55,
      transitionDuration: 0.15,
      animationMode: 'draw',
      strokeColor: ink,
      strokeWidth: 3,
      fillReveal: false,
      fillColor: ink,
      opacity: 1,
      camera: {
        cx: sceneX,
        cy: sceneY,
        zoom: 1.05,
        autoFit: false,
      },
      strokes: [],
      text: line,
      fontFamily,
      fontSize: line.length > 55 ? 34 : 44,
      textAlign: 'left',
    });
  });

  return elements;
}
