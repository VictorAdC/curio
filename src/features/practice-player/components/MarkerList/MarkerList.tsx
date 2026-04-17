import { useMemo } from 'react';
import { formatTime } from '../../utils/time';
import type { PracticeMarker, PracticeSystemTag } from '../../types/practicePlayer';
import { MarkerEditor } from '../MarkerEditor/MarkerEditor';
import { useI18n } from '../../../../i18n/I18nProvider';
import { isSpecialMarker, SYSTEM_TAGS } from '../../utils/markerTags';
import styles from './MarkerList.module.css';

interface MarkerListProps {
  markers: PracticeMarker[];
  onSeekToMarker: (seconds: number) => void;
  onToggleSystemTag: (markerId: string, tag: PracticeSystemTag) => void;
  onConvertSystemTagToUserTag: (markerId: string, tag: PracticeSystemTag) => void;
  onDeleteMarker: (markerId: string) => void;
  onUpdateMarker: (markerId: string, updates: Partial<Pick<PracticeMarker, 'title' | 'note' | 'userTags'>>) => void;
  onAddMarker: () => void;
  onClearLoop: () => void;
}

const specialTags: PracticeSystemTag[] = ['loop-start', 'loop-end', 'media-start', 'media-end'];

export function MarkerList({
  markers,
  onSeekToMarker,
  onToggleSystemTag,
  onConvertSystemTagToUserTag,
  onDeleteMarker,
  onUpdateMarker,
  onAddMarker,
  onClearLoop,
}: MarkerListProps) {
  const { t } = useI18n();

  const counts = useMemo(
    () => ({
      total: markers.length,
      special: markers.filter(isSpecialMarker).length,
    }),
    [markers],
  );

  const suggestedTags = useMemo(
    () =>
      Array.from(
        new Set(
          markers
            .flatMap((marker) => marker.userTags)
            .map((tag) => tag.trim())
            .filter((tag) => tag && !(SYSTEM_TAGS as readonly string[]).includes(tag)),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [markers],
  );

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <h3>{t('practice.markerList.title')}</h3>
          <p>{t('practice.markerList.description')}</p>
          <div className={styles.summaryRow}>
            <span>{t('practice.markerList.summary.total', { count: counts.total })}</span>
            <span>{t('practice.markerList.summary.special', { count: counts.special })}</span>
          </div>
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
        {markers.length === 0 ? <p className={styles.empty}>{t('practice.markerList.empty')}</p> : null}
        {markers.map((marker) => (
          <article key={marker.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <button className={styles.seekButton} type="button" onClick={() => onSeekToMarker(marker.timestampSeconds)}>
                {formatTime(marker.timestampSeconds)}
              </button>
              <button className={styles.removeButton} type="button" onClick={() => onDeleteMarker(marker.id)}>
                {t('practice.markerList.remove')}
              </button>
            </div>

            <div className={styles.specialTags}>
              {specialTags.map((tag) => {
                const isActive = marker.systemTags.includes(tag);

                return (
                  <div key={tag} className={styles.specialTagCard}>
                    <button
                      className={`${styles.tagToggle} ${isActive ? styles.tagToggleActive : ''}`}
                      type="button"
                      onClick={() => onToggleSystemTag(marker.id, tag)}
                    >
                      {t(`practice.markerList.systemTag.${tag}`)}
                    </button>
                    {isActive ? (
                      <button
                        className={styles.convertButton}
                        type="button"
                        onClick={() => onConvertSystemTagToUserTag(marker.id, tag)}
                      >
                        {t('practice.markerList.convertToTag')}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <MarkerEditor marker={marker} suggestedTags={suggestedTags} onChange={onUpdateMarker} />
          </article>
        ))}
      </div>
    </section>
  );
}
