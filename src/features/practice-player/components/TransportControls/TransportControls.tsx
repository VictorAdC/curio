import { useI18n } from '../../../../i18n/I18nProvider';
import styles from './TransportControls.module.css';

interface TransportControlsProps {
  isPlaying: boolean;
  playbackRate: number;
  playbackRatePresets: readonly number[];
  onTogglePlayback: () => void;
  onJumpBackward: () => void;
  onJumpForward: () => void;
  onSetPlaybackRate: (rate: number) => void;
}

export function TransportControls({
  isPlaying,
  playbackRate,
  playbackRatePresets,
  onTogglePlayback,
  onJumpBackward,
  onJumpForward,
  onSetPlaybackRate,
}: TransportControlsProps) {
  const { t } = useI18n();

  return (
    <div className={styles.root}>
      <div className={styles.primaryRow}>
        <button className={styles.secondary} type="button" onClick={onJumpBackward}>
          {t('practice.transport.backward')}
        </button>
        <button className={styles.primary} type="button" onClick={onTogglePlayback}>
          {isPlaying ? t('practice.transport.pause') : t('practice.transport.play')}
        </button>
        <button className={styles.secondary} type="button" onClick={onJumpForward}>
          {t('practice.transport.forward')}
        </button>
      </div>
      <div className={styles.rateGroup}>
        <span className={styles.rateLabel}>{t('practice.transport.speed')}</span>
        <div className={styles.rateOptions}>
          {playbackRatePresets.map((rate) => (
            <button
              key={rate}
              className={`${styles.rateOption} ${playbackRate === rate ? styles.rateOptionActive : ''}`}
              type="button"
              onClick={() => onSetPlaybackRate(rate)}
            >
              {t('practice.transport.speedValue', { value: rate })}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
