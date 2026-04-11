export type PracticeMediaKind = 'local-audio' | 'local-video' | 'youtube';

export interface PracticeMediaSource {
  id: string;
  kind: PracticeMediaKind;
  title: string;
  durationSeconds: number;
  sourceRef: {
    file?: File;
    objectUrl?: string;
    youtubeUrl?: string;
    youtubeVideoId?: string;
    persistedMediaId?: string;
  };
}

export interface PracticeMarker {
  id: string;
  timestampSeconds: number;
  title: string;
  note: string;
  loopRole: 'none' | 'start' | 'end';
}

export interface LoopSelection {
  startMarkerId: string | null;
  endMarkerId: string | null;
}

export interface TimelineWaveformDatum {
  amplitude: number;
  timestampSeconds: number;
}

export interface PracticeSessionState {
  source: PracticeMediaSource | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  markers: PracticeMarker[];
  loopSelection: LoopSelection;
  sessionNote: string;
  waveform: TimelineWaveformDatum[];
  error: string | null;
  isReady: boolean;
}

export interface PlaybackAdapter {
  load(source: PracticeMediaSource): Promise<void>;
  play(): Promise<void> | void;
  pause(): void;
  seek(seconds: number): void;
  jumpBy(deltaSeconds: number): void;
  getDuration(): number;
  getCurrentTime(): number;
  setLoop(startSeconds: number, endSeconds: number | null): void;
  clearLoop(): void;
  destroy(): void;
}
