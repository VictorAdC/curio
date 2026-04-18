import { useRef } from 'react';
import type { PracticeMarker, TimelineWaveformDatum } from '../../types/practicePlayer';
import { formatTime } from '../../utils/time';
import { WaveformTimeline } from '../WaveformTimeline/WaveformTimeline';
import { useI18n } from '../../../../i18n/I18nProvider';
import styles from './Timeline.module.css';

interface TimelineProps {
  currentTime: number;
  duration: number;
  markers: PracticeMarker[];
  loopStart: number | null;
  loopEnd: number | null;
  waveform: TimelineWaveformDatum[];
  onSeek: (seconds: number) => void;
  variant?: 'default' | 'compact';
  onMarkerHover?: (marker: PracticeMarker) => void;
  onMarkerLeave?: () => void;
  onMarkerClick?: (marker: PracticeMarker) => void;
}

export function Timeline({
  currentTime,
  duration,
  markers,
  loopStart,
  loopEnd,
  waveform,
  onSeek,
  variant = 'default',
  onMarkerHover,
  onMarkerLeave,
  onMarkerClick,
}: TimelineProps) {
  const isDraggingRef = useRef(false);
  const isCompact = variant === 'compact';
  const { t } = useI18n();

  const handleSeekFromTrack = (clientX: number, left: number, width: number) => {
    if (duration <= 0) {
      return;
    }

    const ratio = (clientX - left) / width;
    onSeek(Math.max(0, Math.min(1, ratio)) * duration);
  };

  if (waveform.length > 0) {
    return (
      <div className={styles.root}>
        <WaveformTimeline
          waveform={waveform}
          currentTime={currentTime}
          duration={duration}
          loopStart={loopStart}
          loopEnd={loopEnd}
          onSeek={onSeek}
        />
      </div>
    );
  }

  return (
    <div className={`${styles.root} ${isCompact ? styles.compactShell : ''}`}>
      <div
        className={`${styles.genericTrack} ${isCompact ? styles.compactTrack : ''}`}
        onPointerDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          isDraggingRef.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          handleSeekFromTrack(event.clientX, rect.left, rect.width);
        }}
        onPointerMove={(event) => {
          if (!isDraggingRef.current) {
            return;
          }

          const rect = event.currentTarget.getBoundingClientRect();
          handleSeekFromTrack(event.clientX, rect.left, rect.width);
        }}
        onPointerUp={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          handleSeekFromTrack(event.clientX, rect.left, rect.width);
          isDraggingRef.current = false;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={(event) => {
          isDraggingRef.current = false;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        role="button"
        tabIndex={duration > 0 ? 0 : -1}
        aria-label={t('practice.timeline.seekMediaAria')}
      >
        <div className={styles.genericProgress} style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
        {(loopStart !== null || loopEnd !== null) && duration > 0 ? (
          <div
            className={styles.loopRange}
            style={{
              left: `${((loopStart ?? 0) / duration) * 100}%`,
              width: `${(((loopEnd ?? duration) - (loopStart ?? 0)) / duration) * 100}%`,
            }}
          />
        ) : null}
        {markers.map((marker) => (
          <span
            key={marker.id}
            className={`${styles.marker} ${isCompact ? styles.compactMarker : ''}`}
            style={{ left: `${duration > 0 ? (marker.timestampSeconds / duration) * 100 : 0}%` }}
            onMouseEnter={() => onMarkerHover?.(marker)}
            onMouseLeave={() => onMarkerLeave?.()}
            onClick={(e) => { e.stopPropagation(); onMarkerClick?.(marker); }}
          />
        ))}
        <div
          className={`${styles.playhead} ${isCompact ? styles.compactPlayhead : ''}`}
          style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>

      {isCompact ? (
        <div className={styles.compactMeta}>
          <span>{t('practice.timeline.markersCount', { count: markers.length })}</span>
          <span>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      ) : null}
    </div>
  );
}
