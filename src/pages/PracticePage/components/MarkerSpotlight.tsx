import type { PracticeMarker } from '../../../features/practice-player/types/practicePlayer';
import { formatTime } from '../../../features/practice-player/utils/time';
import styles from '../PracticePage.module.css';

interface MarkerSpotlightProps {
  marker: PracticeMarker | null;
}

export function MarkerSpotlight({ marker }: MarkerSpotlightProps) {
  if (!marker) {
    return null;
  }

  return (
    <article className={styles.markerSpotlight}>
      <span className={styles.markerSpotlightLabel}>Marker</span>
      <strong>{marker.title}</strong>
      <span>{formatTime(marker.timestampSeconds)}</span>
      <p>{marker.note || 'Add a note to this marker to keep contextual practice guidance here.'}</p>
    </article>
  );
}
