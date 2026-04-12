export type PracticeErrorCode =
  | 'LOCAL_MEDIA_URL_MISSING'
  | 'YOUTUBE_VIDEO_ID_MISSING'
  | 'MEDIA_ELEMENT_NOT_READY'
  | 'BACKUP_UNSUPPORTED'
  | 'SESSION_MEDIA_RELINK_NOT_REQUIRED';

export class PracticeError extends Error {
  constructor(public code: PracticeErrorCode) {
    super(code);
    this.name = 'PracticeError';
  }
}

export function getPracticeErrorCode(error: unknown): PracticeErrorCode | null {
  if (error instanceof PracticeError) {
    return error.code;
  }

  return null;
}
