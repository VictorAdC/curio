import Dexie, { type Table } from 'dexie';
import type {
  LoopSelection,
  PracticeMarker,
  PracticeMediaSource,
  PracticeSessionSummary,
  PracticeSessionState,
  TimelineWaveformDatum,
} from '../types/practicePlayer';

const SESSIONS_STORAGE_KEY = 'curio.practice-sessions.v1';
const ACTIVE_SESSION_ID_STORAGE_KEY = 'curio.practice-active-session.v1';

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
    },
  };
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
      return null;
    }

    const storedMedia = await db.mediaAssets.get(persistedMediaId);

    if (!storedMedia) {
      return null;
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
        },
      },
    };
  } catch {
    return null;
  }
}
