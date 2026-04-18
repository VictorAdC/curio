import { formatTime } from '../../utils/time';
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
  loopStart?: number | null;
  loopEnd?: number | null;
  onAddMarker?: () => void;
  onClearLoop?: () => void;
}

export function TransportControls({
  isPlaying,
  playbackRate,
  playbackRatePresets,
  onTogglePlayback,
  onJumpBackward,
  onJumpForward,
  onSetPlaybackRate,
  loopStart,
  loopEnd,
  onAddMarker,
  onClearLoop,
}: TransportControlsProps) {
  const { t } = useI18n();
  const withLoopControls = onAddMarker !== undefined;

  if (!withLoopControls) {
    return (
      <div className={styles.stackedRoot}>
        <div className={styles.primaryRow}>
          <button className={styles.jump} type="button" onClick={onJumpBackward} aria-label={t('practice.transport.backward')}>
            <span className="material-symbols-outlined">replay_5</span>
          </button>
          <button className={styles.play} type="button" onClick={onTogglePlayback} aria-label={isPlaying ? t('practice.transport.pause') : t('practice.transport.play')}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button className={styles.jump} type="button" onClick={onJumpForward} aria-label={t('practice.transport.forward')}>
            <span className="material-symbols-outlined">forward_5</span>
          </button>
        </div>
        <div className={styles.speedRow}>
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
    );
  }

  return (
    <div className={styles.rowRoot}>
      <div className={styles.speedGroup}>
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

      <div className={styles.transportGroup}>
        <button className={styles.jump} type="button" onClick={onJumpBackward} aria-label={t('practice.transport.backward')}>
          <span className="material-symbols-outlined">replay_5</span>
        </button>
        <button className={styles.play} type="button" onClick={onTogglePlayback} aria-label={isPlaying ? t('practice.transport.pause') : t('practice.transport.play')}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>
        <button className={styles.jump} type="button" onClick={onJumpForward} aria-label={t('practice.transport.forward')}>
          <span className="material-symbols-outlined">forward_5</span>
        </button>
      </div>

      <div className={styles.loopGroup}>
        <div className={styles.loopRange}>
          <span className={styles.loopLabel}>{t('practice.controls.loopRange')}</span>
          <strong className={styles.loopValue}>
            {loopStart != null ? formatTime(loopStart) : '--:--'}
            {' – '}
            {loopEnd != null ? formatTime(loopEnd) : '--:--'}
          </strong>
        </div>
        <button className={styles.addMarkerBtn} type="button" onClick={onAddMarker}>
          + {t('practice.controls.addMarker')}
        </button>
        <button
          className={styles.clearLoopBtn}
          type="button"
          onClick={onClearLoop}
          aria-label={t('practice.controls.clearLoop')}
          title={t('practice.controls.clearLoop')}
        >
          <span className="material-symbols-outlined">loop</span>
        </button>
      </div>
    </div>
  );
}
