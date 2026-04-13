import type { PracticeMarker } from '../../../features/practice-player/types/practicePlayer';
import { Timeline } from '../../../features/practice-player/components/Timeline/Timeline';
import { TransportControls } from '../../../features/practice-player/components/TransportControls/TransportControls';
import styles from '../PracticePage.module.css';

interface PracticePlaybackFooterProps {
  currentTime: number;
  duration: number;
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
}

export function PracticePlaybackFooter({
  currentTime,
  duration,
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
}: PracticePlaybackFooterProps) {
  return (
    <div className={styles.canvasFooter}>
      <div className={styles.canvasTransport}>
        <TransportControls
          isPlaying={isPlaying}
          playbackRate={playbackRate}
          playbackRatePresets={playbackRatePresets}
          onTogglePlayback={onTogglePlayback}
          onJumpBackward={() => onJumpBy(-10)}
          onJumpForward={() => onJumpBy(10)}
          onSetPlaybackRate={onSetPlaybackRate}
        />
      </div>
      <Timeline
        currentTime={currentTime}
        duration={duration}
        markers={markers}
        loopStart={loopStart}
        loopEnd={loopEnd}
        waveform={[]}
        onSeek={onSeek}
        variant="compact"
        onMarkerHover={onMarkerHover}
        onMarkerLeave={onMarkerLeave}
      />
    </div>
  );
}
