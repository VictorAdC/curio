import type { PracticeMarker, PracticeMediaKind } from '../../../features/practice-player/types/practicePlayer';
import { MarkerSpotlight } from './MarkerSpotlight';
import { PracticePlaybackFooter } from './PracticePlaybackFooter';
import styles from './VideoPracticeCanvas.module.css';

interface VideoPracticeCanvasProps {
  sourceKind: PracticeMediaKind | null;
  currentTime: number;
  duration: number;
  markers: PracticeMarker[];
  loopStart: number | null;
  loopEnd: number | null;
  isPlaying: boolean;
  playbackRate: number;
  playbackRatePresets: readonly number[];
  hoveredMarker: PracticeMarker | null;
  onAddMarker: () => void;
  onClearLoop: () => void;
  onLoopStartClick?: () => void;
  onLoopEndClick?: () => void;
  onTogglePlayback: () => void;
  onJumpBy: (deltaSeconds: number) => void;
  onSetPlaybackRate: (rate: number) => void;
  onSeek: (seconds: number) => void;
  onMarkerHover: (marker: PracticeMarker) => void;
  onMarkerLeave: () => void;
  onMarkerClick?: (marker: PracticeMarker) => void;
  onSwitchToRecord?: () => void;
  setVideoElement: (element: HTMLVideoElement | null) => void;
}

export function VideoPracticeCanvas({
  sourceKind,
  currentTime,
  duration,
  markers,
  loopStart,
  loopEnd,
  isPlaying,
  playbackRate,
  playbackRatePresets,
  hoveredMarker,
  onAddMarker,
  onClearLoop,
  onTogglePlayback,
  onJumpBy,
  onSetPlaybackRate,
  onSeek,
  onMarkerHover,
  onMarkerLeave,
  onMarkerClick,
  onSwitchToRecord,
  setVideoElement,
}: VideoPracticeCanvasProps) {
  return (
    <div className={styles.root}>
      <div className={styles.playerArea}>
        <video
          ref={setVideoElement}
          className={sourceKind === 'local-video' ? styles.video : styles.hiddenMedia}
          controls={false}
          onClick={sourceKind === 'local-video' ? onTogglePlayback : undefined}
        />
        <div className={sourceKind === 'youtube' ? styles.youtubeFrame : styles.hiddenMedia} id="youtube-player-root" />

        <button className={styles.recPill} type="button" onClick={onSwitchToRecord}>
          <span className={styles.recDot} />
          REC
          <span className={styles.recDivider} />
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </button>

        <MarkerSpotlight marker={hoveredMarker} />
      </div>

      <PracticePlaybackFooter
        currentTime={currentTime}
        duration={duration}
        markers={markers}
        loopStart={loopStart}
        loopEnd={loopEnd}
        isPlaying={isPlaying}
        playbackRate={playbackRate}
        playbackRatePresets={playbackRatePresets}
        onTogglePlayback={onTogglePlayback}
        onJumpBy={onJumpBy}
        onSetPlaybackRate={onSetPlaybackRate}
        onSeek={onSeek}
        onMarkerHover={onMarkerHover}
        onMarkerLeave={onMarkerLeave}
        onMarkerClick={onMarkerClick}
        onAddMarker={onAddMarker}
        onClearLoop={onClearLoop}
        hideMeta={true}
      />
    </div>
  );
}
