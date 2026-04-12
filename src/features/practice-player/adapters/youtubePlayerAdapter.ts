import type { PlaybackAdapter, PracticeMediaSource } from '../types/practicePlayer';
import { PracticeError } from '../utils/errors';
import { clampTime } from '../utils/time';

interface YouTubeAdapterOptions {
  elementId: string;
  onTimeUpdate: (currentTime: number) => void;
  onDurationChange: (duration: number) => void;
  onPlaybackChange: (isPlaying: boolean) => void;
  onReady: () => void;
}

let youtubeApiPromise: Promise<YouTubeNamespace> | null = null;

function loadYouTubeApi() {
  if (window.YT) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;

    window.onYouTubeIframeAPIReady = () => {
      if (window.YT) {
        resolve(window.YT);
      }
    };

    document.body.append(script);
  });

  return youtubeApiPromise;
}

export class YouTubePlayerAdapter implements PlaybackAdapter {
  private player: YouTubePlayer | null = null;
  private loopStart: number | null = null;
  private loopEnd: number | null = null;
  private frameHandle: number | null = null;

  constructor(private options: YouTubeAdapterOptions) {}

  async load(source: PracticeMediaSource) {
    const videoId = source.sourceRef.youtubeVideoId;

    if (!videoId) {
      throw new PracticeError('YOUTUBE_VIDEO_ID_MISSING');
    }

    const yt = await loadYouTubeApi();

    if (this.player) {
      this.player.cueVideoById(videoId);
      this.options.onDurationChange(this.player.getDuration());
      this.options.onReady();
      this.startPolling();
      return;
    }

    this.player = new yt.Player(this.options.elementId, {
      videoId,
      playerVars: {
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: (event: YouTubePlayerEvent) => {
          this.player = event.target;
          this.options.onDurationChange(event.target.getDuration());
          this.options.onReady();
          this.startPolling();
        },
      },
    });
  }

  play() {
    this.player?.playVideo();
    this.options.onPlaybackChange(true);
  }

  pause() {
    this.player?.pauseVideo();
    this.options.onPlaybackChange(false);
  }

  seek(seconds: number) {
    if (!this.player) {
      return;
    }

    const nextTime = clampTime(seconds, this.getDuration());
    this.player.seekTo(nextTime, true);
    this.options.onTimeUpdate(nextTime);
  }

  jumpBy(deltaSeconds: number) {
    this.seek(this.getCurrentTime() + deltaSeconds);
  }

  getDuration() {
    return this.player?.getDuration() ?? 0;
  }

  getCurrentTime() {
    return this.player?.getCurrentTime() ?? 0;
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
    if (this.frameHandle) {
      window.cancelAnimationFrame(this.frameHandle);
      this.frameHandle = null;
    }

    this.player?.pauseVideo();
    this.player?.destroy();
    this.player = null;
  }

  private startPolling() {
    if (this.frameHandle) {
      window.cancelAnimationFrame(this.frameHandle);
    }

    const tick = () => {
      const currentTime = this.getCurrentTime();

      if (this.loopStart !== null && this.loopEnd !== null && currentTime >= this.loopEnd) {
        this.seek(this.loopStart);
      } else {
        this.options.onTimeUpdate(currentTime);
        this.options.onDurationChange(this.getDuration());
      }

      this.frameHandle = window.requestAnimationFrame(tick);
    };

    this.frameHandle = window.requestAnimationFrame(tick);
  }
}
