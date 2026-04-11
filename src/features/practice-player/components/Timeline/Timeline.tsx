import type { PracticeMarker, TimelineWaveformDatum } from '../../types/practicePlayer';
import { WaveformTimeline } from '../WaveformTimeline/WaveformTimeline';
import styles from './Timeline.module.css';

interface TimelineProps {
  currentTime: number;
  duration: number;
  markers: PracticeMarker[];
  loopStart: number | null;
  loopEnd: number | null;
  waveform: TimelineWaveformDatum[];
  onSeek: (seconds: number) => void;
}

export function Timeline({
  currentTime,
  duration,
  markers,
  loopStart,
  loopEnd,
  waveform,
  onSeek,
}: TimelineProps) {
  return (
    <div className={styles.root}>
      {waveform.length > 0 ? (
        <WaveformTimeline
          waveform={waveform}
          currentTime={currentTime}
          duration={duration}
          markers={markers}
          loopStart={loopStart}
          loopEnd={loopEnd}
        />
      ) : (
        <div className={styles.genericTrack}>
          <div className={styles.genericProgress} style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
          {loopStart !== null && loopEnd !== null && duration > 0 ? (
            <div
              className={styles.loopRange}
              style={{
                left: `${(loopStart / duration) * 100}%`,
                width: `${((loopEnd - loopStart) / duration) * 100}%`,
              }}
            />
          ) : null}
          {markers.map((marker) => (
            <span
              key={marker.id}
              className={styles.marker}
              style={{ left: `${duration > 0 ? (marker.timestampSeconds / duration) * 100 : 0}%` }}
            />
          ))}
        </div>
      )}

      <input
        className={styles.range}
        type="range"
        min={0}
        max={duration || 0}
        step={0.01}
        value={Math.min(currentTime, duration || 0)}
        onChange={(event) => onSeek(Number(event.target.value))}
        disabled={duration <= 0}
      />
    </div>
  );
}
