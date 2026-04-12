import { useI18n } from '../../../../i18n/I18nProvider';
import styles from './TransportControls.module.css';

interface TransportControlsProps {
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onJumpBackward: () => void;
  onJumpForward: () => void;
}

export function TransportControls({
  isPlaying,
  onTogglePlayback,
  onJumpBackward,
  onJumpForward,
}: TransportControlsProps) {
  const { t } = useI18n();

  return (
    <div className={styles.root}>
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
  );
}
