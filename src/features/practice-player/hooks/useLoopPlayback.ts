import { useEffect } from 'react';
import type { PracticeMarker } from '../types/practicePlayer';
import { PracticePlayerController } from '../controllers/practicePlayerController';

export function useLoopPlayback(
  controller: PracticePlayerController | null,
  markers: PracticeMarker[],
  startMarkerId: string | null,
  endMarkerId: string | null,
) {
  useEffect(() => {
    if (!controller) {
      return;
    }

    const startMarker = markers.find((marker) => marker.id === startMarkerId);
    const endMarker = markers.find((marker) => marker.id === endMarkerId);

    if (!startMarker || !endMarker || startMarker.timestampSeconds >= endMarker.timestampSeconds) {
      controller.clearLoop();
      return;
    }

    controller.setLoop(startMarker.timestampSeconds, endMarker.timestampSeconds);
  }, [controller, endMarkerId, markers, startMarkerId]);
}
