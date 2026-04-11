const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube\.com\/embed\/)([\w-]{11})/,
];

export function parseYouTubeVideoId(url: string) {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);

    if (match) {
      return match[1];
    }
  }

  return null;
}
