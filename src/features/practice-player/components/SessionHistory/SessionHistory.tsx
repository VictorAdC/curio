import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PracticeSessionSummary } from '../../types/practicePlayer';
import styles from './SessionHistory.module.css';

interface SessionHistoryProps {
  sessions: PracticeSessionSummary[];
  activeSessionId: string | null;
  onLoadSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, name: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAll: () => void;
  onExportLight: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
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
          {session.requiresMediaRelink ? <span className={styles.warningBadge}>Media missing</span> : null}
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
  onClearAll,
  onExportLight,
  onExport,
  onImport,
}: SessionHistoryProps) {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

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

      <div className={styles.bulkActions}>
        <button className={styles.bulkButton} type="button" onClick={() => setIsBackupModalOpen(true)}>
          Download copy
        </button>
        <button className={styles.bulkButton} type="button" onClick={() => importInputRef.current?.click()}>
          Upload copy
        </button>
        <button
          className={styles.bulkDangerButton}
          type="button"
          onClick={() => {
            if (window.confirm('Clear all saved sessions? This will remove all saved notes, markers, and local media snapshots.')) {
              onClearAll();
            }
          }}
        >
          Clear all
        </button>
        <input
          ref={importInputRef}
          className={styles.hiddenInput}
          type="file"
          accept="application/json"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (!file) {
              return;
            }

            onImport(file);
            event.currentTarget.value = '';
          }}
        />
      </div>

      {isBackupModalOpen
        ? createPortal(
            <div className={styles.modalShell} role="dialog" aria-modal="true" aria-label="Choose backup type">
              <button
                className={styles.modalBackdrop}
                type="button"
                aria-label="Close backup options"
                onClick={() => setIsBackupModalOpen(false)}
              />
              <div className={styles.modalCard}>
                <div className={styles.modalHeader}>
                  <h4>Choose backup type</h4>
                  <button className={styles.modalClose} type="button" onClick={() => setIsBackupModalOpen(false)}>
                    Close
                  </button>
                </div>
                <p className={styles.modalIntro}>
                  Light copies are smaller. Full copies include saved local audio and video, which can make the file much larger.
                </p>
                <div className={styles.modalOptions}>
                  <button
                    className={styles.modalOption}
                    type="button"
                    onClick={() => {
                      onExportLight();
                      setIsBackupModalOpen(false);
                    }}
                  >
                    <strong>Light copy</strong>
                    <span>Session data only. Local media must be relinked after import.</span>
                  </button>
                  <button
                    className={styles.modalOption}
                    type="button"
                    onClick={() => {
                      onExport();
                      setIsBackupModalOpen(false);
                    }}
                  >
                    <strong>Full copy</strong>
                    <span>Includes saved local audio and video for complete restoration.</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
