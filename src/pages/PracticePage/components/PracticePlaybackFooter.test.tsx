import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../../i18n/I18nProvider';
import { PlaybackProvider, type PlaybackContextValue } from '../context/PlaybackContext';
import { PracticePlaybackFooter } from './PracticePlaybackFooter';

const defaultContext: PlaybackContextValue = {
  currentTime: 3,
  duration: 11,
  markers: [],
  loopStart: null,
  loopEnd: null,
  waveform: [],
  isPlaying: false,
  playbackRate: 1,
  playbackRatePresets: [0.5, 0.75, 1, 1.25, 1.5],
  sourceKind: null,
  hoveredMarker: null,
  recorderMode: undefined,
  onTogglePlayback: vi.fn(),
  onJumpBy: vi.fn(),
  onSetPlaybackRate: vi.fn(),
  onSeek: vi.fn(),
  onAddMarker: vi.fn(),
  onClearLoop: vi.fn(),
  onMarkerHover: vi.fn(),
  onMarkerLeave: vi.fn(),
  onMarkerClick: vi.fn(),
  onSwitchToRecord: vi.fn(),
  onLoopStartClick: vi.fn(),
  onLoopEndClick: vi.fn(),
};

function renderFooter(hideMeta?: boolean, contextOverrides: Partial<PlaybackContextValue> = {}) {
  return render(
    <I18nProvider>
      <PlaybackProvider value={{ ...defaultContext, ...contextOverrides }}>
        <PracticePlaybackFooter hideMeta={hideMeta} />
      </PlaybackProvider>
    </I18nProvider>,
  );
}

describe('PracticePlaybackFooter timecode', () => {
  it('shows the standalone timecode for media displays when meta is hidden', () => {
    renderFooter(true);

    expect(screen.getByText('00:03')).toBeInTheDocument();
    expect(screen.getByText('00:11')).toBeInTheDocument();
    expect(screen.queryByText('Markers: 0')).not.toBeInTheDocument();
  });

  it('does not render a duplicate standalone timecode when compact meta is visible', () => {
    renderFooter(false);

    expect(screen.getByText('Markers: 0')).toBeInTheDocument();
    expect(screen.queryAllByText('00:03 / 00:11')).toHaveLength(1);
  });
});
