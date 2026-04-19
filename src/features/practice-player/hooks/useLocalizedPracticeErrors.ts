import { useCallback } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { getPracticeErrorCode } from '../utils/errors';

export function useLocalizedPracticeErrors() {
  const { t } = useI18n();
  return useCallback(
    (error: unknown): string => {
      const code = getPracticeErrorCode(error);
      switch (code) {
        case 'LOCAL_MEDIA_URL_MISSING':
        case 'MEDIA_ELEMENT_NOT_READY':
          return t('practice.player.error.mediaLoad');
        case 'YOUTUBE_VIDEO_ID_MISSING':
          return t('practice.player.error.invalidYoutube');
        case 'BACKUP_UNSUPPORTED':
          return t('practice.sessionHistory.error.unsupportedBackup');
        case 'SESSION_MEDIA_RELINK_NOT_REQUIRED':
          return t('practice.player.error.relinkUnavailable');
        default:
          return t('practice.player.error.generic');
      }
    },
    [t],
  );
}
