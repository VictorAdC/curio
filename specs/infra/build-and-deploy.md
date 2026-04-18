# Build And Deploy

## Application Model

Curio is deployed as a static frontend application.

Current assumptions:

- the app is built with Vite;
- deployment output is the generated `dist/` directory;
- runtime hosting does not require a backend;
- browser APIs such as IndexedDB, local file handling, and media playback remain client-side concerns.

## Build Process

The production build command is:

```bash
npm run build
```

This command:

- type-checks the project through the configured TypeScript build;
- bundles the frontend with Vite;
- emits static assets into `dist/`.

## Deployment Target

The current deployment target is GitHub Pages.

Curio is configured as a project site that uses the repository name in the final path:

```text
https://USERNAME.github.io/REPOSITORY_NAME/
```

This model allows multiple repositories to publish independent static pages under the same GitHub account.

## Base Path Behavior

Because GitHub Pages project sites are served from a repository subpath, the frontend must build with the correct Vite `base` value.

Current behavior:

- local development and non-GitHub-Actions builds use `/`;
- GitHub Actions builds derive the base path from `GITHUB_REPOSITORY`;
- repository `VictorAdC/curio` builds with base `/curio/`.

This behavior is implemented in the shared helper used by `vite.config.ts`.

## Continuous Deployment

Deployment is automated through GitHub Actions.

The workflow:

- runs on pushes to `main`;
- supports manual triggering through `workflow_dispatch`;
- installs dependencies with `npm ci`;
- runs `npm run build`;
- uploads the built `dist/` directory as the Pages artifact;
- deploys that artifact to GitHub Pages.

## Repository Setup Requirements

Before deployment works, the repository must:

- exist on GitHub;
- have the local repo pushed to that remote;
- have GitHub Pages configured to use `GitHub Actions` as the build and deployment source.

## Operational Notes

- renaming the repository changes the GitHub Pages path;
- custom domains can be added later, but are not part of the current default deployment model;
- GitHub Pages only hosts the static frontend, so any future backend capabilities would require separate hosting.
