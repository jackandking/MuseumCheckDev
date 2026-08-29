/**
 * Regression test for image upload filename uniqueness
 *
 * Bug: When uploading photos for multiple exhibit tasks in a single personal-museum
 * visit, the second and subsequent uploads would fail with HTTP 409 (Conflict)
 * because `imageUploader.uploadImage()` was reusing the original file name
 * (e.g. "IMG_1234.jpg") unchanged.  The entrance photo (task 1) stores locally
 * and was never affected; only server-uploaded exhibit-task photos (tasks 2–4)
 * were broken.
 *
 * Fix: `uploadImage()` now appends a timestamp + random suffix to the base name
 * so every upload gets a globally-unique filename.
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');

const { ImageUploader } = require('../js/image-upload-util.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal File-like object that satisfies uploadImage's needs. */
function makeFile(name, type = 'image/jpeg') {
    // Use a real Blob so FormData.append accepts it in jsdom
    const blob = new Blob(['fake-image-data'], { type });
    // Attach a `name` property to mimic a File object
    Object.defineProperty(blob, 'name', { value: name, writable: false });
    return blob;
}

/** Build a fetch mock that records FormData filenames and returns success. */
function makeFetchMock(capturedFilenames) {
    return async (_url, options) => {
        // Extract the filename from FormData
        const body = options && options.body;
        if (body && typeof body.get === 'function') {
            const fileEntry = body.get('file');
            if (fileEntry && fileEntry.name) {
                capturedFilenames.push(fileEntry.name);
            }
        }
        // Simulate a successful server response
        return {
            ok: true,
            status: 200,
            json: async () => ({
                success: true,
                filename: capturedFilenames[capturedFilenames.length - 1] || 'uploaded.jpg',
                path: '/images/',
                destination: '/images/'
            })
        };
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ImageUploader.uploadImage – unique filename per upload', () => {
    let capturedFilenames;
    let originalFetch;

    beforeEach(() => {
        capturedFilenames = [];
        originalFetch = global.fetch;
        global.fetch = makeFetchMock(capturedFilenames);
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    test('appends a unique suffix so the same source file can be uploaded twice', async () => {
        const uploader = new ImageUploader({ endpoint: 'https://museumcheck.cn/image/upload' });
        const file = makeFile('IMG_1234.jpg');

        await uploader.uploadImage(file, { compress: false });
        await uploader.uploadImage(file, { compress: false });

        expect(capturedFilenames).toHaveLength(2);

        // Both filenames should start with the original base name
        expect(capturedFilenames[0]).toMatch(/^IMG_1234_/);
        expect(capturedFilenames[1]).toMatch(/^IMG_1234_/);

        // They must be different – no 409 conflict
        expect(capturedFilenames[0]).not.toBe(capturedFilenames[1]);
    });

    test('generates unique filenames across four uploads (simulating tasks 1–4)', async () => {
        const uploader = new ImageUploader({ endpoint: 'https://museumcheck.cn/image/upload' });
        const file = makeFile('photo.jpg');

        for (let i = 0; i < 4; i++) {
            await uploader.uploadImage(file, { compress: false });
        }

        expect(capturedFilenames).toHaveLength(4);

        // All four filenames should be unique
        const unique = new Set(capturedFilenames);
        expect(unique.size).toBe(4);
    });

    test('preserves the original file extension', async () => {
        const uploader = new ImageUploader({ endpoint: 'https://museumcheck.cn/image/upload' });

        for (const ext of ['jpg', 'png', 'heic']) {
            capturedFilenames.length = 0; // reset
            const file = makeFile(`photo.${ext}`, `image/${ext}`);
            await uploader.uploadImage(file, { compress: false });

            expect(capturedFilenames[0]).toMatch(new RegExp(`\\.${ext}$`));
        }
    });

    test('handles files without an extension', async () => {
        const uploader = new ImageUploader({ endpoint: 'https://museumcheck.cn/image/upload' });
        const file = makeFile('noextension', 'image/jpeg');

        await uploader.uploadImage(file, { compress: false });

        expect(capturedFilenames).toHaveLength(1);
        // Fallback .jpg extension is always appended when the source file has no extension
        expect(capturedFilenames[0]).toMatch(/^noextension_/);
        expect(capturedFilenames[0]).toMatch(/\.jpg$/);
    });

    test('handles files with no name (fallback)', async () => {
        const uploader = new ImageUploader({ endpoint: 'https://museumcheck.cn/image/upload' });
        const file = makeFile(null, 'image/jpeg');

        await uploader.uploadImage(file, { compress: false });

        expect(capturedFilenames).toHaveLength(1);
        expect(capturedFilenames[0]).toBeTruthy();
        // Fallback base should still produce a .jpg extension
        expect(capturedFilenames[0]).toMatch(/\.jpg$/);
    });
});
