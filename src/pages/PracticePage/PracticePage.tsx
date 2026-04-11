import { useMemo, useState } from 'react';
import { MediaSourcePicker } from '../../features/practice-player/components/MediaSourcePicker/MediaSourcePicker';
import { MarkerList } from '../../features/practice-player/components/MarkerList/MarkerList';
import { SessionNotes } from '../../features/practice-player/components/SessionNotes/SessionNotes';
import { Timeline } from '../../features/practice-player/components/Timeline/Timeline';
import { TransportControls } from '../../features/practice-player/components/TransportControls/TransportControls';
import { usePracticePlayer } from '../../features/practice-player/hooks/usePracticePlayer';
import { formatTime } from '../../features/practice-player/utils/time';
import styles from './PracticePage.module.css';

export function PracticePage() {
  const { state, actions } = usePracticePlayer();
  const [hoveredMarker, setHoveredMarker] = useState<(typeof state.markers)[number] | null>(null);
  const sourceKind = state.source?.kind ?? null;
  const showAudioCanvas = sourceKind === 'local-audio';
  const showMediaDisplay = sourceKind === 'local-video' || sourceKind === 'youtube';
  const timelineWaveform = sourceKind === 'local-audio' ? state.waveform : [];

  const loopRange = useMemo(() => {
    const start = state.markers.find((marker) => marker.id === state.loopSelection.startMarkerId);
    const end = state.markers.find((marker) => marker.id === state.loopSelection.endMarkerId);

    if (!start || !end || start.timestampSeconds >= end.timestampSeconds) {
      return {
        start: null,
        end: null,
      };
    }

    return {
      start: start.timestampSeconds,
      end: end.timestampSeconds,
    };
  }, [state.loopSelection.endMarkerId, state.loopSelection.startMarkerId, state.markers]);

  const overlayControls = (
    <>
      <button className={styles.overlayAction} type="button" onClick={actions.addMarker}>
        Add bookmark
      </button>
      <button className={styles.overlayGhost} type="button" onClick={() => state.clearLoop()}>
        Clear loop
      </button>
      <div className={styles.overlayMeta}>
        <span>Loop start</span>
        <strong>{loopRange.start !== null ? formatTime(loopRange.start) : '--:--'}</strong>
      </div>
      <div className={styles.overlayMeta}>
        <span>Loop end</span>
        <strong>{loopRange.end !== null ? formatTime(loopRange.end) : '--:--'}</strong>
      </div>
    </>
  );

  const markerSpotlight = hoveredMarker ? (
    <article className={styles.markerSpotlight}>
      <span className={styles.markerSpotlightLabel}>Bookmark</span>
      <strong>{hoveredMarker.title}</strong>
      <span>{formatTime(hoveredMarker.timestampSeconds)}</span>
      <p>{hoveredMarker.note || 'Add a note to this bookmark to keep contextual practice guidance here.'}</p>
    </article>
  ) : null;

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Curio practice studio</span>
          <h1>Practice page</h1>
          <p>
            Load local media or a YouTube performance, navigate precisely through the timeline, and build
            loop-based study sessions with notes.
          </p>
        </div>
        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>Current source</span>
          <strong>{state.source?.title ?? 'No media loaded'}</strong>
          <span>{state.source?.kind ?? 'Load a local file or YouTube URL to begin.'}</span>
        </div>
      </header>

      <MediaSourcePicker onLocalFileSelected={actions.loadLocalFile} onYouTubeLoad={actions.loadYouTubeUrl} />

      {state.error ? <div className={styles.error}>{state.error}</div> : null}

      <section className={styles.playerShell}>
        <div className={styles.playerHeader}>
          <div>
            <span className={styles.eyebrow}>Now practicing</span>
            <h2>{state.source?.title ?? 'Waiting for a source'}</h2>
          </div>
          <div className={styles.timeBlock}>
            <strong>{formatTime(state.currentTime)}</strong>
            <span>/ {formatTime(state.duration)}</span>
          </div>
        </div>

        <audio ref={actions.setAudioElement} className={styles.hiddenMedia} />

        {showMediaDisplay ? (
          <div className={styles.videoCanvas}>
            <div className={styles.playerArea}>
              <video
                ref={actions.setVideoElement}
                className={sourceKind === 'local-video' ? styles.video : styles.hiddenMedia}
                controls={false}
              />
              <div className={sourceKind === 'youtube' ? styles.youtubeFrame : styles.hiddenMedia} id="youtube-player-root" />
              <div className={styles.overlayRail}>{overlayControls}</div>
              {markerSpotlight}
            </div>

            <div className={styles.canvasFooter}>
              <div className={styles.canvasTransport}>
                <TransportControls
                  isPlaying={state.isPlaying}
                  onTogglePlayback={actions.togglePlayback}
                  onJumpBackward={() => actions.jumpBy(-10)}
                  onJumpForward={() => actions.jumpBy(10)}
                />
              </div>
              <Timeline
                currentTime={state.currentTime}
                duration={state.duration}
                markers={state.markers}
                loopStart={loopRange.start}
                loopEnd={loopRange.end}
                waveform={[]}
                onSeek={actions.seek}
                variant="compact"
                onMarkerHover={setHoveredMarker}
                onMarkerLeave={() => setHoveredMarker(null)}
              />
            </div>
          </div>
        ) : null}

        {showAudioCanvas ? (
          <div className={styles.videoCanvas}>
            <div className={`${styles.playerArea} ${styles.audioCanvasArea}`}>
              <div className={`${styles.overlayRail} ${styles.audioOverlayRail}`}>{overlayControls}</div>
              <div className={styles.audioWaveStage}>
                <Timeline
                  currentTime={state.currentTime}
                  duration={state.duration}
                  markers={state.markers}
                  loopStart={loopRange.start}
                  loopEnd={loopRange.end}
                  waveform={timelineWaveform}
                  onSeek={actions.seek}
                  onMarkerHover={setHoveredMarker}
                  onMarkerLeave={() => setHoveredMarker(null)}
                />
              </div>
              {markerSpotlight ? <div className={styles.audioMarkerRow}>{markerSpotlight}</div> : null}
            </div>

            <div className={styles.canvasFooter}>
              <div className={styles.canvasTransport}>
                <TransportControls
                  isPlaying={state.isPlaying}
                  onTogglePlayback={actions.togglePlayback}
                  onJumpBackward={() => actions.jumpBy(-10)}
                  onJumpForward={() => actions.jumpBy(10)}
                />
              </div>
              <Timeline
                currentTime={state.currentTime}
                duration={state.duration}
                markers={state.markers}
                loopStart={loopRange.start}
                loopEnd={loopRange.end}
                waveform={[]}
                onSeek={actions.seek}
                variant="compact"
                onMarkerHover={setHoveredMarker}
                onMarkerLeave={() => setHoveredMarker(null)}
              />
            </div>
          </div>
        ) : null}

        {!showMediaDisplay && !showAudioCanvas ? (
          <TransportControls
            isPlaying={state.isPlaying}
            onTogglePlayback={actions.togglePlayback}
            onJumpBackward={() => actions.jumpBy(-10)}
            onJumpForward={() => actions.jumpBy(10)}
          />
        ) : null}

        <div className={styles.metaRow}>
          <div className={styles.metaCard}>
            <span>Readiness</span>
            <strong>{state.isReady ? 'Ready' : 'Loading metadata'}</strong>
          </div>
          <div className={styles.metaCard}>
            <span>Bookmarks</span>
            <strong>{state.markers.length}</strong>
          </div>
          <div className={styles.metaCard}>
            <span>Loop</span>
            <strong>{loopRange.start !== null && loopRange.end !== null ? 'Active' : 'Inactive'}</strong>
          </div>
        </div>
      </section>

      <section className={styles.lowerGrid}>
        <MarkerList
          markers={state.markers}
          onSeekToMarker={actions.seek}
          onAssignLoopRole={(markerId, role) => state.assignLoopRole(markerId, role)}
          onDeleteMarker={(markerId) => state.removeMarker(markerId)}
          onUpdateMarker={(markerId, updates) => state.updateMarker(markerId, updates)}
          onAddMarker={actions.addMarker}
          onClearLoop={() => state.clearLoop()}
        />
        <SessionNotes value={state.sessionNote} onChange={(value) => state.setSessionNote(value)} />
      </section>
    </main>
  );
}
