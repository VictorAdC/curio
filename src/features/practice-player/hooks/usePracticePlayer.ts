import { useEffect, useMemo, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { useI18n } from '../../../i18n/I18nProvider';
import { PracticePlayerController } from '../controllers/practicePlayerController';
import { useLoopPlayback } from './useLoopPlayback';
import { usePracticeSessionStore } from '../store/practiceSessionStore';
import type {
  MediaRelinkWarning,
  PracticeMarker,
  PracticeMediaSource,
  PracticeSessionSummary,
} from '../types/practicePlayer';
import {
  clearAllPersistedPracticeSessions,
  createPracticeSessionSummary,
  deletePersistedPracticeSession,
  exportPersistedPracticeSessions,
  getActivePracticeSessionId,
  getPracticeSessionMediaRelinkWarning,
  inspectPracticeSessionsBackup,
  importSelectedPracticeSessions,
  importPersistedPracticeSessions,
  listPersistedPracticeSessions,
  persistPracticeSession,
  relinkPersistedPracticeSessionMedia,
  renamePersistedPracticeSession,
  persistLocalMediaFile,
  restorePracticeSession,
} from '../utils/sessionPersistence';
import { parseYouTubeVideoId } from '../utils/youtube';
import { buildWaveformFromFile } from '../utils/waveform';

export function usePracticePlayer() {
  const { t } = useI18n();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controllerRef = useRef<PracticePlayerController | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const restoredSessionRef = useRef(false);
  const pendingRestoreSeekRef = useRef<number | null>(null);
  const persistTimerRef = useRef<number | null>(null);

  const store = usePracticeSessionStore();
  const [sessionHistory, setSessionHistory] = useState<PracticeSessionSummary[]>(() => listPersistedPracticeSessions());
  const [activeSession, setActiveSession] = useState<PracticeSessionSummary | null>(null);

  const releaseObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const loadPersistedSession = async (sessionId?: string) => {
    const restoredSession = await restorePracticeSession(sessionId);

    if (!restoredSession) {
      return null;
    }

    if (restoredSession.source.sourceRef.objectUrl) {
      releaseObjectUrl();
      objectUrlRef.current = restoredSession.source.sourceRef.objectUrl;
    }

    store.hydrateSession(restoredSession);
    setActiveSession(restoredSession.session);
    setSessionHistory(listPersistedPracticeSessions());

    if (restoredSession.source.sourceRef.mediaMissing) {
      store.setError(
        t('practice.player.error.missingMedia', { title: restoredSession.source.title }),
      );
      return restoredSession;
    }

    await loadSourceIntoPlayer(restoredSession.source, {
      fileForWaveform: restoredSession.source.sourceRef.file,
      restoredCurrentTime: restoredSession.currentTime,
    });

    return restoredSession;
  };

  const loadSourceIntoPlayer = async (
    source: PracticeMediaSource,
    options?: {
      fileForWaveform?: File;
      restoredCurrentTime?: number;
    },
  ) => {
    if (source.kind === 'local-video') {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });
    }

    await controllerRef.current?.load(source);

    if (options?.fileForWaveform && source.kind === 'local-audio') {
      try {
        const waveform = await buildWaveformFromFile(options.fileForWaveform);
        store.setWaveform(waveform);
      } catch {
        store.setWaveform([]);
      }
    }

    if (options?.restoredCurrentTime !== undefined) {
      pendingRestoreSeekRef.current = options.restoredCurrentTime;
    }
  };

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    const controller = new PracticePlayerController({
      getMediaElement: (kind) => (kind === 'local-video' ? videoRef.current : audioRef.current),
      youtubeElementId: 'youtube-player-root',
      onTimeUpdate: (currentTime) => usePracticeSessionStore.getState().setPlayback({ currentTime }),
      onDurationChange: (duration) => usePracticeSessionStore.getState().setPlayback({ duration }),
      onPlaybackChange: (isPlaying) => usePracticeSessionStore.getState().setPlayback({ isPlaying }),
      onReady: () => usePracticeSessionStore.getState().setPlayback({ isReady: true }),
    });

    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  useLoopPlayback(
    controllerRef.current,
    store.markers,
    store.loopSelection.startMarkerId,
    store.loopSelection.endMarkerId,
  );

  useEffect(() => {
    return () => {
      releaseObjectUrl();
    };
  }, []);

  useEffect(() => {
    if (!controllerRef.current || restoredSessionRef.current) {
      return;
    }

    restoredSessionRef.current = true;

    void (async () => {
      const activeSessionId = getActivePracticeSessionId();
      await loadPersistedSession(activeSessionId ?? undefined);
    })();
  }, []);

  useEffect(() => {
    if (!store.source || !activeSession) {
      return;
    }

    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = window.setTimeout(() => {
      persistPracticeSession(activeSession, usePracticeSessionStore.getState());
    }, 250);

    return () => {
      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current);
      }
    };
  }, [
    store.currentTime,
    store.duration,
    store.loopSelection,
    store.markers,
    store.sessionNote,
    store.source,
    store.waveform,
    activeSession,
  ]);

  useEffect(() => {
    if (!store.isReady || pendingRestoreSeekRef.current === null) {
      return;
    }

    controllerRef.current?.seek(pendingRestoreSeekRef.current);
    pendingRestoreSeekRef.current = null;
  }, [store.isReady]);

  const actions = useMemo(
    () => ({
      setAudioElement: (element: HTMLAudioElement | null) => {
        audioRef.current = element;
      },
      setVideoElement: (element: HTMLVideoElement | null) => {
        videoRef.current = element;
      },
      async loadLocalFile(file: File) {
        const isAudio = file.type.startsWith('audio/');
        const isVideo = file.type.startsWith('video/');

        if (!isAudio && !isVideo) {
          store.setError(t('practice.player.error.unsupportedFile'));
          return;
        }

        releaseObjectUrl();

        store.resetForNewSource();

        const sourceId = nanoid();
        await persistLocalMediaFile(sourceId, file);
        const objectUrl = URL.createObjectURL(file);
        objectUrlRef.current = objectUrl;

        const source: PracticeMediaSource = {
          id: sourceId,
          kind: isAudio ? 'local-audio' : 'local-video',
          title: file.name.replace(/\.[^.]+$/, ''),
          durationSeconds: 0,
          sourceRef: {
            file,
            objectUrl,
            persistedMediaId: sourceId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileLastModified: file.lastModified,
          },
        };
        const session = createPracticeSessionSummary(source);

        store.hydrateSession({
          source,
          currentTime: 0,
          duration: 0,
          markers: [],
          loopSelection: {
            startMarkerId: null,
            endMarkerId: null,
          },
          sessionNote: '',
          waveform: [],
        });
        store.setError(null);
        setActiveSession(session);
        setSessionHistory((currentSessions) => [session, ...currentSessions.filter((item) => item.id !== session.id)]);
        await loadSourceIntoPlayer(source, { fileForWaveform: file });
      },
      async loadYouTubeUrl(url: string) {
        const videoId = parseYouTubeVideoId(url);

        if (!videoId) {
          store.setError(t('practice.player.error.invalidYoutube'));
          return;
        }

        releaseObjectUrl();
        store.resetForNewSource();

        const source: PracticeMediaSource = {
          id: nanoid(),
          kind: 'youtube',
          title: 'YouTube Practice Source',
          durationSeconds: 0,
          sourceRef: {
            youtubeUrl: url,
            youtubeVideoId: videoId,
          },
        };
        const session = createPracticeSessionSummary(source);

        store.hydrateSession({
          source,
          currentTime: 0,
          duration: 0,
          markers: [],
          loopSelection: {
            startMarkerId: null,
            endMarkerId: null,
          },
          sessionNote: '',
          waveform: [],
        });
        store.setError(null);
        setActiveSession(session);
        setSessionHistory((currentSessions) => [session, ...currentSessions.filter((item) => item.id !== session.id)]);
        await loadSourceIntoPlayer(source);
      },
      async loadSession(sessionId: string) {
        await loadPersistedSession(sessionId);
      },
      renameSession(sessionId: string, name: string) {
        renamePersistedPracticeSession(sessionId, name);
        setSessionHistory((currentSessions) =>
          currentSessions.map((session) => (session.id === sessionId ? { ...session, name } : session)),
        );
        setActiveSession((currentSession) => (currentSession?.id === sessionId ? { ...currentSession, name } : currentSession));
      },
      inspectRelinkSessionMedia(sessionId: string, file: File): MediaRelinkWarning | null {
        return getPracticeSessionMediaRelinkWarning(sessionId, file);
      },
      async relinkSessionMedia(sessionId: string, file: File) {
        const result = await relinkPersistedPracticeSessionMedia(sessionId, file);
        setSessionHistory(result.sessions);

        if (activeSession?.id === sessionId) {
          releaseObjectUrl();
          await loadPersistedSession(sessionId);
        }
      },
      async deleteSession(sessionId: string) {
        const result = await deletePersistedPracticeSession(sessionId);
        setSessionHistory(result.sessions);

        if (activeSession?.id !== sessionId) {
          return;
        }

        releaseObjectUrl();

        if (result.nextActiveSessionId) {
          await loadPersistedSession(result.nextActiveSessionId);
          return;
        }

        controllerRef.current?.destroy();
        store.resetForNewSource();
        store.setSource(null);
        setActiveSession(null);
      },
      async clearAllSessions() {
        await clearAllPersistedPracticeSessions();
        releaseObjectUrl();
        controllerRef.current?.destroy();
        store.resetForNewSource();
        store.setSource(null);
        setActiveSession(null);
        setSessionHistory([]);
      },
      async exportSessions(sessionIds?: string[]) {
        const { objectUrl, filename } = await exportPersistedPracticeSessions(
          true,
          sessionIds,
        );
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = filename;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
      },
      async exportLightSessions(sessionIds?: string[]) {
        const { objectUrl, filename } = await exportPersistedPracticeSessions(
          false,
          sessionIds,
        );
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = filename;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
      },
      async prepareImportSessions(file: File) {
        return inspectPracticeSessionsBackup(file);
      },
      async importSessions(
        file: File,
        options?: { sessionIds?: string[]; mode: 'replace' | 'append'; collisionStrategy?: 'replace' | 'duplicate' },
      ) {
        const result = options
          ? await importSelectedPracticeSessions(file, options)
          : await importPersistedPracticeSessions(file);
        setSessionHistory(result.sessions);
        releaseObjectUrl();

        if (result.activeSessionId) {
          await loadPersistedSession(result.activeSessionId);
          return;
        }

        controllerRef.current?.destroy();
        store.resetForNewSource();
        store.setSource(null);
        setActiveSession(null);
      },
      togglePlayback() {
        if (store.isPlaying) {
          controllerRef.current?.pause();
        } else {
          void controllerRef.current?.play();
        }
      },
      seek(seconds: number) {
        controllerRef.current?.seek(seconds);
      },
      jumpBy(deltaSeconds: number) {
        controllerRef.current?.jumpBy(deltaSeconds);
      },
      addMarker() {
        store.addMarker({
          id: nanoid(),
          timestampSeconds: store.currentTime,
          title: `${t('practice.markerSpotlight.label')} ${store.markers.length + 1}`,
          note: '',
          loopRole: 'none',
        });
      },
      clearLoop() {
        store.clearLoop();
      },
      assignLoopRole(markerId: string, role: PracticeMarker['loopRole']) {
        store.assignLoopRole(markerId, role);
      },
      removeMarker(markerId: string) {
        store.removeMarker(markerId);
      },
      updateMarker(markerId: string, updates: Partial<Pick<PracticeMarker, 'title' | 'note'>>) {
        store.updateMarker(markerId, updates);
      },
      setSessionNote(value: string) {
        store.setSessionNote(value);
      },
    }),
    [activeSession, store, t],
  );

  const loopRange = useMemo(() => {
    const start = store.markers.find((marker) => marker.id === store.loopSelection.startMarkerId);
    const end = store.markers.find((marker) => marker.id === store.loopSelection.endMarkerId);

    if (!start || !end || start.timestampSeconds >= end.timestampSeconds) {
      return {
        start: null,
        end: null,
      };
    }

    return {
      start: start.timestampSeconds,
      end: end.timestampSeconds,
    };
  }, [store.loopSelection.endMarkerId, store.loopSelection.startMarkerId, store.markers]);

  const sourceKind = store.source?.kind ?? null;

  const view = useMemo(
    () => ({
      source: store.source,
      sourceKind,
      title: store.source?.title ?? t('practice.player.waitingForSource'),
      isPlaying: store.isPlaying,
      currentTime: store.currentTime,
      duration: store.duration,
      markers: store.markers,
      markerCount: store.markers.length,
      loopRange,
      sessionNote: store.sessionNote,
      error: store.error,
      isReady: store.isReady,
      waveform: sourceKind === 'local-audio' ? store.waveform : [],
      sessionHistory,
      activeSessionId: activeSession?.id ?? null,
      showAudioCanvas: sourceKind === 'local-audio',
      showMediaDisplay: sourceKind === 'local-video' || sourceKind === 'youtube',
      isLoopActive: loopRange.start !== null && loopRange.end !== null,
    }),
    [activeSession, loopRange, sessionHistory, sourceKind, store, t],
  );

  return {
    view,
    actions,
  };
}
