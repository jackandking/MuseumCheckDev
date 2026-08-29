(function(root, factory) {
    'use strict';
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.MuseumCheckPilot = api;
    }
})(typeof window !== 'undefined' ? window : null, function(root) {
    'use strict';

    const STORAGE_KEY = 'museumcheckPilotContext:v1';
    const SIGNAL_KEY = 'museumcheck-visit-signals';
    const PERSONAL_MUSEUMS_KEY = 'museumcheck-personal-museums-v1';
    const SIGNAL_TTL_SECONDS = 90 * 24 * 60 * 60;
    const AGE_VALUES = ['3-6', '7-12', '13-18'];
    const FORMAT_VALUES = ['family', 'camp', 'school', 'friends'];
    const GROUP_VALUES = ['2-3', '4-8', '9-20', '21-plus'];
    const DURATION_VALUES = ['under-60', '60-90', '90-120', '120-plus'];
    const COHORT_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;
    const SESSION_PATTERN = /^pilot-[a-z0-9-]{8,80}$/;
    const INVITE_CODE_PATTERN = /^[A-Z0-9]{6}$/;
    const COHORTS = {
        'one-camp': {
            name: '受邀共创试用',
            inviteLine: '给这次真实参观的一张现场任务卡',
            summary: '不用安装，不用注册。先选计划去的馆，看看现场的第一个小任务；合适再开始。'
        }
    };

    function allowed(value, values, fallback) {
        return values.includes(value) ? value : fallback;
    }

    function normalizeCohort(value) {
        const normalized = String(value || '').trim().toLowerCase();
        return COHORT_PATTERN.test(normalized) ? normalized : 'early-family';
    }

    function normalizeInviteCode(value) {
        const normalized = String(value || '').trim().toUpperCase();
        return INVITE_CODE_PATTERN.test(normalized) ? normalized : '';
    }

    function createSessionId(now, randomValue) {
        const timestamp = Number.isFinite(now) ? now : Date.now();
        const randomPart = typeof randomValue === 'string'
            ? randomValue
            : Math.random().toString(36).slice(2, 10);
        return `pilot-${timestamp}-${randomPart.replace(/[^a-z0-9]/gi, '').slice(0, 12) || 'session'}`;
    }

    function normalizePilotContext(context) {
        const input = context || {};
        const pilotSessionId = SESSION_PATTERN.test(String(input.pilotSessionId || ''))
            ? String(input.pilotSessionId)
            : createSessionId();

        return {
            version: 1,
            cohort: normalizeCohort(input.cohort),
            pilotSessionId,
            inviteCode: normalizeInviteCode(input.inviteCode),
            age: allowed(input.age, AGE_VALUES, '7-12'),
            museumId: String(input.museumId || '').trim().slice(0, 80),
            museumName: String(input.museumName || '').trim().slice(0, 120),
            city: String(input.city || '').trim().slice(0, 80),
            format: allowed(input.format, FORMAT_VALUES, 'family'),
            group: allowed(input.group, GROUP_VALUES, '2-3'),
            duration: allowed(input.duration, DURATION_VALUES, '60-90'),
            savedAt: Number.isFinite(input.savedAt) ? input.savedAt : Date.now()
        };
    }

    function museumLabel(museum) {
        return `${museum.name}｜${museum.location}`;
    }

    function resolveMuseum(value, museums) {
        const query = String(value || '').trim().toLowerCase();
        if (!query || !Array.isArray(museums)) return null;

        return museums.find(museum => {
            if (!museum || !museum.id || !museum.name) return false;
            return String(museum.id).toLowerCase() === query ||
                String(museum.name).toLowerCase() === query ||
                museumLabel(museum).toLowerCase() === query;
        }) || null;
    }

    function createPersonalMuseum(name, city) {
        const normalizedName = String(name || '').trim();
        const normalizedCity = String(city || '').trim();
        if (!normalizedName) return null;

        try {
            const saved = JSON.parse(root.localStorage.getItem(PERSONAL_MUSEUMS_KEY) || '[]');
            const museums = Array.isArray(saved) ? saved : [];
            const existing = museums.find(museum => museum
                && museum.name === normalizedName
                && String(museum.city || '') === normalizedCity);
            if (existing) return existing;

            const museum = {
                id: `personal-${Date.now().toString(36)}`,
                name: normalizedName,
                city: normalizedCity,
                location: normalizedCity,
                createdAt: Date.now(),
                reviewStatus: 'pending',
                visibility: 'private'
            };
            museums.push(museum);
            root.localStorage.setItem(PERSONAL_MUSEUMS_KEY, JSON.stringify(museums));
            return museum;
        } catch (error) {
            console.warn('[Pilot] Could not save personal museum:', error);
            return null;
        }
    }

    function buildCheckinUrl(context) {
        const normalized = normalizePilotContext(context);
        if (!normalized.museumId) return '';

        const params = new URLSearchParams({
            museum: normalized.museumId,
            age: normalized.age,
            pilot: normalized.cohort,
            pilotSession: normalized.pilotSessionId,
            format: normalized.format,
            group: normalized.group,
            duration: normalized.duration
        });
        if (normalized.inviteCode) params.set('invite', normalized.inviteCode);
        return `museum-checkin.html?${params.toString()}`;
    }

    function getCohortConfig(cohort) {
        return COHORTS[normalizeCohort(cohort)] || {
            name: 'MuseumCheck 早期共创试用',
            inviteLine: '给这次真实参观的一张任务卡',
            summary: '不用安装，不用注册。先选计划去的馆，看看现场的第一个小任务；合适再开始。'
        };
    }

    function sendSignal(signalType, context, extra) {
        if (!root || typeof root.fetch !== 'function') return Promise.resolve();
        const endpoint = root.API_ENDPOINTS && root.API_ENDPOINTS.KV_STORE;
        if (!endpoint) return Promise.resolve();

        const normalized = normalizePilotContext(context);
        const timestamp = Date.now();
        const payload = {
            type: 'visit_signal',
            signalType,
            page: 'pilot',
            pilotContext: {
                cohort: normalized.cohort,
                pilotSessionId: normalized.pilotSessionId,
                inviteCode: normalized.inviteCode,
                age: normalized.age,
                museumId: normalized.museumId,
                city: normalized.city,
                format: normalized.format,
                group: normalized.group,
                duration: normalized.duration
            },
            timestamp,
            parameters: extra || {}
        };
        const body = JSON.stringify({
            key: SIGNAL_KEY,
            sortKey: `${signalType}-${normalized.pilotSessionId}-${timestamp}`,
            value: JSON.stringify(payload),
            expireAt: Math.floor(timestamp / 1000) + SIGNAL_TTL_SECONDS
        });

        return root.fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: body.length < 60000
        }).catch(function(error) {
            console.warn('[Pilot] Anonymous signal failed:', error);
        });
    }

    function initializePage() {
        if (!root || !root.document) return;
        const document = root.document;
        const params = new URLSearchParams(root.location.search);
        const cohort = normalizeCohort(params.get('pilot'));
        const inviteCode = normalizeInviteCode(params.get('invite'));
        const config = getCohortConfig(cohort);
        const museums = Array.isArray(root.MUSEUMS_META) ? root.MUSEUMS_META : [];
        const sessionId = createSessionId();
        const baseContext = normalizePilotContext({ cohort, pilotSessionId: sessionId, inviteCode });
        const form = document.getElementById('pilotForm');
        const museumInput = document.getElementById('museumInput');
        const personalMuseumCity = document.getElementById('personalMuseumCity');
        const datalist = document.getElementById('museumOptions');
        const error = document.getElementById('pilotError');
        const inviteCodeInput = document.getElementById('inviteCodeInput');
        const preview = document.getElementById('pilotPreview');
        const previewTitle = document.getElementById('pilotPreviewTitle');
        const previewCopy = document.getElementById('pilotPreviewCopy');
        const prep = document.getElementById('pilotPrep');
        const submitLabel = document.getElementById('pilotSubmitLabel');
        const cardCount = document.getElementById('pilotCardCount');
        let previewing = false;

        document.title = `${config.name}｜MuseumCheck`;
        const inviteLine = document.getElementById('pilotInviteLine');
        const summary = document.getElementById('pilotSummary');
        if (inviteLine) inviteLine.textContent = config.inviteLine;
        if (summary) summary.textContent = config.summary;
        if (inviteCodeInput && inviteCode) inviteCodeInput.value = inviteCode;

        if (datalist) {
            const fragment = document.createDocumentFragment();
            museums.forEach(function(museum) {
                if (!museum || !museum.id || !museum.name || !museum.location) return;
                const option = document.createElement('option');
                option.value = museumLabel(museum);
                fragment.appendChild(option);
            });
            datalist.appendChild(fragment);
        }

        sendSignal('pilot_open', baseContext, { museumOptionCount: museums.length });

        if (!form || !museumInput) return;
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            if (error) error.hidden = true;

            let museum = resolveMuseum(museumInput.value, museums);
            const formData = new FormData(form);
            let isPersonalMuseum = false;
            if (!museum) {
                const city = formData.get('personalMuseumCity');
                if (!String(city || '').trim()) {
                    if (error) {
                        error.textContent = '请选择一个具体博物馆，或填写完整馆名和所在城市。';
                        error.hidden = false;
                    }
                    museumInput.focus();
                    return;
                }
                isPersonalMuseum = true;
                museum = { id: 'personal-preview', name: String(museumInput.value || '').trim(), location: String(city || '').trim() };
            }

            if (!previewing) {
                const previewContext = normalizePilotContext({
                    cohort,
                    pilotSessionId: sessionId,
                    inviteCode: formData.get('inviteCode'),
                    museumId: museum.id,
                    museumName: museum.name,
                    city: museum.location || formData.get('personalMuseumCity')
                });
                if (previewTitle) previewTitle.textContent = `在${museum.name}，先找一件让孩子想多看一会儿的东西`;
                if (previewCopy) previewCopy.textContent = '站在展厅入口，问孩子：第一眼最想走向哪里？先不用急着解释，一起走过去看看。';
                if (preview) preview.hidden = false;
                if (prep) prep.hidden = false;
                if (submitLabel) submitLabel.textContent = '从这家馆开始探索';
                if (cardCount) cardCount.textContent = '已选馆';
                previewing = true;
                sendSignal('pilot_preview_open', previewContext, { museumKnown: !isPersonalMuseum });
                if (preview && typeof preview.scrollIntoView === 'function') {
                    preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                return;
            }

            if (isPersonalMuseum) {
                museum = createPersonalMuseum(museumInput.value, formData.get('personalMuseumCity'));
                if (!museum) {
                    if (error) {
                        error.textContent = '暂时无法保存这家博物馆，请检查浏览器存储后重试。';
                        error.hidden = false;
                    }
                    return;
                }
            }

            const context = normalizePilotContext({
                cohort,
                pilotSessionId: sessionId,
                inviteCode: formData.get('inviteCode'),
                age: formData.get('age'),
                museumId: museum.id,
                museumName: museum.name,
                city: museum.location,
                format: formData.get('format'),
                group: formData.get('group'),
                duration: formData.get('duration')
            });

            try {
                root.localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
                root.localStorage.setItem('ageGroup', context.age);
            } catch (storageError) {
                console.warn('[Pilot] Could not save local context:', storageError);
            }

            const target = buildCheckinUrl(context);
            sendSignal('pilot_started', context, { target: 'museum-checkin' });
            root.location.assign(target);
        });
    }

    if (root && root.document) {
        if (root.document.readyState === 'loading') {
            root.document.addEventListener('DOMContentLoaded', initializePage, { once: true });
        } else {
            initializePage();
        }
    }

    return {
        STORAGE_KEY,
        normalizeCohort,
        normalizeInviteCode,
        normalizePilotContext,
        createSessionId,
        resolveMuseum,
        buildCheckinUrl,
        getCohortConfig,
        museumLabel
    };
});
