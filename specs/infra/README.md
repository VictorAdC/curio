# Infra Specs

This folder documents project infrastructure and operational concerns.

For Curio, this should stay lightweight at first, but it is still useful to specify:

- build and deployment model for a static app;
- environment assumptions;
- package management conventions;
- CI expectations;
- asset handling rules;
- versioning and release basics.

## Suggested Files

- `build-and-deploy.md`
- `environment.md`
- `ci.md`
- `dependencies.md`

## Current Coverage

- GitHub Pages deployment for the static frontend should be documented here.
- GitHub Actions-based build and deploy flows belong in this folder rather than in page or feature specs.
