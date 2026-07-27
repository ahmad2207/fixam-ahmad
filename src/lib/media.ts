const VIDEO_EXTENSION_RE = /\.(mp4|mov|webm|m4v)(\?.*)?$/i;

export function isVideoUrl(url: string): boolean {
  return VIDEO_EXTENSION_RE.test(url);
}
