/**
 * Local identity module (js/identity.js)
 *
 * Single source of truth for "who is this device" and for the default nickname
 * derived from it. Load this BEFORE any script that reads a nickname.
 *
 * Why this exists
 * ---------------
 * The old default nickname was the shared literal '小淘气'. Every user who never
 * opened settings ended up with the exact same name, so the firework wall, the
 * event wall and the leaderboard were full of identical "小淘气" entries and
 * parents could not tell their own entry apart.
 *
 * The default is now derived from user_id, which means it is:
 *   - unique        (not shared between users)
 *   - stable        (same value across reloads and across pages)
 *   - traceable     (the suffix maps back to the user_id used as the KV sortKey,
 *                    so "用户a3f9c2" can be found in the KV store directly)
 *
 * Format: 用户 + last 6 alphanumeric characters of user_id -> e.g. 用户a3f9c2
 * (8 characters total, stays within the settings input's maxlength=10)
 *
 * Future login system: everything here is the seam to replace. When real
 * accounts arrive, swap the two functions below for ones that read the
 * authenticated user, and every consumer follows automatically.
 */
(function (global) {
    'use strict';

    var LEGACY_DEFAULT_NICKNAME = '小淘气';

    function readStoredUserId() {
        try {
            return global.localStorage ? global.localStorage.getItem('user_id') : null;
        } catch (error) {
            console.warn('[identity] cannot read user_id from localStorage:', error);
            return null;
        }
    }

    /**
     * Get the local user id, creating it once if absent (UUID v4 when available).
     * @returns {string}
     */
    function getOrCreateUserId() {
        var userId = readStoredUserId();
        if (userId) {
            return userId;
        }

        if (typeof global.crypto !== 'undefined' && global.crypto && global.crypto.randomUUID) {
            userId = global.crypto.randomUUID();
        } else {
            userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
        }

        try {
            if (global.localStorage) {
                global.localStorage.setItem('user_id', userId);
            }
        } catch (error) {
            console.warn('[identity] cannot persist user_id:', error);
        }

        return userId;
    }

    /**
     * Default nickname derived from the user id.
     * @returns {string} e.g. 用户a3f9c2
     */
    function getDefaultNickname() {
        var normalized = String(getOrCreateUserId()).replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
        var tail = normalized.slice(-6) || '000000';
        return '用户' + tail;
    }

    /**
     * Whether the stored nickname is the legacy shared default (i.e. the user
     * never actively chose a name). Users who typed their own name are
     * protected by the nicknameHasBeenSet flag.
     * @returns {boolean}
     */
    function isLegacyDefaultNickname(storedNickname) {
        var value = (storedNickname || '').trim();
        if (!value) {
            return true;
        }
        if (value !== LEGACY_DEFAULT_NICKNAME) {
            return false;
        }
        try {
            return global.localStorage
                ? global.localStorage.getItem('nicknameHasBeenSet') !== 'true'
                : true;
        } catch (error) {
            return true;
        }
    }

    global.LocalIdentity = {
        LEGACY_DEFAULT_NICKNAME: LEGACY_DEFAULT_NICKNAME,
        getOrCreateUserId: getOrCreateUserId,
        getDefaultNickname: getDefaultNickname,
        isLegacyDefaultNickname: isLegacyDefaultNickname
    };
})(typeof window !== 'undefined' ? window : this);
