import { useI18n } from '../../../../i18n/I18nProvider';
import styles from './SessionNotes.module.css';

interface SessionNotesProps {
  value: string;
  onChange: (value: string) => void;
}

export function SessionNotes({ value, onChange }: SessionNotesProps) {
  const { t } = useI18n();

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <h3>{t('practice.sessionNotes.title')}</h3>
        <span>{t('practice.sessionNotes.saved')}</span>
      </div>
      <textarea
        className={styles.textarea}
        rows={10}
        placeholder={t('practice.sessionNotes.placeholder')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}
