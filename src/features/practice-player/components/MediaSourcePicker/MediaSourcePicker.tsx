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
      <div className={styles.inputShell}>
        <input
          className={styles.textInput}
          type="url"
          placeholder="Paste a YouTube link"
          value={youtubeUrl}
          onChange={(event) => setYoutubeUrl(event.target.value)}
        />
        <button className={styles.inlineLoadButton} type="button" onClick={() => onYouTubeLoad(youtubeUrl)}>
          Load
        </button>
      </div>

      <div className={styles.secondaryBlock}>
        <div className={styles.secondaryRow}>
          <span className={styles.secondaryText}>or</span>
          <label className={styles.fileLink}>
            load a local audio or video file
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
