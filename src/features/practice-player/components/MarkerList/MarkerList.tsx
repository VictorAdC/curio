import { formatTime } from '../../utils/time';
import type { PracticeMarker } from '../../types/practicePlayer';
import { MarkerEditor } from '../MarkerEditor/MarkerEditor';
import { useI18n } from '../../../../i18n/I18nProvider';
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
  const { t } = useI18n();

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <h3>{t('practice.markerList.title')}</h3>
          <p>{t('practice.markerList.description')}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.addButton} type="button" onClick={onAddMarker}>
            {t('practice.controls.addMarker')}
          </button>
          <button className={styles.clearButton} type="button" onClick={onClearLoop}>
            {t('practice.controls.clearLoop')}
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {markers.length === 0 ? (
          <p className={styles.empty}>{t('practice.markerList.empty')}</p>
        ) : null}
        {markers.map((marker) => (
          <article key={marker.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <button className={styles.seekButton} type="button" onClick={() => onSeekToMarker(marker.timestampSeconds)}>
                {formatTime(marker.timestampSeconds)}
              </button>
              <div className={styles.actions}>
                <button type="button" onClick={() => onAssignLoopRole(marker.id, marker.loopRole === 'start' ? 'none' : 'start')}>
                  {marker.loopRole === 'start' ? t('practice.markerList.unsetStart') : t('practice.markerList.setStart')}
                </button>
                <button type="button" onClick={() => onAssignLoopRole(marker.id, marker.loopRole === 'end' ? 'none' : 'end')}>
                  {marker.loopRole === 'end' ? t('practice.markerList.unsetEnd') : t('practice.markerList.setEnd')}
                </button>
                <button type="button" onClick={() => onDeleteMarker(marker.id)}>
                  {t('practice.markerList.remove')}
                </button>
              </div>
            </div>
            <div className={styles.roleBadge}>
              {marker.loopRole === 'none'
                ? t('practice.markerList.role.marker')
                : marker.loopRole === 'start'
                  ? t('practice.markerList.role.loopStart')
                  : t('practice.markerList.role.loopEnd')}
            </div>
            <MarkerEditor marker={marker} onChange={onUpdateMarker} />
          </article>
        ))}
      </div>
    </section>
  );
}
