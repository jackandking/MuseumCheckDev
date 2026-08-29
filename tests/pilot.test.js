const {
    normalizeCohort,
    normalizeInviteCode,
    normalizePilotContext,
    resolveMuseum,
    buildCheckinUrl,
    getCohortConfig
} = require('../js/pilot.js');

describe('invited pilot context', () => {
    const museums = [
        { id: 'forbidden-city', name: '故宫博物院', location: '北京' },
        { id: 'shanghai-museum', name: '上海博物馆', location: '上海' }
    ];

    test('accepts reusable cohort slugs and rejects reflected text', () => {
        expect(normalizeCohort('one-camp')).toBe('one-camp');
        expect(normalizeCohort('<img src=x>')).toBe('early-family');
        expect(getCohortConfig('unknown-cohort').name).toContain('早期共创');
    });

    test('keeps invite codes controlled and anonymous', () => {
        expect(normalizeInviteCode(' 7k4d9q ')).toBe('7K4D9Q');
        expect(normalizeInviteCode('SH-TECH-01')).toBe('');
        expect(normalizeInviteCode('姓名-13800000000')).toBe('');
        expect(normalizeInviteCode('<script>')).toBe('');
    });

    test('resolves only a specific museum selection', () => {
        expect(resolveMuseum('故宫博物院｜北京', museums)).toEqual(museums[0]);
        expect(resolveMuseum('forbidden-city', museums)).toEqual(museums[0]);
        expect(resolveMuseum('北京', museums)).toBeNull();
    });

    test('normalizes context to controlled, non-sensitive fields', () => {
        const context = normalizePilotContext({
            cohort: 'one-camp',
            pilotSessionId: 'pilot-12345678-session',
            inviteCode: '7K4D9Q',
            age: '7-12',
            museumId: 'forbidden-city',
            museumName: '故宫博物院',
            city: '北京',
            format: 'camp',
            group: '9-20',
            duration: '90-120',
            childName: '不应保留',
            phone: '13800000000'
        });

        expect(context).toEqual(expect.objectContaining({
            cohort: 'one-camp',
            inviteCode: '7K4D9Q',
            age: '7-12',
            museumId: 'forbidden-city',
            city: '北京',
            format: 'camp',
            group: '9-20',
            duration: '90-120'
        }));
        expect(context).not.toHaveProperty('childName');
        expect(context).not.toHaveProperty('phone');
    });

    test('builds a tailored check-in URL without names or contact fields', () => {
        const url = buildCheckinUrl({
            cohort: 'one-camp',
            pilotSessionId: 'pilot-12345678-session',
            inviteCode: '7K4D9Q',
            age: '3-6',
            museumId: 'forbidden-city',
            format: 'family',
            group: '2-3',
            duration: 'under-60'
        });
        const parsed = new URL(url, 'https://museumcheck.cn/');

        expect(parsed.pathname).toBe('/museum-checkin.html');
        expect(parsed.searchParams.get('museum')).toBe('forbidden-city');
        expect(parsed.searchParams.get('age')).toBe('3-6');
        expect(parsed.searchParams.get('pilot')).toBe('one-camp');
        expect(parsed.searchParams.get('invite')).toBe('7K4D9Q');
        expect(parsed.searchParams.get('format')).toBe('family');
        expect(parsed.search).not.toContain('name');
        expect(parsed.search).not.toContain('phone');
    });

    test('keeps the preview signal name separate from a real pilot start', () => {
        expect('pilot_preview_open').not.toBe('pilot_started');
    });
});
