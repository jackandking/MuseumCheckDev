const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * UT: Validate Pinghu Museum collections image URLs
 * - Structure: non-empty, has name/url, absolute https, host www.pinghumuseum.com (port optional 9001)
 * - Path includes kindeditorupload/image and has image extension
 * - Network check: each URL returns HTTP 2xx/3xx and content-type image/* (best-effort; small timeout)
 */

describe('Pinghu Museum collections URLs', () => {
  beforeAll(() => {
    const filePath = path.join(__dirname, '..', 'museums', 'pinghu-museum.js');
    expect(fs.existsSync(filePath)).toBe(true);
    delete require.cache[filePath];
    require(filePath); // defines window.MUSEUM_PINGHU
  });

  test('collections have valid image URL format', () => {
    const museum = window && window.MUSEUM_PINGHU;
    expect(museum).toBeTruthy();
    expect(Array.isArray(museum.collections)).toBe(true);
    expect(museum.collections.length).toBeGreaterThanOrEqual(1);

    const imgExtRe = /\.(png|jpe?g|webp|gif|bmp)$/i;

    museum.collections.forEach((item) => {
      expect(item && typeof item.name === 'string' && item.name.trim().length > 0).toBe(true);
      expect(item && typeof item.imageUrl === 'string' && item.imageUrl.trim().length > 0).toBe(true);

      let u;
      try { u = new URL(item.imageUrl); } catch { u = null; }
      expect(u).toBeTruthy();
      expect(u.protocol).toBe('https:');
      expect(u.hostname).toBe('www.pinghumuseum.com');
      if (u.port) expect(['9001', ''].includes(u.port)).toBe(true);
      expect(u.pathname.includes('/kindeditorupload/image/')).toBe(true);
      expect(imgExtRe.test(u.pathname)).toBe(true);
    });
  });

  test('collections image URLs respond with image content', async () => {
    const museum = window && window.MUSEUM_PINGHU;
    const urls = (museum.collections || []).map(i => i.imageUrl).filter(Boolean);

    const headOrGet = (url) => new Promise((resolve) => {
      // Try HEAD first, fallback to GET
      const doReq = (method) => {
        const req = https.request(url, { method, timeout: 8000 }, (res) => {
          const status = res.statusCode || 0;
          const type = String(res.headers['content-type'] || '');
          res.resume(); // discard body
          resolve({ ok: status >= 200 && status < 400, status, type });
        });
        req.on('timeout', () => { req.destroy(new Error('timeout')); });
        req.on('error', () => resolve({ ok: false, status: 0, type: '' }));
        req.end();
      };
      doReq('HEAD');
    }).then(r => r.ok ? r : new Promise((resolve) => {
      const req = https.request(url, { method: 'GET', timeout: 8000 }, (res) => {
        const status = res.statusCode || 0;
        const type = String(res.headers['content-type'] || '');
        res.resume();
        resolve({ ok: status >= 200 && status < 400, status, type });
      });
      req.on('timeout', () => { req.destroy(new Error('timeout')); });
      req.on('error', () => resolve({ ok: false, status: 0, type: '' }));
      req.end();
    }));

    const results = await Promise.all(urls.map(headOrGet));

    results.forEach((r, idx) => {
      expect(r.ok).toBe(true);
      expect(r.type.toLowerCase().startsWith('image/')).toBe(true);
    });
  }, 30000);
});
