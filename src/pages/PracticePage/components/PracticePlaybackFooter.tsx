import { Timeline } from '../../../features/practice-player/components/Timeline/Timeline';
import { TransportControls } from '../../../features/practice-player/components/TransportControls/TransportControls';
import { formatMediaTimestamp } from '../../../features/practice-player/utils/time';
import { usePlaybackContext } from '../context/PlaybackContext';
import styles from './PracticePlaybackFooter.module.css';

interface PracticePlaybackFooterProps {
  hideMeta?: boolean;
}

export function PracticePlaybackFooter({ hideMeta }: PracticePlaybackFooterProps) {
  const {
    currentTime,
    duration,
    waveform,
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
  } = usePlaybackContext();

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
