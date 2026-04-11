import { useEffect, useMemo, useRef } from 'react';
import { nanoid } from 'nanoid';
import { PracticePlayerController } from '../controllers/practicePlayerController';
import { useLoopPlayback } from './useLoopPlayback';
import { usePracticeSessionStore } from '../store/practiceSessionStore';
import type { PracticeMediaSource } from '../types/practicePlayer';
import { parseYouTubeVideoId } from '../utils/youtube';
import { buildWaveformFromFile } from '../utils/waveform';

export function usePracticePlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controllerRef = useRef<PracticePlayerController | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const store = usePracticeSessionStore();

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
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

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

        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }

        const objectUrl = URL.createObjectURL(file);
        objectUrlRef.current = objectUrl;

        store.resetForNewSource();

        const source: PracticeMediaSource = {
          id: nanoid(),
          kind: isAudio ? 'local-audio' : 'local-video',
          title: file.name.replace(/\.[^.]+$/, ''),
          durationSeconds: 0,
          sourceRef: {
            file,
            objectUrl,
          },
        };

        store.setSource(source);
        store.setError(null);

        if (isVideo) {
          await new Promise<void>((resolve) => {
            window.requestAnimationFrame(() => resolve());
          });
        }

        await controllerRef.current?.load(source);

        if (isAudio) {
          try {
            const waveform = await buildWaveformFromFile(file);
            store.setWaveform(waveform);
          } catch {
            store.setWaveform([]);
          }
        }
      },
      async loadYouTubeUrl(url: string) {
        const videoId = parseYouTubeVideoId(url);

        if (!videoId) {
          store.setError('Invalid YouTube URL. Please use a valid YouTube link.');
          return;
        }

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

        store.setSource(source);
        store.setError(null);
        await controllerRef.current?.load(source);
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
    }),
    [store],
  );

  return {
    state: store,
    actions,
  };
}
