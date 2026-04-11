import { useEffect, useState } from 'react';
import type { PracticeSessionSummary } from '../../types/practicePlayer';
import styles from './SessionHistory.module.css';

interface SessionHistoryProps {
  sessions: PracticeSessionSummary[];
  activeSessionId: string | null;
  onLoadSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, name: string) => void;
}

function SessionHistoryItem({
  session,
  isActive,
  onLoadSession,
  onRenameSession,
}: {
  session: PracticeSessionSummary;
  isActive: boolean;
  onLoadSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, name: string) => void;
}) {
  const [draftName, setDraftName] = useState(session.name);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setDraftName(session.name);
    setIsEditing(false);
  }, [session.name]);

  const commitName = () => {
    const trimmedName = draftName.trim();

    if (!trimmedName || trimmedName === session.name) {
      setDraftName(session.name);
      setIsEditing(false);
      return;
    }

    onRenameSession(session.id, trimmedName);
    setIsEditing(false);
  };

  return (
    <article className={`${styles.item} ${isActive ? styles.activeItem : ''}`}>
      <div className={styles.itemHeader}>
        <button className={styles.loadButton} type="button" onClick={() => onLoadSession(session.id)}>
          {session.name}
        </button>
        <div className={styles.itemHeaderActions}>
          {isActive ? <span className={styles.activeBadge}>Open</span> : null}
          <button
            className={styles.renameButton}
            type="button"
            onClick={() => {
              setDraftName(session.name);
              setIsEditing(true);
            }}
          >
            Rename
          </button>
        </div>
      </div>
      {isEditing ? (
        <input
          className={styles.nameInput}
          type="text"
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={commitName}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
            if (event.key === 'Escape') {
              setDraftName(session.name);
              setIsEditing(false);
            }
          }}
          aria-label={`Session name for ${session.sourceTitle}`}
          autoFocus
        />
      ) : null}
      <div className={styles.meta}>
        <span>{session.sourceTitle}</span>
        <span>{session.sourceKind}</span>
        <span>{new Date(session.updatedAt).toLocaleString()}</span>
      </div>
    </article>
  );
}

export function SessionHistory({
  sessions,
  activeSessionId,
  onLoadSession,
  onRenameSession,
}: SessionHistoryProps) {
  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <h3>Session history</h3>
          <p>Reload a previous session or rename it for easier recall.</p>
        </div>
      </div>

      <div className={styles.list}>
        {sessions.length === 0 ? (
          <p className={styles.empty}>No sessions yet. Load a source to start your first one.</p>
        ) : null}
        {sessions.map((session) => (
          <SessionHistoryItem
            key={session.id}
            session={session}
            isActive={session.id === activeSessionId}
            onLoadSession={onLoadSession}
            onRenameSession={onRenameSession}
          />
        ))}
      </div>
    </section>
  );
}
