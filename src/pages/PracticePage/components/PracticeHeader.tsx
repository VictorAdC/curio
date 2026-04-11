import styles from '../PracticePage.module.css';

export function PracticeHeader() {
  return (
    <header className={styles.hero}>
      <div>
        <span className={styles.eyebrow}>Curio practice studio</span>
        <h1>Practice page</h1>
        <p>
          Load local media or a YouTube performance, navigate precisely through the timeline, and build
          loop-based study sessions with notes.
        </p>
      </div>
    </header>
  );
}
