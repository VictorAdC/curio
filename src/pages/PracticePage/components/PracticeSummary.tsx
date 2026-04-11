import styles from '../PracticePage.module.css';

interface PracticeSummaryProps {
  isReady: boolean;
  markerCount: number;
  isLoopActive: boolean;
}

export function PracticeSummary({ isReady, markerCount, isLoopActive }: PracticeSummaryProps) {
  return (
    <div className={styles.metaRow}>
      <div className={styles.metaCard}>
        <span>Readiness</span>
        <strong>{isReady ? 'Ready' : 'Loading metadata'}</strong>
      </div>
      <div className={styles.metaCard}>
        <span>Markers</span>
        <strong>{markerCount}</strong>
      </div>
      <div className={styles.metaCard}>
        <span>Loop</span>
        <strong>{isLoopActive ? 'Active' : 'Inactive'}</strong>
      </div>
    </div>
  );
}
