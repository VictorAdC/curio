import type { PracticeMarker } from '../../../features/practice-player/types/practicePlayer';
import type { TimelineWaveformDatum } from '../../../features/practice-player/types/practicePlayer';
import { Timeline } from '../../../features/practice-player/components/Timeline/Timeline';
import { TransportControls } from '../../../features/practice-player/components/TransportControls/TransportControls';
import { formatMediaTimestamp } from '../../../features/practice-player/utils/time';
import styles from './PracticePlaybackFooter.module.css';

interface PracticePlaybackFooterProps {
  currentTime: number;
  duration: number;
  waveform?: TimelineWaveformDatum[];
  markers: PracticeMarker[];
  loopStart: number | null;
  loopEnd: number | null;
  isPlaying: boolean;
  playbackRate: number;
  playbackRatePresets: readonly number[];
  onTogglePlayback: () => void;
  onJumpBy: (deltaSeconds: number) => void;
  onSetPlaybackRate: (rate: number) => void;
  onSeek: (seconds: number) => void;
  onMarkerHover: (marker: PracticeMarker) => void;
  onMarkerLeave: () => void;
  onMarkerClick?: (marker: PracticeMarker) => void;
  onAddMarker?: () => void;
  onClearLoop?: () => void;
  hideMeta?: boolean;
}

export function PracticePlaybackFooter({
  currentTime,
  duration,
  waveform = [],
  markers,
  loopStart,
  loopEnd,
  isPlaying,
  playbackRate,
  playbackRatePresets,
  onTogglePlayback,
  onJumpBy,
  onSetPlaybackRate,
  onSeek,
  onMarkerHover,
  onMarkerLeave,
  onMarkerClick,
  onAddMarker,
  onClearLoop,
  hideMeta,
}: PracticePlaybackFooterProps) {
  const currentTimeLabel = formatMediaTimestamp(currentTime, duration);
  const durationLabel = formatMediaTimestamp(duration, duration);

  return (
    <div className={styles.root}>
      <div className={styles.timelineShell}>
        <Timeline
          currentTime={currentTime}
          duration={duration}
          markers={markers}
          loopStart={loopStart}
          loopEnd={loopEnd}
          waveform={waveform}
          onSeek={onSeek}
          variant="compact"
          hideMeta={hideMeta}
          onMarkerHover={onMarkerHover}
          onMarkerLeave={onMarkerLeave}
          onMarkerClick={onMarkerClick}
        />
        {hideMeta ? (
          <div className={styles.timecode}>
            <span>{currentTimeLabel}</span>
            <span>/</span>
            <span>{durationLabel}</span>
          </div>
        ) : null}
      </div>
      <TransportControls
        isPlaying={isPlaying}
        playbackRate={playbackRate}
        playbackRatePresets={playbackRatePresets}
        onTogglePlayback={onTogglePlayback}
        onJumpBackward={() => onJumpBy(-5)}
        onJumpForward={() => onJumpBy(5)}
        onSetPlaybackRate={onSetPlaybackRate}
        loopStart={loopStart}
        loopEnd={loopEnd}
        onAddMarker={onAddMarker}
        onClearLoop={onClearLoop}
      />
    </div>
  );
}
