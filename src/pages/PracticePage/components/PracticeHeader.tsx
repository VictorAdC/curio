import { useI18n } from '../../../i18n/I18nProvider';
import styles from '../PracticePage.module.css';

export function PracticeHeader() {
  const { t } = useI18n();

  return (
    <header className={styles.hero}>
      <div>
        <span className={styles.eyebrow}>{t('practice.header.eyebrow')}</span>
        <h1>{t('practice.header.title')}</h1>
        <p>{t('practice.header.description')}</p>
      </div>
    </header>
  );
}
