import type { PracticeMarker } from '../../../features/practice-player/types/practicePlayer';
import { formatTime } from '../../../features/practice-player/utils/time';
import { useI18n } from '../../../i18n/I18nProvider';
import styles from './MarkerSpotlight.module.css';

interface MarkerSpotlightProps {
  marker: PracticeMarker | null;
}

export function MarkerSpotlight({ marker }: MarkerSpotlightProps) {
  const { t } = useI18n();

  if (!marker) {
    return null;
  }

  return (
    <article className={styles.root}>
      <span className={styles.label}>{t('practice.markerSpotlight.label')}</span>
      <strong>{marker.title}</strong>
      <span>{formatTime(marker.timestampSeconds)}</span>
      <p>{marker.note || t('practice.markerSpotlight.emptyNote')}</p>
    </article>
  );
}
