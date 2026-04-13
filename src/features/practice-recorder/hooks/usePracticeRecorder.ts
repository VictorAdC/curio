import { useEffect, useMemo, useRef, useState } from 'react';

export type RecordingMode = 'audio' | 'video' | 'both';
export interface RecorderInputDevice {
  deviceId: string;
  label: string;
}

function canRecordInBrowser() {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined'
  );
}

function getConstraints(
  mode: RecordingMode,
  options?: {
    audioDeviceId?: string | null;
    videoDeviceId?: string | null;
  },
): MediaStreamConstraints {
  const audioConstraint = options?.audioDeviceId
    ? { deviceId: { exact: options.audioDeviceId } }
    : true;
  const videoConstraint = options?.videoDeviceId
    ? { deviceId: { exact: options.videoDeviceId } }
    : true;

  if (mode === 'audio') {
    return { audio: audioConstraint, video: false };
  }

  if (mode === 'video') {
    return { audio: false, video: videoConstraint };
  }

  return { audio: audioConstraint, video: videoConstraint };
}

function getMimeType(mode: RecordingMode) {
  const preferred =
    mode === 'audio'
      ? ['audio/webm;codecs=opus', 'audio/webm']
      : ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];

  return preferred.find((value) => MediaRecorder.isTypeSupported(value));
}

export function usePracticeRecorder() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<RecordingMode>('audio');
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingMimeType, setRecordingMimeType] = useState<string | null>(null);
  const [recordedMode, setRecordedMode] = useState<RecordingMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [livePreviewStream, setLivePreviewStream] = useState<MediaStream | null>(null);
  const [audioInputs, setAudioInputs] = useState<RecorderInputDevice[]>([]);
  const [videoInputs, setVideoInputs] = useState<RecorderInputDevice[]>([]);
  const [selectedAudioInputId, setSelectedAudioInputId] = useState<string | null>(null);
  const [selectedVideoInputId, setSelectedVideoInputId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const livePreviewStreamRef = useRef<MediaStream | null>(null);
  const recordingUrlRef = useRef<string | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopStream = () => {
    livePreviewStreamRef.current?.getTracks().forEach((track) => track.stop());
    livePreviewStreamRef.current = null;
    setLivePreviewStream(null);
  };

  const resetRecordingUrl = () => {
    if (recordingUrlRef.current) {
      URL.revokeObjectURL(recordingUrlRef.current);
    }

    recordingUrlRef.current = null;
    setRecordingUrl(null);
  };

  useEffect(() => {
    livePreviewStreamRef.current = livePreviewStream;
  }, [livePreviewStream]);

  useEffect(() => {
    recordingUrlRef.current = recordingUrl;
  }, [recordingUrl]);

  useEffect(() => {
    return () => {
      clearTimer();
      stopStream();
      if (recordingUrlRef.current) {
        URL.revokeObjectURL(recordingUrlRef.current);
      }
    };
  }, []);

  const refreshDevices = async (fallbackLabels?: {
    audio: string;
    video: string;
  }) => {
    if (!canRecordInBrowser()) {
      return;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const nextAudioInputs = devices
      .filter((device) => device.kind === 'audioinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `${fallbackLabels?.audio ?? 'Audio input'} ${index + 1}`,
      }));
    const nextVideoInputs = devices
      .filter((device) => device.kind === 'videoinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `${fallbackLabels?.video ?? 'Video input'} ${index + 1}`,
      }));

    setAudioInputs(nextAudioInputs);
    setVideoInputs(nextVideoInputs);
    setSelectedAudioInputId((current) =>
      current && nextAudioInputs.some((device) => device.deviceId === current)
        ? current
        : nextAudioInputs[0]?.deviceId ?? null,
    );
    setSelectedVideoInputId((current) =>
      current && nextVideoInputs.some((device) => device.deviceId === current)
        ? current
        : nextVideoInputs[0]?.deviceId ?? null,
    );
  };

  const startRecording = async (messages: {
    unsupported: string;
    permissionDenied: string;
    generic: string;
    audioInputLabel: string;
    videoInputLabel: string;
  }) => {
    if (!canRecordInBrowser()) {
      setError(messages.unsupported);
      return;
    }

    try {
      resetRecordingUrl();
      setRecordingMimeType(null);
      setError(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia(
        getConstraints(mode, {
          audioDeviceId: selectedAudioInputId,
          videoDeviceId: selectedVideoInputId,
        }),
      );
      const activeMode = mode;
      const mimeType = getMimeType(mode);
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      setLivePreviewStream(stream);

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener('stop', () => {
        const finalMimeType = recorder.mimeType || mimeType || (activeMode === 'audio' ? 'audio/webm' : 'video/webm');
        const blob = new Blob(chunksRef.current, { type: finalMimeType });
        const nextUrl = URL.createObjectURL(blob);

        setRecordingMimeType(finalMimeType);
        setRecordedMode(activeMode);
        recordingUrlRef.current = nextUrl;
        setRecordingUrl(nextUrl);
        setIsRecording(false);
        clearTimer();
        stopStream();
      });

      recorder.start();
      void refreshDevices({
        audio: messages.audioInputLabel,
        video: messages.videoInputLabel,
      });
      setElapsedSeconds(0);
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((current) => current + 1);
      }, 1000);
    } catch (error) {
      const nextError =
        error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')
          ? messages.permissionDenied
          : messages.generic;

      setError(nextError);
      setIsRecording(false);
      clearTimer();
      stopStream();
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return;
    }

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
  };

  const downloadRecording = (baseName: string) => {
    if (!recordingUrl) {
      return;
    }

    const extension = recordingMimeType?.includes('audio/') ? 'webm' : 'webm';
    const anchor = document.createElement('a');
    anchor.href = recordingUrl;
    anchor.download = `${baseName}.${extension}`;
    anchor.click();
  };

  const view = useMemo(
    () => ({
      supported: canRecordInBrowser(),
      isOpen,
      mode,
      isRecording,
      elapsedSeconds,
      hasRecording: !!recordingUrl,
      recordingUrl,
      recordedMode,
      audioInputs,
      videoInputs,
      selectedAudioInputId,
      selectedVideoInputId,
      hasLiveVideo: mode !== 'audio' && !!livePreviewStream,
      hasLiveAudio: !!livePreviewStream?.getAudioTracks().length,
      livePreviewStream,
      error,
    }),
    [
      audioInputs,
      elapsedSeconds,
      error,
      isOpen,
      isRecording,
      livePreviewStream,
      mode,
      recordedMode,
      recordingUrl,
      selectedAudioInputId,
      selectedVideoInputId,
      videoInputs,
    ],
  );

  const actions = {
    setOpen(nextOpen: boolean) {
      setIsOpen(nextOpen);
    },
    setMode(nextMode: RecordingMode) {
      setMode(nextMode);
    },
    setSelectedAudioInput(deviceId: string) {
      setSelectedAudioInputId(deviceId);
    },
    setSelectedVideoInput(deviceId: string) {
      setSelectedVideoInputId(deviceId);
    },
    refreshDevices,
    startRecording,
    stopRecording,
    downloadRecording,
    clearError() {
      setError(null);
    },
  };

  return { view, actions };
}
