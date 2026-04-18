import type { RecordingMode } from '../../../features/practice-recorder/hooks/usePracticeRecorder';
import type {
  PracticeMarker,
  PracticeMediaKind,
  TimelineWaveformDatum,
} from '../../../features/practice-player/types/practicePlayer';
import { MarkerSpotlight } from './MarkerSpotlight';
import { PracticePlaybackFooter } from './PracticePlaybackFooter';
import { RecPill } from './RecPill';
import styles from './VideoPracticeCanvas.module.css';

interface VideoPracticeCanvasProps {
  sourceKind: PracticeMediaKind | null;
  currentTime: number;
  duration: number;
  waveform: TimelineWaveformDatum[];
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
  recorderMode?: RecordingMode;
  setVideoElement: (element: HTMLVideoElement | null) => void;
}

export function VideoPracticeCanvas({
  sourceKind,
  currentTime,
  duration,
  waveform,
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
  recorderMode,
  setVideoElement,
}: VideoPracticeCanvasProps) {
  const progress = duration > 0 ? currentTime / duration : 0;

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

        {waveform.length > 0 ? (
          <div className={styles.waveformOverlay} aria-hidden="true">
            <div className={styles.waveformBars}>
              {waveform.map((sample, index) => (
                <span
                  key={`${sample.timestampSeconds}-${index}`}
                  className={styles.waveformBar}
                  style={{
                    height: `${Math.max(sample.amplitude * 100, 18)}%`,
                    opacity: sample.timestampSeconds <= currentTime ? 0.92 : 0.44,
                  }}
                />
              ))}
            </div>
            <div
              className={styles.waveformProgress}
              style={{ width: `${progress * 100}%` }}
            />
            <div
              className={styles.waveformPlayhead}
              style={{ left: `${progress * 100}%` }}
            />
          </div>
        ) : null}

        <RecPill onClick={onSwitchToRecord} mode={recorderMode} />

        <MarkerSpotlight marker={hoveredMarker} />
      </div>

      <PracticePlaybackFooter
        currentTime={currentTime}
        duration={duration}
        waveform={waveform}
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
