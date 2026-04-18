import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

function getGithubPagesBase() {
  const env = (globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>;
    };
  }).process?.env;

  if (!env?.GITHUB_ACTIONS) {
    return '/';
  }

  const repository = env.GITHUB_REPOSITORY?.split('/')[1];

  if (!repository) {
    return '/';
  }

  return `/${repository}/`;
}

export default defineConfig({
  base: getGithubPagesBase(),
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['tests/e2e/**'],
  },
});
