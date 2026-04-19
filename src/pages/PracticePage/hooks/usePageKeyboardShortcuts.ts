import { useEffect } from 'react';

interface KeyboardShortcutActions {
  togglePlayback: () => void;
  jumpBy: (delta: number) => void;
  addMarker: () => void;
  clearLoop: () => void;
}

interface RecorderShortcutActions {
  toggleRecordingPlayback: () => void;
  stopRecording: () => void;
  startRecording: (messages: RecorderMessages) => Promise<void>;
}

interface RecorderMessages {
  unsupported: string;
  permissionDenied: string;
  generic: string;
  audioInputLabel: string;
  videoInputLabel: string;
}

interface Options {
  actions: KeyboardShortcutActions;
  recorderActions: RecorderShortcutActions;
  isRecording: boolean;
  hasSource: boolean;
  recorderMessages: RecorderMessages;
  onOpenRecorder: () => void;
}

export function usePageKeyboardShortcuts({
  actions,
  recorderActions,
  isRecording,
  hasSource,
  recorderMessages,
  onOpenRecorder,
}: Options) {
  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tagName = target.tagName.toLowerCase();
      return (
        target.isContentEditable ||
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        tagName === 'option'
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === ' ') {
        const el = event.target instanceof HTMLElement ? event.target : null;
        const tag = el?.tagName.toLowerCase() ?? '';
        const isTextEntry =
          el?.isContentEditable ||
          (tag === 'input' &&
            !['button', 'checkbox', 'radio', 'submit', 'reset', 'file', 'image'].includes(
              (el as HTMLInputElement).type,
            )) ||
          tag === 'textarea';
        if (!isTextEntry) {
          event.preventDefault();
          actions.togglePlayback();
        }
        return;
      }

      if (isTypingTarget(event.target)) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); actions.jumpBy(-5); return; }
      if (event.key === 'ArrowRight') { event.preventDefault(); actions.jumpBy(5); return; }
      if (event.key.toLowerCase() === 'm') { event.preventDefault(); actions.addMarker(); return; }
      if (event.key.toLowerCase() === 'l') { event.preventDefault(); actions.clearLoop(); return; }
      if (event.key.toLowerCase() === 'p') { event.preventDefault(); recorderActions.toggleRecordingPlayback(); return; }
      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        onOpenRecorder();
        if (isRecording) { recorderActions.stopRecording(); return; }
        if (!hasSource) return;
        void recorderActions.startRecording(recorderMessages);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, recorderActions, isRecording, hasSource, recorderMessages, onOpenRecorder]);
}
