import type { PracticeMarker, TimelineWaveformDatum } from '../../../features/practice-player/types/practicePlayer';
import { Timeline } from '../../../features/practice-player/components/Timeline/Timeline';
import { MarkerSpotlight } from './MarkerSpotlight';
import { PracticeControlCards } from './PracticeControlCards';
import { PracticePlaybackFooter } from './PracticePlaybackFooter';
import styles from '../PracticePage.module.css';

interface AudioPracticeCanvasProps {
  currentTime: number;
  duration: number;
  markers: PracticeMarker[];
  loopStart: number | null;
  loopEnd: number | null;
  waveform: TimelineWaveformDatum[];
  isPlaying: boolean;
  hoveredMarker: PracticeMarker | null;
  onAddMarker: () => void;
  onClearLoop: () => void;
  onTogglePlayback: () => void;
  onJumpBy: (deltaSeconds: number) => void;
  onSeek: (seconds: number) => void;
  onMarkerHover: (marker: PracticeMarker) => void;
  onMarkerLeave: () => void;
}

export function AudioPracticeCanvas({
  currentTime,
  duration,
  markers,
  loopStart,
  loopEnd,
  waveform,
  isPlaying,
  hoveredMarker,
  onAddMarker,
  onClearLoop,
  onTogglePlayback,
  onJumpBy,
  onSeek,
  onMarkerHover,
  onMarkerLeave,
}: AudioPracticeCanvasProps) {
  return (
    <div className={styles.videoCanvas}>
      <div className={`${styles.playerArea} ${styles.audioCanvasArea}`}>
        <PracticeControlCards
          layout="inline"
          loopStart={loopStart}
          loopEnd={loopEnd}
          onAddMarker={onAddMarker}
          onClearLoop={onClearLoop}
        />
        <div className={styles.audioWaveStage}>
          <Timeline
            currentTime={currentTime}
            duration={duration}
            markers={markers}
            loopStart={loopStart}
            loopEnd={loopEnd}
            waveform={waveform}
            onSeek={onSeek}
            onMarkerHover={onMarkerHover}
            onMarkerLeave={onMarkerLeave}
          />
        </div>
        {hoveredMarker ? (
          <div className={styles.audioMarkerRow}>
            <MarkerSpotlight marker={hoveredMarker} />
          </div>
        ) : null}
      </div>

      <PracticePlaybackFooter
        currentTime={currentTime}
        duration={duration}
        markers={markers}
        loopStart={loopStart}
        loopEnd={loopEnd}
        isPlaying={isPlaying}
        onTogglePlayback={onTogglePlayback}
        onJumpBy={onJumpBy}
        onSeek={onSeek}
        onMarkerHover={onMarkerHover}
        onMarkerLeave={onMarkerLeave}
      />
    </div>
  );
}
