import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import type { ExportConfig, ExportProgress, ScribeProject } from '../types/scribe';
import { mixProjectAudioBuffer } from './audio';
import { preloadProjectImages, renderProjectFrame } from './renderer';
import { buildTimelineSchedule, getStageDimensions } from './timeline';

const VIDEO_CODECS = ['avc1.4d002a', 'avc1.42001f', 'avc1.640028', 'avc1.42E01E'];

async function pickSupportedVideoCodec(
  width: number,
  height: number,
  fps: number,
  bitrate: number,
): Promise<string | null> {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') {
    return null;
  }
  for (const codec of VIDEO_CODECS) {
    try {
      const res = await VideoEncoder.isConfigSupported({
        codec,
        width,
        height,
        framerate: fps,
        bitrate,
      });
      if (res.supported) return codec;
    } catch {
      // Try next H.264 profile
    }
  }
  return null;
}

async function isAacSupported(sampleRate: number, channels: number): Promise<boolean> {
  if (typeof AudioEncoder === 'undefined' || typeof AudioData === 'undefined') return false;
  try {
    const res = await AudioEncoder.isConfigSupported({
      codec: 'mp4a.40.2',
      sampleRate,
      numberOfChannels: channels,
      bitrate: 128_000,
    });
    return Boolean(res.supported);
  } catch {
    return false;
  }
}

export function getExportPixelDimensions(
  aspectRatio: ScribeProject['aspectRatio'],
  resolution: ExportConfig['resolution'],
): { width: number; height: number } {
  const base = getStageDimensions(aspectRatio);
  if (resolution === '1080p') {
    if (aspectRatio === '16:9') return { width: 1920, height: 1080 };
    if (aspectRatio === '9:16') return { width: 1080, height: 1920 };
    return { width: 1080, height: 1080 };
  }
  // 720p
  if (aspectRatio === '16:9') return { width: 1280, height: 720 };
  if (aspectRatio === '9:16') return { width: 720, height: 1280 };
  return { width: base.width, height: base.height }; // 960x960 (even)
}

export async function exportProjectVideo(
  project: ScribeProject,
  config: ExportConfig,
  onProgress: (prog: ExportProgress) => void,
  signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string; mimeType: string; method: 'webcodecs-mp4' | 'mediarecorder-webm' }> {
  const { width, height } = getExportPixelDimensions(project.aspectRatio, config.resolution);
  const { totalDuration } = buildTimelineSchedule(project);
  const fps = config.fps;
  const totalFrames = Math.max(1, Math.ceil(totalDuration * fps));
  const bitrate = config.resolution === '1080p' ? 7_500_000 : 4_200_000;

  onProgress({
    phase: 'preparing',
    progress: 0.02,
    currentFrame: 0,
    totalFrames,
    message: 'Carregando imagens e fontes no canvas...',
  });

  await preloadProjectImages(project);
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const supportedCodec =
    config.format === 'mp4' ? await pickSupportedVideoCodec(width, height, fps, bitrate) : null;

  if (supportedCodec && config.format === 'mp4') {
    return exportViaWebCodecsMp4(
      project,
      width,
      height,
      fps,
      totalDuration,
      totalFrames,
      bitrate,
      supportedCodec,
      onProgress,
      signal,
    );
  }

  return exportViaMediaRecorderWebm(
    project,
    width,
    height,
    fps,
    totalDuration,
    totalFrames,
    onProgress,
    signal,
  );
}

async function exportViaWebCodecsMp4(
  project: ScribeProject,
  width: number,
  height: number,
  fps: number,
  totalDuration: number,
  totalFrames: number,
  bitrate: number,
  codecString: string,
  onProgress: (prog: ExportProgress) => void,
  signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string; mimeType: string; method: 'webcodecs-mp4' }> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Contexto 2D indisponível para renderização.');

  const hasAudio = Boolean(project.voiceover || project.music);
  const mixedAudio = hasAudio
    ? await mixProjectAudioBuffer(project.voiceover, project.music, totalDuration, 48000)
    : null;
  const canEncodeAac = mixedAudio ? await isAacSupported(48000, 2) : false;

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: {
      codec: 'avc',
      width,
      height,
      frameRate: fps,
    },
    audio:
      mixedAudio && canEncodeAac
        ? {
            codec: 'aac',
            numberOfChannels: 2,
            sampleRate: 48000,
          }
        : undefined,
    fastStart: 'in-memory',
  });

  let encoderError: Error | null = null;
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (err) => {
      encoderError = err instanceof Error ? err : new Error(String(err));
    },
  });

  videoEncoder.configure({
    codec: codecString,
    width,
    height,
    bitrate,
    framerate: fps,
  });

  const frameDurationUs = Math.round(1_000_000 / fps);

  for (let frame = 0; frame < totalFrames; frame++) {
    if (signal?.aborted) {
      videoEncoder.close();
      throw new Error('Exportação cancelada.');
    }
    if (encoderError) throw encoderError;

    const timeSec = Math.min(totalDuration, frame / fps);
    renderProjectFrame(ctx, project, {
      width,
      height,
      time: timeSec,
      mode: 'export',
    });

    const timestamp = frame * frameDurationUs;
    const vf = new VideoFrame(canvas, {
      timestamp,
      duration: frameDurationUs,
    });

    const keyFrame = frame % (fps * 2) === 0;
    videoEncoder.encode(vf, { keyFrame });
    vf.close();

    // Backpressure + UI yield every few frames
    if (videoEncoder.encodeQueueSize > 8) {
      await new Promise((r) => setTimeout(r, 4));
    } else if (frame % 4 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }

    if (frame % 3 === 0 || frame === totalFrames - 1) {
      onProgress({
        phase: 'rendering',
        progress: 0.05 + (frame / totalFrames) * (mixedAudio && canEncodeAac ? 0.78 : 0.9),
        currentFrame: frame + 1,
        totalFrames,
        message: `Renderizando quadro ${frame + 1} de ${totalFrames} (${width}x${height} MP4)...`,
      });
    }
  }

  await videoEncoder.flush();
  videoEncoder.close();

  if (mixedAudio && canEncodeAac) {
    onProgress({
      phase: 'encoding-audio',
      progress: 0.86,
      currentFrame: totalFrames,
      totalFrames,
      message: 'Codificando áudio AAC e sincronizando trilha...',
    });

    const audioEncoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (err) => {
        encoderError = err instanceof Error ? err : new Error(String(err));
      },
    });
    audioEncoder.configure({
      codec: 'mp4a.40.2',
      numberOfChannels: 2,
      sampleRate: 48000,
      bitrate: 128_000,
    });

    const chunkFrames = 1024;
    const ch0 = mixedAudio.getChannelData(0);
    const ch1 = mixedAudio.numberOfChannels > 1 ? mixedAudio.getChannelData(1) : ch0;

    for (let offset = 0; offset < mixedAudio.length; offset += chunkFrames) {
      const count = Math.min(chunkFrames, mixedAudio.length - offset);
      const planar = new Float32Array(count * 2);
      planar.set(ch0.subarray(offset, offset + count), 0);
      planar.set(ch1.subarray(offset, offset + count), count);

      const ad = new AudioData({
        format: 'f32-planar',
        sampleRate: 48000,
        numberOfFrames: count,
        numberOfChannels: 2,
        timestamp: Math.round((offset / 48000) * 1_000_000),
        data: planar,
      });
      audioEncoder.encode(ad);
      ad.close();
    }

    await audioEncoder.flush();
    audioEncoder.close();
  }

  if (encoderError) throw encoderError;

  onProgress({
    phase: 'finalizing',
    progress: 0.97,
    currentFrame: totalFrames,
    totalFrames,
    message: 'Empacotando arquivo MP4...',
  });

  muxer.finalize();
  const blob = new Blob([target.buffer], { type: 'video/mp4' });
  const safeName = (project.title || 'openscribe-video').replace(/[^a-zA-Z0-9_-]/g, '_');

  onProgress({
    phase: 'done',
    progress: 1,
    currentFrame: totalFrames,
    totalFrames,
    message: 'MP4 pronto!',
  });

  return {
    blob,
    filename: `${safeName}.mp4`,
    mimeType: 'video/mp4',
    method: 'webcodecs-mp4',
  };
}

async function exportViaMediaRecorderWebm(
  project: ScribeProject,
  width: number,
  height: number,
  fps: number,
  totalDuration: number,
  totalFrames: number,
  onProgress: (prog: ExportProgress) => void,
  signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string; mimeType: string; method: 'mediarecorder-webm' }> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Contexto 2D indisponível.');

  const stream = canvas.captureStream(fps);
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : 'video/webm';

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 4_500_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (ev) => {
    if (ev.data.size > 0) chunks.push(ev.data);
  };

  const donePromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
  });

  recorder.start(250);
  const frameMs = 1000 / fps;

  for (let frame = 0; frame < totalFrames; frame++) {
    if (signal?.aborted) {
      recorder.stop();
      throw new Error('Exportação cancelada.');
    }
    const timeSec = Math.min(totalDuration, frame / fps);
    renderProjectFrame(ctx, project, {
      width,
      height,
      time: timeSec,
      mode: 'export',
    });

    onProgress({
      phase: 'rendering',
      progress: 0.05 + (frame / totalFrames) * 0.9,
      currentFrame: frame + 1,
      totalFrames,
      message: `Gravando quadro ${frame + 1} de ${totalFrames} (WebM fallback)...`,
    });

    await new Promise((r) => setTimeout(r, frameMs));
  }

  recorder.stop();
  const blob = await donePromise;
  const safeName = (project.title || 'openscribe-video').replace(/[^a-zA-Z0-9_-]/g, '_');

  onProgress({
    phase: 'done',
    progress: 1,
    currentFrame: totalFrames,
    totalFrames,
    message: 'Vídeo WebM pronto!',
  });

  return {
    blob,
    filename: `${safeName}.webm`,
    mimeType: 'video/webm',
    method: 'mediarecorder-webm',
  };
}
