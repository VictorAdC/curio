import { useEffect, useState } from 'react';
import type { PracticeSessionSummary } from '../../types/practicePlayer';
import styles from './SessionHistory.module.css';

interface SessionHistoryProps {
  sessions: PracticeSessionSummary[];
  activeSessionId: string | null;
  onLoadSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, name: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

function SessionHistoryItem({
  session,
  isActive,
  onLoadSession,
  onRenameSession,
  onDeleteSession,
}: {
  session: PracticeSessionSummary;
  isActive: boolean;
  onLoadSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, name: string) => void;
  onDeleteSession: (sessionId: string) => void;
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
    <article
      className={`${styles.item} ${styles.clickableItem} ${isActive ? styles.activeItem : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onLoadSession(session.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onLoadSession(session.id);
        }
      }}
    >
      <div className={styles.itemHeader}>
        {isEditing ? (
          <div className={styles.inlineEditWrap}>
            <input
              className={styles.inlineNameInput}
              type="text"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onBlur={commitName}
              onClick={(event) => event.stopPropagation()}
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
            <span className={styles.editingBadge}>Editing</span>
          </div>
        ) : (
          <button
            className={styles.loadButton}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setDraftName(session.name);
              setIsEditing(true);
            }}
          >
            {session.name}
          </button>
        )}
        <div className={styles.itemHeaderActions}>
          {isActive ? <span className={styles.activeBadge}>Open</span> : null}
          <button
            className={styles.renameButton}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (
                window.confirm(
                  `Delete session "${session.name}"? This will remove its saved notes, markers, and local media snapshot.`,
                )
              ) {
                onDeleteSession(session.id);
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>
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
  onDeleteSession,
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
            onDeleteSession={onDeleteSession}
          />
        ))}
      </div>
    </section>
  );
}
