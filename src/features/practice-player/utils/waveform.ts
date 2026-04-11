import type { TimelineWaveformDatum } from '../types/practicePlayer';

export async function buildWaveformFromFile(file: File, samples = 56) {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const raw = audioBuffer.getChannelData(0);
    const bucketSize = Math.max(1, Math.floor(raw.length / samples));
    const data: TimelineWaveformDatum[] = [];

    for (let index = 0; index < samples; index += 1) {
      const start = index * bucketSize;
      const end = Math.min(start + bucketSize, raw.length);
      let peak = 0;

      for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
        peak = Math.max(peak, Math.abs(raw[sampleIndex]));
      }

      data.push({
        amplitude: peak,
        timestampSeconds: (audioBuffer.duration / samples) * index,
      });
    }

    return normalizeWaveform(data);
  } finally {
    void audioContext.close();
  }
}

function normalizeWaveform(data: TimelineWaveformDatum[]) {
  const max = data.reduce((highest, item) => Math.max(highest, item.amplitude), 0.001);

  return data.map((item) => ({
    ...item,
    amplitude: item.amplitude / max,
  }));
}
