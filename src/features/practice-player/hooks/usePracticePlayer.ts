import { useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
import { useI18n } from '../../../i18n/I18nProvider';
import { useLoopPlayback } from './useLoopPlayback';
import { useLocalizedPracticeErrors } from './useLocalizedPracticeErrors';
import { usePlaybackController } from './usePlaybackController';
import { useSessionManager } from './useSessionManager';
import { useSessionPersistence } from './useSessionPersistence';
import { usePracticeSessionStore } from '../store/practiceSessionStore';
import type { PracticeMarker, PracticeSessionSummary, PracticeSystemTag } from '../types/practicePlayer';
import { getValidLoopRange } from '../utils/markerTags';

const PLAYBACK_RATE_PRESETS = [0.5, 0.75, 1, 1.25, 1.5] as const;

export function usePracticePlayer() {
  const { t } = useI18n();
  const store = usePracticeSessionStore();
  const getLocalizedErrorMessage = useLocalizedPracticeErrors();

  const [activeSession, setActiveSession] = useState<PracticeSessionSummary | null>(null);

  const { audioRef, videoRef, controllerRef, objectUrlRef, releaseObjectUrl, loadSourceIntoPlayer } =
    usePlaybackController(getLocalizedErrorMessage);

  const { storageHealth, refreshStorageHealth } = useSessionPersistence(activeSession);

  const { sessionHistory, persistenceFeedback, actions: sessionActions } = useSessionManager({
    controllerRef,
    releaseObjectUrl,
    objectUrlRef,
    loadSourceIntoPlayer,
    getLocalizedErrorMessage,
    refreshStorageHealth,
    activeSession,
    setActiveSession,
  });

  useLoopPlayback(controllerRef.current, store.markers, store.duration);

  const actions = useMemo(
    () => ({
      setAudioElement: (element: HTMLAudioElement | null) => {
        audioRef.current = element;
      },
      setVideoElement: (element: HTMLVideoElement | null) => {
        videoRef.current = element;
      },
      ...sessionActions,
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
      updateMarker(
        markerId: string,
        updates: Partial<Pick<PracticeMarker, 'title' | 'note' | 'userTags'>>,
      ) {
        store.updateMarker(markerId, updates);
      },
      setSessionNote(value: string) {
        store.setSessionNote(value);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeSession, sessionActions, store, t],
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

  return { view, actions };
}
