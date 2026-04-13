declare global {
  interface YouTubePlayer {
    destroy(): void;
    pauseVideo(): void;
    playVideo(): void;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
    setPlaybackRate(rate: number): void;
    getPlaybackRate(): number;
    getCurrentTime(): number;
    getDuration(): number;
    cueVideoById(videoId: string): void;
  }

  interface YouTubePlayerEvent {
    target: YouTubePlayer;
  }

  interface YouTubePlayerOptions {
    videoId: string;
    playerVars?: Record<string, string | number>;
    events?: {
      onReady?: (event: YouTubePlayerEvent) => void;
    };
  }

  interface YouTubeNamespace {
    Player: new (elementId: string, options: YouTubePlayerOptions) => YouTubePlayer;
  }

  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export {};
