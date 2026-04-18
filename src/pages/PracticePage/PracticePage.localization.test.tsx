import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider';
import { PracticePage } from './PracticePage';

describe('PracticePage localization', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('switches the visible UI copy when the language toggle is used', async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <PracticePage />
      </I18nProvider>,
    );

    expect(screen.getByPlaceholderText('Paste YouTube URL or Search...')).toBeInTheDocument();
    expect(screen.getByText('Open Local File')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'PT' }));

    expect(await screen.findByPlaceholderText('Cole a URL do YouTube...')).toBeInTheDocument();
    expect(screen.getByText('Abrir arquivo local')).toBeInTheDocument();
  });

  it('persists the selected locale locally across remounts', async () => {
    const user = userEvent.setup();

    const { unmount } = render(
      <I18nProvider>
        <PracticePage />
      </I18nProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'PT' }));
    expect(window.localStorage.getItem('curio.locale.v1')).toBe('pt-BR');

    unmount();

    render(
      <I18nProvider>
        <PracticePage />
      </I18nProvider>,
    );

    expect(screen.getByPlaceholderText('Cole a URL do YouTube...')).toBeInTheDocument();
  });
});
