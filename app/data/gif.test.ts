import { describe, expect, it } from 'vitest';
import { giphyGifUrl } from './gif';

describe('giphyGifUrl', () => {
  it('builds the public Giphy CDN webp URL for an id', () => {
    expect(giphyGifUrl('lp8JOW74nExzvnPdjV')).toBe(
      'https://media.giphy.com/media/lp8JOW74nExzvnPdjV/giphy.webp',
    );
  });

  it('uses the exact id without encoding (Giphy ids are url-safe)', () => {
    expect(giphyGifUrl('abc123')).toBe('https://media.giphy.com/media/abc123/giphy.webp');
  });
});
