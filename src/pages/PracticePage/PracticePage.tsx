import { useRef, useState } from 'react';
import { MediaSourcePicker } from '../../features/practice-player/components/MediaSourcePicker/MediaSourcePicker';
import { MarkerList } from '../../features/practice-player/components/MarkerList/MarkerList';
import { SessionHistory } from '../../features/practice-player/components/SessionHistory/SessionHistory';
import { SessionNotes } from '../../features/practice-player/components/SessionNotes/SessionNotes';
import { TransportControls } from '../../features/practice-player/components/TransportControls/TransportControls';
import { usePracticePlayer } from '../../features/practice-player/hooks/usePracticePlayer';
import type { PracticeMarker } from '../../features/practice-player/types/practicePlayer';
import { useI18n } from '../../i18n/I18nProvider';
import { AudioPracticeCanvas } from './components/AudioPracticeCanvas';
import { PracticeHeader } from './components/PracticeHeader';
import { PracticePlayerHeader } from './components/PracticePlayerHeader';
import { PracticeSummary } from './components/PracticeSummary';
import { VideoPracticeCanvas } from './components/VideoPracticeCanvas';
import styles from './PracticePage.module.css';

export function PracticePage() {
  const { view, actions } = usePracticePlayer();
  const { locale, setLocale, t } = useI18n();
  const [hoveredMarker, setHoveredMarker] = useState<PracticeMarker | null>(null);
  const [isSessionDrawerOpen, setIsSessionDrawerOpen] = useState(false);
  const relinkInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <main className={styles.page}>
      <div className={styles.heroRow}>
        <PracticeHeader />
        <div className={styles.utilityRow}>
          <button
            className={styles.localeToggle}
            type="button"
            onClick={() => setLocale(locale === 'en' ? 'pt-BR' : 'en')}
            aria-label={t('language.label')}
            title={t('language.label')}
          >
            <span className={styles.localeToggleTrack}>
              <span className={`${styles.localeToggleThumb} ${locale === 'pt-BR' ? styles.localeToggleThumbPortuguese : ''}`} />
              <span className={`${styles.localeToggleOption} ${locale === 'en' ? styles.localeToggleOptionActive : ''}`}>
                {t('language.shortEnglish')}
              </span>
              <span className={`${styles.localeToggleOption} ${locale === 'pt-BR' ? styles.localeToggleOptionActive : ''}`}>
                {t('language.shortPortuguese')}
              </span>
            </span>
          </button>
          <button
            className={styles.sessionDrawerButton}
            type="button"
            onClick={() => setIsSessionDrawerOpen(true)}
          >
            {t('practice.sessions.button')}
          </button>
        </div>
      </div>

      <MediaSourcePicker onLocalFileSelected={actions.loadLocalFile} onYouTubeLoad={actions.loadYouTubeUrl} />

      {view.error ? (
        <div className={styles.error}>
          <span>{view.error}</span>
          {view.source?.sourceRef.mediaMissing && view.activeSessionId ? (
            <>
              <button
                className={styles.errorAction}
                type="button"
                onClick={() => relinkInputRef.current?.click()}
              >
                {t('practice.player.hiddenMediaRelink')}
              </button>
              <input
                ref={relinkInputRef}
                className={styles.hiddenFileInput}
                type="file"
                accept="audio/*,video/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (!file || !view.activeSessionId) {
                    return;
                  }

                  const warning = actions.inspectRelinkSessionMedia(view.activeSessionId, file);

                  if (
                    warning &&
                    !window.confirm(
                      t('practice.player.error.relinkWarning', {
                        details: warning.mismatches
                          .map((mismatch) => t(`practice.player.error.relinkDetail.${mismatch}`))
                          .join(', '),
                      }),
                    )
                  ) {
                    event.currentTarget.value = '';
                    return;
                  }

                  void actions.relinkSessionMedia(view.activeSessionId, file);
                  event.currentTarget.value = '';
                }}
              />
            </>
          ) : null}
        </div>
      ) : null}

      <section className={styles.playerShell}>
        <PracticePlayerHeader title={view.title} currentTime={view.currentTime} duration={view.duration} />

        <audio ref={actions.setAudioElement} className={styles.hiddenMedia} />

        {view.showMediaDisplay ? (
          <VideoPracticeCanvas
            sourceKind={view.sourceKind}
            currentTime={view.currentTime}
            duration={view.duration}
            markers={view.markers}
            loopStart={view.loopRange.start}
            loopEnd={view.loopRange.end}
            isPlaying={view.isPlaying}
            hoveredMarker={hoveredMarker}
            onAddMarker={actions.addMarker}
            onClearLoop={actions.clearLoop}
            onTogglePlayback={actions.togglePlayback}
            onJumpBy={actions.jumpBy}
            onSeek={actions.seek}
            onMarkerHover={setHoveredMarker}
            onMarkerLeave={() => setHoveredMarker(null)}
            setVideoElement={actions.setVideoElement}
          />
        ) : null}

        {view.showAudioCanvas ? (
          <AudioPracticeCanvas
            currentTime={view.currentTime}
            duration={view.duration}
            markers={view.markers}
            loopStart={view.loopRange.start}
            loopEnd={view.loopRange.end}
            waveform={view.waveform}
            isPlaying={view.isPlaying}
            hoveredMarker={hoveredMarker}
            onAddMarker={actions.addMarker}
            onClearLoop={actions.clearLoop}
            onTogglePlayback={actions.togglePlayback}
            onJumpBy={actions.jumpBy}
            onSeek={actions.seek}
            onMarkerHover={setHoveredMarker}
            onMarkerLeave={() => setHoveredMarker(null)}
          />
        ) : null}

        {!view.showMediaDisplay && !view.showAudioCanvas ? (
          <TransportControls
            isPlaying={view.isPlaying}
            onTogglePlayback={actions.togglePlayback}
            onJumpBackward={() => actions.jumpBy(-10)}
            onJumpForward={() => actions.jumpBy(10)}
          />
        ) : null}

        <PracticeSummary isReady={view.isReady} markerCount={view.markerCount} isLoopActive={view.isLoopActive} />
      </section>

      <section className={styles.lowerGrid}>
        <MarkerList
          markers={view.markers}
          onSeekToMarker={actions.seek}
          onAssignLoopRole={actions.assignLoopRole}
          onDeleteMarker={actions.removeMarker}
          onUpdateMarker={actions.updateMarker}
          onAddMarker={actions.addMarker}
          onClearLoop={actions.clearLoop}
        />
        <SessionNotes value={view.sessionNote} onChange={actions.setSessionNote} />
      </section>

      {isSessionDrawerOpen ? (
        <div className={styles.sessionDrawerShell} role="dialog" aria-modal="true" aria-label={t('practice.sessions.dialogLabel')}>
          <button
            className={styles.sessionDrawerBackdrop}
            type="button"
            aria-label={t('practice.sessions.closeAria')}
            onClick={() => setIsSessionDrawerOpen(false)}
          />
          <aside className={styles.sessionDrawer}>
            <div className={styles.sessionDrawerHeader}>
              <span className={styles.eyebrow}>{t('practice.sessions.savedEyebrow')}</span>
              <button
                className={styles.sessionDrawerClose}
                type="button"
                onClick={() => setIsSessionDrawerOpen(false)}
              >
                {t('practice.sessions.close')}
              </button>
            </div>
            <SessionHistory
              sessions={view.sessionHistory}
              activeSessionId={view.activeSessionId}
              onLoadSession={(sessionId) => {
                void actions.loadSession(sessionId);
                setIsSessionDrawerOpen(false);
              }}
              onRenameSession={actions.renameSession}
              onDeleteSession={(sessionId) => {
                void actions.deleteSession(sessionId);
              }}
              onClearAll={() => {
                void actions.clearAllSessions();
                setIsSessionDrawerOpen(false);
              }}
              onExportLight={() => {
                void actions.exportLightSessions();
              }}
              onExport={() => {
                void actions.exportSessions();
              }}
              onPrepareImport={(file) => actions.prepareImportSessions(file)}
              onImport={(file, options) => {
                void actions.importSessions(file, options);
                setIsSessionDrawerOpen(false);
              }}
            />
          </aside>
        </div>
      ) : null}
    </main>
  );
}
