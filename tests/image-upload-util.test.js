/**
 * Tests for Image Upload Utility
 * Verifies the ImageUploader class functionality for uploading and compressing images
 */

describe('Image Upload Utility', () => {
    let ImageUploader;
    let imageUploader;

    beforeEach(() => {
        // Reset modules and mock fetch
        jest.resetModules();
        
        // Create mock canvas
        global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
            drawImage: jest.fn(),
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        }));
        
        global.HTMLCanvasElement.prototype.toBlob = jest.fn((callback, format, quality) => {
            callback(new Blob(['test'], { type: 'image/jpeg' }));
        });

        // Load the ImageUploader class
        const imageUploadUtil = require('../image-upload-util.js');
        ImageUploader = imageUploadUtil.ImageUploader;
        imageUploader = new ImageUploader();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Constructor', () => {
        test('should use default config values', () => {
            expect(imageUploader.config.endpoint).toBe('https://letmetry.cloud/file/upload');
            expect(imageUploader.config.maxFileSizeMB).toBe(10);
            expect(imageUploader.config.targetWidth).toBe(1200);
            expect(imageUploader.config.targetHeight).toBe(1200);
            expect(imageUploader.config.quality).toBe(0.85);
            expect(imageUploader.config.format).toBe('image/jpeg');
        });

        test('should accept custom config values', () => {
            const customUploader = new ImageUploader({
                endpoint: 'https://custom.endpoint/upload',
                maxFileSizeMB: 5,
                targetWidth: 800,
                quality: 0.7
            });
            
            expect(customUploader.config.endpoint).toBe('https://custom.endpoint/upload');
            expect(customUploader.config.maxFileSizeMB).toBe(5);
            expect(customUploader.config.targetWidth).toBe(800);
            expect(customUploader.config.quality).toBe(0.7);
        });
    });

    describe('File size validation', () => {
        test('should reject files larger than maxFileSizeMB', async () => {
            // Create a minimal blob and mock its size property for memory efficiency
            const largeFile = new Blob(['test'], { type: 'image/jpeg' });
            Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });
            
            await expect(imageUploader.uploadImage(largeFile)).rejects.toThrow('文件太大');
        });

        test('should accept files smaller than maxFileSizeMB', async () => {
            const smallFile = new Blob(['test'], { type: 'image/jpeg' });
            Object.defineProperty(smallFile, 'size', { value: 1024 });
            
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ url: 'https://test.com/image.jpg' })
            });
            
            const result = await imageUploader.uploadImage(smallFile, { compress: false });
            expect(result).toBe('https://test.com/image.jpg');
        });
    });

    describe('Upload API', () => {
        test('should handle successful upload with url response', async () => {
            const file = new Blob(['test'], { type: 'image/jpeg' });
            
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ url: 'https://letmetry.cloud/files/test.jpg' })
            });
            
            const result = await imageUploader.uploadImage(file, { compress: false });
            expect(result).toBe('https://letmetry.cloud/files/test.jpg');
        });

        test('should handle successful upload with fileUrl response', async () => {
            const file = new Blob(['test'], { type: 'image/jpeg' });
            
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ fileUrl: 'https://letmetry.cloud/files/test.jpg' })
            });
            
            const result = await imageUploader.uploadImage(file, { compress: false });
            expect(result).toBe('https://letmetry.cloud/files/test.jpg');
        });

        test('should handle successful upload with data.url response', async () => {
            const file = new Blob(['test'], { type: 'image/jpeg' });
            
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: { url: 'https://letmetry.cloud/files/test.jpg' } })
            });
            
            const result = await imageUploader.uploadImage(file, { compress: false });
            expect(result).toBe('https://letmetry.cloud/files/test.jpg');
        });

        test('should throw error on upload failure', async () => {
            const file = new Blob(['test'], { type: 'image/jpeg' });
            
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 500
            });
            
            await expect(imageUploader.uploadImage(file, { compress: false })).rejects.toThrow('上传失败: 500');
        });

        test('should throw error on invalid response format', async () => {
            const file = new Blob(['test'], { type: 'image/jpeg' });
            
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });
            
            await expect(imageUploader.uploadImage(file, { compress: false })).rejects.toThrow('上传响应格式无效');
        });
    });

    describe('File input creation', () => {
        test('should create file input with correct attributes', () => {
            const input = imageUploader.createFileInput(() => {});
            
            expect(input.type).toBe('file');
            expect(input.accept).toBe('image/*');
            expect(input.style.display).toBe('none');
        });
    });

    describe('Progress callbacks', () => {
        test('should call onProgress during upload', async () => {
            const file = new Blob(['test'], { type: 'text/plain' });
            const onProgress = jest.fn();
            
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ url: 'https://test.com/file.jpg' })
            });
            
            await imageUploader.uploadImage(file, { 
                compress: false,
                onProgress 
            });
            
            expect(onProgress).toHaveBeenCalledWith('uploading', 0);
            expect(onProgress).toHaveBeenCalledWith('uploading', 100);
        });
    });
});

describe('Image Upload Configuration', () => {
    test('should have letmetry.cloud as the default upload endpoint', () => {
        const imageUploadUtil = require('../image-upload-util.js');
        const uploader = new imageUploadUtil.ImageUploader();
        
        expect(uploader.config.endpoint).toContain('letmetry.cloud');
        expect(uploader.config.endpoint).toBe('https://letmetry.cloud/file/upload');
    });

    test('should have mobile-optimized compression settings', () => {
        const imageUploadUtil = require('../image-upload-util.js');
        const uploader = new imageUploadUtil.ImageUploader();
        
        // Max dimensions should be suitable for mobile display
        expect(uploader.config.targetWidth).toBeLessThanOrEqual(1200);
        expect(uploader.config.targetHeight).toBeLessThanOrEqual(1200);
        
        // Quality should balance file size and visual quality
        expect(uploader.config.quality).toBeGreaterThanOrEqual(0.7);
        expect(uploader.config.quality).toBeLessThanOrEqual(0.95);
    });
});
