import { useState } from 'react';
import { useI18n } from '../../../../i18n/I18nProvider';
import styles from './MediaSourcePicker.module.css';

interface MediaSourcePickerProps {
  onLocalFileSelected: (file: File) => void;
  onYouTubeLoad: (url: string) => void;
}

export function MediaSourcePicker({ onLocalFileSelected, onYouTubeLoad }: MediaSourcePickerProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const { t } = useI18n();

  return (
    <section className={styles.root}>
      <div className={styles.inputShell}>
        <input
          className={styles.textInput}
          type="url"
          placeholder={t('practice.media.youtubePlaceholder')}
          value={youtubeUrl}
          onChange={(event) => setYoutubeUrl(event.target.value)}
        />
        <button className={styles.inlineLoadButton} type="button" onClick={() => onYouTubeLoad(youtubeUrl)}>
          {t('practice.media.load')}
        </button>
      </div>

      <div className={styles.secondaryBlock}>
        <div className={styles.secondaryRow}>
          <span className={styles.secondaryText}>{t('practice.media.or')}</span>
          <label className={styles.fileLink}>
            {t('practice.media.localFile')}
            <input
              className={styles.hiddenInput}
              type="file"
              accept="audio/*,video/*"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  onLocalFileSelected(file);
                }
              }}
            />
          </label>
        </div>
      </div>
    </section>
  );
}
