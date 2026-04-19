import type { PracticeStorageHealth } from '../../types/practicePlayer';
import { db, getLocalStorageBytes, readPersistedSessions } from './db';

export async function getPracticeStorageHealth(): Promise<PracticeStorageHealth> {
  const sessions = readPersistedSessions();
  const mediaAssets = await db.mediaAssets.toArray();
  const mediaBytes = mediaAssets.reduce((total, asset) => total + asset.file.size, 0);
  const localStorageBytes = getLocalStorageBytes();
  const totalStoredBytes = mediaBytes + localStorageBytes;
  const missingMediaCount = sessions.filter((session) => session.session.requiresMediaRelink).length;

  let usageBytes: number | null = null;
  let quotaBytes: number | null = null;
  let persisted: boolean | null = null;
  let storageEstimateSupported = false;

  if ('storage' in navigator) {
    storageEstimateSupported = true;
    const estimate = await navigator.storage.estimate().catch(() => null);
    usageBytes = estimate?.usage ?? null;
    quotaBytes = estimate?.quota ?? null;
    persisted =
      typeof navigator.storage.persisted === 'function'
        ? await navigator.storage.persisted().catch(() => null)
        : null;
  }

  const usageRatio = usageBytes !== null && quotaBytes ? usageBytes / quotaBytes : null;
  const status =
    missingMediaCount > 0 || (usageRatio !== null && usageRatio >= 0.75)
      ? usageRatio !== null && usageRatio >= 0.9
        ? 'limited'
        : 'warning'
      : 'healthy';

  return {
    sessionCount: sessions.length,
    missingMediaCount,
    mediaAssetCount: mediaAssets.length,
    mediaBytes,
    localStorageBytes,
    totalStoredBytes,
    storageEstimateSupported,
    usageBytes,
    quotaBytes,
    persisted,
    status,
  };
}
