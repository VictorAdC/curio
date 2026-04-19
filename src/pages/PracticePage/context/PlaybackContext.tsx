import { createContext, useContext, type ReactNode } from 'react';
import type { RecordingMode } from '../../../features/practice-recorder/hooks/usePracticeRecorder';
import type {
  PracticeMarker,
  PracticeMediaKind,
  TimelineWaveformDatum,
} from '../../../features/practice-player/types/practicePlayer';

export interface PlaybackContextValue {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;
  playbackRatePresets: readonly number[];
  markers: PracticeMarker[];
  loopStart: number | null;
  loopEnd: number | null;
  waveform: TimelineWaveformDatum[];
  sourceKind: PracticeMediaKind | null;
  hoveredMarker: PracticeMarker | null;
  recorderMode: RecordingMode | undefined;
  onTogglePlayback: () => void;
  onJumpBy: (deltaSeconds: number) => void;
  onSetPlaybackRate: (rate: number) => void;
  onSeek: (seconds: number) => void;
  onAddMarker: () => void;
  onClearLoop: () => void;
  onMarkerHover: (marker: PracticeMarker) => void;
  onMarkerLeave: () => void;
  onMarkerClick: (marker: PracticeMarker) => void;
  onSwitchToRecord: () => void;
  onLoopStartClick: () => void;
  onLoopEndClick: () => void;
}

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

export function PlaybackProvider({ value, children }: { value: PlaybackContextValue; children: ReactNode }) {
  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}

export function usePlaybackContext(): PlaybackContextValue {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error('usePlaybackContext must be used inside PlaybackProvider');
  return ctx;
}
