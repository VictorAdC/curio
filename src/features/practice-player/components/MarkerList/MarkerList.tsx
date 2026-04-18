import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatTime } from '../../utils/time';
import type { PracticeMarker, PracticeSystemTag } from '../../types/practicePlayer';
import { MarkerEditor } from '../MarkerEditor/MarkerEditor';
import { useI18n } from '../../../../i18n/I18nProvider';
import { isSpecialMarker, SYSTEM_TAGS } from '../../utils/markerTags';
import styles from './MarkerList.module.css';

interface MarkerListProps {
  markers: PracticeMarker[];
  focusMarkerId?: string | null;
  onSeekToMarker: (seconds: number) => void;
  onToggleSystemTag: (markerId: string, tag: PracticeSystemTag) => void;
  onDeleteMarker: (markerId: string) => void;
  onUpdateMarker: (markerId: string, updates: Partial<Pick<PracticeMarker, 'title' | 'note' | 'userTags'>>) => void;
  onAddMarker: () => void;
  onClearLoop: () => void;
  onExportLight?: (sessionIds?: string[]) => void;
  onExport?: (sessionIds?: string[]) => void;
}

const specialTags: PracticeSystemTag[] = ['loop-start', 'loop-end', 'media-start', 'media-end'];

const systemTagIcons: Record<string, string> = {
  'loop-start': '↩',
  'loop-end': '↪',
  'media-start': '⏮',
  'media-end': '⏭',
};

export function MarkerList({
  markers,
  focusMarkerId,
  onSeekToMarker,
  onToggleSystemTag,
  onDeleteMarker,
  onUpdateMarker,
  onAddMarker,
  onClearLoop,
  onExportLight,
  onExport,
}: MarkerListProps) {
  const { t } = useI18n();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [tooltip, setTooltip] = useState<{ text: string; bottom: number; left: number } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const showTooltip = (text: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      text,
      bottom: window.innerHeight - rect.top + 8,
      left: rect.left + rect.width / 2,
    });
  };

  const hideTooltip = () => setTooltip(null);

  useEffect(() => {
    if (focusMarkerId) {
      setExpandedIds((prev) => new Set([...prev, focusMarkerId]));
    }
  }, [focusMarkerId]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
        <span className={styles.eyebrow}>{t('practice.markers.eyebrow')}</span>
        <div className={styles.headerTop}>
          <h3>{t('practice.markerList.title')}</h3>
          <span className={styles.itemCount}>{counts.total} {counts.total === 1 ? 'item' : 'items'}</span>
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
        {markers.map((marker) => {
          const isExpanded = expandedIds.has(marker.id);

          return (
            <article key={marker.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <button
                  className={styles.seekButton}
                  type="button"
                  onClick={() => onSeekToMarker(marker.timestampSeconds)}
                >
                  {formatTime(marker.timestampSeconds)}
                </button>
                <button
                  className={styles.expandButton}
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => toggleExpanded(marker.id)}
                >
                  {t(isExpanded ? 'practice.markerList.collapse' : 'practice.markerList.expand')}
                </button>
              </div>

              {!isExpanded ? (
                <div className={styles.cardSummary}>
                  {marker.title ? (
                    <span className={styles.cardTitle}>{marker.title}</span>
                  ) : null}
                  {marker.userTags.length > 0 ? (
                    <div className={styles.cardTagPreview}>
                      {marker.userTags.map((tag) => (
                        <span key={tag} className={styles.userTag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <MarkerEditor
                    marker={marker}
                    suggestedTags={suggestedTags}
                    onChange={onUpdateMarker}
                    systemTagsSlot={
                      <div className={styles.specialTags}>
                        {specialTags.map((tag) => {
                          const isActive = marker.systemTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              className={`${styles.tagToggle} ${isActive ? styles.tagToggleActive : ''}`}
                              type="button"
                              aria-label={t(`practice.markerList.systemTag.${tag}`)}
                              aria-pressed={isActive}
                              onMouseEnter={(e) => showTooltip(t(`practice.markerList.systemTag.${tag}`), e)}
                              onMouseLeave={hideTooltip}
                              onClick={() => onToggleSystemTag(marker.id, tag)}
                            >
                              {systemTagIcons[tag]}
                            </button>
                          );
                        })}
                      </div>
                    }
                  />

                  <div className={styles.cardFooter}>
                    <button
                      className={styles.removeButton}
                      type="button"
                      onClick={() => onDeleteMarker(marker.id)}
                    >
                      {t('practice.markerList.remove')}
                    </button>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>

      {(onExportLight || onExport) ? (
        <div className={styles.exportArea}>
          {exportOpen ? (
            <div className={styles.exportOptions}>
              {onExportLight ? (
                <button className={styles.exportOption} type="button" onClick={() => { onExportLight(); setExportOpen(false); }}>
                  {t('practice.sessionHistory.lightCopy')}
                </button>
              ) : null}
              {onExport ? (
                <button className={styles.exportOption} type="button" onClick={() => { onExport(); setExportOpen(false); }}>
                  {t('practice.sessionHistory.fullCopy')}
                </button>
              ) : null}
              <button className={styles.exportCancel} type="button" onClick={() => setExportOpen(false)}>
                {t('practice.sessionHistory.modalClose')}
              </button>
            </div>
          ) : (
            <button className={styles.exportButton} type="button" onClick={() => setExportOpen(true)}>
              {t('practice.markers.exportSession')}
            </button>
          )}
        </div>
      ) : null}

      {tooltip ? createPortal(
        <div
          className={styles.floatingTooltip}
          style={{ bottom: tooltip.bottom, left: tooltip.left }}
          aria-hidden
        >
          {tooltip.text}
        </div>,
        document.body,
      ) : null}
    </section>
  );
}
