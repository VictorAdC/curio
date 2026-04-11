import { useRef } from 'react';
import type { PracticeMarker, TimelineWaveformDatum } from '../../types/practicePlayer';
import styles from './WaveformTimeline.module.css';

interface WaveformTimelineProps {
  waveform: TimelineWaveformDatum[];
  currentTime: number;
  duration: number;
  markers: PracticeMarker[];
  loopStart: number | null;
  loopEnd: number | null;
  onSeek: (seconds: number) => void;
  onMarkerHover?: (marker: PracticeMarker) => void;
  onMarkerLeave?: () => void;
}

export function WaveformTimeline({
  waveform,
  currentTime,
  duration,
  markers,
  loopStart,
  loopEnd,
  onSeek,
  onMarkerHover,
  onMarkerLeave,
}: WaveformTimelineProps) {
  const isDraggingRef = useRef(false);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const seekFromPointer = (clientX: number, element: HTMLDivElement) => {
    if (duration <= 0) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, ratio)) * duration);
  };

  return (
    <div
      className={styles.root}
      onPointerDown={(event) => {
        isDraggingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        seekFromPointer(event.clientX, event.currentTarget);
      }}
      onPointerMove={(event) => {
        if (!isDraggingRef.current) {
          return;
        }

        seekFromPointer(event.clientX, event.currentTarget);
      }}
      onPointerUp={(event) => {
        if (isDraggingRef.current) {
          seekFromPointer(event.clientX, event.currentTarget);
        }

        isDraggingRef.current = false;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={(event) => {
        isDraggingRef.current = false;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      role="button"
      tabIndex={duration > 0 ? 0 : -1}
      onKeyDown={(event) => {
        if (duration <= 0) {
          return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSeek(currentTime);
        }
      }}
      aria-label="Seek through audio waveform"
    >
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
          onMouseEnter={() => onMarkerHover?.(marker)}
          onMouseLeave={() => onMarkerLeave?.()}
        />
      ))}
    </div>
  );
}
