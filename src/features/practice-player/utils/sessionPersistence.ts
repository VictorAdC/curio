import Dexie, { type Table } from 'dexie';
import type {
  LoopSelection,
  PracticeMarker,
  PracticeMediaSource,
  PracticeSessionState,
  TimelineWaveformDatum,
} from '../types/practicePlayer';

const SESSION_STORAGE_KEY = 'curio.practice-session.v1';

interface StoredMediaAsset {
  id: string;
  file: Blob;
  name: string;
  type: string;
  lastModified: number;
}

interface PersistedSessionSnapshot {
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

export function persistPracticeSession(state: PracticeSessionState) {
  if (!state.source) {
    return;
  }

  const snapshot: PersistedSessionSnapshot = {
    source: buildPersistedSource(state.source),
    currentTime: state.currentTime,
    duration: state.duration,
    markers: state.markers,
    loopSelection: state.loopSelection,
    sessionNote: state.sessionNote,
    waveform: state.waveform,
  };

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(snapshot));
}

export function clearPersistedPracticeSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function restorePracticeSession(): Promise<RestoredPracticeSession | null> {
  try {
    const rawSnapshot = window.localStorage.getItem(SESSION_STORAGE_KEY);

    if (!rawSnapshot) {
      return null;
    }

    const snapshot = JSON.parse(rawSnapshot) as PersistedSessionSnapshot;

    if (snapshot.source.kind === 'youtube') {
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
      clearPersistedPracticeSession();
      return null;
    }

    const storedMedia = await db.mediaAssets.get(persistedMediaId);

    if (!storedMedia) {
      clearPersistedPracticeSession();
      return null;
    }

    const file = new File([storedMedia.file], storedMedia.name, {
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
        },
      },
    };
  } catch {
    clearPersistedPracticeSession();
    return null;
  }
}
