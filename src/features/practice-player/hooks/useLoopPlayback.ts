import { useEffect } from 'react';
import type { PracticeMarker } from '../types/practicePlayer';
import { PracticePlayerController } from '../controllers/practicePlayerController';
import { getValidLoopRange } from '../utils/markerTags';

export function useLoopPlayback(
  controller: PracticePlayerController | null,
  markers: PracticeMarker[],
) {
  useEffect(() => {
    if (!controller) {
      return;
    }

    const loopRange = getValidLoopRange(markers);

    if (loopRange.start === null && loopRange.end === null) {
      controller.clearLoop();
      return;
    }

    controller.setLoop(loopRange.start, loopRange.end);
  }, [controller, markers]);
}
