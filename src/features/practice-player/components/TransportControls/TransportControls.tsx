import styles from './TransportControls.module.css';

interface TransportControlsProps {
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onJumpBackward: () => void;
  onJumpForward: () => void;
}

export function TransportControls({
  isPlaying,
  onTogglePlayback,
  onJumpBackward,
  onJumpForward,
}: TransportControlsProps) {
  return (
    <div className={styles.root}>
      <button className={styles.secondary} type="button" onClick={onJumpBackward}>
        -10s
      </button>
      <button className={styles.primary} type="button" onClick={onTogglePlayback}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button className={styles.secondary} type="button" onClick={onJumpForward}>
        +10s
      </button>
    </div>
  );
}
