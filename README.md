# Curio

Curio is a browser-based practice studio for musicians. It lets you load local audio, local video, or a YouTube source, navigate precisely through the media, create timestamped markers, define loop and media boundaries, and keep session notes in a local-first workflow.

The app is built as a static frontend and is designed to run well without a backend. Session data is stored in the browser, including marker metadata and persisted local media references.

## Features

- Load local audio and video files
- Load and practice against YouTube media
- Seek through waveform and timeline views
- Add timestamped markers with notes and tags
- Define loop start/end and media start/end boundaries
- Adjust playback speed during practice
- Keep session-level notes
- Restore saved sessions from browser storage
- Export and import session backups
- Use the interface in English or Portuguese

## Stack

- React
- TypeScript
- Vite
- Zustand
- Dexie / IndexedDB
- Vitest
- Playwright

## Getting Started

### Requirements

- Node.js 20+ recommended
- npm

### Install

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

This starts the Vite development server.

## Build

Create a production build with:

```bash
npm run build
```

Preview the production build locally with:

```bash
npm run preview
```

## Test

Run the unit and integration test suite:

```bash
npm run test:run
```

Run tests in watch mode:

```bash
npm run test
```

Run end-to-end tests:

```bash
npm run test:e2e
```

## Deployment

Curio is configured to deploy as a GitHub Pages project site through GitHub Actions.

The app uses the repository name as its Pages base path, so it is served at:

```text
https://USERNAME.github.io/REPOSITORY_NAME/
```

To deploy:

1. Push the repository to GitHub
2. Open `Settings -> Pages`
3. Set `Build and deployment` to `GitHub Actions`
4. Push to `main` or trigger the deploy workflow manually from the `Actions` tab

## Project Structure

```text
src/       Application code
specs/     Product, feature, testing, and infra documentation
tests/     End-to-end test coverage
scripts/   Project utility scripts
```

## License

No license is currently declared in this repository.
