(function() {
  'use strict';

  const CHECK_TIMEOUT_MS = 6000;
  const LEGACY_IMAGE_SAMPLE = 'https://letmetry.cloud/images/beijing-capital-museum_user_sadj28r2c_1767511470653.png';
  const state = {
    deployment: null,
    checks: []
  };

  const $ = id => document.getElementById(id);

  function setText(id, value) {
    const element = $(id);
    if (!element) return;
    element.textContent = value == null || value === '' ? '-' : String(value);
  }

  function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('zh-CN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function absoluteUrl(pathOrUrl) {
    try {
      return new URL(pathOrUrl, window.location.href).href;
    } catch (error) {
      return String(pathOrUrl || '');
    }
  }

  function cacheBustedUrl(pathOrUrl) {
    const url = new URL(absoluteUrl(pathOrUrl));
    url.searchParams.set('_debug_ts', Date.now().toString());
    return url.href;
  }

  function endpointOrigin(endpoint) {
    if (endpoint == null) return '-';
    const url = absoluteUrl(endpoint || '/');
    try {
      return new URL(url).origin;
    } catch (error) {
      return '-';
    }
  }

  function endpointLabel(endpoint) {
    if (endpoint == null) return '-';
    if (endpoint === '') return `${window.location.origin} (same-origin)`;
    return absoluteUrl(endpoint);
  }

  function getApiEndpoints() {
    return window.API_ENDPOINTS || {
      BASE_URL: '',
      HEALTH: '/health',
      MYSQL: { QUERY: '/mysql/query' },
      CDN: { IMAGES: '/images' },
      KV_STORE: ''
    };
  }

  async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
    const startedAt = performance.now();

    try {
      const response = await fetch(url, {
        cache: 'no-store',
        credentials: 'omit',
        signal: controller.signal,
        ...options
      });
      const durationMs = Math.round(performance.now() - startedAt);
      return { response, durationMs };
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function readTextResource(pathOrUrl, options = {}) {
    const url = options.cacheBust ? cacheBustedUrl(pathOrUrl) : absoluteUrl(pathOrUrl);
    const { response, durationMs } = await fetchWithTimeout(url);
    const body = await response.text();
    return { url, status: response.status, ok: response.ok, body, durationMs };
  }

  async function loadDeploymentMetadata() {
    try {
      const result = await readTextResource('./status.json', { cacheBust: true });
      const deployment = JSON.parse(result.body);
      state.deployment = deployment;
      $('metadataBadge').textContent = deployment.environment === 'repository-fallback' ? '占位' : '已生成';
      return deployment;
    } catch (error) {
      const deployment = {
        app: 'MuseumCheck',
        environment: 'metadata-unavailable',
        branch: 'unknown',
        commit: 'unknown',
        commitShort: 'unknown',
        workflow: 'unavailable',
        runId: 'unavailable',
        runAttempt: 'unavailable',
        deployedAt: null
      };
      state.deployment = deployment;
      $('metadataBadge').textContent = '不可用';
      return deployment;
    }
  }

  function renderDeployment(deployment) {
    setText('environmentValue', deployment.environment);
    setText('commitValue', deployment.commitShort || deployment.commit);
    setText('branchValue', deployment.branch);
    setText('workflowValue', deployment.workflow);
    setText('runValue', deployment.runId && deployment.runAttempt ? `${deployment.runId} / ${deployment.runAttempt}` : deployment.runId);
    setText('deployedAtValue', formatDate(deployment.deployedAt));
  }

  function renderRuntime() {
    const api = getApiEndpoints();
    const baseLabel = endpointLabel(api.BASE_URL);
    setText('hostValue', window.location.host);
    setText('pathValue', window.location.pathname);
    setText('viewportValue', `${window.innerWidth} x ${window.innerHeight}`);
    setText('timezoneValue', Intl.DateTimeFormat().resolvedOptions().timeZone || '-');
    setText('apiOriginValue', endpointOrigin(api.HEALTH || api.BASE_URL || '/'));
    setText('checkedAtValue', formatDate(new Date().toISOString()));
    setText('baseUrlValue', baseLabel);
    setText('healthEndpointValue', endpointLabel(api.HEALTH));
    setText('mysqlEndpointValue', endpointLabel(api.MYSQL && api.MYSQL.QUERY));
    setText('imageEndpointValue', endpointLabel(api.CDN && api.CDN.IMAGES));
    setText('kvEndpointValue', endpointLabel(api.KV_STORE));
  }

  function createCheckRow(check) {
    const row = document.createElement('li');
    row.className = 'check-row';
    row.dataset.checkName = check.id;
    row.dataset.state = check.state || 'pending';

    const copy = document.createElement('div');
    const name = document.createElement('span');
    name.className = 'check-name';
    name.textContent = check.name;
    const detail = document.createElement('span');
    detail.className = 'check-detail';
    detail.textContent = check.detail || '等待检查';
    copy.append(name, detail);

    const status = document.createElement('span');
    status.className = 'check-state';
    status.textContent = stateLabel(check.state || 'pending');

    row.append(copy, status);
    return row;
  }

  function stateLabel(checkState) {
    if (checkState === 'ok') return 'OK';
    if (checkState === 'warn') return 'WARN';
    if (checkState === 'fail') return 'FAIL';
    return 'PENDING';
  }

  function renderChecks() {
    const list = $('checksList');
    list.textContent = '';
    state.checks.forEach(check => list.appendChild(createCheckRow(check)));

    const failed = state.checks.filter(check => check.state === 'fail').length;
    const warned = state.checks.filter(check => check.state === 'warn').length;
    const pending = state.checks.filter(check => check.state === 'pending').length;
    const overall = $('overallStatus');

    if (pending > 0) {
      overall.dataset.state = 'pending';
      setText('overallStatusText', '检查中');
      setText('checksBadge', `${pending} 项检查中`);
    } else if (failed > 0) {
      overall.dataset.state = 'fail';
      setText('overallStatusText', `${failed} 项失败`);
      setText('checksBadge', `${failed} 失败`);
    } else if (warned > 0) {
      overall.dataset.state = 'warn';
      setText('overallStatusText', `${warned} 项警告`);
      setText('checksBadge', `${warned} 警告`);
    } else {
      overall.dataset.state = 'ok';
      setText('overallStatusText', '状态正常');
      setText('checksBadge', '全部通过');
    }

    renderSummary();
  }

  async function checkTextResource(id, name, pathOrUrl, expectedText, options = {}) {
    try {
      const result = await readTextResource(pathOrUrl, options);
      if (!result.ok) {
        return { id, name, state: 'fail', detail: `${result.status} ${result.url}` };
      }
      if (expectedText && !result.body.includes(expectedText)) {
        return { id, name, state: 'fail', detail: `缺少预期内容: ${expectedText}` };
      }
      return { id, name, state: 'ok', detail: `${result.status} ${result.durationMs}ms ${result.url}` };
    } catch (error) {
      return { id, name, state: 'fail', detail: error.message };
    }
  }

  async function checkHealthEndpoint() {
    const api = getApiEndpoints();
    const url = absoluteUrl(api.HEALTH || '/health');
    try {
      const { response, durationMs } = await fetchWithTimeout(url, { method: 'GET' });
      const stateValue = response.ok ? 'ok' : 'warn';
      return {
        id: 'api-health',
        name: 'API health',
        state: stateValue,
        detail: `${response.status} ${durationMs}ms ${url}`
      };
    } catch (error) {
      return {
        id: 'api-health',
        name: 'API health',
        state: 'warn',
        detail: `${error.message} ${url}`
      };
    }
  }

  function checkApiHosts() {
    const api = getApiEndpoints();
    const endpoints = [
      api.BASE_URL,
      api.HEALTH,
      api.MYSQL && api.MYSQL.QUERY,
      api.IMAGE && api.IMAGE.UPLOAD,
      api.CDN && api.CDN.IMAGES
    ].filter(endpoint => endpoint != null);
    const badEndpoint = endpoints.find(endpoint => {
      try {
        return new URL(endpoint || '/', window.location.origin).hostname.includes('letmetry.cloud');
      } catch (error) {
        return false;
      }
    });

    if (badEndpoint) {
      return {
        id: 'api-hosts',
        name: 'API host policy',
        state: 'fail',
        detail: `发现 letmetry.cloud: ${badEndpoint}`
      };
    }

    return {
      id: 'api-hosts',
      name: 'API host policy',
      state: 'ok',
      detail: '前端 API 路由未指向 letmetry.cloud'
    };
  }

  function checkLegacyImageRewrite() {
    const api = getApiEndpoints();
    const normalize = window.normalizeMuseumCheckImageUrl || (api && api.normalizeImageUrl && api.normalizeImageUrl.bind(api));
    const rewritten = normalize ? normalize(LEGACY_IMAGE_SAMPLE) : LEGACY_IMAGE_SAMPLE;
    const ok = rewritten.startsWith('https://museumcheck.cn/images/');
    return {
      id: 'legacy-image-rewrite',
      name: 'Legacy image rewrite',
      state: ok ? 'ok' : 'fail',
      detail: rewritten
    };
  }

  function checkDocumentResources() {
    const resources = performance.getEntriesByType('resource')
      .map(entry => entry.name)
      .filter(Boolean);
    const letmetryResources = resources.filter(resource => {
      try {
        return new URL(resource).hostname.includes('letmetry.cloud');
      } catch (error) {
        return false;
      }
    });

    return {
      id: 'runtime-resources',
      name: 'Runtime resource hosts',
      state: letmetryResources.length === 0 ? 'ok' : 'fail',
      detail: letmetryResources.length === 0 ? '本页资源未请求 letmetry.cloud' : letmetryResources.join(', ')
    };
  }

  async function runDiagnostics() {
    state.checks = [
      { id: 'metadata', name: 'Deployment metadata', state: 'pending', detail: '读取 status.json' },
      { id: 'debug-page', name: 'Debug page', state: 'pending', detail: '读取当前页面' },
      { id: 'api-config', name: 'API config script', state: 'pending', detail: '读取 config/api-endpoints.js' },
      { id: 'checkin-page', name: 'Check-in page', state: 'pending', detail: '读取 museum-checkin.html' },
      { id: 'checkin-js', name: 'Check-in script', state: 'pending', detail: '读取 js/museum-checkin.js' },
      { id: 'api-hosts', name: 'API host policy', state: 'pending', detail: '检查 API host' },
      { id: 'legacy-image-rewrite', name: 'Legacy image rewrite', state: 'pending', detail: '检查旧图片 URL 兼容' },
      { id: 'runtime-resources', name: 'Runtime resource hosts', state: 'pending', detail: '检查本页资源 host' }
    ];
    renderChecks();

    const deployment = await loadDeploymentMetadata();
    renderDeployment(deployment);
    renderRuntime();

    const asyncResults = await Promise.all([
      checkTextResource('metadata', 'Deployment metadata', './status.json', '"app"', { cacheBust: true }),
      checkTextResource('debug-page', 'Debug page', './', '部署与连通性状态', { cacheBust: true }),
      checkTextResource('api-config', 'API config script', '../../config/api-endpoints.js', 'API_ENDPOINTS', { cacheBust: true }),
      checkTextResource('checkin-page', 'Check-in page', '../../museum-checkin.html', 'museum-checkin.js', { cacheBust: true }),
      checkTextResource('checkin-js', 'Check-in script', '../../js/museum-checkin.js', 'museumcheck-visit-signals', { cacheBust: true })
    ]);

    state.checks = [
      ...asyncResults,
      checkApiHosts(),
      checkLegacyImageRewrite(),
      checkDocumentResources()
    ];
    renderChecks();
  }

  function buildSummary() {
    const deployment = state.deployment || {};
    const api = getApiEndpoints();
    const failed = state.checks.filter(check => check.state === 'fail');
    const warned = state.checks.filter(check => check.state === 'warn');
    const lines = [
      'MuseumCheck debug status',
      `URL: ${window.location.href}`,
      `Environment: ${deployment.environment || '-'}`,
      `Branch: ${deployment.branch || '-'}`,
      `Commit: ${deployment.commit || '-'}`,
      `Workflow: ${deployment.workflow || '-'} run ${deployment.runId || '-'}`,
      `Deployed at: ${deployment.deployedAt || '-'}`,
      `API health: ${endpointLabel(api.HEALTH)}`,
      `API health probe: ${$('apiHealthResult').textContent || '未检查'}`,
      `API base: ${endpointLabel(api.BASE_URL)}`,
      `Viewport: ${window.innerWidth}x${window.innerHeight}`,
      `Failures: ${failed.length ? failed.map(check => check.name).join(', ') : 'none'}`,
      `Warnings: ${warned.length ? warned.map(check => check.name).join(', ') : 'none'}`
    ];
    return lines.join('\n');
  }

  function renderSummary() {
    const output = $('summaryOutput');
    if (output) output.value = buildSummary();
  }

  async function copySummary() {
    const summary = buildSummary();
    const button = $('copySummaryButton');
    try {
      await navigator.clipboard.writeText(summary);
      button.textContent = '已复制';
      window.setTimeout(() => {
        button.textContent = '复制摘要';
      }, 1600);
    } catch (error) {
      const output = $('summaryOutput');
      output.focus();
      output.select();
      button.textContent = '请手动复制';
      window.setTimeout(() => {
        button.textContent = '复制摘要';
      }, 1600);
    }
  }

  async function runHealthProbe() {
    const result = $('apiHealthResult');
    const button = $('apiHealthButton');
    result.dataset.state = 'idle';
    result.textContent = '检查中';
    button.disabled = true;

    const check = await checkHealthEndpoint();
    result.dataset.state = check.state === 'ok' ? 'ok' : 'warn';
    result.textContent = check.detail;
    button.disabled = false;
    renderSummary();
  }

  function bindActions() {
    $('refreshButton').addEventListener('click', runDiagnostics);
    $('copySummaryButton').addEventListener('click', copySummary);
    $('apiHealthButton').addEventListener('click', runHealthProbe);
    window.addEventListener('resize', renderRuntime);
  }

  bindActions();
  runDiagnostics();
})();
