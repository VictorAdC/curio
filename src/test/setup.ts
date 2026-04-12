import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

const originalCreateObjectUrl = URL.createObjectURL;
const originalRevokeObjectUrl = URL.revokeObjectURL;

beforeAll(() => {
  if (!URL.createObjectURL) {
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: vi.fn(() => `blob:mock-${crypto.randomUUID()}`),
    });
  }

  if (!URL.revokeObjectURL) {
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: vi.fn(),
    });
  }
});

afterEach(() => {
  cleanup();
});

afterAll(() => {
  if (originalCreateObjectUrl) {
    URL.createObjectURL = originalCreateObjectUrl;
  }

  if (originalRevokeObjectUrl) {
    URL.revokeObjectURL = originalRevokeObjectUrl;
  }
});
