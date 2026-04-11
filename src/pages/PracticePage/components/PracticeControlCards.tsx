import { formatTime } from '../../../features/practice-player/utils/time';
import styles from '../PracticePage.module.css';

interface PracticeControlCardsProps {
  layout: 'stacked' | 'inline';
  loopStart: number | null;
  loopEnd: number | null;
  onAddMarker: () => void;
  onClearLoop: () => void;
}

export function PracticeControlCards({
  layout,
  loopStart,
  loopEnd,
  onAddMarker,
  onClearLoop,
}: PracticeControlCardsProps) {
  const loopStartLabel = loopStart !== null ? formatTime(loopStart) : '--:--';
  const loopEndLabel = loopEnd !== null ? formatTime(loopEnd) : '--:--';

  if (layout === 'inline') {
    return (
      <div className={styles.audioControlsRow}>
        <div className={styles.audioActionsRow}>
          <button className={styles.overlayAction} type="button" onClick={onAddMarker}>
            Add marker
          </button>
          <button className={styles.overlayGhost} type="button" onClick={onClearLoop}>
            Clear loop
          </button>
        </div>
        <div className={styles.audioLoopInfoRow}>
          <div className={styles.overlayMeta}>
            <span>Loop start</span>
            <strong>{loopStartLabel}</strong>
          </div>
          <div className={styles.overlayMeta}>
            <span>Loop end</span>
            <strong>{loopEndLabel}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlayRail}>
      <button className={styles.overlayAction} type="button" onClick={onAddMarker}>
        Add marker
      </button>
      <button className={styles.overlayGhost} type="button" onClick={onClearLoop}>
        Clear loop
      </button>
      <div className={styles.overlayMeta}>
        <span>Loop start</span>
        <strong>{loopStartLabel}</strong>
      </div>
      <div className={styles.overlayMeta}>
        <span>Loop end</span>
        <strong>{loopEndLabel}</strong>
      </div>
    </div>
  );
}
