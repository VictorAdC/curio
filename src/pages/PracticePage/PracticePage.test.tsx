import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider';
import { PracticePage } from './PracticePage';

describe('PracticePage marker workspace', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the marker workspace in the practice tab', () => {
    render(
      <I18nProvider>
        <PracticePage />
      </I18nProvider>,
    );

    expect(screen.getByText('Markers & special tags')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add marker' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear loop' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export Session' })).toBeInTheDocument();
  });
});
