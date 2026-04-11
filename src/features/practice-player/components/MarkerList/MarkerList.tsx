import { formatTime } from '../../utils/time';
import type { PracticeMarker } from '../../types/practicePlayer';
import { MarkerEditor } from '../MarkerEditor/MarkerEditor';
import styles from './MarkerList.module.css';

interface MarkerListProps {
  markers: PracticeMarker[];
  onSeekToMarker: (seconds: number) => void;
  onAssignLoopRole: (markerId: string, role: PracticeMarker['loopRole']) => void;
  onDeleteMarker: (markerId: string) => void;
  onUpdateMarker: (markerId: string, updates: Partial<Pick<PracticeMarker, 'title' | 'note'>>) => void;
  onAddMarker: () => void;
  onClearLoop: () => void;
}

export function MarkerList({
  markers,
  onSeekToMarker,
  onAssignLoopRole,
  onDeleteMarker,
  onUpdateMarker,
  onAddMarker,
  onClearLoop,
}: MarkerListProps) {
  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <h3>Markers & loop points</h3>
          <p>Create reference points and assign one start and one end loop marker.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.addButton} type="button" onClick={onAddMarker}>
            Add marker
          </button>
          <button className={styles.clearButton} type="button" onClick={onClearLoop}>
            Clear loop
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {markers.length === 0 ? (
          <p className={styles.empty}>No markers yet. Add one at the current playback position.</p>
        ) : null}
        {markers.map((marker) => (
          <article key={marker.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <button className={styles.seekButton} type="button" onClick={() => onSeekToMarker(marker.timestampSeconds)}>
                {formatTime(marker.timestampSeconds)}
              </button>
              <div className={styles.actions}>
                <button type="button" onClick={() => onAssignLoopRole(marker.id, marker.loopRole === 'start' ? 'none' : 'start')}>
                  {marker.loopRole === 'start' ? 'Unset start' : 'Set start'}
                </button>
                <button type="button" onClick={() => onAssignLoopRole(marker.id, marker.loopRole === 'end' ? 'none' : 'end')}>
                  {marker.loopRole === 'end' ? 'Unset end' : 'Set end'}
                </button>
                <button type="button" onClick={() => onDeleteMarker(marker.id)}>
                  Remove
                </button>
              </div>
            </div>
            <div className={styles.roleBadge}>{marker.loopRole === 'none' ? 'Marker' : `Loop ${marker.loopRole}`}</div>
            <MarkerEditor marker={marker} onChange={onUpdateMarker} />
          </article>
        ))}
      </div>
    </section>
  );
}
