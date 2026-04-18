import { formatTime } from '../../../features/practice-player/utils/time';
import { useI18n } from '../../../i18n/I18nProvider';
import styles from './PracticeControlCards.module.css';

interface PracticeControlCardsProps {
  layout: 'stacked' | 'inline';
  loopStart: number | null;
  loopEnd: number | null;
  onAddMarker: () => void;
  onClearLoop: () => void;
  onLoopStartClick?: () => void;
  onLoopEndClick?: () => void;
}

export function PracticeControlCards({
  layout,
  loopStart,
  loopEnd,
  onAddMarker,
  onClearLoop,
  onLoopStartClick,
  onLoopEndClick,
}: PracticeControlCardsProps) {
  const { t } = useI18n();
  const loopStartLabel = loopStart !== null ? formatTime(loopStart) : '--:--';
  const loopEndLabel = loopEnd !== null ? formatTime(loopEnd) : '--:--';

  if (layout === 'inline') {
    return (
      <div className={styles.inlineRow}>
        <button className={styles.inlineAction} type="button" onClick={onAddMarker}>
          {t('practice.controls.addMarker')}
        </button>
        <button className={styles.inlineGhost} type="button" onClick={onClearLoop}>
          {t('practice.controls.clearLoop')}
        </button>
        <button
          className={`${styles.inlineMeta} ${onLoopStartClick && loopStart !== null ? styles.inlineMetaClickable : ''}`}
          type="button"
          onClick={onLoopStartClick}
          disabled={loopStart === null}
        >
          <span>{t('practice.controls.loopStart')}</span>
          <strong>{loopStartLabel}</strong>
        </button>
        <button
          className={`${styles.inlineMeta} ${onLoopEndClick && loopEnd !== null ? styles.inlineMetaClickable : ''}`}
          type="button"
          onClick={onLoopEndClick}
          disabled={loopEnd === null}
        >
          <span>{t('practice.controls.loopEnd')}</span>
          <strong>{loopEndLabel}</strong>
        </button>
      </div>
    );
  }

  return (
    <div className={styles.stackedRail}>
      <button className={styles.overlayAction} type="button" onClick={onAddMarker}>
        {t('practice.controls.addMarker')}
      </button>
      <button className={styles.overlayGhost} type="button" onClick={onClearLoop}>
        {t('practice.controls.clearLoop')}
      </button>
      <button
        className={`${styles.overlayMeta} ${onLoopStartClick && loopStart !== null ? styles.overlayMetaClickable : ''}`}
        type="button"
        onClick={onLoopStartClick}
        disabled={loopStart === null}
      >
        <span>{t('practice.controls.loopStart')}</span>
        <strong>{loopStartLabel}</strong>
      </button>
      <button
        className={`${styles.overlayMeta} ${onLoopEndClick && loopEnd !== null ? styles.overlayMetaClickable : ''}`}
        type="button"
        onClick={onLoopEndClick}
        disabled={loopEnd === null}
      >
        <span>{t('practice.controls.loopEnd')}</span>
        <strong>{loopEndLabel}</strong>
      </button>
    </div>
  );
}
