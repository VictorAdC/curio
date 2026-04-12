import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../../../i18n/I18nProvider';
import type { PracticeSessionSummary } from '../../types/practicePlayer';
import { SessionHistory } from './SessionHistory';

const sessions: PracticeSessionSummary[] = [
  {
    id: '1',
    name: 'Etude Run',
    sourceTitle: 'Warmup Audio',
    sourceKind: 'local-audio',
    createdAt: '2026-04-12T10:00:00.000Z',
    updatedAt: '2026-04-12T10:10:00.000Z',
  },
  {
    id: '2',
    name: 'Video Notes',
    sourceTitle: 'Cello Visual',
    sourceKind: 'local-video',
    createdAt: '2026-04-11T10:00:00.000Z',
    updatedAt: '2026-04-11T10:10:00.000Z',
  },
  {
    id: '3',
    name: 'YouTube Session',
    sourceTitle: 'Practice Clip',
    sourceKind: 'youtube',
    createdAt: '2026-04-10T10:00:00.000Z',
    updatedAt: '2026-04-10T10:10:00.000Z',
  },
];

function renderSessionHistory() {
  return render(
    <I18nProvider>
      <SessionHistory
        sessions={sessions}
        activeSessionId={null}
        onLoadSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={vi.fn()}
        onClearAll={vi.fn()}
        onExport={vi.fn()}
        onExportLight={vi.fn()}
        onPrepareImport={vi.fn()}
        onImport={vi.fn()}
      />
    </I18nProvider>,
  );
}

describe('SessionHistory organization controls', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('filters sessions by search text', async () => {
    const user = userEvent.setup();

    renderSessionHistory();

    await user.type(screen.getByPlaceholderText('Search sessions'), 'video');

    expect(screen.getByRole('button', { name: 'Video Notes' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Etude Run' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'YouTube Session' })).not.toBeInTheDocument();
  });

  it('filters sessions by source type', async () => {
    const user = userEvent.setup();

    renderSessionHistory();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Source type' }), 'youtube');

    expect(screen.getByRole('button', { name: 'YouTube Session' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Etude Run' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Video Notes' })).not.toBeInTheDocument();
  });
});
