import { create } from 'zustand';
import type {
  PracticeMarker,
  PracticeMediaSource,
  PracticeSystemTag,
  TimelineWaveformDatum,
} from '../types/practicePlayer';
import { convertSystemTagToUserTag, toggleSystemTag } from '../utils/markerTags';

interface PracticeSessionActions {
  setSource: (source: PracticeMediaSource | null) => void;
  setPlayback: (payload: { currentTime?: number; duration?: number; isPlaying?: boolean; isReady?: boolean; playbackRate?: number }) => void;
  setError: (error: string | null) => void;
  setWaveform: (waveform: TimelineWaveformDatum[]) => void;
  setSessionNote: (note: string) => void;
  addMarker: (marker: PracticeMarker) => void;
  updateMarker: (markerId: string, updates: Partial<Pick<PracticeMarker, 'title' | 'note' | 'userTags'>>) => void;
  removeMarker: (markerId: string) => void;
  toggleSystemTag: (markerId: string, tag: PracticeSystemTag) => void;
  convertSystemTagToUserTag: (markerId: string, tag: PracticeSystemTag) => void;
  clearLoop: () => void;
  hydrateSession: (payload: {
    source: PracticeMediaSource;
    currentTime: number;
    duration: number;
    playbackRate: number;
    markers: PracticeMarker[];
    sessionNote: string;
    waveform: TimelineWaveformDatum[];
  }) => void;
  resetForNewSource: () => void;
}

type PracticeSessionStore = import('../types/practicePlayer').PracticeSessionState & PracticeSessionActions;

export const usePracticeSessionStore = create<PracticeSessionStore>((set) => ({
  source: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  markers: [],
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
    set((state) => ({
      markers: state.markers.filter((marker) => marker.id !== markerId),
    })),
  toggleSystemTag: (markerId, tag) =>
    set((state) => {
      return {
        markers: toggleSystemTag(state.markers, markerId, tag),
      };
    }),
  convertSystemTagToUserTag: (markerId, tag) =>
    set((state) => ({
      markers: convertSystemTagToUserTag(state.markers, markerId, tag),
    })),
  clearLoop: () =>
    set((state) => ({
      markers: state.markers.map((marker) => ({
        ...marker,
        systemTags: marker.systemTags.filter((tag) => tag !== 'loop-start' && tag !== 'loop-end'),
      })),
    })),
  hydrateSession: (payload) =>
    set({
      source: payload.source,
      isPlaying: false,
      currentTime: payload.currentTime,
      duration: payload.duration,
      playbackRate: payload.playbackRate,
      markers: payload.markers,
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
      sessionNote: '',
      waveform: [],
      error: null,
      isReady: false,
    }),
}));
