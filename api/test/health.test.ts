import { describe, it, expect } from 'vitest';
import app from '../src/index.js';

describe('GET /health', () => {
  it('returns 200 with ok payload', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ status: 'ok', service: 'curio-api' });
  });

  it('unknown routes return 404', async () => {
    const res = await app.request('/nope');
    expect(res.status).toBe(404);
  });
});
