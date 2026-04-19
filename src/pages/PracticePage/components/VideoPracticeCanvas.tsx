import { usePlaybackContext } from '../context/PlaybackContext';
import { MarkerSpotlight } from './MarkerSpotlight';
import { PracticePlaybackFooter } from './PracticePlaybackFooter';
import { RecPill } from './RecPill';
import styles from './VideoPracticeCanvas.module.css';

interface VideoPracticeCanvasProps {
  setVideoElement: (element: HTMLVideoElement | null) => void;
}

export function VideoPracticeCanvas({ setVideoElement }: VideoPracticeCanvasProps) {
  const {
    sourceKind,
    hoveredMarker,
    recorderMode,
    onTogglePlayback,
    onSwitchToRecord,
  } = usePlaybackContext();

  return (
    <div className={styles.root}>
      <div className={styles.playerArea}>
        <video
          ref={setVideoElement}
          className={sourceKind === 'local-video' ? styles.video : styles.hiddenMedia}
          controls={false}
          onClick={sourceKind === 'local-video' ? onTogglePlayback : undefined}
        />
        <div className={sourceKind === 'youtube' ? styles.youtubeFrame : styles.hiddenMedia} id="youtube-player-root" />

        <RecPill onClick={onSwitchToRecord} mode={recorderMode} />

        <MarkerSpotlight marker={hoveredMarker} />
      </div>

      <PracticePlaybackFooter hideMeta />
    </div>
  );
}
