import { useEffect, useRef, useState } from 'react';
import { usePracticeSessionStore } from '../store/practiceSessionStore';
import type { PracticeSessionSummary, PracticeStorageHealth } from '../types/practicePlayer';
import { getPracticeStorageHealth, persistPracticeSession } from '../utils/sessionPersistence';

export function useSessionPersistence(activeSession: PracticeSessionSummary | null) {
  const store = usePracticeSessionStore();
  const persistTimerRef = useRef<number | null>(null);
  const [storageHealth, setStorageHealth] = useState<PracticeStorageHealth | null>(null);

  const refreshStorageHealth = async () => {
    const nextHealth = await getPracticeStorageHealth().catch(() => null);
    setStorageHealth(nextHealth);
  };

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

  return { storageHealth, refreshStorageHealth };
}
