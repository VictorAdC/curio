import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PracticeMediaSource, PracticeSessionState } from '../types/practicePlayer';
import {
  clearAllPersistedPracticeSessions,
  createPracticeSessionsBackup,
  createPracticeSessionSummary,
  getActivePracticeSessionId,
  importPersistedPracticeSessions,
  persistLocalMediaFile,
  persistPracticeSession,
  relinkPersistedPracticeSessionMedia,
  restorePracticeSession,
} from './sessionPersistence';

function createLocalAudioSource(file: File): PracticeMediaSource {
  return {
    id: 'session-audio-1',
    kind: 'local-audio',
    title: 'Etude in C',
    durationSeconds: 32,
    sourceRef: {
      file,
      persistedMediaId: 'session-audio-1',
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileLastModified: file.lastModified,
    },
  };
}

function createSessionState(source: PracticeMediaSource): PracticeSessionState {
  return {
    source,
    isPlaying: false,
    currentTime: 8.2,
    duration: 32,
    playbackRate: 1,
    markers: [
      {
        id: 'marker-1',
        timestampSeconds: 8.2,
        title: 'Opening phrase',
        note: 'Watch intonation on the shift.',
        loopRole: 'none',
      },
    ],
    loopSelection: {
      startMarkerId: null,
      endMarkerId: null,
    },
    sessionNote: 'Keep the bow light.',
    waveform: [{ amplitude: 0.6, timestampSeconds: 0 }],
    error: null,
    isReady: false,
  };
}

function createBackupFile(backupJson: unknown) {
  return {
    text: async () => JSON.stringify(backupJson),
  } as File;
}

describe('sessionPersistence critical session flows', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await clearAllPersistedPracticeSessions();
  });

  afterEach(async () => {
    await clearAllPersistedPracticeSessions();
  });

  it('restores the last active local-media session after reload state is read back', async () => {
    const file = new File(['audio-bytes'], 'etude.wav', {
      type: 'audio/wav',
      lastModified: 1712860000000,
    });
    const source = createLocalAudioSource(file);
    const session = createPracticeSessionSummary(source, 'en-US');
    const state = createSessionState(source);

    await persistLocalMediaFile(source.id, file);
    persistPracticeSession(session, state);

    const restored = await restorePracticeSession(session.id);

    expect(getActivePracticeSessionId()).toBe(session.id);
    expect(restored).not.toBeNull();
    expect(restored?.currentTime).toBe(8.2);
    expect(restored?.sessionNote).toBe('Keep the bow light.');
    expect(restored?.markers).toHaveLength(1);
    expect(restored?.source.kind).toBe('local-audio');
    expect(restored?.source.sourceRef.file?.name).toBe('etude.wav');
    expect(restored?.source.sourceRef.objectUrl).toMatch(/^blob:mock-/);
  });

  it('round-trips a full backup and restores embedded local media', async () => {
    const file = new File(['audio-bytes'], 'etude.wav', {
      type: 'audio/wav',
      lastModified: 1712860000000,
    });
    const source = createLocalAudioSource(file);
    const session = createPracticeSessionSummary(source, 'en-US');
    const state = createSessionState(source);

    await persistLocalMediaFile(source.id, file);
    persistPracticeSession(session, state);

    const backupJson = await createPracticeSessionsBackup(true, [session.id]);

    expect(backupJson.sessions).toHaveLength(1);
    expect(backupJson.mediaAssets).toHaveLength(1);

    await clearAllPersistedPracticeSessions();

    const imported = await importPersistedPracticeSessions(createBackupFile(backupJson));

    expect(imported.sessions).toHaveLength(1);
    expect(imported.sessions[0]?.requiresMediaRelink).not.toBe(true);

    const restored = await restorePracticeSession(session.id);
    expect(restored?.source.sourceRef.mediaMissing).toBeUndefined();
    expect(restored?.source.sourceRef.file?.name).toBe('etude.wav');
  });

  it('imports a light backup as missing media and becomes playable again after relink', async () => {
    const file = new File(['audio-bytes'], 'etude.wav', {
      type: 'audio/wav',
      lastModified: 1712860000000,
    });
    const source = createLocalAudioSource(file);
    const session = createPracticeSessionSummary(source, 'en-US');
    const state = createSessionState(source);

    await persistLocalMediaFile(source.id, file);
    persistPracticeSession(session, state);

    const backupJson = await createPracticeSessionsBackup(false, [session.id]);

    expect(backupJson.mediaAssets).toHaveLength(0);

    await clearAllPersistedPracticeSessions();

    const imported = await importPersistedPracticeSessions(createBackupFile(backupJson));

    expect(imported.sessions[0]?.requiresMediaRelink).toBe(true);

    const missingSession = await restorePracticeSession(session.id);
    expect(missingSession?.source.sourceRef.mediaMissing).toBe(true);
    expect(missingSession?.source.sourceRef.file).toBeUndefined();

    await relinkPersistedPracticeSessionMedia(session.id, file);

    const relinkedSession = await restorePracticeSession(session.id);
    expect(relinkedSession?.session.requiresMediaRelink).toBe(false);
    expect(relinkedSession?.source.sourceRef.mediaMissing).toBeUndefined();
    expect(relinkedSession?.source.sourceRef.file?.name).toBe('etude.wav');
  });
});
