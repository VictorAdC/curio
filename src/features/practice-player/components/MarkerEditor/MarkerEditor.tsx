import { useMemo, useState } from 'react';
import type { PracticeMarker } from '../../types/practicePlayer';
import { useI18n } from '../../../../i18n/I18nProvider';
import styles from './MarkerEditor.module.css';

interface MarkerEditorProps {
  marker: PracticeMarker;
  suggestedTags: string[];
  onChange: (markerId: string, updates: Partial<Pick<PracticeMarker, 'title' | 'note' | 'userTags'>>) => void;
}

export function MarkerEditor({ marker, suggestedTags, onChange }: MarkerEditorProps) {
  const { t } = useI18n();
  const [tagDraft, setTagDraft] = useState('');

  const filteredSuggestions = useMemo(() => {
    const normalizedDraft = tagDraft.trim().toLowerCase();

    if (!normalizedDraft) {
      return [];
    }

    return suggestedTags
      .filter((tag) => !marker.userTags.includes(tag))
      .filter((tag) => tag.toLowerCase().includes(normalizedDraft))
      .slice(0, 6);
  }, [marker.userTags, suggestedTags, tagDraft]);

  const addTag = (value: string) => {
    const nextTag = value.trim();

    if (!nextTag || marker.userTags.includes(nextTag)) {
      setTagDraft('');
      return;
    }

    onChange(marker.id, {
      userTags: [...marker.userTags, nextTag],
    });
    setTagDraft('');
  };

  const removeTag = (value: string) => {
    onChange(marker.id, {
      userTags: marker.userTags.filter((tag) => tag !== value),
    });
  };

  return (
    <div className={styles.root}>
      <input
        className={styles.title}
        value={marker.title}
        onChange={(event) => onChange(marker.id, { title: event.target.value })}
      />
      <textarea
        className={styles.note}
        rows={3}
        placeholder={t('practice.markerEditor.notePlaceholder')}
        value={marker.note}
        onChange={(event) => onChange(marker.id, { note: event.target.value })}
      />
      <div className={styles.tagsRoot}>
        <div className={styles.tagList}>
          {marker.userTags.map((tag) => (
            <span key={tag} className={styles.tagChip}>
              {tag}
              <button
                className={styles.tagRemove}
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={t('practice.markerEditor.removeTag', { tag })}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          className={styles.tags}
          value={tagDraft}
          placeholder={t('practice.markerEditor.tagsPlaceholder')}
          onChange={(event) => setTagDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addTag(tagDraft);
            }
          }}
        />
        {filteredSuggestions.length > 0 ? (
          <div className={styles.suggestions}>
            <span className={styles.suggestionsLabel}>{t('practice.markerEditor.suggestions')}</span>
            <div className={styles.suggestionList}>
              {filteredSuggestions.map((tag) => (
                <button
                  key={tag}
                  className={styles.suggestion}
                  type="button"
                  onClick={() => addTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
