import { useEffect, useRef, useState } from 'react';
import { RecorderDock } from '../../features/practice-recorder/components/RecorderDock/RecorderDock';
import { MediaSourcePicker } from '../../features/practice-player/components/MediaSourcePicker/MediaSourcePicker';
import { MarkerList } from '../../features/practice-player/components/MarkerList/MarkerList';
import { SessionHistory } from '../../features/practice-player/components/SessionHistory/SessionHistory';
import { SessionNotes } from '../../features/practice-player/components/SessionNotes/SessionNotes';
import { TransportControls } from '../../features/practice-player/components/TransportControls/TransportControls';
import { usePracticePlayer } from '../../features/practice-player/hooks/usePracticePlayer';
import { usePracticeRecorder } from '../../features/practice-recorder/hooks/usePracticeRecorder';
import type { PracticeMarker } from '../../features/practice-player/types/practicePlayer';
import { useI18n } from '../../i18n/I18nProvider';
import { AudioPracticeCanvas } from './components/AudioPracticeCanvas';
import { BottomNav } from './components/BottomNav';
import { TopNav } from './components/TopNav';
import { VideoPracticeCanvas } from './components/VideoPracticeCanvas';
import styles from './PracticePage.module.css';

type ActiveTab = 'practice' | 'record' | 'history';

export function PracticePage() {
  const { view, actions } = usePracticePlayer();
  const recorder = usePracticeRecorder();
  const { t } = useI18n();
  const [hoveredMarker, setHoveredMarker] = useState<PracticeMarker | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('practice');
  const [recorderOpen, setRecorderOpen] = useState(false);
  const [focusMarkerId, setFocusMarkerId] = useState<string | null>(null);

  const openMarkerById = (id: string) => {
    setFocusMarkerId(id);
    setActiveTab('practice');
  };

  const handleLoopStartClick = () => {
    const starts = view.markers.filter((m) => m.systemTags.includes('loop-start') || m.systemTags.includes('media-start'));
    const effective = starts.reduce<typeof starts[0] | null>((best, m) => (!best || m.timestampSeconds > best.timestampSeconds ? m : best), null);
    if (effective) openMarkerById(effective.id);
  };

  const handleLoopEndClick = () => {
    const ends = view.markers.filter((m) => m.systemTags.includes('loop-end') || m.systemTags.includes('media-end'));
    const effective = ends.reduce<typeof ends[0] | null>((best, m) => (!best || m.timestampSeconds < best.timestampSeconds ? m : best), null);
    if (effective) openMarkerById(effective.id);
  };

  const relinkInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tagName = target.tagName.toLowerCase();
      return target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select' || tagName === 'option';
    };

    const recorderMessages = {
      unsupported: t('practice.recorder.error.unsupported'),
      permissionDenied: t('practice.recorder.error.permission'),
      generic: t('practice.recorder.error.generic'),
      audioInputLabel: t('practice.recorder.audioInput'),
      videoInputLabel: t('practice.recorder.videoInput'),
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      // Space triggers playback unless the user is actively typing text
      if (event.key === ' ') {
        const el = event.target instanceof HTMLElement ? event.target : null;
        const tag = el?.tagName.toLowerCase() ?? '';
        const isTextEntry = el?.isContentEditable ||
          (tag === 'input' && !['button', 'checkbox', 'radio', 'submit', 'reset', 'file', 'image'].includes((el as HTMLInputElement).type)) ||
          tag === 'textarea';
        if (!isTextEntry) { event.preventDefault(); actions.togglePlayback(); }
        return;
      }

      if (isTypingTarget(event.target)) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); actions.jumpBy(-5); return; }
      if (event.key === 'ArrowRight') { event.preventDefault(); actions.jumpBy(5); return; }
      if (event.key.toLowerCase() === 'm') { event.preventDefault(); actions.addMarker(); return; }
      if (event.key.toLowerCase() === 'l') { event.preventDefault(); actions.clearLoop(); return; }
      if (event.key.toLowerCase() === 'p') { event.preventDefault(); recorder.actions.toggleRecordingPlayback(); return; }
      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        setRecorderOpen(true);
        if (recorder.view.isRecording) { recorder.actions.stopRecording(); return; }
        if (!view.source) return;
        void recorder.actions.startRecording(recorderMessages);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, recorder.actions, recorder.view.isRecording, t, view.source]);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'record') {
      recorder.actions.setOpen(true);
    }
  };

  return (
    <main className={styles.page}>
      <TopNav />

      <MediaSourcePicker onLocalFileSelected={actions.loadLocalFile} onYouTubeLoad={actions.loadYouTubeUrl} />

      {view.persistenceFeedback ? (
        <div className={`${styles.persistenceFeedback} ${styles[`persistenceFeedback${view.persistenceFeedback.tone[0].toUpperCase()}${view.persistenceFeedback.tone.slice(1)}`]}`}>
          <span>{view.persistenceFeedback.message}</span>
          <button className={styles.persistenceFeedbackDismiss} type="button" onClick={actions.dismissPersistenceFeedback}>
            {t('practice.persistence.dismiss')}
          </button>
        </div>
      ) : null}

      {view.error ? (
        <div className={styles.error}>
          <span>{view.error}</span>
          {view.source?.sourceRef.mediaMissing && view.activeSessionId ? (
            <>
              <button className={styles.errorAction} type="button" onClick={() => relinkInputRef.current?.click()}>
                {t('practice.player.hiddenMediaRelink')}
              </button>
              <input
                ref={relinkInputRef}
                className={styles.hiddenFileInput}
                type="file"
                accept="audio/*,video/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file || !view.activeSessionId) return;
                  const warning = actions.inspectRelinkSessionMedia(view.activeSessionId, file);
                  if (warning && !window.confirm(t('practice.player.error.relinkWarning', { details: warning.mismatches.map((mismatch) => t(`practice.player.error.relinkDetail.${mismatch}`)).join(', ') }))) {
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

      {activeTab === 'history' ? (
        <div className={styles.historyPanel}>
          <SessionHistory
            sessions={view.sessionHistory}
            activeSessionId={view.activeSessionId}
            storageHealth={view.storageHealth}
            persistenceFeedback={view.persistenceFeedback}
            onDismissFeedback={actions.dismissPersistenceFeedback}
            onLoadSession={(sessionId) => { void actions.loadSession(sessionId); setActiveTab('practice'); }}
            onRenameSession={actions.renameSession}
            onDeleteSession={(sessionId) => { void actions.deleteSession(sessionId); }}
            onClearAll={() => { void actions.clearAllSessions(); }}
            onExportLight={(sessionIds) => { void actions.exportLightSessions(sessionIds); }}
            onExport={(sessionIds) => { void actions.exportSessions(sessionIds); }}
            onPrepareImport={(file) => actions.prepareImportSessions(file)}
            onImport={(file, options) => { void actions.importSessions(file, options); }}
          />
        </div>
      ) : null}

      {activeTab === 'practice' ? (
        <div className={styles.practiceLayout}>
          <div className={styles.playerColumn}>
            <audio ref={actions.setAudioElement} className={styles.hiddenMedia} />

            {recorderOpen ? (
              <div className={styles.recorderOverlay}>
                <RecorderDock hasActiveSource={!!view.source} recorder={recorder} inline onClose={() => setRecorderOpen(false)} />
              </div>
            ) : null}

            {view.showMediaDisplay ? (
              <VideoPracticeCanvas
                sourceKind={view.sourceKind}
                currentTime={view.currentTime}
                duration={view.duration}
                waveform={view.waveform}
                markers={view.markers}
                loopStart={view.loopRange.start}
                loopEnd={view.loopRange.end}
                isPlaying={view.isPlaying}
                playbackRate={view.playbackRate}
                playbackRatePresets={view.playbackRatePresets}
                hoveredMarker={hoveredMarker}
                onAddMarker={actions.addMarker}
                onClearLoop={actions.clearLoop}
                onLoopStartClick={handleLoopStartClick}
                onLoopEndClick={handleLoopEndClick}
                onTogglePlayback={actions.togglePlayback}
                onJumpBy={actions.jumpBy}
                onSetPlaybackRate={actions.setPlaybackRate}
                onSeek={actions.seek}
                onMarkerHover={setHoveredMarker}
                onMarkerLeave={() => setHoveredMarker(null)}
                onMarkerClick={(marker) => { setFocusMarkerId(marker.id); }}
                onSwitchToRecord={() => setRecorderOpen((o) => !o)}
                recorderMode={recorder.view.mode}
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
                playbackRate={view.playbackRate}
                playbackRatePresets={view.playbackRatePresets}
                hoveredMarker={hoveredMarker}
                onAddMarker={actions.addMarker}
                onClearLoop={actions.clearLoop}
                onLoopStartClick={handleLoopStartClick}
                onLoopEndClick={handleLoopEndClick}
                onTogglePlayback={actions.togglePlayback}
                onJumpBy={actions.jumpBy}
                onSetPlaybackRate={actions.setPlaybackRate}
                onSeek={actions.seek}
                onMarkerHover={setHoveredMarker}
                onMarkerLeave={() => setHoveredMarker(null)}
                onMarkerClick={(marker) => { setFocusMarkerId(marker.id); }}
                onSwitchToRecord={() => setRecorderOpen((o) => !o)}
                recorderMode={recorder.view.mode}
              />
            ) : null}

            {!view.showMediaDisplay && !view.showAudioCanvas ? (
              <TransportControls
                isPlaying={view.isPlaying}
                playbackRate={view.playbackRate}
                playbackRatePresets={view.playbackRatePresets}
                onTogglePlayback={actions.togglePlayback}
                onJumpBackward={() => actions.jumpBy(-5)}
                onJumpForward={() => actions.jumpBy(5)}
                onSetPlaybackRate={actions.setPlaybackRate}
              />
            ) : null}
          </div>

          <aside className={styles.markersColumn}>
            <MarkerList
              markers={view.markers}
              focusMarkerId={focusMarkerId}
              onSeekToMarker={actions.seek}
              onToggleSystemTag={actions.toggleSystemTag}
              onDeleteMarker={actions.removeMarker}
              onUpdateMarker={actions.updateMarker}
              onAddMarker={actions.addMarker}
              onClearLoop={actions.clearLoop}
              onExportLight={(sessionIds) => { void actions.exportLightSessions(sessionIds); }}
              onExport={(sessionIds) => { void actions.exportSessions(sessionIds); }}
            />
          </aside>
        </div>
      ) : null}

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      <div className={styles.lowerGrid}>
        <SessionNotes value={view.sessionNote} onChange={actions.setSessionNote} />
        <section className={styles.shortcutPanel} aria-label={t('practice.shortcuts.title')}>
          <strong>{t('practice.shortcuts.title')}</strong>
          <div className={styles.shortcutGrid}>
            <span className={styles.shortcutItem}><kbd>Space</kbd>{t('practice.shortcuts.playPause')}</span>
            <span className={styles.shortcutItem}><kbd>←</kbd><kbd>→</kbd>{t('practice.shortcuts.seek')}</span>
            <span className={styles.shortcutItem}><kbd>M</kbd>{t('practice.shortcuts.addMarker')}</span>
            <span className={styles.shortcutItem}><kbd>L</kbd>{t('practice.shortcuts.loopToggle')}</span>
            <span className={styles.shortcutItem}><kbd>R</kbd>{t('practice.shortcuts.record')}</span>
            <span className={styles.shortcutItem}><kbd>P</kbd>{t('practice.shortcuts.playRecording')}</span>
          </div>
        </section>
      </div>
    </main>
  );
}
