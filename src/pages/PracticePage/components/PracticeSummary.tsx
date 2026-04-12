import { useI18n } from '../../../i18n/I18nProvider';
import styles from '../PracticePage.module.css';

interface PracticeSummaryProps {
  isReady: boolean;
  markerCount: number;
  isLoopActive: boolean;
}

export function PracticeSummary({ isReady, markerCount, isLoopActive }: PracticeSummaryProps) {
  const { t } = useI18n();

  return (
    <div className={styles.metaRow}>
      <div className={styles.metaCard}>
        <span>{t('practice.summary.readiness')}</span>
        <strong>{isReady ? t('practice.summary.readiness.ready') : t('practice.summary.readiness.loading')}</strong>
      </div>
      <div className={styles.metaCard}>
        <span>{t('practice.summary.markers')}</span>
        <strong>{markerCount}</strong>
      </div>
      <div className={styles.metaCard}>
        <span>{t('practice.summary.loop')}</span>
        <strong>{isLoopActive ? t('practice.summary.loop.active') : t('practice.summary.loop.inactive')}</strong>
      </div>
    </div>
  );
}
