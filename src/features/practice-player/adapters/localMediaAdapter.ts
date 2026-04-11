import type { PlaybackAdapter, PracticeMediaSource } from '../types/practicePlayer';
import { clampTime } from '../utils/time';

interface LocalMediaAdapterOptions {
  mediaElement: HTMLMediaElement;
  onTimeUpdate: (currentTime: number) => void;
  onDurationChange: (duration: number) => void;
  onPlaybackChange: (isPlaying: boolean) => void;
  onReady: () => void;
}

export class LocalMediaAdapter implements PlaybackAdapter {
  private loopStart: number | null = null;
  private loopEnd: number | null = null;

  constructor(private options: LocalMediaAdapterOptions) {
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
    this.handleLoadedMetadata = this.handleLoadedMetadata.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.handlePause = this.handlePause.bind(this);

    this.options.mediaElement.addEventListener('timeupdate', this.handleTimeUpdate);
    this.options.mediaElement.addEventListener('loadedmetadata', this.handleLoadedMetadata);
    this.options.mediaElement.addEventListener('play', this.handlePlay);
    this.options.mediaElement.addEventListener('pause', this.handlePause);
  }

  async load(source: PracticeMediaSource) {
    const objectUrl = source.sourceRef.objectUrl;

    if (!objectUrl) {
      throw new Error('Missing local media URL');
    }

    this.clearLoop();
    this.options.mediaElement.src = objectUrl;
    this.options.mediaElement.load();
  }

  play() {
    return this.options.mediaElement.play();
  }

  pause() {
    this.options.mediaElement.pause();
  }

  seek(seconds: number) {
    this.options.mediaElement.currentTime = clampTime(seconds, this.getDuration());
    this.options.onTimeUpdate(this.options.mediaElement.currentTime);
  }

  jumpBy(deltaSeconds: number) {
    this.seek(this.getCurrentTime() + deltaSeconds);
  }

  getDuration() {
    return Number.isFinite(this.options.mediaElement.duration) ? this.options.mediaElement.duration : 0;
  }

  getCurrentTime() {
    return this.options.mediaElement.currentTime;
  }

  setLoop(startSeconds: number, endSeconds: number | null) {
    this.loopStart = startSeconds;
    this.loopEnd = endSeconds;
  }

  clearLoop() {
    this.loopStart = null;
    this.loopEnd = null;
  }

  destroy() {
    this.options.mediaElement.removeEventListener('timeupdate', this.handleTimeUpdate);
    this.options.mediaElement.removeEventListener('loadedmetadata', this.handleLoadedMetadata);
    this.options.mediaElement.removeEventListener('play', this.handlePlay);
    this.options.mediaElement.removeEventListener('pause', this.handlePause);
  }

  private handleTimeUpdate() {
    const currentTime = this.options.mediaElement.currentTime;

    if (this.loopStart !== null && this.loopEnd !== null && currentTime >= this.loopEnd) {
      this.options.mediaElement.currentTime = this.loopStart;
      this.options.onTimeUpdate(this.loopStart);
      return;
    }

    this.options.onTimeUpdate(currentTime);
  }

  private handleLoadedMetadata() {
    this.options.onDurationChange(this.getDuration());
    this.options.onReady();
  }

  private handlePlay() {
    this.options.onPlaybackChange(true);
  }

  private handlePause() {
    this.options.onPlaybackChange(false);
  }
}
