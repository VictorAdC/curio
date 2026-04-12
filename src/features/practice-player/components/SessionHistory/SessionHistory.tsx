import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PracticeSessionSummary } from '../../types/practicePlayer';
import type { PracticeSessionsBackupPreview } from '../../utils/sessionPersistence';
import styles from './SessionHistory.module.css';

interface SessionHistoryProps {
  sessions: PracticeSessionSummary[];
  activeSessionId: string | null;
  onLoadSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, name: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAll: () => void;
  onExportLight: (sessionIds?: string[]) => void;
  onExport: (sessionIds?: string[]) => void;
  onPrepareImport: (file: File) => Promise<PracticeSessionsBackupPreview>;
  onImport: (
    file: File,
    options: { sessionIds?: string[]; mode: 'replace' | 'append'; collisionStrategy?: 'replace' | 'duplicate' },
  ) => void;
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
  onPrepareImport,
  onImport,
}: SessionHistoryProps) {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [selectedExportSessionIds, setSelectedExportSessionIds] = useState<string[]>([]);
  const [importPreview, setImportPreview] = useState<PracticeSessionsBackupPreview | null>(null);
  const [selectedImportSessionIds, setSelectedImportSessionIds] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('append');
  const [collisionStrategy, setCollisionStrategy] = useState<'replace' | 'duplicate'>('replace');

  useEffect(() => {
    setSelectedExportSessionIds(sessions.map((session) => session.id));
  }, [activeSessionId, isBackupModalOpen]);

  useEffect(() => {
    if (!importPreview) {
      return;
    }

    setSelectedImportSessionIds(importPreview.sessions.map((session) => session.id));
  }, [importPreview]);

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

            void onPrepareImport(file).then((preview) => {
              setImportPreview(preview);
              setImportMode('append');
              setCollisionStrategy('replace');
            });
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
                <div className={styles.scopeSection}>
                  <span className={styles.scopeLabel}>What to include</span>
                  <div className={styles.scopeActions}>
                    <button
                      className={styles.scopeActionButton}
                      type="button"
                      onClick={() => setSelectedExportSessionIds(sessions.map((session) => session.id))}
                    >
                      Select all
                    </button>
                    <button
                      className={styles.scopeActionButton}
                      type="button"
                      onClick={() => setSelectedExportSessionIds([])}
                    >
                      Deselect all
                    </button>
                  </div>
                  <div className={styles.scopeOptions}>
                    {sessions.map((session) => (
                      <label key={session.id} className={styles.scopeOption}>
                        <input
                          type="checkbox"
                          checked={selectedExportSessionIds.includes(session.id)}
                          onChange={(event) => {
                            setSelectedExportSessionIds((currentIds) =>
                              event.target.checked
                                ? [...currentIds, session.id]
                                : currentIds.filter((id) => id !== session.id),
                            );
                          }}
                        />
                        <span>{session.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className={styles.modalOptions}>
                  <button
                    className={styles.modalOption}
                    type="button"
                    disabled={selectedExportSessionIds.length === 0}
                    onClick={() => {
                      onExportLight(selectedExportSessionIds.length === sessions.length ? undefined : selectedExportSessionIds);
                      setIsBackupModalOpen(false);
                    }}
                  >
                    <strong>Light copy</strong>
                    <span>Session data only. Local media must be relinked after import.</span>
                  </button>
                  <button
                    className={styles.modalOption}
                    type="button"
                    disabled={selectedExportSessionIds.length === 0}
                    onClick={() => {
                      onExport(selectedExportSessionIds.length === sessions.length ? undefined : selectedExportSessionIds);
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

      {importPreview
        ? createPortal(
            <div className={styles.modalShell} role="dialog" aria-modal="true" aria-label="Choose import sessions">
              <button
                className={styles.modalBackdrop}
                type="button"
                aria-label="Close import options"
                onClick={() => setImportPreview(null)}
              />
              <div className={styles.modalCard}>
                <div className={styles.modalHeader}>
                  <h4>Import sessions</h4>
                  <button className={styles.modalClose} type="button" onClick={() => setImportPreview(null)}>
                    Close
                  </button>
                </div>
                <p className={styles.modalIntro}>
                  Choose which sessions to import and whether they should replace your current ones or be appended to them.
                </p>
                <div className={styles.scopeSection}>
                  <span className={styles.scopeLabel}>Import mode</span>
                  <div className={styles.scopeActions}>
                    <button
                      className={`${styles.scopeModeButton} ${importMode === 'append' ? styles.scopeModeButtonActive : ''}`}
                      type="button"
                      onClick={() => setImportMode('append')}
                    >
                      Append
                    </button>
                    <button
                      className={`${styles.scopeModeButton} ${importMode === 'replace' ? styles.scopeModeButtonActive : ''}`}
                      type="button"
                      onClick={() => setImportMode('replace')}
                    >
                      Replace current
                    </button>
                  </div>
                </div>
                <div className={styles.scopeSection}>
                  <span className={styles.scopeLabel}>Sessions to import</span>
                  <div className={styles.scopeActions}>
                    <button
                      className={styles.scopeActionButton}
                      type="button"
                      onClick={() => setSelectedImportSessionIds(importPreview.sessions.map((session) => session.id))}
                    >
                      Select all
                    </button>
                    <button
                      className={styles.scopeActionButton}
                      type="button"
                      onClick={() => setSelectedImportSessionIds([])}
                    >
                      Deselect all
                    </button>
                  </div>
                  <div className={styles.scopeOptions}>
                    {importPreview.sessions.map((session) => (
                      <label key={session.id} className={styles.scopeOption}>
                        <input
                          type="checkbox"
                          checked={selectedImportSessionIds.includes(session.id)}
                          onChange={(event) => {
                            setSelectedImportSessionIds((currentIds) =>
                              event.target.checked
                                ? [...currentIds, session.id]
                                : currentIds.filter((id) => id !== session.id),
                            );
                          }}
                        />
                        <span>{session.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {importMode === 'append' && importPreview.collidingSessionIds.length > 0 ? (
                  <div className={styles.scopeSection}>
                    <span className={styles.scopeLabel}>If a session already exists</span>
                    <div className={styles.scopeActions}>
                      <button
                        className={`${styles.scopeModeButton} ${collisionStrategy === 'replace' ? styles.scopeModeButtonActive : ''}`}
                        type="button"
                        onClick={() => setCollisionStrategy('replace')}
                      >
                        Replace it
                      </button>
                      <button
                        className={`${styles.scopeModeButton} ${collisionStrategy === 'duplicate' ? styles.scopeModeButtonActive : ''}`}
                        type="button"
                        onClick={() => setCollisionStrategy('duplicate')}
                      >
                        Duplicate it
                      </button>
                    </div>
                  </div>
                ) : null}
                <div className={styles.modalOptions}>
                  <button
                    className={styles.modalOption}
                    type="button"
                    disabled={selectedImportSessionIds.length === 0}
                    onClick={() => {
                      onImport(importPreview.file, {
                        sessionIds:
                          selectedImportSessionIds.length === importPreview.sessions.length
                            ? undefined
                            : selectedImportSessionIds,
                        mode: importMode,
                        collisionStrategy,
                      });
                      setImportPreview(null);
                    }}
                  >
                    <strong>Import selected sessions</strong>
                    <span>
                      {importMode === 'replace'
                        ? 'Current saved sessions will be cleared before import.'
                        : 'Selected sessions will be added to your current saved sessions.'}
                    </span>
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
