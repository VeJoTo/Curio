/** Public Giphy CDN URL for the animated WebP rendition of a GIF id. No API key needed. */
export function giphyGifUrl(id: string): string {
  return `https://media.giphy.com/media/${id}/giphy.webp`;
}
