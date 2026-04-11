import { formatTime } from '../../../features/practice-player/utils/time';
import styles from '../PracticePage.module.css';

interface PracticePlayerHeaderProps {
  title: string;
  currentTime: number;
  duration: number;
}

export function PracticePlayerHeader({ title, currentTime, duration }: PracticePlayerHeaderProps) {
  return (
    <div className={styles.playerHeader}>
      <div>
        <span className={styles.eyebrow}>Now practicing</span>
        <h2>{title}</h2>
      </div>
      <div className={styles.timeBlock}>
        <strong>{formatTime(currentTime)}</strong>
        <span>/ {formatTime(duration)}</span>
      </div>
    </div>
  );
}
