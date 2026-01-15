/**
 * Image Upload Utility for MuseumCheck
 * 
 * Provides image upload functionality with compression for mobile optimization.
 * Uploads images to letmetry.cloud storage service.
 */

class ImageUploader {
    constructor(config = {}) {
        this.config = {
            endpoint: config.endpoint || ((typeof API_ENDPOINTS !== 'undefined') ? API_ENDPOINTS.IMAGE.UPLOAD : 'https://letmetry.cloud/image/upload'),
            maxFileSizeMB: config.maxFileSizeMB || 10,
            // Compression settings optimized for mobile display
            targetWidth: config.targetWidth || 1200,   // Max width for mobile
            targetHeight: config.targetHeight || 1200, // Max height for mobile
            quality: config.quality || 0.85,           // JPEG/WebP quality (0-1)
            format: config.format || 'image/jpeg'      // Output format
        };
    }

    /**
     * Compress image before upload for mobile optimization
     * @param {File} file - The image file to compress
     * @returns {Promise<Blob>} - Compressed image blob
     */
    async compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    try {
                        // Calculate new dimensions
                        let { width, height } = img;
                        const maxWidth = this.config.targetWidth;
                        const maxHeight = this.config.targetHeight;
                        
                        // Only resize if image is larger than target
                        if (width > maxWidth || height > maxHeight) {
                            const ratio = Math.min(maxWidth / width, maxHeight / height);
                            width = Math.round(width * ratio);
                            height = Math.round(height * ratio);
                        }
                        
                        // Create canvas for compression
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        
                        const ctx = canvas.getContext('2d');
                        
                        // Use smooth rendering for better quality
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        
                        // Draw resized image
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Convert to blob with compression
                        canvas.toBlob(
                            (blob) => {
                                if (blob) {
                                    console.log(`✓ Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(blob.size / 1024).toFixed(1)}KB`);
                                    resolve(blob);
                                } else {
                                    reject(new Error('Failed to create compressed image blob'));
                                }
                            },
                            this.config.format,
                            this.config.quality
                        );
                    } catch (error) {
                        reject(error);
                    }
                };
                
                img.onerror = () => {
                    reject(new Error('Failed to load image for compression'));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read image file'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    /**
     * Upload image to letmetry.cloud
     * @param {File|Blob} file - The file or blob to upload
     * @param {Object} options - Upload options
     * @returns {Promise<string>} - URL of uploaded image
     */
    async uploadImage(file, options = {}) {
        const {
            compress = true,
            onProgress = null
        } = options;
        
        // Validate file size
        const maxSizeBytes = this.config.maxFileSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            throw new Error(`文件太大，最大支持 ${this.config.maxFileSizeMB}MB`);
        }
        
        // Compress if enabled and file is an image
        let uploadBlob = file;
        if (compress && file.type && file.type.startsWith('image/')) {
            try {
                if (onProgress) onProgress('compressing', 0);
                uploadBlob = await this.compressImage(file);
                if (onProgress) onProgress('compressing', 100);
            } catch (error) {
                console.warn('Compression failed, using original file:', error);
                uploadBlob = file;
            }
        }
        
        // Create FormData for upload
        const formData = new FormData();
        // Use original filename if available, otherwise generate one
        const filename = file.name || `image-${Date.now()}.jpg`;
        formData.append('file', uploadBlob, filename);
        
        // Upload
        if (onProgress) onProgress('uploading', 0);
        
        const response = await fetch(this.config.endpoint, {
            method: 'POST',
            body: formData
        });
        
        if (onProgress) onProgress('uploading', 100);
        
        if (!response.ok) {
            // Provide user-friendly error messages for specific status codes
            if (response.status === 409) {
                throw new Error(`文件名冲突 (409): 该文件名已存在，请使用不同的文件名`);
            } else if (response.status === 413) {
                throw new Error(`文件太大 (413): 请压缩后再上传`);
            } else if (response.status === 401 || response.status === 403) {
                throw new Error(`权限错误 (${response.status}): 请检查访问权限`);
            } else if (response.status >= 500) {
                throw new Error(`服务器错误 (${response.status}): 服务暂时不可用，请稍后重试`);
            }
            throw new Error(`上传失败 (${response.status}): 请稍后重试`);
        }
        
        const data = await response.json();
        
        // Handle different response formats
        if (data.url) {
            return data.url;
        } else if (data.fileUrl) {
            return data.fileUrl;
        } else if (data.data && data.data.url) {
            return data.data.url;
        } else if (data.success && data.filename) {
            // Handle letmetry.cloud response format: {success: true, filename: "...", path: "...", destination: "..."}
            // Extract base URL from endpoint (e.g., "https://letmetry.cloud/image/upload" -> "https://letmetry.cloud")
            const url = new URL(this.config.endpoint);
            const baseUrl = `${url.protocol}//${url.host}`;
            
            // Sanitize filename to prevent path traversal attacks
            // 1. Decode URL-encoded sequences (with error handling for malformed URIs)
            let sanitizedFilename;
            try {
                sanitizedFilename = decodeURIComponent(data.filename);
            } catch (e) {
                sanitizedFilename = data.filename;
            }
            // 2. Remove any path traversal patterns repeatedly to handle nested cases
            // Loop until no more ../ or ..\ patterns remain
            let previousValue;
            do {
                previousValue = sanitizedFilename;
                sanitizedFilename = sanitizedFilename.replace(/\.\.[\/\\]/g, '');
            } while (previousValue !== sanitizedFilename);
            
            // 3. Remove leading slashes and backslashes
            sanitizedFilename = sanitizedFilename.replace(/^[\/\\]+/, '');
            // 4. Extract only the filename (remove any remaining path components)
            // This is the key security step - ensures no path traversal is possible
            // Even if ../ patterns somehow remained, they cannot be executed
            sanitizedFilename = sanitizedFilename.split(/[\/\\]/).pop() || 'unnamed';
            
            // Files are served from /images/ directory on the server
            return `${baseUrl}/images/${encodeURIComponent(sanitizedFilename)}`;
        }
        
        throw new Error('上传响应格式无效');
    }

    /**
     * Create a file input for image selection
     * @param {Function} onSelect - Callback when file is selected
     * @returns {HTMLInputElement} - File input element
     */
    createFileInput(onSelect) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file && onSelect) {
                onSelect(file);
            }
        };
        
        return input;
    }

    /**
     * Open file picker dialog and return selected file
     * @returns {Promise<File|null>} - Selected file or null if cancelled
     */
    pickFile() {
        return new Promise((resolve) => {
            const input = this.createFileInput((file) => {
                resolve(file);
            });
            
            // Handle cancel (no file selected)
            input.addEventListener('cancel', () => {
                resolve(null);
            });
            
            // Also handle window focus to detect cancel.
            // We use a short delay after focus to allow time for the file selection
            // to be populated if user selected a file vs cancelled the dialog.
            const FOCUS_DELAY_MS = 300;
            const handleFocus = () => {
                setTimeout(() => {
                    if (!input.files || input.files.length === 0) {
                        resolve(null);
                    }
                }, FOCUS_DELAY_MS);
                window.removeEventListener('focus', handleFocus);
            };
            
            window.addEventListener('focus', handleFocus);
            
            // Trigger file picker
            input.click();
        });
    }

    /**
     * Upload image with UI feedback
     * @param {Object} options - Options for the upload
     * @returns {Promise<string|null>} - URL of uploaded image or null if cancelled
     */
    async uploadWithUI(options = {}) {
        const {
            onStart = null,
            onProgress = null,
            onComplete = null,
            onError = null,
            compress = true
        } = options;
        
        // Pick file
        const file = await this.pickFile();
        if (!file) {
            return null;
        }
        
        try {
            if (onStart) onStart(file);
            
            // Upload with compression
            const url = await this.uploadImage(file, {
                compress,
                onProgress: (stage, progress) => {
                    if (onProgress) {
                        onProgress(stage, progress, file);
                    }
                }
            });
            
            if (onComplete) onComplete(url, file);
            
            return url;
        } catch (error) {
            if (onError) onError(error, file);
            throw error;
        }
    }
}

// Create global instance with default config for convenience.
// Consumers can create their own instances with custom config if needed.
const imageUploader = new ImageUploader();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ImageUploader, imageUploader };
}
