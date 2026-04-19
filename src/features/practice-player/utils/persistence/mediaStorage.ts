import type { MediaRelinkWarning } from '../../types/practicePlayer';
import {
  db,
  normalizeStoredBlob,
  readPersistedSessions,
  sortSessionsDescending,
  writePersistedSessions,
  type PersistedSessionSnapshot,
  type RestoredPracticeSession,
} from './db';
import { listPersistedPracticeSessions, getActivePracticeSessionId } from './sessionStorage';

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
  if (!sourceId) return;
  await db.mediaAssets.delete(sourceId);
}

export function getPracticeSessionMediaRelinkWarning(sessionId: string, file: File): MediaRelinkWarning | null {
  const sessions = readPersistedSessions();
  const targetSession = sessions.find((session) => session.session.id === sessionId);

  if (!targetSession || targetSession.source.kind === 'youtube') return null;

  const expected = targetSession.source.sourceRef;
  const mismatches: MediaRelinkWarning['mismatches'] = [];

  if (expected.fileType && expected.fileType !== file.type) mismatches.push('type');
  if (expected.fileSize && expected.fileSize !== file.size) mismatches.push('size');
  if (expected.fileName && expected.fileName !== file.name) mismatches.push('name');
  if (expected.fileLastModified && expected.fileLastModified !== file.lastModified) mismatches.push('lastModified');

  return mismatches.length === 0 ? null : { mismatches };
}

export async function relinkPersistedPracticeSessionMedia(sessionId: string, file: File) {
  const { PracticeError } = await import('../errors');
  const sessions = readPersistedSessions();
  const targetSession = sessions.find((session) => session.session.id === sessionId);

  if (!targetSession || targetSession.source.kind === 'youtube') {
    throw new PracticeError('SESSION_MEDIA_RELINK_NOT_REQUIRED');
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
            session: { ...session.session, requiresMediaRelink: false, updatedAt: new Date().toISOString() },
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

export async function restoreMediaFromDb(snapshot: PersistedSessionSnapshot): Promise<RestoredPracticeSession | null> {
  const persistedMediaId = snapshot.source.sourceRef.persistedMediaId;

  if (!persistedMediaId) {
    return {
      ...snapshot,
      session: { ...snapshot.session, requiresMediaRelink: true },
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
      playbackRate: snapshot.playbackRate ?? 1,
    };
  }

  const storedMedia = await db.mediaAssets.get(persistedMediaId);

  if (!storedMedia) {
    return {
      ...snapshot,
      session: { ...snapshot.session, requiresMediaRelink: true },
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

  const file = new File([normalizeStoredBlob(storedMedia.file, storedMedia.type)], storedMedia.name, {
    type: storedMedia.type,
    lastModified: storedMedia.lastModified,
  });

  const objectUrl = URL.createObjectURL(file);

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
    playbackRate: snapshot.playbackRate ?? 1,
  };
}

export { listPersistedPracticeSessions };
