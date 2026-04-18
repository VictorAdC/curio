import { useEffect, useRef } from 'react';
import { useI18n } from '../../../../i18n/I18nProvider';
import { formatTime } from '../../../practice-player/utils/time';
import type { usePracticeRecorder } from '../../hooks/usePracticeRecorder';
import styles from './RecorderDock.module.css';

interface RecorderDockProps {
  hasActiveSource: boolean;
  recorder: ReturnType<typeof usePracticeRecorder>;
  inline?: boolean;
  onClose?: () => void;
}

export function RecorderDock({ hasActiveSource, recorder, inline, onClose }: RecorderDockProps) {
  const { t } = useI18n();
  const { view, actions } = recorder;
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!liveVideoRef.current || !view.livePreviewStream) {
      return;
    }

    liveVideoRef.current.srcObject = view.livePreviewStream;
    void liveVideoRef.current.play().catch(() => {});

    return () => {
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = null;
      }
    };
  }, [view.livePreviewStream]);

  useEffect(() => {
    if (!view.isOpen) {
      return;
    }

    void actions.refreshDevices({
      audio: t('practice.recorder.audioInput'),
      video: t('practice.recorder.videoInput'),
    });
  }, [t, view.isOpen]);

  const panelOpen = inline ? true : view.isOpen;

  return (
    <div className={`${styles.root} ${inline ? styles.rootInline : ''}`}>
      {!inline && (
        <button
          className={`${styles.toggle} ${view.isRecording ? styles.toggleRecording : ''}`}
          type="button"
          onClick={() => actions.setOpen(!view.isOpen)}
        >
          {view.isRecording ? t('practice.recorder.recordingButton') : t('practice.recorder.toggle')}
        </button>
      )}

      {panelOpen ? (
        <div className={`${styles.panel} ${inline ? styles.panelInline : ''}`}>
          <div className={styles.header}>
            <div>
              <strong>{t('practice.recorder.title')}</strong>
              <p>{t('practice.recorder.description')}</p>
            </div>
            {onClose && (
              <button className={styles.close} type="button" onClick={onClose} aria-label="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>

          <div className={styles.modes}>
            {([
              ['audio', 'practice.recorder.mode.audio'],
              ['both', 'practice.recorder.mode.video'],
            ] as const).map(([mode, labelKey]) => (
              <button
                key={mode}
                className={`${styles.mode} ${view.mode === mode ? styles.modeActive : ''}`}
                type="button"
                onClick={() => actions.setMode(mode)}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>

          {(view.mode === 'audio' || view.mode === 'both') && view.audioInputs.length > 1 ? (
            <label className={styles.field}>
              <span>{t('practice.recorder.audioInput')}</span>
              <select
                className={styles.select}
                value={view.selectedAudioInputId ?? ''}
                onChange={(event) => actions.setSelectedAudioInput(event.target.value)}
              >
                {view.audioInputs.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {view.mode === 'both' && view.videoInputs.length > 1 ? (
            <label className={styles.field}>
              <span>{t('practice.recorder.videoInput')}</span>
              <select
                className={styles.select}
                value={view.selectedVideoInputId ?? ''}
                onChange={(event) => actions.setSelectedVideoInput(event.target.value)}
              >
                {view.videoInputs.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <button
            className={styles.refreshInputs}
            type="button"
            onClick={() =>
              void actions.refreshDevices({
                audio: t('practice.recorder.audioInput'),
                video: t('practice.recorder.videoInput'),
              })
            }
          >
            {t('practice.recorder.refreshInputs')}
          </button>

          <div className={styles.statusRow}>
            <span className={styles.status}>
              <span className={`${styles.statusDot} ${view.isRecording ? styles.statusDotRecording : ''}`} />
              {view.isRecording ? t('practice.recorder.status.recording') : t('practice.recorder.status.idle')}
            </span>
            <span>{formatTime(view.elapsedSeconds)}</span>
          </div>

          {view.error ? <div className={styles.error}>{view.error}</div> : null}

          <div className={styles.actions}>
            {!view.isRecording ? (
              <button
                className={`${styles.primary} ${!hasActiveSource || !view.supported ? styles.disabled : ''}`}
                type="button"
                disabled={!hasActiveSource || !view.supported}
                onClick={() =>
                  void actions.startRecording({
                    unsupported: t('practice.recorder.error.unsupported'),
                    permissionDenied: t('practice.recorder.error.permission'),
                    generic: t('practice.recorder.error.generic'),
                    audioInputLabel: t('practice.recorder.audioInput'),
                    videoInputLabel: t('practice.recorder.videoInput'),
                  })
                }
              >
                {t('practice.recorder.start')}
              </button>
            ) : (
              <button className={styles.primary} type="button" onClick={actions.stopRecording}>
                {t('practice.recorder.stop')}
              </button>
            )}

            {!hasActiveSource ? (
              <span>{t('practice.recorder.sourceRequired')}</span>
            ) : null}
          </div>

          {view.hasLiveVideo ? (
            <div className={styles.previewCard}>
              <strong>{t('practice.recorder.livePreview')}</strong>
              <video ref={liveVideoRef} className={styles.preview} autoPlay muted playsInline />
            </div>
          ) : null}

          {view.isRecording && !view.hasLiveVideo && view.hasLiveAudio ? (
            <div className={styles.previewCard}>
              <strong>{t('practice.recorder.liveAudio')}</strong>
              <p>{t('practice.recorder.liveAudioDescription')}</p>
              <div className={styles.audioLiveRow}>
                <span className={`${styles.audioPulse} ${styles.audioPulseActive}`} />
                <span>{t('practice.recorder.status.recording')}</span>
              </div>
            </div>
          ) : null}

          {view.hasRecording && view.recordingUrl ? (
            <div className={styles.previewCard}>
              <div>
                <strong>{t('practice.recorder.lastTake')}</strong>
                <p>{t('practice.recorder.downloadHint')}</p>
              </div>

              {view.recordedMode === 'audio' ? (
                <audio className={styles.audioPreview} controls src={view.recordingUrl} />
              ) : (
                <video className={styles.preview} controls src={view.recordingUrl} />
              )}

              <div className={styles.actions}>
                <button
                  className={styles.secondary}
                  type="button"
                  onClick={() => actions.downloadRecording(`curio-practice-${view.mode}-${Date.now()}`)}
                >
                  {t('practice.recorder.download')}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
