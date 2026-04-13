import { create } from 'zustand';
import type {
  LoopSelection,
  PracticeMarker,
  PracticeMediaSource,
  TimelineWaveformDatum,
} from '../types/practicePlayer';

interface PracticeSessionActions {
  setSource: (source: PracticeMediaSource | null) => void;
  setPlayback: (payload: { currentTime?: number; duration?: number; isPlaying?: boolean; isReady?: boolean; playbackRate?: number }) => void;
  setError: (error: string | null) => void;
  setWaveform: (waveform: TimelineWaveformDatum[]) => void;
  setSessionNote: (note: string) => void;
  addMarker: (marker: PracticeMarker) => void;
  updateMarker: (markerId: string, updates: Partial<Pick<PracticeMarker, 'title' | 'note'>>) => void;
  removeMarker: (markerId: string) => void;
  assignLoopRole: (markerId: string, role: PracticeMarker['loopRole']) => void;
  clearLoop: () => void;
  hydrateSession: (payload: {
    source: PracticeMediaSource;
    currentTime: number;
    duration: number;
    playbackRate: number;
    markers: PracticeMarker[];
    loopSelection: LoopSelection;
    sessionNote: string;
    waveform: TimelineWaveformDatum[];
  }) => void;
  resetForNewSource: () => void;
}

type PracticeSessionStore = import('../types/practicePlayer').PracticeSessionState & PracticeSessionActions;

const initialLoopSelection: LoopSelection = {
  startMarkerId: null,
  endMarkerId: null,
};

export const usePracticeSessionStore = create<PracticeSessionStore>((set) => ({
  source: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  markers: [],
  loopSelection: initialLoopSelection,
  sessionNote: '',
  waveform: [],
  error: null,
  isReady: false,
  setSource: (source) =>
    set({
      source,
    }),
  setPlayback: (payload) =>
    set((state) => ({
      currentTime: payload.currentTime ?? state.currentTime,
      duration: payload.duration ?? state.duration,
      isPlaying: payload.isPlaying ?? state.isPlaying,
      isReady: payload.isReady ?? state.isReady,
      playbackRate: payload.playbackRate ?? state.playbackRate,
    })),
  setError: (error) => set({ error }),
  setWaveform: (waveform) => set({ waveform }),
  setSessionNote: (sessionNote) => set({ sessionNote }),
  addMarker: (marker) =>
    set((state) => ({
      markers: [...state.markers, marker].sort((left, right) => left.timestampSeconds - right.timestampSeconds),
    })),
  updateMarker: (markerId, updates) =>
    set((state) => ({
      markers: state.markers.map((marker) => (marker.id === markerId ? { ...marker, ...updates } : marker)),
    })),
  removeMarker: (markerId) =>
    set((state) => {
      const removedMarker = state.markers.find((marker) => marker.id === markerId);
      const nextLoopSelection = { ...state.loopSelection };

      if (removedMarker?.loopRole === 'start') {
        nextLoopSelection.startMarkerId = null;
      }

      if (removedMarker?.loopRole === 'end') {
        nextLoopSelection.endMarkerId = null;
      }

      return {
        markers: state.markers.filter((marker) => marker.id !== markerId),
        loopSelection: nextLoopSelection,
      };
    }),
  assignLoopRole: (markerId, role) =>
    set((state) => {
      const markers = state.markers.map((marker) => {
        if (marker.id === markerId) {
          return { ...marker, loopRole: role } as PracticeMarker;
        }

        if (role !== 'none' && marker.loopRole === role) {
          return { ...marker, loopRole: 'none' } as PracticeMarker;
        }

        return marker;
      });

      return {
        markers,
        loopSelection: {
          startMarkerId:
            role === 'start'
              ? markerId
              : role === 'none' && state.loopSelection.startMarkerId === markerId
                ? null
                : state.loopSelection.startMarkerId,
          endMarkerId:
            role === 'end'
              ? markerId
              : role === 'none' && state.loopSelection.endMarkerId === markerId
                ? null
                : state.loopSelection.endMarkerId,
        },
      };
    }),
  clearLoop: () =>
    set((state) => ({
      loopSelection: initialLoopSelection,
      markers: state.markers.map((marker) => ({ ...marker, loopRole: 'none' })),
    })),
  hydrateSession: (payload) =>
    set({
      source: payload.source,
      isPlaying: false,
      currentTime: payload.currentTime,
      duration: payload.duration,
      playbackRate: payload.playbackRate,
      markers: payload.markers,
      loopSelection: payload.loopSelection,
      sessionNote: payload.sessionNote,
      waveform: payload.waveform,
      error: null,
      isReady: false,
    }),
  resetForNewSource: () =>
    set({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playbackRate: 1,
      markers: [],
      loopSelection: initialLoopSelection,
      sessionNote: '',
      waveform: [],
      error: null,
      isReady: false,
    }),
}));
