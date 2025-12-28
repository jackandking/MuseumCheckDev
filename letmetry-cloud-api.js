// Helper for interacting with letmetry.cloud minimal API (file upload + poster publish)
// Supports configurable base URL and optional API key stored in localStorage under 'letmetry_api_key'

const LetmetryAPI = (function(){
  const DEFAULT_BASE = 'https://letmetry.cloud';
  let base = DEFAULT_BASE;
  let apiKey = (typeof window !== 'undefined') ? (localStorage.getItem('letmetry_api_key') || window.LETMETRY_API_KEY || '') : '';

  function setApiKey(key) {
    apiKey = key || '';
    try { if (typeof localStorage !== 'undefined') localStorage.setItem('letmetry_api_key', apiKey); } catch(e){}
  }
  function getApiKey(){ return apiKey; }

  function setBaseUrl(url){ if (url) base = url.replace(/\/+$/,''); }
  function getBaseUrl(){ return base; }

  async function _fetchJson(url, opts = {}){
    const headers = opts.headers || {};
    if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey;
    const res = await fetch(url, Object.assign({}, opts, { headers }));
    if (!res.ok) {
      const text = await res.text().catch(()=>null);
      const err = new Error(text || `${res.status} ${res.statusText}`);
      err.response = res;
      throw err;
    }
    return res.json().catch(()=>null);
  }

  function _normalizeToPublicImageUrl(pathOrFilename) {
    if (!pathOrFilename) return null;
    // If it's already a full URL, return as-is
    try {
      const u = new URL(pathOrFilename);
      if (u.protocol && u.host) return pathOrFilename;
    } catch (e) {}

    // If contains '/images/' segment, take the basename after that
    const imagesIdx = pathOrFilename.indexOf('/images/');
    let filename = null;
    if (imagesIdx !== -1) {
      filename = pathOrFilename.substring(imagesIdx + '/images/'.length);
    } else {
      // Otherwise use last path segment as filename
      const parts = pathOrFilename.split('/').filter(Boolean);
      filename = parts.length ? parts[parts.length - 1] : pathOrFilename;
    }
    if (!filename) return null;
    return base.replace(/\/+$/,'') + '/images/' + filename;
  }

  // Upload to /file/upload (general file) and /image/upload (image)
  async function tryUploadTo(url, form, headers) {
    try {
      const res = await fetch(url, { method: 'POST', body: form, headers });
      if (!res.ok) return { ok: false, status: res.status, text: await res.text().catch(()=>null) };
      const json = await res.json().catch(()=>null);
      // Prefer explicit URL fields
      let extracted = json && (json.url || json.fileUrl || json.imageUrl || (json.data && json.data.url));
      if (!extracted) {
        // Try filename or path fields and normalize to public images URL
        const candidate = json && (json.path || json.filename || json.originalname || json.file || (json.data && (json.data.path || json.data.filename)));
        extracted = _normalizeToPublicImageUrl(candidate);
      }
      return { ok: true, raw: json, url: extracted };
    } catch (e) {
      return { ok: false, error: e };
    }
  }

  async function uploadFile(file /* File or Blob */) {
    const form = new FormData();
    form.append('file', file, file.name || 'poster.png');

    const headers = {};
    if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey;

    // Candidate endpoints (try in order): prefer /image/upload
    const host = base.replace(/\/+$/,'');
    const candidates = [
      `${host}/image/upload`,
      `${host}/file/upload`,
      `${host}/file/list`,
      `${host}/files`,
      `${host}/api/v1/files`,
      `${host}/upload`
    ];

    for (const endpoint of candidates) {
      const result = await tryUploadTo(endpoint, form, headers);
      if (result.ok) {
        const url = result.url || (result.raw && (result.raw.path || result.raw.filename || result.raw.filepath)) || null;
        const normalized = _normalizeToPublicImageUrl(url) || url;
        return { raw: result.raw, url: normalized };
      }
    }

    throw new Error('所有上传端点均失败');
  }

  async function uploadImage(file /* File or Blob */) {
    const form = new FormData();
    form.append('file', file, file.name || 'poster.png');
    const headers = {};
    if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey;
    const resp = await fetch(`${base}/image/upload`, { method: 'POST', body: form, headers });
    if (!resp.ok) {
      const text = await resp.text().catch(()=>null);
      throw new Error('上传失败: ' + (text || resp.status));
    }
    const json = await resp.json().catch(()=>null);
    const filename = json && (json.filename || json.originalname || null);
    const path = json && (json.path || null);
    const candidate = path || filename || null;
    const url = _normalizeToPublicImageUrl(candidate) || (path ? (base.replace(/\/$/,'') + path) : (filename ? base.replace(/\/$/,'') + '/images/' + filename : null));
    return { raw: json, filename, path, url };
  }

  async function listFiles() {
    return await _fetchJson(`${base}/file/list`, { method: 'GET' });
  }

  // Insert a record into a MySQL table via Letmetry API
  async function insertRecord(table, data) {
    if (!table || !data) throw new Error('table and data are required');
    const url = `${base}/mysql/insert`;
    const body = JSON.stringify({ table, data });
    return await _fetchJson(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json' } });
  }

  // Publish poster: upload image (image/upload) and optionally return URL
  async function publishPoster({ file /* File|Blob */, title, userName }) {
    // Upload via image/upload if available
    const upload = await uploadImage(file);
    const imageUrl = upload.url || _normalizeToPublicImageUrl(upload.path || upload.filename) || (upload.path ? base.replace(/\/$/,'') + upload.path : null);
    return { uploaded: upload, imageUrl, title: title || '', userName: userName || '' };
  }

  return { uploadFile, uploadImage, listFiles, publishPoster, insertRecord, setApiKey, getApiKey, setBaseUrl, getBaseUrl, DEFAULT_BASE };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = LetmetryAPI;

// Backwards-compatible alias for browser
if (typeof window !== 'undefined') window.LetmetryAPI = LetmetryAPI;
