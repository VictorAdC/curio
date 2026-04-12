import Dexie, { type Table } from 'dexie';
import type {
  LoopSelection,
  MediaRelinkWarning,
  PracticeMarker,
  PracticeMediaSource,
  PracticeSessionSummary,
  PracticeSessionState,
  TimelineWaveformDatum,
} from '../types/practicePlayer';

const SESSIONS_STORAGE_KEY = 'curio.practice-sessions.v1';
const ACTIVE_SESSION_ID_STORAGE_KEY = 'curio.practice-active-session.v1';
const BACKUP_VERSION = 1;

interface StoredMediaAsset {
  id: string;
  file: Blob;
  name: string;
  type: string;
  lastModified: number;
}

interface PersistedSessionSnapshot {
  session: PracticeSessionSummary;
  source: PersistedPracticeMediaSource;
  currentTime: number;
  duration: number;
  markers: PracticeMarker[];
  loopSelection: LoopSelection;
  sessionNote: string;
  waveform: TimelineWaveformDatum[];
}

interface PersistedPracticeMediaSource {
  id: string;
  kind: PracticeMediaSource['kind'];
  title: string;
  durationSeconds: number;
  sourceRef: {
    youtubeUrl?: string;
    youtubeVideoId?: string;
    persistedMediaId?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    fileLastModified?: number;
  };
}

interface RestoredPracticeSession {
  session: PracticeSessionSummary;
  source: PracticeMediaSource;
  currentTime: number;
  duration: number;
  markers: PracticeMarker[];
  loopSelection: LoopSelection;
  sessionNote: string;
  waveform: TimelineWaveformDatum[];
}

interface PracticeSessionsBackup {
  version: number;
  exportedAt: string;
  activeSessionId: string | null;
  sessions: PersistedSessionSnapshot[];
  mediaAssets: Array<{
    id: string;
    name: string;
    type: string;
    lastModified: number;
    dataUrl: string;
  }>;
}

export interface PracticeSessionsBackupPreview {
  file: File;
  sessions: PracticeSessionSummary[];
  activeSessionId: string | null;
  includesMediaAssets: boolean;
  collidingSessionIds: string[];
}

interface ImportPracticeSessionsOptions {
  sessionIds?: string[];
  mode: 'replace' | 'append';
  collisionStrategy?: 'replace' | 'duplicate';
}

class CurioPracticeDatabase extends Dexie {
  mediaAssets!: Table<StoredMediaAsset, string>;

  constructor() {
    super('curioPractice');
    this.version(1).stores({
      mediaAssets: '&id',
    });
  }
}

const db = new CurioPracticeDatabase();

function readPersistedSessions(): PersistedSessionSnapshot[] {
  const rawSessions = window.localStorage.getItem(SESSIONS_STORAGE_KEY);

  if (!rawSessions) {
    return [];
  }

  try {
    return JSON.parse(rawSessions) as PersistedSessionSnapshot[];
  } catch {
    window.localStorage.removeItem(SESSIONS_STORAGE_KEY);
    return [];
  }
}

function writePersistedSessions(sessions: PersistedSessionSnapshot[]) {
  window.localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
}

function sortSessionsDescending(sessions: PersistedSessionSnapshot[]) {
  return [...sessions].sort(
    (left, right) => new Date(right.session.updatedAt).getTime() - new Date(left.session.updatedAt).getTime(),
  );
}

function buildPersistedSource(source: PracticeMediaSource): PersistedPracticeMediaSource {
  return {
    id: source.id,
    kind: source.kind,
    title: source.title,
    durationSeconds: source.durationSeconds,
    sourceRef: {
      youtubeUrl: source.sourceRef.youtubeUrl,
      youtubeVideoId: source.sourceRef.youtubeVideoId,
      persistedMediaId: source.sourceRef.persistedMediaId,
      fileName: source.sourceRef.fileName ?? source.sourceRef.file?.name,
      fileType: source.sourceRef.fileType ?? source.sourceRef.file?.type,
      fileSize: source.sourceRef.fileSize ?? source.sourceRef.file?.size,
      fileLastModified: source.sourceRef.fileLastModified ?? source.sourceRef.file?.lastModified,
    },
  };
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl: string) {
  const [header, data] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] ?? 'application/octet-stream';
  const binaryString = window.atob(data);
  const bytes = new Uint8Array(binaryString.length);

  for (let index = 0; index < binaryString.length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

export async function persistLocalMediaFile(sourceId: string, file: File) {
  await db.mediaAssets.put({
    id: sourceId,
    file,
    name: file.name,
    type: file.type,
    lastModified: file.lastModified,
  });
}

export async function removePersistedLocalMediaFile(sourceId: string | null | undefined) {
  if (!sourceId) {
    return;
  }

  await db.mediaAssets.delete(sourceId);
}

export function listPersistedPracticeSessions(): PracticeSessionSummary[] {
  return sortSessionsDescending(readPersistedSessions()).map((session) => session.session);
}

export function createPracticeSessionSummary(source: PracticeMediaSource): PracticeSessionSummary {
  const timestamp = new Date().toISOString();

  return {
    id: source.id,
    name: timestamp.replace('T', ' ').slice(0, 16),
    sourceTitle: source.title,
    sourceKind: source.kind,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function persistPracticeSession(session: PracticeSessionSummary, state: PracticeSessionState) {
  if (!state.source) {
    return;
  }

  const nextSnapshot: PersistedSessionSnapshot = {
    session: {
      ...session,
      sourceTitle: state.source.title,
      sourceKind: state.source.kind,
      updatedAt: new Date().toISOString(),
    },
    source: buildPersistedSource(state.source),
    currentTime: state.currentTime,
    duration: state.duration,
    markers: state.markers,
    loopSelection: state.loopSelection,
    sessionNote: state.sessionNote,
    waveform: state.waveform,
  };

  const sessions = readPersistedSessions().filter((item) => item.session.id !== session.id);
  writePersistedSessions(sortSessionsDescending([...sessions, nextSnapshot]));
  window.localStorage.setItem(ACTIVE_SESSION_ID_STORAGE_KEY, session.id);
}

export function clearPersistedPracticeSession() {
  window.localStorage.removeItem(SESSIONS_STORAGE_KEY);
  window.localStorage.removeItem(ACTIVE_SESSION_ID_STORAGE_KEY);
}

export async function clearAllPersistedPracticeSessions() {
  await db.mediaAssets.clear();
  clearPersistedPracticeSession();
}

export function renamePersistedPracticeSession(sessionId: string, name: string) {
  const sessions = readPersistedSessions().map((session) =>
    session.session.id === sessionId
      ? {
          ...session,
          session: {
            ...session.session,
            name,
            updatedAt: new Date().toISOString(),
          },
        }
      : session,
  );

  writePersistedSessions(sortSessionsDescending(sessions));
}

export function getActivePracticeSessionId() {
  return window.localStorage.getItem(ACTIVE_SESSION_ID_STORAGE_KEY);
}

export async function deletePersistedPracticeSession(sessionId: string) {
  const sessions = readPersistedSessions();
  const targetSession = sessions.find((session) => session.session.id === sessionId);

  if (!targetSession) {
    return {
      sessions: listPersistedPracticeSessions(),
      nextActiveSessionId: getActivePracticeSessionId(),
    };
  }

  if (targetSession.source.kind !== 'youtube') {
    await removePersistedLocalMediaFile(targetSession.source.sourceRef.persistedMediaId ?? targetSession.source.id);
  }

  const remainingSessions = sortSessionsDescending(sessions.filter((session) => session.session.id !== sessionId));
  writePersistedSessions(remainingSessions);

  const currentActiveSessionId = getActivePracticeSessionId();
  const nextActiveSessionId =
    currentActiveSessionId === sessionId ? (remainingSessions[0]?.session.id ?? null) : currentActiveSessionId;

  if (nextActiveSessionId) {
    window.localStorage.setItem(ACTIVE_SESSION_ID_STORAGE_KEY, nextActiveSessionId);
  } else {
    window.localStorage.removeItem(ACTIVE_SESSION_ID_STORAGE_KEY);
  }

  return {
    sessions: remainingSessions.map((session) => session.session),
    nextActiveSessionId,
  };
}

export function getPracticeSessionMediaRelinkWarning(sessionId: string, file: File): MediaRelinkWarning | null {
  const sessions = readPersistedSessions();
  const targetSession = sessions.find((session) => session.session.id === sessionId);

  if (!targetSession || targetSession.source.kind === 'youtube') {
    return null;
  }

  const expected = targetSession.source.sourceRef;
  const mismatches: MediaRelinkWarning['mismatches'] = [];

  if (expected.fileType && expected.fileType !== file.type) {
    mismatches.push('type');
  }

  if (expected.fileSize && expected.fileSize !== file.size) {
    mismatches.push('size');
  }

  if (expected.fileName && expected.fileName !== file.name) {
    mismatches.push('name');
  }

  if (expected.fileLastModified && expected.fileLastModified !== file.lastModified) {
    mismatches.push('lastModified');
  }

  if (mismatches.length === 0) {
    return null;
  }

  const mismatchLabels = mismatches.map((mismatch) => {
    switch (mismatch) {
      case 'type':
        return 'file type';
      case 'size':
        return 'file size';
      case 'name':
        return 'file name';
      case 'lastModified':
        return 'last modified date';
    }
  });

  return {
    mismatches,
    message: `This file differs from the original session media (${mismatchLabels.join(', ')}). Use it anyway?`,
  };
}

export async function relinkPersistedPracticeSessionMedia(sessionId: string, file: File) {
  const sessions = readPersistedSessions();
  const targetSession = sessions.find((session) => session.session.id === sessionId);

  if (!targetSession || targetSession.source.kind === 'youtube') {
    throw new Error('This session does not require local media relinking.');
  }

  const mediaId = targetSession.source.sourceRef.persistedMediaId ?? targetSession.source.id;

  await db.mediaAssets.put({
    id: mediaId,
    file,
    name: file.name,
    type: file.type,
    lastModified: file.lastModified,
  });

  const nextSessions = sortSessionsDescending(
    sessions.map((session) =>
      session.session.id === sessionId
        ? {
            ...session,
            session: {
              ...session.session,
              requiresMediaRelink: false,
              updatedAt: new Date().toISOString(),
            },
            source: {
              ...session.source,
              sourceRef: {
                ...session.source.sourceRef,
                persistedMediaId: mediaId,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                fileLastModified: file.lastModified,
              },
            },
          }
        : session,
    ),
  );

  writePersistedSessions(nextSessions);

  return {
    sessions: nextSessions.map((session) => session.session),
    activeSessionId: getActivePracticeSessionId(),
  };
}

export async function exportPersistedPracticeSessions(includeMediaAssets: boolean, sessionIds?: string[]) {
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

          if (!asset) {
            return null;
          }

          return {
            id: asset.id,
            name: asset.name,
            type: asset.type,
            lastModified: asset.lastModified,
            dataUrl: await blobToDataUrl(asset.file),
          };
        }),
      )
    : [];

  const backup: PracticeSessionsBackup = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    activeSessionId:
      sessions.length === 1 ? sessions[0].session.id : getActivePracticeSessionId(),
    sessions,
    mediaAssets: mediaAssets.filter((asset): asset is NonNullable<typeof asset> => asset !== null),
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const objectUrl = URL.createObjectURL(blob);
  const sanitizedTimestamp = backup.exportedAt.slice(0, 19).replace(/:/g, '-');

  return {
    objectUrl,
    filename: `curio-practice-sessions-${includeMediaAssets ? 'full' : 'light'}-${sanitizedTimestamp}.json`,
  };
}

export async function importPersistedPracticeSessions(file: File) {
  const backup = JSON.parse(await file.text()) as PracticeSessionsBackup;

  if (backup.version !== BACKUP_VERSION || !Array.isArray(backup.sessions) || !Array.isArray(backup.mediaAssets)) {
    throw new Error('Unsupported backup file.');
  }

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
    backup.sessions.map((session) => {
      if (session.source.kind === 'youtube') {
        return session;
      }

      const hasMediaAsset = backup.mediaAssets.some((asset) => asset.id === session.source.sourceRef.persistedMediaId);

      return {
        ...session,
        session: {
          ...session.session,
          requiresMediaRelink: !hasMediaAsset,
        },
      };
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
  const backup = JSON.parse(await file.text()) as PracticeSessionsBackup;

  if (backup.version !== BACKUP_VERSION || !Array.isArray(backup.sessions) || !Array.isArray(backup.mediaAssets)) {
    throw new Error('Unsupported backup file.');
  }

  const existingSessionIds = new Set(readPersistedSessions().map((session) => session.session.id));

  return {
    file,
    sessions: backup.sessions.map((session) => session.session),
    activeSessionId: backup.activeSessionId,
    includesMediaAssets: backup.mediaAssets.length > 0,
    collidingSessionIds: backup.sessions
      .map((session) => session.session.id)
      .filter((sessionId) => existingSessionIds.has(sessionId)),
  };
}

export async function importSelectedPracticeSessions(
  file: File,
  options: ImportPracticeSessionsOptions,
) {
  const backup = JSON.parse(await file.text()) as PracticeSessionsBackup;

  if (backup.version !== BACKUP_VERSION || !Array.isArray(backup.sessions) || !Array.isArray(backup.mediaAssets)) {
    throw new Error('Unsupported backup file.');
  }

  const selectedSessions =
    options.sessionIds && options.sessionIds.length > 0
      ? backup.sessions.filter((session) => options.sessionIds?.includes(session.session.id))
      : backup.sessions;
  const existingSessionsById = new Map(readPersistedSessions().map((session) => [session.session.id, session] as const));

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
        name: `${session.session.name} copy`,
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
          (existingSession) => !normalizedSessions.some((selectedSession) => selectedSession.session.id === existingSession.session.id),
        )
      : [];

  await Promise.all(
    selectedMediaAssets.map(async (asset) => {
      const matchingSession = normalizedSessions.find((session) => session.source.sourceRef.persistedMediaId === asset.id);
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
      if (session.source.kind === 'youtube') {
        return session;
      }

      const hasMediaAsset = selectedMediaAssets.some((asset) => asset.id === session.source.sourceRef.persistedMediaId);

      return {
        ...session,
        session: {
          ...session.session,
          requiresMediaRelink: !hasMediaAsset,
        },
      };
    }),
  );

  const mergedSessions = sortSessionsDescending([...existingSessions, ...importedSessions]);
  writePersistedSessions(mergedSessions);

  const nextActiveSessionId =
    backup.activeSessionId && importedSessions.some((session) => session.session.id === backup.activeSessionId)
      ? backup.activeSessionId
      : importedSessions[0]?.session.id ?? existingSessions[0]?.session.id ?? null;

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

export async function restorePracticeSession(sessionId?: string): Promise<RestoredPracticeSession | null> {
  try {
    const sessions = readPersistedSessions();
    const targetSessionId = sessionId ?? window.localStorage.getItem(ACTIVE_SESSION_ID_STORAGE_KEY);

    if (!targetSessionId) {
      return null;
    }

    const snapshot = sessions.find((session) => session.session.id === targetSessionId);

    if (!snapshot) {
      return null;
    }

    if (snapshot.source.kind === 'youtube') {
      window.localStorage.setItem(ACTIVE_SESSION_ID_STORAGE_KEY, snapshot.session.id);
      return {
        ...snapshot,
        source: {
          ...snapshot.source,
          sourceRef: {
            youtubeUrl: snapshot.source.sourceRef.youtubeUrl,
            youtubeVideoId: snapshot.source.sourceRef.youtubeVideoId,
          },
        },
      };
    }

    const persistedMediaId = snapshot.source.sourceRef.persistedMediaId;

    if (!persistedMediaId) {
      return {
        ...snapshot,
        session: {
          ...snapshot.session,
          requiresMediaRelink: true,
        },
        source: {
          ...snapshot.source,
          sourceRef: {
            persistedMediaId,
            fileName: snapshot.source.sourceRef.fileName,
            fileType: snapshot.source.sourceRef.fileType,
            fileSize: snapshot.source.sourceRef.fileSize,
            fileLastModified: snapshot.source.sourceRef.fileLastModified,
            mediaMissing: true,
          },
        },
      };
    }

    const storedMedia = await db.mediaAssets.get(persistedMediaId);

    if (!storedMedia) {
      return {
        ...snapshot,
        session: {
          ...snapshot.session,
          requiresMediaRelink: true,
        },
        source: {
          ...snapshot.source,
          sourceRef: {
            persistedMediaId,
            fileName: snapshot.source.sourceRef.fileName,
            fileType: snapshot.source.sourceRef.fileType,
            fileSize: snapshot.source.sourceRef.fileSize,
            fileLastModified: snapshot.source.sourceRef.fileLastModified,
            mediaMissing: true,
          },
        },
      };
    }

    const file = new File([storedMedia.file], storedMedia.name, {
      type: storedMedia.type,
      lastModified: storedMedia.lastModified,
    });

    const objectUrl = URL.createObjectURL(file);

    window.localStorage.setItem(ACTIVE_SESSION_ID_STORAGE_KEY, snapshot.session.id);
    return {
      ...snapshot,
      source: {
        ...snapshot.source,
        sourceRef: {
          file,
          objectUrl,
          persistedMediaId,
          fileName: storedMedia.name,
          fileType: storedMedia.type,
          fileSize: storedMedia.file.size,
          fileLastModified: storedMedia.lastModified,
        },
      },
    };
  } catch {
    return null;
  }
}
