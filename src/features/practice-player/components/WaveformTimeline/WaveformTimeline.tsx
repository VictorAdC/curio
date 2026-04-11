import type { PracticeMarker, TimelineWaveformDatum } from '../../types/practicePlayer';
import styles from './WaveformTimeline.module.css';

interface WaveformTimelineProps {
  waveform: TimelineWaveformDatum[];
  currentTime: number;
  duration: number;
  markers: PracticeMarker[];
  loopStart: number | null;
  loopEnd: number | null;
}

export function WaveformTimeline({
  waveform,
  currentTime,
  duration,
  markers,
  loopStart,
  loopEnd,
}: WaveformTimelineProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={styles.root}>
      {loopStart !== null && loopEnd !== null && duration > 0 ? (
        <div
          className={styles.loopRange}
          style={{
            left: `${(loopStart / duration) * 100}%`,
            width: `${((loopEnd - loopStart) / duration) * 100}%`,
          }}
        />
      ) : null}

      <div className={styles.bars}>
        {waveform.map((sample, index) => (
          <span
            key={`${sample.timestampSeconds}-${index}`}
            className={styles.bar}
            style={{
              height: `${Math.max(sample.amplitude * 100, 12)}%`,
              opacity: sample.timestampSeconds <= currentTime ? 1 : 0.34,
            }}
          />
        ))}
      </div>

      <div className={styles.playhead} style={{ left: `${progress}%` }} />

      {markers.map((marker) => (
        <span
          key={marker.id}
          className={styles.marker}
          title={marker.title}
          style={{ left: `${duration > 0 ? (marker.timestampSeconds / duration) * 100 : 0}%` }}
        />
      ))}
    </div>
  );
}
