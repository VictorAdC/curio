import type { RecordingMode } from '../../../features/practice-recorder/hooks/usePracticeRecorder';
import styles from './RecPill.module.css';

interface RecPillProps {
  onClick?: () => void;
  mode?: RecordingMode;
}

const MicIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const CameraIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

export function RecPill({ onClick, mode }: RecPillProps) {
  const showMic = !mode || mode === 'audio';
  const showCamera = !mode || mode === 'video' || mode === 'both';

  return (
    <button className={styles.recPill} type="button" onClick={onClick}>
      <span className={styles.recDot} />
      REC
      <span className={styles.recDivider} />
      {showMic && <MicIcon />}
      {showCamera && <CameraIcon />}
    </button>
  );
}
