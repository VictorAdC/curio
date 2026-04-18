import { useEffect } from 'react';
import type { PracticeMarker } from '../types/practicePlayer';
import { PracticePlayerController } from '../controllers/practicePlayerController';
import { getEffectiveLoopRange } from '../utils/markerTags';

export function useLoopPlayback(
  controller: PracticePlayerController | null,
  markers: PracticeMarker[],
  duration: number,
) {
  useEffect(() => {
    if (!controller) {
      return;
    }

    const loopRange = getEffectiveLoopRange(markers, duration);

    if (loopRange.start === null && loopRange.end === null) {
      controller.clearLoop();
      return;
    }

    controller.setLoop(loopRange.start, loopRange.end);
  }, [controller, duration, markers]);
}
