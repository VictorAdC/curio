import { useEffect, useRef } from 'react';
import { PracticePlayerController } from '../controllers/practicePlayerController';
import { usePracticeSessionStore } from '../store/practiceSessionStore';
import type { PracticeMediaSource } from '../types/practicePlayer';
import { buildWaveformFromFile } from '../utils/waveform';

export function usePlaybackController(getLocalizedErrorMessage: (error: unknown) => string) {
  const store = usePracticeSessionStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controllerRef = useRef<PracticePlayerController | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const pendingRestoreSeekRef = useRef<number | null>(null);

  const releaseObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
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

  useEffect(() => {
    return () => {
      releaseObjectUrl();
    };
  }, []);

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

    controllerRef.current?.setPlaybackRate(usePracticeSessionStore.getState().playbackRate);
  };

  return {
    audioRef,
    videoRef,
    controllerRef,
    objectUrlRef,
    releaseObjectUrl,
    loadSourceIntoPlayer,
  };
}
