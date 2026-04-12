import type { PracticeMarker } from '../../types/practicePlayer';
import { useI18n } from '../../../../i18n/I18nProvider';
import styles from './MarkerEditor.module.css';

interface MarkerEditorProps {
  marker: PracticeMarker;
  onChange: (markerId: string, updates: Partial<Pick<PracticeMarker, 'title' | 'note'>>) => void;
}

export function MarkerEditor({ marker, onChange }: MarkerEditorProps) {
  const { t } = useI18n();

  return (
    <div className={styles.root}>
      <input
        className={styles.title}
        value={marker.title}
        onChange={(event) => onChange(marker.id, { title: event.target.value })}
      />
      <textarea
        className={styles.note}
        rows={3}
        placeholder={t('practice.markerEditor.notePlaceholder')}
        value={marker.note}
        onChange={(event) => onChange(marker.id, { note: event.target.value })}
      />
    </div>
  );
}
