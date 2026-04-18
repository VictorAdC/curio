import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../../i18n/I18nProvider';
import { PracticePlaybackFooter } from './PracticePlaybackFooter';

function renderFooter(overrides: Partial<React.ComponentProps<typeof PracticePlaybackFooter>> = {}) {
  return render(
    <I18nProvider>
      <PracticePlaybackFooter
        currentTime={3}
        duration={11}
        markers={[]}
        loopStart={null}
        loopEnd={null}
        isPlaying={false}
        playbackRate={1}
        playbackRatePresets={[0.5, 0.75, 1, 1.25, 1.5]}
        onTogglePlayback={vi.fn()}
        onJumpBy={vi.fn()}
        onSetPlaybackRate={vi.fn()}
        onSeek={vi.fn()}
        onMarkerHover={vi.fn()}
        onMarkerLeave={vi.fn()}
        onAddMarker={vi.fn()}
        onClearLoop={vi.fn()}
        {...overrides}
      />
    </I18nProvider>,
  );
}

describe('PracticePlaybackFooter timecode', () => {
  it('shows the standalone timecode for media displays when meta is hidden', () => {
    renderFooter({ hideMeta: true });

    expect(screen.getByText('00:03')).toBeInTheDocument();
    expect(screen.getByText('00:11')).toBeInTheDocument();
    expect(screen.queryByText('Markers: 0')).not.toBeInTheDocument();
  });

  it('does not render a duplicate standalone timecode when compact meta is visible', () => {
    renderFooter({ hideMeta: false });

    expect(screen.getByText('Markers: 0')).toBeInTheDocument();
    expect(screen.queryAllByText('00:03 / 00:11')).toHaveLength(1);
  });
});
