import type { PracticeMarker } from '../../types/practicePlayer';
import styles from './MarkerEditor.module.css';

interface MarkerEditorProps {
  marker: PracticeMarker;
  onChange: (markerId: string, updates: Partial<Pick<PracticeMarker, 'title' | 'note'>>) => void;
}

export function MarkerEditor({ marker, onChange }: MarkerEditorProps) {
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
        placeholder="Add a note for this practice moment..."
        value={marker.note}
        onChange={(event) => onChange(marker.id, { note: event.target.value })}
      />
    </div>
  );
}
