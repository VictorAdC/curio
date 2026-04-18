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
  PracticePersistenceFeedback,
  PracticeSessionSummary,
  PracticeSystemTag,
  PracticeStorageHealth,
} from '../types/practicePlayer';
import {
  clearAllPersistedPracticeSessions,
  createPracticeSessionSummary,
  deletePersistedPracticeSession,
  exportPersistedPracticeSessions,
  getActivePracticeSessionId,
  getPracticeStorageHealth,
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
import { getPracticeErrorCode } from '../utils/errors';
import { getValidLoopRange } from '../utils/markerTags';
import { parseYouTubeVideoId } from '../utils/youtube';
import { buildWaveformFromFile } from '../utils/waveform';

const PLAYBACK_RATE_PRESETS = [0.5, 0.75, 1, 1.25, 1.5] as const;

export function usePracticePlayer() {
  const { t, localeCode } = useI18n();
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
  const [storageHealth, setStorageHealth] = useState<PracticeStorageHealth | null>(null);
  const [persistenceFeedback, setPersistenceFeedback] = useState<PracticePersistenceFeedback | null>(null);

  const releaseObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const getLocalizedErrorMessage = (error: unknown) => {
    const code = getPracticeErrorCode(error);

    switch (code) {
      case 'LOCAL_MEDIA_URL_MISSING':
      case 'MEDIA_ELEMENT_NOT_READY':
        return t('practice.player.error.mediaLoad');
      case 'YOUTUBE_VIDEO_ID_MISSING':
        return t('practice.player.error.invalidYoutube');
      case 'BACKUP_UNSUPPORTED':
        return t('practice.sessionHistory.error.unsupportedBackup');
      case 'SESSION_MEDIA_RELINK_NOT_REQUIRED':
        return t('practice.player.error.relinkUnavailable');
      default:
        return t('practice.player.error.generic');
    }
  };

  const refreshStorageHealth = async () => {
    const nextHealth = await getPracticeStorageHealth().catch(() => null);
    setStorageHealth(nextHealth);
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

    try {
      await loadSourceIntoPlayer(restoredSession.source, {
        fileForWaveform: restoredSession.source.sourceRef.file,
        restoredCurrentTime: restoredSession.currentTime,
      });
    } catch {
      return restoredSession;
    }

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

    try {
      await controllerRef.current?.load(source);
    } catch (error) {
      store.setError(getLocalizedErrorMessage(error));
      throw error;
    }

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

    controllerRef.current?.setPlaybackRate(store.playbackRate);
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
      await refreshStorageHealth();
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
      void refreshStorageHealth();
    }, 250);

    return () => {
      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current);
      }
    };
  }, [
    store.currentTime,
    store.duration,
    store.playbackRate,
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

  useEffect(() => {
    if (!store.source) {
      return;
    }

    controllerRef.current?.setPlaybackRate(store.playbackRate);
  }, [store.playbackRate, store.source]);

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
        const session = createPracticeSessionSummary(source, localeCode);

        store.hydrateSession({
          source,
          currentTime: 0,
          duration: 0,
          playbackRate: 1,
          markers: [],
          sessionNote: '',
          waveform: [],
        });
        store.setError(null);
        setActiveSession(session);
        setSessionHistory((currentSessions) => [session, ...currentSessions.filter((item) => item.id !== session.id)]);
        await refreshStorageHealth();
        try {
          await loadSourceIntoPlayer(source, { fileForWaveform: file });
        } catch {}
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
          title: t('practice.player.youtubeSourceTitle'),
          durationSeconds: 0,
          sourceRef: {
            youtubeUrl: url,
            youtubeVideoId: videoId,
          },
        };
        const session = createPracticeSessionSummary(source, localeCode);

        store.hydrateSession({
          source,
          currentTime: 0,
          duration: 0,
          playbackRate: 1,
          markers: [],
          sessionNote: '',
          waveform: [],
        });
        store.setError(null);
        setActiveSession(session);
        setSessionHistory((currentSessions) => [session, ...currentSessions.filter((item) => item.id !== session.id)]);
        await refreshStorageHealth();
        try {
          await loadSourceIntoPlayer(source);
        } catch {}
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
        const result = await relinkPersistedPracticeSessionMedia(sessionId, file).catch((error) => {
          store.setError(getLocalizedErrorMessage(error));
          setPersistenceFeedback({
            tone: 'error',
            message: getLocalizedErrorMessage(error),
          });
          return null;
        });

        if (!result) {
          return;
        }

        setSessionHistory(result.sessions);
        setPersistenceFeedback({
          tone: 'success',
          message: t('practice.persistence.relinkSuccess'),
        });
        store.setError(null);
        await refreshStorageHealth();

        if (activeSession?.id === sessionId) {
          releaseObjectUrl();
          await loadPersistedSession(sessionId);
        }
      },
      async deleteSession(sessionId: string) {
        const result = await deletePersistedPracticeSession(sessionId);
        setSessionHistory(result.sessions);
        setPersistenceFeedback({
          tone: 'info',
          message: t('practice.persistence.deleteSuccess'),
        });
        await refreshStorageHealth();

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
        setPersistenceFeedback({
          tone: 'warning',
          message: t('practice.persistence.clearAllSuccess'),
        });
        await refreshStorageHealth();
      },
      async exportSessions(sessionIds?: string[]) {
        try {
          const { objectUrl, filename } = await exportPersistedPracticeSessions(
            true,
            sessionIds,
          );
          const anchor = document.createElement('a');
          anchor.href = objectUrl;
          anchor.download = filename;
          anchor.click();
          window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
          setPersistenceFeedback({
            tone: 'success',
            message: t('practice.persistence.exportFullSuccess'),
          });
        } catch (error) {
          const message = getLocalizedErrorMessage(error);
          setPersistenceFeedback({
            tone: 'error',
            message,
          });
        }
      },
      async exportLightSessions(sessionIds?: string[]) {
        try {
          const { objectUrl, filename } = await exportPersistedPracticeSessions(
            false,
            sessionIds,
          );
          const anchor = document.createElement('a');
          anchor.href = objectUrl;
          anchor.download = filename;
          anchor.click();
          window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
          setPersistenceFeedback({
            tone: 'success',
            message: t('practice.persistence.exportLightSuccess'),
          });
        } catch (error) {
          const message = getLocalizedErrorMessage(error);
          setPersistenceFeedback({
            tone: 'error',
            message,
          });
        }
      },
      async prepareImportSessions(file: File) {
        try {
          return await inspectPracticeSessionsBackup(file);
        } catch (error) {
          const message = getLocalizedErrorMessage(error);
          store.setError(message);
          setPersistenceFeedback({
            tone: 'error',
            message,
          });
          throw error;
        }
      },
      async importSessions(
        file: File,
        options?: { sessionIds?: string[]; mode: 'replace' | 'append'; collisionStrategy?: 'replace' | 'duplicate' },
      ) {
        const result = await (options
          ? importSelectedPracticeSessions(file, {
              ...options,
              duplicateSuffix: t('practice.sessionHistory.duplicateSuffix'),
            })
          : importPersistedPracticeSessions(file)).catch((error) => {
            const message = getLocalizedErrorMessage(error);
            store.setError(message);
            setPersistenceFeedback({
              tone: 'error',
              message,
            });
            return null;
          });

        if (!result) {
          return;
        }
        setSessionHistory(result.sessions);
        await refreshStorageHealth();
        const relinkCount = result.sessions.filter((session) => session.requiresMediaRelink).length;
        setPersistenceFeedback({
          tone: relinkCount > 0 ? 'warning' : 'success',
          message:
            relinkCount > 0
              ? t('practice.persistence.importSuccessWithRelink', { count: relinkCount })
              : t('practice.persistence.importSuccess'),
        });
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
          const { markers, currentTime } = usePracticeSessionStore.getState();
          const loopRange = getValidLoopRange(markers);
          if (loopRange.end !== null && currentTime >= loopRange.end) {
            controllerRef.current?.seek(loopRange.start ?? 0);
          } else if (loopRange.start !== null && currentTime < loopRange.start) {
            controllerRef.current?.seek(loopRange.start);
          }
          void controllerRef.current?.play();
        }
      },
      seek(seconds: number) {
        controllerRef.current?.seek(seconds);
      },
      jumpBy(deltaSeconds: number) {
        controllerRef.current?.jumpBy(deltaSeconds);
      },
      setPlaybackRate(rate: number) {
        controllerRef.current?.setPlaybackRate(rate);
        store.setPlayback({ playbackRate: rate });
      },
      addMarker() {
        const marker: PracticeMarker = {
          id: nanoid(),
          timestampSeconds: store.currentTime,
          title: `${t('practice.markerSpotlight.label')} ${store.markers.length + 1}`,
          note: '',
          systemTags: [],
          userTags: [],
        };

        store.addMarker(marker);
      },
      clearLoop() {
        store.clearLoop();
      },
      toggleSystemTag(markerId: string, tag: PracticeSystemTag) {
        store.toggleSystemTag(markerId, tag);
      },
      convertSystemTagToUserTag(markerId: string, tag: PracticeSystemTag) {
        store.convertSystemTagToUserTag(markerId, tag);
      },
      removeMarker(markerId: string) {
        store.removeMarker(markerId);
      },
      updateMarker(markerId: string, updates: Partial<Pick<PracticeMarker, 'title' | 'note' | 'userTags'>>) {
        store.updateMarker(markerId, updates);
      },
      setSessionNote(value: string) {
        store.setSessionNote(value);
      },
      dismissPersistenceFeedback() {
        setPersistenceFeedback(null);
      },
    }),
    [activeSession, localeCode, store, t],
  );

  const loopRange = useMemo(() => getValidLoopRange(store.markers), [store.markers]);

  const sourceKind = store.source?.kind ?? null;

  const view = useMemo(
    () => ({
      source: store.source,
      sourceKind,
      title: store.source?.title ?? t('practice.player.waitingForSource'),
      isPlaying: store.isPlaying,
      currentTime: store.currentTime,
      duration: store.duration,
      playbackRate: store.playbackRate,
      playbackRatePresets: PLAYBACK_RATE_PRESETS,
      markers: store.markers,
      markerCount: store.markers.length,
      specialMarkerCount: store.markers.filter((marker) => marker.systemTags.length > 0).length,
      loopRange,
      sessionNote: store.sessionNote,
      error: store.error,
      isReady: store.isReady,
      waveform: sourceKind === 'local-audio' ? store.waveform : [],
      sessionHistory,
      storageHealth,
      activeSessionId: activeSession?.id ?? null,
      persistenceFeedback,
      showAudioCanvas: sourceKind === 'local-audio',
      showMediaDisplay: sourceKind === 'local-video' || sourceKind === 'youtube',
      isLoopActive: loopRange.start !== null || loopRange.end !== null,
    }),
    [activeSession, loopRange, persistenceFeedback, sessionHistory, sourceKind, storageHealth, store, t],
  );

  return {
    view,
    actions,
  };
}
