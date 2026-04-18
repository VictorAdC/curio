import { describe, expect, it } from 'vitest';
import { getGithubPagesBase } from './utils/githubPages';

describe('vite GitHub Pages base', () => {
  it('uses root locally when GitHub Actions is not active', () => {
    expect(getGithubPagesBase(undefined)).toBe('/');
    expect(getGithubPagesBase({ GITHUB_REPOSITORY: 'VictorAdC/curio' })).toBe('/');
  });

  it('uses the repository name as the project base path in GitHub Actions', () => {
    expect(
      getGithubPagesBase({
        GITHUB_ACTIONS: 'true',
        GITHUB_REPOSITORY: 'VictorAdC/curio',
      }),
    ).toBe('/curio/');
  });

  it('falls back to root when the repository name is missing in GitHub Actions', () => {
    expect(getGithubPagesBase({ GITHUB_ACTIONS: 'true' })).toBe('/');
  });
});
