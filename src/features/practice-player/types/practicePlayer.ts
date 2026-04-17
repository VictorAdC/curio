export type PracticeMediaKind = 'local-audio' | 'local-video' | 'youtube';
export type PracticeSystemTag = 'loop-start' | 'loop-end' | 'media-start' | 'media-end';

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
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    fileLastModified?: number;
    mediaMissing?: boolean;
  };
}

export interface PracticeMarker {
  id: string;
  timestampSeconds: number;
  title: string;
  note: string;
  systemTags: PracticeSystemTag[];
  userTags: string[];
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
  playbackRate: number;
  markers: PracticeMarker[];
  sessionNote: string;
  waveform: TimelineWaveformDatum[];
  error: string | null;
  isReady: boolean;
}

export interface PracticeSessionSummary {
  id: string;
  name: string;
  sourceTitle: string;
  sourceKind: PracticeMediaKind;
  createdAt: string;
  updatedAt: string;
  requiresMediaRelink?: boolean;
}

export interface MediaRelinkWarning {
  mismatches: Array<'name' | 'type' | 'size' | 'lastModified'>;
}

export interface PracticeStorageHealth {
  sessionCount: number;
  missingMediaCount: number;
  mediaAssetCount: number;
  mediaBytes: number;
  localStorageBytes: number;
  totalStoredBytes: number;
  storageEstimateSupported: boolean;
  usageBytes: number | null;
  quotaBytes: number | null;
  persisted: boolean | null;
  status: 'healthy' | 'warning' | 'limited';
}

export interface PracticePersistenceFeedback {
  tone: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

export interface PlaybackAdapter {
  load(source: PracticeMediaSource): Promise<void>;
  play(): Promise<void> | void;
  pause(): void;
  seek(seconds: number): void;
  jumpBy(deltaSeconds: number): void;
  setPlaybackRate(rate: number): void;
  getPlaybackRate(): number;
  getDuration(): number;
  getCurrentTime(): number;
  setLoop(startSeconds: number, endSeconds: number | null): void;
  clearLoop(): void;
  destroy(): void;
}
