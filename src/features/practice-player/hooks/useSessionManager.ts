import { useEffect, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { nanoid } from 'nanoid';
import { useI18n } from '../../../i18n/I18nProvider';
import type { PracticePlayerController } from '../controllers/practicePlayerController';
import { usePracticeSessionStore } from '../store/practiceSessionStore';
import type {
  MediaRelinkWarning,
  PracticeMediaSource,
  PracticePersistenceFeedback,
  PracticeSessionSummary,
} from '../types/practicePlayer';
import {
  clearAllPersistedPracticeSessions,
  createPracticeSessionSummary,
  deletePersistedPracticeSession,
  exportPersistedPracticeSessions,
  getActivePracticeSessionId,
  getPracticeSessionMediaRelinkWarning,
  importPersistedPracticeSessions,
  importSelectedPracticeSessions,
  inspectPracticeSessionsBackup,
  listPersistedPracticeSessions,
  persistLocalMediaFile,
  relinkPersistedPracticeSessionMedia,
  renamePersistedPracticeSession,
  restorePracticeSession,
} from '../utils/sessionPersistence';
import { parseYouTubeVideoId } from '../utils/youtube';

interface UseSessionManagerOptions {
  controllerRef: React.RefObject<PracticePlayerController | null>;
  releaseObjectUrl: () => void;
  objectUrlRef: MutableRefObject<string | null>;
  loadSourceIntoPlayer: (
    source: PracticeMediaSource,
    options?: { fileForWaveform?: File; restoredCurrentTime?: number },
  ) => Promise<void>;
  getLocalizedErrorMessage: (error: unknown) => string;
  refreshStorageHealth: () => Promise<void>;
  activeSession: PracticeSessionSummary | null;
  setActiveSession: Dispatch<SetStateAction<PracticeSessionSummary | null>>;
}

export function useSessionManager({
  controllerRef,
  releaseObjectUrl,
  objectUrlRef,
  loadSourceIntoPlayer,
  getLocalizedErrorMessage,
  refreshStorageHealth,
  activeSession,
  setActiveSession,
}: UseSessionManagerOptions) {
  const store = usePracticeSessionStore();
  const { t, localeCode } = useI18n();
  const restoredSessionRef = useRef(false);

  const [sessionHistory, setSessionHistory] = useState<PracticeSessionSummary[]>(() =>
    listPersistedPracticeSessions(),
  );
  const [persistenceFeedback, setPersistenceFeedback] =
    useState<PracticePersistenceFeedback | null>(null);

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

  const actions = {
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
      setSessionHistory((currentSessions) => [
        session,
        ...currentSessions.filter((item) => item.id !== session.id),
      ]);
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
      setSessionHistory((currentSessions) => [
        session,
        ...currentSessions.filter((item) => item.id !== session.id),
      ]);
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
        currentSessions.map((session) =>
          session.id === sessionId ? { ...session, name } : session,
        ),
      );
      setActiveSession((currentSession) =>
        currentSession?.id === sessionId ? { ...currentSession, name } : currentSession,
      );
    },

    inspectRelinkSessionMedia(sessionId: string, file: File): MediaRelinkWarning | null {
      return getPracticeSessionMediaRelinkWarning(sessionId, file);
    },

    async relinkSessionMedia(sessionId: string, file: File) {
      const result = await relinkPersistedPracticeSessionMedia(sessionId, file).catch((error) => {
        store.setError(getLocalizedErrorMessage(error));
        setPersistenceFeedback({ tone: 'error', message: getLocalizedErrorMessage(error) });
        return null;
      });

      if (!result) {
        return;
      }

      setSessionHistory(result.sessions);
      setPersistenceFeedback({ tone: 'success', message: t('practice.persistence.relinkSuccess') });
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
      setPersistenceFeedback({ tone: 'info', message: t('practice.persistence.deleteSuccess') });
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
        const { objectUrl, filename } = await exportPersistedPracticeSessions(true, sessionIds);
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
        setPersistenceFeedback({ tone: 'error', message: getLocalizedErrorMessage(error) });
      }
    },

    async exportLightSessions(sessionIds?: string[]) {
      try {
        const { objectUrl, filename } = await exportPersistedPracticeSessions(false, sessionIds);
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
        setPersistenceFeedback({ tone: 'error', message: getLocalizedErrorMessage(error) });
      }
    },

    async prepareImportSessions(file: File) {
      try {
        return await inspectPracticeSessionsBackup(file);
      } catch (error) {
        const message = getLocalizedErrorMessage(error);
        store.setError(message);
        setPersistenceFeedback({ tone: 'error', message });
        throw error;
      }
    },

    async importSessions(
      file: File,
      options?: { sessionIds?: string[]; mode: 'replace' | 'append'; collisionStrategy?: 'replace' | 'duplicate' },
    ) {
      const result = await (
        options
          ? importSelectedPracticeSessions(file, {
              ...options,
              duplicateSuffix: t('practice.sessionHistory.duplicateSuffix'),
            })
          : importPersistedPracticeSessions(file)
      ).catch((error) => {
        const message = getLocalizedErrorMessage(error);
        store.setError(message);
        setPersistenceFeedback({ tone: 'error', message });
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

    dismissPersistenceFeedback() {
      setPersistenceFeedback(null);
    },
  };

  return { sessionHistory, persistenceFeedback, actions };
}
