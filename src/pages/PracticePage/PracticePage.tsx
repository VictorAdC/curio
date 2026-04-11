import { useState } from 'react';
import { MediaSourcePicker } from '../../features/practice-player/components/MediaSourcePicker/MediaSourcePicker';
import { MarkerList } from '../../features/practice-player/components/MarkerList/MarkerList';
import { SessionHistory } from '../../features/practice-player/components/SessionHistory/SessionHistory';
import { SessionNotes } from '../../features/practice-player/components/SessionNotes/SessionNotes';
import { TransportControls } from '../../features/practice-player/components/TransportControls/TransportControls';
import { usePracticePlayer } from '../../features/practice-player/hooks/usePracticePlayer';
import type { PracticeMarker } from '../../features/practice-player/types/practicePlayer';
import { AudioPracticeCanvas } from './components/AudioPracticeCanvas';
import { PracticeHeader } from './components/PracticeHeader';
import { PracticePlayerHeader } from './components/PracticePlayerHeader';
import { PracticeSummary } from './components/PracticeSummary';
import { VideoPracticeCanvas } from './components/VideoPracticeCanvas';
import styles from './PracticePage.module.css';

export function PracticePage() {
  const { view, actions } = usePracticePlayer();
  const [hoveredMarker, setHoveredMarker] = useState<PracticeMarker | null>(null);
  const [isSessionDrawerOpen, setIsSessionDrawerOpen] = useState(false);

  return (
    <main className={styles.page}>
      <div className={styles.heroRow}>
        <PracticeHeader />
        <div className={styles.utilityRow}>
          <button
            className={styles.sessionDrawerButton}
            type="button"
            onClick={() => setIsSessionDrawerOpen(true)}
          >
            Sessions
          </button>
        </div>
      </div>

      <MediaSourcePicker onLocalFileSelected={actions.loadLocalFile} onYouTubeLoad={actions.loadYouTubeUrl} />

      {view.error ? <div className={styles.error}>{view.error}</div> : null}

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
        <div className={styles.sessionDrawerShell} role="dialog" aria-modal="true" aria-label="Session history">
          <button
            className={styles.sessionDrawerBackdrop}
            type="button"
            aria-label="Close session history"
            onClick={() => setIsSessionDrawerOpen(false)}
          />
          <aside className={styles.sessionDrawer}>
            <div className={styles.sessionDrawerHeader}>
              <span className={styles.eyebrow}>Saved sessions</span>
              <button
                className={styles.sessionDrawerClose}
                type="button"
                onClick={() => setIsSessionDrawerOpen(false)}
              >
                Close
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
              onExport={() => {
                void actions.exportSessions();
              }}
              onImport={(file) => {
                void actions.importSessions(file);
                setIsSessionDrawerOpen(false);
              }}
            />
          </aside>
        </div>
      ) : null}
    </main>
  );
}
