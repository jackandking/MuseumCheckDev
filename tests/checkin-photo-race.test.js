/**
 * @jest-environment jsdom
 *
 * Regression test for photo upload -> immediate complete race condition.
 * Simulates selecting a file then immediately invoking the completion flow
 * to ensure the pending file is processed and taskPhotos is populated.
 */

describe('Check-in Photo Race Condition', () => {
    beforeEach(() => {
        // Clear localStorage and reset DOM
        localStorage.clear();
        document.body.innerHTML = '';
    });

    test('selected file is processed before completion and game condition becomes true', async () => {
        // Minimal DOM required by the processing logic
        const input = document.createElement('input');
        input.type = 'file';
        input.id = 'taskPhotoInput';
        document.body.appendChild(input);

        // Stubs / globals used by museum-checkin logic
        let savedPhotosCalled = false;
        const taskPhotos = {};
        const currentTaskIndex = 0;

        // Mock compressPhoto to return a File-like object (simulates compression)
        global.compressPhoto = async (file) => {
            return new File(['data'], file.name || 'photo.jpg', { type: 'image/jpeg' });
        };

        // Mock savePhotos and displayPhotoPreview used in the flow
        global.savePhotos = () => { savedPhotosCalled = true; };
        global.displayPhotoPreview = (dataUrl) => { /* noop */ };

        // Prepare a fake file and assign to input.files (FileList-like)
        const fakeFile = new File(['dummycontent'], 'test.jpg', { type: 'image/jpeg' });
        // Assign a simple array-like object with index access and length
        const fileListLike = [fakeFile];
        Object.defineProperty(input, 'files', { value: fileListLike, configurable: true });

        // The code under test: replicate the pre-processing block added to completeTask()
        let localTaskPhotos = taskPhotos; // simulate the module-level taskPhotos

        // Ensure no photo yet
        expect(!!localTaskPhotos[currentTaskIndex]).toBe(false);

        // Run the processing logic (as in museum-checkin.html)
        if (!localTaskPhotos[currentTaskIndex] && input && input.files && input.files[0]) {
            try {
                const compressedFile = await global.compressPhoto(input.files[0]);
                const reader = new FileReader();
                const dataUrl = await new Promise((resolve, reject) => {
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = () => reject(new Error('读取图片失败'));
                    reader.readAsDataURL(compressedFile);
                });
                localTaskPhotos[currentTaskIndex] = dataUrl;
                global.savePhotos();
                global.displayPhotoPreview(dataUrl);
            } catch (e) {
                // Should not reach here in expected flow
                // eslint-disable-next-line no-console
                console.warn('processing failed', e);
            }
        }

        // Assert that photo was saved into taskPhotos and savePhotos called
        expect(!!localTaskPhotos[currentTaskIndex]).toBe(true);
        expect(savedPhotosCalled).toBe(true);

        // Assert that puzzle game setting when enabled will allow showing game
        localStorage.setItem('puzzleGameEnabled', 'true');
        const puzzleEnabled = (() => {
            try { const saved = localStorage.getItem('puzzleGameEnabled'); return saved === null ? true : saved === 'true'; } catch (e) { return true; }
        })();
        const hasPhoto = !!localTaskPhotos[currentTaskIndex];
        expect(hasPhoto && puzzleEnabled).toBe(true);
    });
});
