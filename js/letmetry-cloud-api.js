// Helper for interacting with the MuseumCheck API (file upload + poster publish)
// Supports configurable base URL and optional API key stored in localStorage under 'letmetry_api_key'

const LetmetryAPI = (function(){
  // 使用集中配置，如果可用
  const DEFAULT_BASE = (typeof API_ENDPOINTS !== 'undefined') ? API_ENDPOINTS.BASE_URL : 'https://museumcheck.cn';
  let base = DEFAULT_BASE;
  let apiKey = (typeof window !== 'undefined') ? (localStorage.getItem('letmetry_api_key') || window.LETMETRY_API_KEY || '') : '';

  function setApiKey(key) {
    apiKey = key || '';
    try { if (typeof localStorage !== 'undefined') localStorage.setItem('letmetry_api_key', apiKey); } catch(e){}
  }
  function getApiKey(){ return apiKey; }

  function setBaseUrl(url){ if (url) base = url.replace(/\/+$/,''); }
  function getBaseUrl(){ return base; }

  function _normalizeLegacyImageUrl(url) {
    if (typeof API_ENDPOINTS !== 'undefined' && typeof API_ENDPOINTS.normalizeImageUrl === 'function') {
      return API_ENDPOINTS.normalizeImageUrl(url);
    }
    if (typeof window !== 'undefined' && typeof window.normalizeMuseumCheckImageUrl === 'function') {
      return window.normalizeMuseumCheckImageUrl(url);
    }
    return url;
  }

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
      if (u.protocol && u.host) return _normalizeLegacyImageUrl(pathOrFilename);
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
    return base.replace(/\/+$/,'') + '/images/' + encodeURIComponent(filename);
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
      extracted = _normalizeLegacyImageUrl(extracted);
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

  // Execute a raw SQL query via Letmetry MySQL endpoint
  // Returns an array of rows or an object with `rows` depending on server response
  async function queryMysql(sql, params = []) {
    if (!sql) throw new Error('sql is required');
    const url = `${base}/mysql/query`;
    const body = JSON.stringify({ sql, params });
    const res = await _fetchJson(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json' } });
    // _fetchJson returns parsed JSON or null. Normalize to array of rows when possible.
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.rows)) return res.rows;
    // Some endpoints may wrap in { data: [...] }
    if (Array.isArray(res.data)) return res.data;
    return [];
  }

  // Update a record in a MySQL table via Letmetry API
  async function updateRecord(table, id, data) {
    if (!table || (!id && id !== 0) || !data) throw new Error('table, id and data are required');
    const url = `${base}/mysql/update`;
    const body = JSON.stringify({ table, id, data });
    return await _fetchJson(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json' } });
  }

  // Delete a record in a MySQL table via Letmetry API
  async function deleteRecord(table, id) {
    if (!table || (!id && id !== 0)) throw new Error('table and id are required');
    const url = `${base}/mysql/delete`;
    const body = JSON.stringify({ table, id });
    return await _fetchJson(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json' } });
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

  /**
   * Verify if a museum exists in the official Chinese museum database
   * @param {string} museumName - The museum name to verify
   * @param {boolean} strictMode - If true, require exact match (default: false for fuzzy matching)
   * @returns {Promise<Object>} Verification result with status, matched museum data, and confidence score
   */
  async function verifyMuseumOfficial(museumName, strictMode = false) {
    if (!museumName || typeof museumName !== 'string') {
      throw new Error('Museum name must be a non-empty string');
    }

    try {
      const response = await fetch(base + '/museum/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ museumName: museumName.trim() })
      });

      if (!response.ok) {
        return {
          status: 'error',
          error: `HTTP ${response.status}: ${response.statusText}`,
          verified: false,
          museumName,
          matches: [],
          timestamp: new Date().toISOString()
        };
      }

      const data = await response.json();

      if (!data.success) {
        return {
          status: 'not_found',
          error: data.error || 'Museum not found in official database',
          verified: false,
          museumName,
          matches: [],
          timestamp: new Date().toISOString()
        };
      }

      // Calculate similarity score for each match
      const searchTerm = museumName.toLowerCase();
      const scoredMatches = (data.museums || []).map(museum => {
        const museumNameLower = (museum.name || '').toLowerCase();
        
        // Exact match
        if (museumNameLower === searchTerm) {
          return { ...museum, score: 100, matchType: 'exact' };
        }
        
        // Starts with or contains match
        if (museumNameLower.includes(searchTerm) || searchTerm.includes(museumNameLower)) {
          return { ...museum, score: 80, matchType: 'partial' };
        }
        
        // Levenshtein-like scoring for fuzzy match
        const similarity = calculateSimilarity(searchTerm, museumNameLower);
        return { ...museum, score: Math.round(similarity * 100), matchType: 'fuzzy' };
      });

      // Sort by score descending
      scoredMatches.sort((a, b) => b.score - a.score);

      const bestMatch = scoredMatches[0];
      const verified = strictMode ? (bestMatch?.score >= 100) : (bestMatch?.score >= 60);

      return {
        status: 'success',
        verified,
        museumName,
        strictMode,
        bestMatch: bestMatch || null,
        allMatches: scoredMatches,
        totalResults: data.count,
        timestamp: new Date().toISOString(),
        officialMetadata: {
          matchName: bestMatch?.name,
          matchProvince: bestMatch?.province,
          qualityGrade: bestMatch?.qualityGrade,
          collectionCount: bestMatch?.collectionCount,
          preciousArtifactsCount: bestMatch?.preciousArtifactsCount,
          educationalActivitiesCount: bestMatch?.educationalActivitiesCount,
          visitorCount: bestMatch?.visitorCount
        }
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        verified: false,
        museumName,
        matches: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Simple Levenshtein-like similarity calculator (0-1)
   * @private
   */
  function calculateSimilarity(str1, str2) {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;
    
    let matches = 0;
    for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
      if (str1[i] === str2[i]) matches++;
    }
    return matches / maxLen;
  }

  return { uploadFile, uploadImage, listFiles, publishPoster, insertRecord, queryMysql, updateRecord, deleteRecord, setApiKey, getApiKey, setBaseUrl, getBaseUrl, verifyMuseumOfficial, DEFAULT_BASE };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = LetmetryAPI;

// Backwards-compatible alias for browser
if (typeof window !== 'undefined') window.LetmetryAPI = LetmetryAPI;
