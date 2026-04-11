import styles from './SessionNotes.module.css';

interface SessionNotesProps {
  value: string;
  onChange: (value: string) => void;
}

export function SessionNotes({ value, onChange }: SessionNotesProps) {
  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <h3>Session notes</h3>
        <span>Saved locally for this practice session.</span>
      </div>
      <textarea
        className={styles.textarea}
        rows={10}
        placeholder="Write general observations for the session, phrasing reminders, or passages to revisit..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}
