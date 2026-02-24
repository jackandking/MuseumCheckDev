/**
 * @jest-environment jsdom
 *
 * Regression test for bug: when localStorage is full while saving task photos,
 * the cleanup should delete the OLDEST museum's photos first, not the newest.
 *
 * Bug: saving photos failed silently (no cleanup), leaving the current museum's
 * photos unsaved while older museum photos remained in storage.
 *
 * Fix: cleanupOldMuseumPhotos() deletes oldest-first (by poster timestamp)
 * before retrying the save.
 */

describe('Photo Storage Cleanup - Oldest First', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    /**
     * Simulate cleanupOldMuseumPhotos() logic extracted from museum-checkin.js.
     * This mirrors the production implementation to test the ordering logic.
     */
    function cleanupOldMuseumPhotos(currentKey, taskPhotos) {
        const otherKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('museumPhotos_') && key !== currentKey) {
                otherKeys.push(key);
            }
        }
        if (otherKeys.length === 0) return [];

        let postersData = {};
        try {
            postersData = JSON.parse(localStorage.getItem('museumPosters') || '{}');
        } catch (e) { /* ignore */ }

        const AGE_GROUPS = ['3-6', '7-12', '13-18'];
        otherKeys.sort((a, b) => {
            const getMuseumTimestamp = (key) => {
                const withoutPrefix = key.slice('museumPhotos_'.length);
                let museumIdPart = withoutPrefix;
                for (const ag of AGE_GROUPS) {
                    if (withoutPrefix.endsWith('_' + ag)) {
                        museumIdPart = withoutPrefix.slice(0, -(ag.length + 1));
                        break;
                    }
                }
                return (postersData[museumIdPart] && postersData[museumIdPart].timestamp) || 0;
            };
            return getMuseumTimestamp(a) - getMuseumTimestamp(b);
        });

        const removed = [];
        for (const key of otherKeys) {
            localStorage.removeItem(key);
            removed.push(key);
            try {
                localStorage.setItem(currentKey, JSON.stringify(taskPhotos));
                return removed; // save succeeded
            } catch (e) {
                // need to remove more
            }
        }
        return removed;
    }

    test('cleanupOldMuseumPhotos removes oldest museum photos first when sorted by poster timestamp', () => {
        // Set up three older museums' photo entries
        const now = Date.now();
        localStorage.setItem('museumPhotos_museum-a_7-12', JSON.stringify({ 0: 'photo-a' }));
        localStorage.setItem('museumPhotos_museum-b_7-12', JSON.stringify({ 0: 'photo-b' }));
        localStorage.setItem('museumPhotos_museum-c_7-12', JSON.stringify({ 0: 'photo-c' }));

        // Poster timestamps: museum-a is oldest, museum-c is newest
        localStorage.setItem('museumPosters', JSON.stringify({
            'museum-a': { timestamp: now - 3000, dataURL: 'data-a' },
            'museum-b': { timestamp: now - 2000, dataURL: 'data-b' },
            'museum-c': { timestamp: now - 1000, dataURL: 'data-c' },
        }));

        const currentKey = 'museumPhotos_museum-current_7-12';
        const taskPhotos = { 0: 'current-photo' };

        const removed = cleanupOldMuseumPhotos(currentKey, taskPhotos);

        // The oldest (museum-a) should be removed first
        expect(removed[0]).toBe('museumPhotos_museum-a_7-12');
    });

    test('entries without poster timestamps are treated as oldest and removed first', () => {
        localStorage.setItem('museumPhotos_museum-no-poster_7-12', JSON.stringify({ 0: 'photo-old' }));
        localStorage.setItem('museumPhotos_museum-with-poster_7-12', JSON.stringify({ 0: 'photo-recent' }));

        // Only museum-with-poster has a poster timestamp
        localStorage.setItem('museumPosters', JSON.stringify({
            'museum-with-poster': { timestamp: Date.now() - 1000, dataURL: 'data' },
        }));

        const currentKey = 'museumPhotos_museum-current_7-12';
        const taskPhotos = { 0: 'current-photo' };

        const removed = cleanupOldMuseumPhotos(currentKey, taskPhotos);

        // museum-no-poster has timestamp 0, so it is treated as oldest
        expect(removed[0]).toBe('museumPhotos_museum-no-poster_7-12');
    });

    test('current museum photos are never removed during cleanup', () => {
        localStorage.setItem('museumPhotos_museum-old_7-12', JSON.stringify({ 0: 'old-photo' }));
        localStorage.setItem('museumPhotos_museum-current_7-12', JSON.stringify({ 0: 'current-photo' }));

        const currentKey = 'museumPhotos_museum-current_7-12';
        const taskPhotos = { 0: 'updated-current-photo' };

        const removed = cleanupOldMuseumPhotos(currentKey, taskPhotos);

        // Only the old museum's key should be in the removed list
        expect(removed).not.toContain(currentKey);
        expect(removed).toContain('museumPhotos_museum-old_7-12');
    });

    test('all three age groups are correctly parsed from key names', () => {
        const now = Date.now();
        // Two museums: museum-old (visited earlier) and museum-new (visited later)
        // Each stored under two different age groups
        localStorage.setItem('museumPhotos_museum-old_3-6', JSON.stringify({ 0: 'old-3-6' }));
        localStorage.setItem('museumPhotos_museum-old_13-18', JSON.stringify({ 0: 'old-13-18' }));
        localStorage.setItem('museumPhotos_museum-new_7-12', JSON.stringify({ 0: 'new-7-12' }));

        localStorage.setItem('museumPosters', JSON.stringify({
            'museum-old': { timestamp: now - 9000, dataURL: 'data-old' },
            'museum-new': { timestamp: now - 1000, dataURL: 'data-new' },
        }));

        const currentKey = 'museumPhotos_museum-current_7-12';
        const taskPhotos = { 0: 'current-photo' };

        const removed = cleanupOldMuseumPhotos(currentKey, taskPhotos);

        // The first removal should be from museum-old (it has the oldest timestamp).
        // Its age group suffix must be correctly stripped for the poster lookup to work.
        expect(removed[0]).toMatch(/^museumPhotos_museum-old_/);
    });
});
