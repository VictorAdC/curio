import type { PracticeMediaSource, PracticeSessionSummary } from '../../types/practicePlayer';
import {
  ACTIVE_SESSION_ID_STORAGE_KEY,
  buildPersistedSource,
  db,
  readPersistedSessions,
  sortSessionsDescending,
  writePersistedSessions,
  type PracticeSessionState,
  type RestoredPracticeSession,
} from './db';
import { removePersistedLocalMediaFile, restoreMediaFromDb } from './mediaStorage';

export function listPersistedPracticeSessions(): PracticeSessionSummary[] {
  return sortSessionsDescending(readPersistedSessions()).map((session) => session.session);
}

export function createPracticeSessionSummary(source: PracticeMediaSource, localeCode = 'en-US'): PracticeSessionSummary {
  const timestamp = new Date().toISOString();
  return {
    id: source.id,
    name: new Intl.DateTimeFormat(localeCode, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(timestamp)),
    sourceTitle: source.title,
    sourceKind: source.kind,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function persistPracticeSession(session: PracticeSessionSummary, state: PracticeSessionState) {
  if (!state.source) return;

  const nextSnapshot = {
    session: {
      ...session,
      sourceTitle: state.source.title,
      sourceKind: state.source.kind,
      updatedAt: new Date().toISOString(),
    },
    source: buildPersistedSource(state.source),
    currentTime: state.currentTime,
    duration: state.duration,
    playbackRate: state.playbackRate,
    markers: state.markers,
    sessionNote: state.sessionNote,
    waveform: state.waveform,
  };

  const sessions = readPersistedSessions().filter((item) => item.session.id !== session.id);
  writePersistedSessions(sortSessionsDescending([...sessions, nextSnapshot]));
  window.localStorage.setItem(ACTIVE_SESSION_ID_STORAGE_KEY, session.id);
}

export function clearPersistedPracticeSession() {
  window.localStorage.removeItem('curio.practice-sessions.v1');
  window.localStorage.removeItem(ACTIVE_SESSION_ID_STORAGE_KEY);
}

export async function clearAllPersistedPracticeSessions() {
  await db.mediaAssets.clear();
  clearPersistedPracticeSession();
}

export function renamePersistedPracticeSession(sessionId: string, name: string) {
  const sessions = readPersistedSessions().map((session) =>
    session.session.id === sessionId
      ? { ...session, session: { ...session.session, name, updatedAt: new Date().toISOString() } }
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
    currentActiveSessionId === sessionId
      ? (remainingSessions[0]?.session.id ?? null)
      : currentActiveSessionId;

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

export async function restorePracticeSession(sessionId?: string): Promise<RestoredPracticeSession | null> {
  try {
    const sessions = readPersistedSessions();
    const targetSessionId = sessionId ?? window.localStorage.getItem(ACTIVE_SESSION_ID_STORAGE_KEY);

    if (!targetSessionId) return null;

    const snapshot = sessions.find((session) => session.session.id === targetSessionId);
    if (!snapshot) return null;

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
        playbackRate: snapshot.playbackRate ?? 1,
      };
    }

    const result = await restoreMediaFromDb(snapshot);
    if (result) {
      window.localStorage.setItem(ACTIVE_SESSION_ID_STORAGE_KEY, snapshot.session.id);
    }
    return result;
  } catch {
    return null;
  }
}
