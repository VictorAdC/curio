import { LocalMediaAdapter } from '../adapters/localMediaAdapter';
import { YouTubePlayerAdapter } from '../adapters/youtubePlayerAdapter';
import type { PlaybackAdapter, PracticeMediaSource } from '../types/practicePlayer';
import { PracticeError } from '../utils/errors';

interface PracticePlayerControllerOptions {
  getMediaElement: (kind: PracticeMediaSource['kind']) => HTMLAudioElement | HTMLVideoElement | null;
  youtubeElementId: string;
  onTimeUpdate: (currentTime: number) => void;
  onDurationChange: (duration: number) => void;
  onPlaybackChange: (isPlaying: boolean) => void;
  onReady: () => void;
}

export class PracticePlayerController {
  private adapter: PlaybackAdapter | null = null;

  constructor(private options: PracticePlayerControllerOptions) {}

  async load(source: PracticeMediaSource) {
    this.adapter?.destroy();
    this.resetMediaSurfaces();

    if (source.kind === 'youtube') {
      this.adapter = new YouTubePlayerAdapter({
        elementId: this.options.youtubeElementId,
        onTimeUpdate: this.options.onTimeUpdate,
        onDurationChange: this.options.onDurationChange,
        onPlaybackChange: this.options.onPlaybackChange,
        onReady: this.options.onReady,
      });
    } else {
      const mediaElement = this.options.getMediaElement(source.kind);

      if (!mediaElement) {
        throw new PracticeError('MEDIA_ELEMENT_NOT_READY');
      }

      this.adapter = new LocalMediaAdapter({
        mediaElement,
        onTimeUpdate: this.options.onTimeUpdate,
        onDurationChange: this.options.onDurationChange,
        onPlaybackChange: this.options.onPlaybackChange,
        onReady: this.options.onReady,
      });
    }

    return this.adapter.load(source);
  }

  play() {
    return this.adapter?.play();
  }

  pause() {
    this.adapter?.pause();
  }

  seek(seconds: number) {
    this.adapter?.seek(seconds);
  }

  jumpBy(deltaSeconds: number) {
    this.adapter?.jumpBy(deltaSeconds);
  }

  setPlaybackRate(rate: number) {
    this.adapter?.setPlaybackRate(rate);
  }

  getPlaybackRate() {
    return this.adapter?.getPlaybackRate() ?? 1;
  }

  getDuration() {
    return this.adapter?.getDuration() ?? 0;
  }

  getCurrentTime() {
    return this.adapter?.getCurrentTime() ?? 0;
  }

  setLoop(startSeconds: number | null, endSeconds: number | null) {
    this.adapter?.setLoop(startSeconds, endSeconds);
  }

  clearLoop() {
    this.adapter?.clearLoop();
  }

  destroy() {
    this.adapter?.destroy();
    this.resetMediaSurfaces();
    this.adapter = null;
  }

  private resetMediaSurfaces() {
    const audioElement = this.options.getMediaElement('local-audio');
    const videoElement = this.options.getMediaElement('local-video');

    for (const element of [audioElement, videoElement]) {
      if (!element) {
        continue;
      }

      element.pause();
      element.removeAttribute('src');
      element.load();
    }

    const youtubeRoot = document.getElementById(this.options.youtubeElementId);

    if (youtubeRoot) {
      youtubeRoot.replaceChildren();
    }
  }
}
