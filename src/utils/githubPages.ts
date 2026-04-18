type EnvMap = Record<string, string | undefined> | undefined;

export function getGithubPagesBase(env: EnvMap = (globalThis as typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
}).process?.env) {
  if (!env?.GITHUB_ACTIONS) {
    return '/';
  }

  const repository = env.GITHUB_REPOSITORY?.split('/')[1];

  if (!repository) {
    return '/';
  }

  return `/${repository}/`;
}
