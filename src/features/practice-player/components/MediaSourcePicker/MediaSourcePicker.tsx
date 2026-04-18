import { useRef, useState } from 'react';
import { useI18n } from '../../../../i18n/I18nProvider';
import styles from './MediaSourcePicker.module.css';

interface MediaSourcePickerProps {
  onLocalFileSelected: (file: File) => void;
  onYouTubeLoad: (url: string) => void;
}

export function MediaSourcePicker({ onLocalFileSelected, onYouTubeLoad }: MediaSourcePickerProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className={styles.root}>
      <div className={styles.inputShell}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <input
          className={styles.textInput}
          type="url"
          placeholder={t('practice.media.youtubePlaceholder')}
          value={youtubeUrl}
          onChange={(event) => setYoutubeUrl(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') onYouTubeLoad(youtubeUrl); }}
        />
        <button className={styles.inlineLoadButton} type="button" onClick={() => onYouTubeLoad(youtubeUrl)}>
          {t('practice.media.load')}
        </button>
      </div>

      <label className={styles.localFileButton}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        {t('practice.media.openLocalFile')}
        <input
          ref={fileInputRef}
          className={styles.hiddenInput}
          type="file"
          accept="audio/*,video/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onLocalFileSelected(file);
          }}
        />
      </label>
    </section>
  );
}
