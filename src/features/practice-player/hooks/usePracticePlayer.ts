import { useEffect, useMemo, useRef } from 'react';
import { nanoid } from 'nanoid';
import { PracticePlayerController } from '../controllers/practicePlayerController';
import { useLoopPlayback } from './useLoopPlayback';
import { usePracticeSessionStore } from '../store/practiceSessionStore';
import type { PracticeMarker, PracticeMediaSource } from '../types/practicePlayer';
import {
  persistLocalMediaFile,
  persistPracticeSession,
  removePersistedLocalMediaFile,
  restorePracticeSession,
} from '../utils/sessionPersistence';
import { parseYouTubeVideoId } from '../utils/youtube';
import { buildWaveformFromFile } from '../utils/waveform';

export function usePracticePlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controllerRef = useRef<PracticePlayerController | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const restoredSessionRef = useRef(false);
  const pendingRestoreSeekRef = useRef<number | null>(null);
  const persistTimerRef = useRef<number | null>(null);

  const store = usePracticeSessionStore();

  const releaseObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const clearPersistedLocalMediaForSource = async (source: PracticeMediaSource | null) => {
    if (!source || source.kind === 'youtube') {
      return;
    }

    await removePersistedLocalMediaFile(source.sourceRef.persistedMediaId ?? source.id);
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
      const restoredSession = await restorePracticeSession();

      if (!restoredSession) {
        return;
      }

      if (restoredSession.source.sourceRef.objectUrl) {
        releaseObjectUrl();
        objectUrlRef.current = restoredSession.source.sourceRef.objectUrl;
      }

      store.hydrateSession(restoredSession);
      await loadSourceIntoPlayer(restoredSession.source, {
        fileForWaveform: restoredSession.source.sourceRef.file,
        restoredCurrentTime: restoredSession.currentTime,
      });
    })();
  }, [store]);

  useEffect(() => {
    if (!store.source) {
      return;
    }

    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = window.setTimeout(() => {
      persistPracticeSession(usePracticeSessionStore.getState());
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
          store.setError('Unsupported file type. Please upload an audio or video file.');
          return;
        }

        await clearPersistedLocalMediaForSource(store.source);
        releaseObjectUrl();

        const objectUrl = URL.createObjectURL(file);
        objectUrlRef.current = objectUrl;

        store.resetForNewSource();

        const sourceId = nanoid();
        await persistLocalMediaFile(sourceId, file);

        const source: PracticeMediaSource = {
          id: sourceId,
          kind: isAudio ? 'local-audio' : 'local-video',
          title: file.name.replace(/\.[^.]+$/, ''),
          durationSeconds: 0,
          sourceRef: {
            file,
            objectUrl,
            persistedMediaId: sourceId,
          },
        };

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
        await loadSourceIntoPlayer(source, { fileForWaveform: file });
      },
      async loadYouTubeUrl(url: string) {
        const videoId = parseYouTubeVideoId(url);

        if (!videoId) {
          store.setError('Invalid YouTube URL. Please use a valid YouTube link.');
          return;
        }

        await clearPersistedLocalMediaForSource(store.source);
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
        await loadSourceIntoPlayer(source);
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
          title: `Marker ${store.markers.length + 1}`,
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
    [store],
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
      title: store.source?.title ?? 'Waiting for a source',
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
      showAudioCanvas: sourceKind === 'local-audio',
      showMediaDisplay: sourceKind === 'local-video' || sourceKind === 'youtube',
      isLoopActive: loopRange.start !== null && loopRange.end !== null,
    }),
    [loopRange, sourceKind, store],
  );

  return {
    view,
    actions,
  };
}
