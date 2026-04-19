import { Timeline } from '../../../features/practice-player/components/Timeline/Timeline';
import { usePlaybackContext } from '../context/PlaybackContext';
import { MarkerSpotlight } from './MarkerSpotlight';
import { PracticePlaybackFooter } from './PracticePlaybackFooter';
import { RecPill } from './RecPill';
import styles from './AudioPracticeCanvas.module.css';

export function AudioPracticeCanvas() {
  const {
    currentTime,
    duration,
    markers,
    loopStart,
    loopEnd,
    waveform,
    hoveredMarker,
    recorderMode,
    onSeek,
    onMarkerHover,
    onMarkerLeave,
    onMarkerClick,
    onSwitchToRecord,
  } = usePlaybackContext();

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

      <PracticePlaybackFooter />
    </div>
  );
}
