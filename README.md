# OpenScribe Studio

Estúdio de animação **whiteboard offline-first (Web App / PWA)** para desktop e celular — construído com TypeScript, React, HTML5 Canvas, auto-vetorização de imagens e exportação local de vídeo **MP4 (WebCodecs + `mp4-muxer`) / WebM** sem servidor e sem marca d'água.

## Principais Recursos

- **Motor de Traçado SVG Real (`src/engine/svgParser.ts`)**: interpreta `<path>`, formas geométricas e `<g transform="...">`, parametriza por comprimento de arco real e ordena traços por vizinho mais próximo (*greedy TSP*) para a mão deslizar naturalmente.
- **Auto-Vetorização de Qualquer PNG/JPG/WebP (`src/engine/imageTracer.ts`)**: pipeline 100% client-side com detecção de contornos (Sobel + Non-Maximum Suppression) e esqueletização (Zhang-Suen) + simplificação Ramer-Douglas-Peucker, gerando traços vetoriais reais com revelação gradual das cores originais.
- **Mão Animada & Estilos de Quadro (`src/engine/handRenderer.ts`)**: caneta fina, marcador, lápis, giz, ponta minimalista e borracha ancorados pixel a pixel na ponta do traço; fundos em Quadro Branco, Papel Pontilhado, Lousa Escura e Blueprint Técnico.
- **Câmera Infinita + Roteiro para Storyboard (`src/engine/scriptGenerator.ts`, `src/engine/timeline.ts`)**: zoom/pan por cena com interpolação cúbica suave e gerador instantâneo de cenas a partir de roteiro em texto.
- **Narração, Trilha & Waveform (`src/engine/audio.ts`)**: gravação de microfone ao vivo, upload de áudio/música e sincronização proporcional da duração das cenas à voz.
- **Exportação MP4 Local (`src/engine/exporter.ts`)**: renderização quadro a quadro determinística em `1080p`/`720p` (`16:9`, `9:16`, `1:1`, `30`/`60 FPS`) via WebCodecs H.264 + AAC com fallback automático para `MediaRecorder` WebM.
- **PWA Offline & Persistência (`src/engine/storage.ts`)**: salvamento automático em IndexedDB e backup em `.openscribe.json`.

## Comandos

```bash
npm install
npm run dev      # servidor local de desenvolvimento
npm test         # testes unitários com Vitest
npm run lint     # validação com oxlint
npm run build    # build de produção (dist/)
```
