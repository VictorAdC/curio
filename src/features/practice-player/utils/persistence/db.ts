import Dexie, { type Table } from 'dexie';
import type {
  PracticeMarker,
  PracticeMediaSource,
  PracticeSessionSummary,
  PracticeSessionState,
  PracticeSystemTag,
  TimelineWaveformDatum,
} from '../../types/practicePlayer';
import { SYSTEM_TAGS } from '../markerTags';

export const SESSIONS_STORAGE_KEY = 'curio.practice-sessions.v1';
export const ACTIVE_SESSION_ID_STORAGE_KEY = 'curio.practice-active-session.v1';
export const BACKUP_VERSION = 2;

type LegacyLoopRole = 'none' | 'start' | 'end';

export interface StoredMediaAsset {
  id: string;
  file: Blob;
  name: string;
  type: string;
  lastModified: number;
}

export interface PersistedPracticeMediaSource {
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

export interface PersistedSessionSnapshot {
  session: PracticeSessionSummary;
  source: PersistedPracticeMediaSource;
  currentTime: number;
  duration: number;
  playbackRate: number;
  markers: PracticeMarker[];
  sessionNote: string;
  waveform: TimelineWaveformDatum[];
}

export interface LegacyPersistedSessionSnapshot extends Omit<PersistedSessionSnapshot, 'markers'> {
  markers: Array<
    Omit<PracticeMarker, 'systemTags' | 'userTags'> & {
      loopRole?: LegacyLoopRole;
      systemTags?: PracticeSystemTag[];
      userTags?: string[];
    }
  >;
  loopSelection?: {
    startMarkerId: string | null;
    endMarkerId: string | null;
  };
}

export interface RestoredPracticeSession {
  session: PracticeSessionSummary;
  source: PracticeMediaSource;
  currentTime: number;
  duration: number;
  playbackRate: number;
  markers: PracticeMarker[];
  sessionNote: string;
  waveform: TimelineWaveformDatum[];
}

export interface PracticeSessionsBackup {
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

export interface ImportPracticeSessionsOptions {
  sessionIds?: string[];
  mode: 'replace' | 'append';
  collisionStrategy?: 'replace' | 'duplicate';
  duplicateSuffix?: string;
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

export const db = new CurioPracticeDatabase();

// --- Normalization helpers ---

function normalizeSystemTags(value: unknown): PracticeSystemTag[] {
  if (!Array.isArray(value)) return [];
  return value.filter((tag): tag is PracticeSystemTag => SYSTEM_TAGS.includes(tag as PracticeSystemTag));
}

function normalizeUserTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function mapLegacyLoopRoleToSystemTags(loopRole?: LegacyLoopRole): PracticeSystemTag[] {
  if (loopRole === 'start') return ['loop-start'];
  if (loopRole === 'end') return ['loop-end'];
  return [];
}

function normalizeMarker(marker: LegacyPersistedSessionSnapshot['markers'][number]): PracticeMarker {
  return {
    id: marker.id,
    timestampSeconds: marker.timestampSeconds,
    title: marker.title,
    note: marker.note ?? '',
    systemTags:
      normalizeSystemTags(marker.systemTags).length > 0
        ? normalizeSystemTags(marker.systemTags)
        : mapLegacyLoopRoleToSystemTags(marker.loopRole),
    userTags: normalizeUserTags(marker.userTags),
  };
}

export function normalizePersistedSession(session: LegacyPersistedSessionSnapshot): PersistedSessionSnapshot {
  return {
    session: session.session,
    source: session.source,
    currentTime: session.currentTime,
    duration: session.duration,
    playbackRate: session.playbackRate ?? 1,
    markers: Array.isArray(session.markers) ? session.markers.map(normalizeMarker) : [],
    sessionNote: session.sessionNote ?? '',
    waveform: Array.isArray(session.waveform) ? session.waveform : [],
  };
}

// --- Storage helpers ---

export function readPersistedSessions(): PersistedSessionSnapshot[] {
  const rawSessions = window.localStorage.getItem(SESSIONS_STORAGE_KEY);
  if (!rawSessions) return [];

  try {
    const parsedSessions = JSON.parse(rawSessions) as LegacyPersistedSessionSnapshot[];
    if (!Array.isArray(parsedSessions)) {
      window.localStorage.removeItem(SESSIONS_STORAGE_KEY);
      return [];
    }
    return parsedSessions.map(normalizePersistedSession);
  } catch {
    window.localStorage.removeItem(SESSIONS_STORAGE_KEY);
    return [];
  }
}

export function writePersistedSessions(sessions: PersistedSessionSnapshot[]) {
  window.localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
}

export function sortSessionsDescending(sessions: PersistedSessionSnapshot[]) {
  return [...sessions].sort(
    (left, right) => new Date(right.session.updatedAt).getTime() - new Date(left.session.updatedAt).getTime(),
  );
}

export function getLocalStorageBytes() {
  try {
    const sessionsRaw = window.localStorage.getItem(SESSIONS_STORAGE_KEY) ?? '';
    const activeRaw = window.localStorage.getItem(ACTIVE_SESSION_ID_STORAGE_KEY) ?? '';
    return new Blob([sessionsRaw, activeRaw]).size;
  } catch {
    return 0;
  }
}

export function buildPersistedSource(source: PracticeMediaSource): PersistedPracticeMediaSource {
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

// --- Blob helpers ---

export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl: string) {
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

export function normalizeStoredBlob(file: StoredMediaAsset['file'], mimeType: string) {
  return file instanceof Blob ? file : new Blob([file], { type: mimeType });
}

// Needed for PracticeSessionState serialization
export type { PracticeSessionState };
