import { PracticeError } from '../errors';
import {
  ACTIVE_SESSION_ID_STORAGE_KEY,
  BACKUP_VERSION,
  blobToDataUrl,
  dataUrlToBlob,
  db,
  normalizePersistedSession,
  normalizeStoredBlob,
  readPersistedSessions,
  sortSessionsDescending,
  writePersistedSessions,
  type ImportPracticeSessionsOptions,
  type LegacyPersistedSessionSnapshot,
  type PracticeSessionsBackup,
} from './db';
import { clearAllPersistedPracticeSessions, listPersistedPracticeSessions, getActivePracticeSessionId } from './sessionStorage';

export type { ImportPracticeSessionsOptions };

export interface PracticeSessionsBackupPreview {
  file: File;
  sessions: import('../../types/practicePlayer').PracticeSessionSummary[];
  activeSessionId: string | null;
  includesMediaAssets: boolean;
  collidingSessionIds: string[];
}

function parseBackup(text: string): PracticeSessionsBackup & { sessions: LegacyPersistedSessionSnapshot[] } {
  const backup = JSON.parse(text) as PracticeSessionsBackup & { sessions: LegacyPersistedSessionSnapshot[] };
  if (
    (backup.version !== 1 && backup.version !== BACKUP_VERSION) ||
    !Array.isArray(backup.sessions) ||
    !Array.isArray(backup.mediaAssets)
  ) {
    throw new PracticeError('BACKUP_UNSUPPORTED');
  }
  return backup;
}

export async function createPracticeSessionsBackup(includeMediaAssets: boolean, sessionIds?: string[]) {
  const allSessions = readPersistedSessions();
  const sessions =
    sessionIds && sessionIds.length > 0
      ? allSessions.filter((session) => sessionIds.includes(session.session.id))
      : allSessions;

  const mediaAssets = includeMediaAssets
    ? await Promise.all(
        Array.from(
          new Set(
            sessions
              .map((session) => session.source.sourceRef.persistedMediaId)
              .filter((mediaId): mediaId is string => Boolean(mediaId)),
          ),
        ).map(async (mediaId) => {
          const asset = await db.mediaAssets.get(mediaId);
          if (!asset) return null;
          return {
            id: asset.id,
            name: asset.name,
            type: asset.type,
            lastModified: asset.lastModified,
            dataUrl: await blobToDataUrl(normalizeStoredBlob(asset.file, asset.type)),
          };
        }),
      )
    : [];

  const backup: PracticeSessionsBackup = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    activeSessionId: sessions.length === 1 ? sessions[0].session.id : getActivePracticeSessionId(),
    sessions,
    mediaAssets: mediaAssets.filter((asset): asset is NonNullable<typeof asset> => asset !== null),
  };

  return backup;
}

export async function exportPersistedPracticeSessions(includeMediaAssets: boolean, sessionIds?: string[]) {
  const backup = await createPracticeSessionsBackup(includeMediaAssets, sessionIds);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const objectUrl = URL.createObjectURL(blob);
  const sanitizedTimestamp = backup.exportedAt.slice(0, 19).replace(/:/g, '-');
  return {
    objectUrl,
    filename: `curio-practice-sessions-${includeMediaAssets ? 'full' : 'light'}-${sanitizedTimestamp}.json`,
  };
}

export async function importPersistedPracticeSessions(file: File) {
  const backup = parseBackup(await file.text());
  const normalizedSessions = backup.sessions.map(normalizePersistedSession);

  await clearAllPersistedPracticeSessions();

  await Promise.all(
    backup.mediaAssets.map(async (asset) => {
      await db.mediaAssets.put({
        id: asset.id,
        name: asset.name,
        type: asset.type,
        lastModified: asset.lastModified,
        file: dataUrlToBlob(asset.dataUrl),
      });
    }),
  );

  const importedSessions = sortSessionsDescending(
    normalizedSessions.map((session) => {
      if (session.source.kind === 'youtube') return session;
      const hasMediaAsset = backup.mediaAssets.some((asset) => asset.id === session.source.sourceRef.persistedMediaId);
      return { ...session, session: { ...session.session, requiresMediaRelink: !hasMediaAsset } };
    }),
  );

  writePersistedSessions(importedSessions);

  if (backup.activeSessionId) {
    window.localStorage.setItem(ACTIVE_SESSION_ID_STORAGE_KEY, backup.activeSessionId);
  }

  return {
    sessions: listPersistedPracticeSessions(),
    activeSessionId: backup.activeSessionId,
  };
}

export async function inspectPracticeSessionsBackup(file: File): Promise<PracticeSessionsBackupPreview> {
  const backup = parseBackup(await file.text());
  const normalizedSessions = backup.sessions.map(normalizePersistedSession);
  const existingSessionIds = new Set(readPersistedSessions().map((session) => session.session.id));

  return {
    file,
    sessions: normalizedSessions.map((session) => session.session),
    activeSessionId: backup.activeSessionId,
    includesMediaAssets: backup.mediaAssets.length > 0,
    collidingSessionIds: normalizedSessions
      .map((session) => session.session.id)
      .filter((sessionId) => existingSessionIds.has(sessionId)),
  };
}

export async function importSelectedPracticeSessions(file: File, options: ImportPracticeSessionsOptions) {
  const backup = parseBackup(await file.text());
  const normalizedBackupSessions = backup.sessions.map(normalizePersistedSession);

  const selectedSessions =
    options.sessionIds && options.sessionIds.length > 0
      ? normalizedBackupSessions.filter((session) => options.sessionIds?.includes(session.session.id))
      : normalizedBackupSessions;

  const existingSessionsById = new Map(
    readPersistedSessions().map((session) => [session.session.id, session] as const),
  );

  const normalizedSessions = selectedSessions.map((session) => {
    const hasCollision = existingSessionsById.has(session.session.id);
    if (!hasCollision || options.mode === 'replace' || options.collisionStrategy !== 'duplicate') {
      return session;
    }
    const duplicatedId = crypto.randomUUID();
    return {
      ...session,
      session: {
        ...session.session,
        id: duplicatedId,
        name: `${session.session.name} ${options.duplicateSuffix ?? 'copy'}`,
        updatedAt: new Date().toISOString(),
      },
      source: {
        ...session.source,
        id: duplicatedId,
        sourceRef: {
          ...session.source.sourceRef,
          persistedMediaId: session.source.kind === 'youtube' ? undefined : duplicatedId,
        },
      },
    };
  });

  const selectedMediaAssetIds = new Set(
    normalizedSessions
      .map((session) => session.source.sourceRef.persistedMediaId)
      .filter((mediaId): mediaId is string => Boolean(mediaId)),
  );
  const selectedMediaAssets = backup.mediaAssets.filter((asset) => selectedMediaAssetIds.has(asset.id));

  if (options.mode === 'replace') {
    await clearAllPersistedPracticeSessions();
  }

  const existingSessions =
    options.mode === 'append'
      ? readPersistedSessions().filter(
          (existingSession) =>
            !normalizedSessions.some((selectedSession) => selectedSession.session.id === existingSession.session.id),
        )
      : [];

  await Promise.all(
    selectedMediaAssets.map(async (asset) => {
      const matchingSession = normalizedSessions.find(
        (session) => session.source.sourceRef.persistedMediaId === asset.id,
      );
      const nextAssetId = matchingSession?.source.sourceRef.persistedMediaId ?? asset.id;
      await db.mediaAssets.put({
        id: nextAssetId,
        name: asset.name,
        type: asset.type,
        lastModified: asset.lastModified,
        file: dataUrlToBlob(asset.dataUrl),
      });
    }),
  );

  const importedSessions = sortSessionsDescending(
    normalizedSessions.map((session) => {
      if (session.source.kind === 'youtube') return session;
      const hasMediaAsset = selectedMediaAssets.some(
        (asset) => asset.id === session.source.sourceRef.persistedMediaId,
      );
      return { ...session, session: { ...session.session, requiresMediaRelink: !hasMediaAsset } };
    }),
  );

  const mergedSessions = sortSessionsDescending([...existingSessions, ...importedSessions]);
  writePersistedSessions(mergedSessions);

  const nextActiveSessionId =
    backup.activeSessionId &&
    importedSessions.some((session) => session.session.id === backup.activeSessionId)
      ? backup.activeSessionId
      : (importedSessions[0]?.session.id ?? existingSessions[0]?.session.id ?? null);

  if (nextActiveSessionId) {
    window.localStorage.setItem(ACTIVE_SESSION_ID_STORAGE_KEY, nextActiveSessionId);
  } else {
    window.localStorage.removeItem(ACTIVE_SESSION_ID_STORAGE_KEY);
  }

  return {
    sessions: listPersistedPracticeSessions(),
    activeSessionId: nextActiveSessionId,
  };
}
