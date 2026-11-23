import type { AudioTrackData } from '../types/scribe';

export async function decodeAudioTrack(
  fileOrBlob: Blob,
  name: string,
  defaultVolume = 1,
): Promise<AudioTrackData> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de áudio.'));
    reader.readAsDataURL(fileOrBlob);
  });

  const arrayBuffer = await fileOrBlob.arrayBuffer();
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const waveform = extractWaveformPeaks(decoded, 90);
    return {
      id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      dataUrl,
      duration: decoded.duration,
      volume: defaultVolume,
      offset: 0,
      waveform,
    };
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

export function extractWaveformPeaks(buffer: AudioBuffer, bars = 90): number[] {
  const channel = buffer.getChannelData(0);
  const blockSize = Math.max(1, Math.floor(channel.length / bars));
  const peaks: number[] = [];
  let maxPeak = 0.01;

  for (let i = 0; i < bars; i++) {
    const start = i * blockSize;
    const end = Math.min(channel.length, start + blockSize);
    let peak = 0;
    for (let j = start; j < end; j += Math.max(1, Math.floor((end - start) / 40))) {
      const v = Math.abs(channel[j]);
      if (v > peak) peak = v;
    }
    if (peak > maxPeak) maxPeak = peak;
    peaks.push(peak);
  }

  return peaks.map((p) => Number((p / maxPeak).toFixed(3)));
}

export async function mixProjectAudioBuffer(
  voiceover: AudioTrackData | null,
  music: AudioTrackData | null,
  totalDurationSec: number,
  sampleRate = 48000,
): Promise<AudioBuffer | null> {
  if (!voiceover && !music) return null;

  const length = Math.max(sampleRate, Math.ceil(totalDurationSec * sampleRate));
  const offline = new OfflineAudioContext(2, length, sampleRate);
  const decodeCtx = new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

  const decodeTrack = async (track: AudioTrackData): Promise<AudioBuffer> => {
    const res = await fetch(track.dataUrl);
    const buf = await res.arrayBuffer();
    return decodeCtx.decodeAudioData(buf);
  };

  try {
    if (voiceover) {
      const voiceBuf = await decodeTrack(voiceover);
      const src = offline.createBufferSource();
      src.buffer = voiceBuf;
      const gain = offline.createGain();
      gain.gain.value = voiceover.volume;
      src.connect(gain);
      gain.connect(offline.destination);
      src.start(Math.max(0, voiceover.offset));
    }

    if (music) {
      const musicBuf = await decodeTrack(music);
      const src = offline.createBufferSource();
      src.buffer = musicBuf;
      src.loop = true;
      const gain = offline.createGain();
      gain.gain.value = music.volume;
      src.connect(gain);
      gain.connect(offline.destination);
      src.start(Math.max(0, music.offset));
    }

    return await offline.startRendering();
  } finally {
    await decodeCtx.close().catch(() => undefined);
  }
}
