import type { RecordingMode } from '../../../features/practice-recorder/hooks/usePracticeRecorder';
import type { PracticeMarker, TimelineWaveformDatum } from '../../../features/practice-player/types/practicePlayer';
import { Timeline } from '../../../features/practice-player/components/Timeline/Timeline';
import { MarkerSpotlight } from './MarkerSpotlight';
import { PracticePlaybackFooter } from './PracticePlaybackFooter';
import { RecPill } from './RecPill';
import styles from './AudioPracticeCanvas.module.css';

interface AudioPracticeCanvasProps {
  currentTime: number;
  duration: number;
  markers: PracticeMarker[];
  loopStart: number | null;
  loopEnd: number | null;
  waveform: TimelineWaveformDatum[];
  isPlaying: boolean;
  playbackRate: number;
  playbackRatePresets: readonly number[];
  hoveredMarker: PracticeMarker | null;
  onAddMarker: () => void;
  onClearLoop: () => void;
  onLoopStartClick?: () => void;
  onLoopEndClick?: () => void;
  onTogglePlayback: () => void;
  onJumpBy: (deltaSeconds: number) => void;
  onSetPlaybackRate: (rate: number) => void;
  onSeek: (seconds: number) => void;
  onMarkerHover: (marker: PracticeMarker) => void;
  onMarkerLeave: () => void;
  onMarkerClick?: (marker: PracticeMarker) => void;
  onSwitchToRecord?: () => void;
  recorderMode?: RecordingMode;
}

export function AudioPracticeCanvas({
  currentTime,
  duration,
  markers,
  loopStart,
  loopEnd,
  waveform,
  isPlaying,
  playbackRate,
  playbackRatePresets,
  hoveredMarker,
  onAddMarker,
  onClearLoop,
  onTogglePlayback,
  onJumpBy,
  onSetPlaybackRate,
  onSeek,
  onMarkerHover,
  onMarkerLeave,
  onMarkerClick,
  onSwitchToRecord,
  recorderMode,
}: AudioPracticeCanvasProps) {
  return (
    <div className={styles.root}>
      <div className={styles.canvasArea}>
        <RecPill onClick={onSwitchToRecord} mode={recorderMode} />
        <div className={styles.waveStage}>
          <Timeline
            currentTime={currentTime}
            duration={duration}
            markers={markers}
            loopStart={loopStart}
            loopEnd={loopEnd}
            waveform={waveform}
            onSeek={onSeek}
            onMarkerHover={onMarkerHover}
            onMarkerLeave={onMarkerLeave}
            onMarkerClick={onMarkerClick}
          />
        </div>
        <MarkerSpotlight marker={hoveredMarker} />
      </div>

      <PracticePlaybackFooter
        currentTime={currentTime}
        duration={duration}
        markers={markers}
        loopStart={loopStart}
        loopEnd={loopEnd}
        isPlaying={isPlaying}
        playbackRate={playbackRate}
        playbackRatePresets={playbackRatePresets}
        onTogglePlayback={onTogglePlayback}
        onJumpBy={onJumpBy}
        onSetPlaybackRate={onSetPlaybackRate}
        onSeek={onSeek}
        onMarkerHover={onMarkerHover}
        onMarkerLeave={onMarkerLeave}
        onMarkerClick={onMarkerClick}
        onAddMarker={onAddMarker}
        onClearLoop={onClearLoop}
      />
    </div>
  );
}
