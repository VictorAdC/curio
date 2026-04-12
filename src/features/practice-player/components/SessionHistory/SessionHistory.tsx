import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../../../i18n/I18nProvider';
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
  const { t, formatDateTime } = useI18n();

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
              aria-label={t('practice.sessionHistory.nameAria', { title: session.sourceTitle })}
              autoFocus
            />
            <span className={styles.editingBadge}>{t('practice.sessionHistory.editing')}</span>
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
          {isActive ? <span className={styles.activeBadge}>{t('practice.sessionHistory.open')}</span> : null}
          {session.requiresMediaRelink ? <span className={styles.warningBadge}>{t('practice.sessionHistory.mediaMissing')}</span> : null}
          <button
            className={styles.renameButton}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (
                window.confirm(
                  t('practice.sessionHistory.deleteConfirm', { name: session.name }),
                )
              ) {
                onDeleteSession(session.id);
              }
            }}
          >
            {t('practice.sessionHistory.delete')}
          </button>
        </div>
      </div>
      <div className={styles.meta}>
        <span>{session.sourceTitle}</span>
        <span>{t(`practice.sourceKind.${session.sourceKind}`)}</span>
        <span>{formatDateTime(session.updatedAt)}</span>
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
  const { t } = useI18n();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [selectedExportSessionIds, setSelectedExportSessionIds] = useState<string[]>([]);
  const [importPreview, setImportPreview] = useState<PracticeSessionsBackupPreview | null>(null);
  const [selectedImportSessionIds, setSelectedImportSessionIds] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('append');
  const [collisionStrategy, setCollisionStrategy] = useState<'replace' | 'duplicate'>('replace');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | PracticeSessionSummary['sourceKind']>('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | 'name'>('recent');

  useEffect(() => {
    setSelectedExportSessionIds(sessions.map((session) => session.id));
  }, [activeSessionId, isBackupModalOpen]);

  useEffect(() => {
    if (!importPreview) {
      return;
    }

    setSelectedImportSessionIds(importPreview.sessions.map((session) => session.id));
  }, [importPreview]);

  const filteredSessions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const nextSessions = sessions.filter((session) => {
      const matchesFilter = sourceFilter === 'all' || session.sourceKind === sourceFilter;

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [session.name, session.sourceTitle].some((value) => value.toLowerCase().includes(normalizedQuery));
    });

    return nextSessions.sort((left, right) => {
      switch (sortOrder) {
        case 'oldest':
          return new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
        case 'name':
          return left.name.localeCompare(right.name);
        case 'recent':
        default:
          return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      }
    });
  }, [searchQuery, sessions, sortOrder, sourceFilter]);

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <h3>{t('practice.sessionHistory.title')}</h3>
          <p>{t('practice.sessionHistory.description')}</p>
        </div>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t('practice.sessions.searchPlaceholder')}
        />
        <div className={styles.filterRow}>
          <select
            className={styles.filterSelect}
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value as typeof sourceFilter)}
            aria-label={t('practice.sessions.filter.label')}
          >
            <option value="all">{t('practice.sessions.filter.all')}</option>
            <option value="local-audio">{t('practice.sourceKind.local-audio')}</option>
            <option value="local-video">{t('practice.sourceKind.local-video')}</option>
            <option value="youtube">{t('practice.sourceKind.youtube')}</option>
          </select>
          <select
            className={styles.filterSelect}
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)}
            aria-label={t('practice.sessions.sort.label')}
          >
            <option value="recent">{t('practice.sessions.sort.recent')}</option>
            <option value="oldest">{t('practice.sessions.sort.oldest')}</option>
            <option value="name">{t('practice.sessions.sort.name')}</option>
          </select>
        </div>
      </div>

      <div className={styles.list}>
        {sessions.length === 0 ? (
          <p className={styles.empty}>{t('practice.sessionHistory.empty')}</p>
        ) : filteredSessions.length === 0 ? (
          <p className={styles.empty}>{t('practice.sessionHistory.emptyFiltered')}</p>
        ) : null}
        {filteredSessions.map((session) => (
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
          {t('practice.sessionHistory.download')}
        </button>
        <button className={styles.bulkButton} type="button" onClick={() => importInputRef.current?.click()}>
          {t('practice.sessionHistory.upload')}
        </button>
        <button
          className={styles.bulkDangerButton}
          type="button"
          onClick={() => {
            if (window.confirm(t('practice.sessionHistory.clearAllConfirm'))) {
              onClearAll();
            }
          }}
        >
          {t('practice.sessionHistory.clearAll')}
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
            <div className={styles.modalShell} role="dialog" aria-modal="true" aria-label={t('practice.sessionHistory.backupDialogLabel')}>
              <button
                className={styles.modalBackdrop}
                type="button"
                aria-label={t('practice.sessionHistory.backupCloseAria')}
                onClick={() => setIsBackupModalOpen(false)}
              />
              <div className={styles.modalCard}>
                <div className={styles.modalHeader}>
                  <h4>{t('practice.sessionHistory.backupTitle')}</h4>
                  <button className={styles.modalClose} type="button" onClick={() => setIsBackupModalOpen(false)}>
                    {t('practice.sessionHistory.modalClose')}
                  </button>
                </div>
                <p className={styles.modalIntro}>
                  {t('practice.sessionHistory.backupIntro')}
                </p>
                <div className={styles.scopeSection}>
                  <span className={styles.scopeLabel}>{t('practice.sessionHistory.scope')}</span>
                  <div className={styles.scopeActions}>
                    <button
                      className={styles.scopeActionButton}
                      type="button"
                      onClick={() => setSelectedExportSessionIds(sessions.map((session) => session.id))}
                    >
                      {t('practice.sessionHistory.selectAll')}
                    </button>
                    <button
                      className={styles.scopeActionButton}
                      type="button"
                      onClick={() => setSelectedExportSessionIds([])}
                    >
                      {t('practice.sessionHistory.deselectAll')}
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
                    <strong>{t('practice.sessionHistory.lightCopy')}</strong>
                    <span>{t('practice.sessionHistory.lightCopyDescription')}</span>
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
                    <strong>{t('practice.sessionHistory.fullCopy')}</strong>
                    <span>{t('practice.sessionHistory.fullCopyDescription')}</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {importPreview
        ? createPortal(
            <div className={styles.modalShell} role="dialog" aria-modal="true" aria-label={t('practice.sessionHistory.importDialogLabel')}>
              <button
                className={styles.modalBackdrop}
                type="button"
                aria-label={t('practice.sessionHistory.importCloseAria')}
                onClick={() => setImportPreview(null)}
              />
              <div className={styles.modalCard}>
                <div className={styles.modalHeader}>
                  <h4>{t('practice.sessionHistory.importTitle')}</h4>
                  <button className={styles.modalClose} type="button" onClick={() => setImportPreview(null)}>
                    {t('practice.sessionHistory.modalClose')}
                  </button>
                </div>
                <p className={styles.modalIntro}>
                  {t('practice.sessionHistory.importIntro')}
                </p>
                <div className={styles.scopeSection}>
                  <span className={styles.scopeLabel}>{t('practice.sessionHistory.importMode')}</span>
                  <div className={styles.scopeActions}>
                    <button
                      className={`${styles.scopeModeButton} ${importMode === 'append' ? styles.scopeModeButtonActive : ''}`}
                      type="button"
                      onClick={() => setImportMode('append')}
                    >
                      {t('practice.sessionHistory.append')}
                    </button>
                    <button
                      className={`${styles.scopeModeButton} ${importMode === 'replace' ? styles.scopeModeButtonActive : ''}`}
                      type="button"
                      onClick={() => setImportMode('replace')}
                    >
                      {t('practice.sessionHistory.replaceCurrent')}
                    </button>
                  </div>
                </div>
                <div className={styles.scopeSection}>
                  <span className={styles.scopeLabel}>{t('practice.sessionHistory.sessionsToImport')}</span>
                  <div className={styles.scopeActions}>
                    <button
                      className={styles.scopeActionButton}
                      type="button"
                      onClick={() => setSelectedImportSessionIds(importPreview.sessions.map((session) => session.id))}
                    >
                      {t('practice.sessionHistory.selectAll')}
                    </button>
                    <button
                      className={styles.scopeActionButton}
                      type="button"
                      onClick={() => setSelectedImportSessionIds([])}
                    >
                      {t('practice.sessionHistory.deselectAll')}
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
                    <span className={styles.scopeLabel}>{t('practice.sessionHistory.collisionLabel')}</span>
                    <div className={styles.scopeActions}>
                      <button
                        className={`${styles.scopeModeButton} ${collisionStrategy === 'replace' ? styles.scopeModeButtonActive : ''}`}
                        type="button"
                        onClick={() => setCollisionStrategy('replace')}
                      >
                        {t('practice.sessionHistory.replaceIt')}
                      </button>
                      <button
                        className={`${styles.scopeModeButton} ${collisionStrategy === 'duplicate' ? styles.scopeModeButtonActive : ''}`}
                        type="button"
                        onClick={() => setCollisionStrategy('duplicate')}
                      >
                        {t('practice.sessionHistory.duplicateIt')}
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
                    <strong>{t('practice.sessionHistory.importSelected')}</strong>
                    <span>
                      {importMode === 'replace'
                        ? t('practice.sessionHistory.importReplaceDescription')
                        : t('practice.sessionHistory.importAppendDescription')}
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
