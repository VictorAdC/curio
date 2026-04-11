import { useState } from 'react';
import styles from './MediaSourcePicker.module.css';

interface MediaSourcePickerProps {
  onLocalFileSelected: (file: File) => void;
  onYouTubeLoad: (url: string) => void;
}

export function MediaSourcePicker({ onLocalFileSelected, onYouTubeLoad }: MediaSourcePickerProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('');

  return (
    <section className={styles.root}>
      <label className={styles.uploadCard}>
        <span className={styles.cardLabel}>Upload audio or video</span>
        <span className={styles.helper}>Use local practice files directly in the browser.</span>
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

      <div className={styles.youtubeCard}>
        <span className={styles.cardLabel}>Use a YouTube URL</span>
        <input
          className={styles.textInput}
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={youtubeUrl}
          onChange={(event) => setYoutubeUrl(event.target.value)}
        />
        <button className={styles.loadButton} type="button" onClick={() => onYouTubeLoad(youtubeUrl)}>
          Load
        </button>
      </div>
    </section>
  );
}
