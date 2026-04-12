import { formatTime } from '../../../features/practice-player/utils/time';
import { useI18n } from '../../../i18n/I18nProvider';
import styles from '../PracticePage.module.css';

interface PracticePlayerHeaderProps {
  title: string;
  currentTime: number;
  duration: number;
}

export function PracticePlayerHeader({ title, currentTime, duration }: PracticePlayerHeaderProps) {
  const { t } = useI18n();

  return (
    <div className={styles.playerHeader}>
      <div>
        <span className={styles.eyebrow}>{t('practice.player.nowPracticing')}</span>
        <h2>{title}</h2>
      </div>
      <div className={styles.timeBlock}>
        <strong>{formatTime(currentTime)}</strong>
        <span>/ {formatTime(duration)}</span>
      </div>
    </div>
  );
}
