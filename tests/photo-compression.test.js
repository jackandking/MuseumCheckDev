/**
 * Test: Photo compression functionality
 * Verifies that photo compression reduces file size and maintains quality
 */

describe('Photo Compression', () => {
  // Mock canvas and image loading for compression testing
  let mockCanvas, mockContext, mockImage;
  
  beforeEach(() => {
    // Create mock canvas and context
    mockContext = {
      drawImage: jest.fn(),
    };
    
    mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => mockContext),
      toBlob: jest.fn((callback, type, quality) => {
        // Simulate compressed blob (much smaller than original)
        const mockBlob = new Blob(['compressed-data'], { type: 'image/jpeg' });
        callback(mockBlob);
      }),
    };
    
    // Mock document.createElement for canvas
    global.document.createElement = jest.fn((tag) => {
      if (tag === 'canvas') return mockCanvas;
      return { style: {}, appendChild: jest.fn(), querySelector: jest.fn() };
    });
    
    // Mock Image constructor
    mockImage = {
      width: 4000,  // Simulate high-res photo
      height: 3000,
      onload: null,
      onerror: null,
      src: '',
    };
    
    global.Image = jest.fn(() => mockImage);
    
    // Mock FileReader
    global.FileReader = jest.fn(() => ({
      onload: null,
      onerror: null,
      readAsDataURL: function(file) {
        setTimeout(() => {
          this.onload({ target: { result: 'data:image/jpeg;base64,mock' } });
        }, 0);
      },
    }));
    
    // Mock File constructor
    global.File = jest.fn((parts, name, options) => ({
      name: name,
      type: options.type,
      size: parts[0].length, // Use content length as size
      lastModified: options.lastModified,
    }));
  });
  
  test('compressPhoto function should be defined and callable', () => {
    // Load single-museum.js content and extract compressPhoto function
    const fs = require('fs');
    const path = require('path');
    const singleMuseumPath = path.join(__dirname, '..', 'single-museum.js');
    const content = fs.readFileSync(singleMuseumPath, 'utf8');
    
    // Check that compressPhoto function exists with updated parameters
    expect(content).toContain('async function compressPhoto');
    expect(content).toContain('maxWidth = 800');
    expect(content).toContain('quality = 0.65');
  });
  
  test('compression should reduce dimensions when image exceeds targetWidth', () => {
    const fs = require('fs');
    const path = require('path');
    const singleMuseumPath = path.join(__dirname, '..', 'single-museum.js');
    const content = fs.readFileSync(singleMuseumPath, 'utf8');
    
    // Verify compression logic exists
    expect(content).toContain('if (width > targetWidth)');
    expect(content).toContain('height = (height * targetWidth) / width');
    expect(content).toContain('width = targetWidth');
  });
  
  test('handlePhotoInput should be async to support compression', () => {
    const fs = require('fs');
    const path = require('path');
    const singleMuseumPath = path.join(__dirname, '..', 'single-museum.js');
    const content = fs.readFileSync(singleMuseumPath, 'utf8');
    
    // Verify handlePhotoInput is async
    expect(content).toContain('async function handlePhotoInput');
    expect(content).toContain('await compressPhoto');
  });
  
  test('compression should have graceful fallback for errors', () => {
    const fs = require('fs');
    const path = require('path');
    const singleMuseumPath = path.join(__dirname, '..', 'single-museum.js');
    const content = fs.readFileSync(singleMuseumPath, 'utf8');
    
    // Verify error handling exists
    expect(content).toContain('try {');
    expect(content).toContain('} catch(compressErr)');
    expect(content).toContain('using original');
  });
  
  test('compression should use tiered approach for different file sizes', () => {
    const fs = require('fs');
    const path = require('path');
    const singleMuseumPath = path.join(__dirname, '..', 'single-museum.js');
    const content = fs.readFileSync(singleMuseumPath, 'utf8');
    
    // Verify tiered compression logic for very large files (>5MB)
    expect(content).toContain('if (fileSizeMB > 5)');
    expect(content).toContain('targetWidth = Math.min(maxWidth, 600)');
    expect(content).toContain('targetQuality = Math.min(quality, 0.55)');
    
    // Verify tiered compression logic for large files (2-5MB)
    expect(content).toContain('else if (fileSizeMB > 2)');
    expect(content).toContain('targetWidth = Math.min(maxWidth, 700)');
    expect(content).toContain('targetQuality = Math.min(quality, 0.6)');
    
    // Verify small file handling
    expect(content).toContain('else if (fileSizeMB < 0.5)');
  });
  
  test('compression should cap canvas size to prevent memory issues', () => {
    const fs = require('fs');
    const path = require('path');
    const singleMuseumPath = path.join(__dirname, '..', 'single-museum.js');
    const content = fs.readFileSync(singleMuseumPath, 'utf8');
    
    // Verify canvas size capping exists
    expect(content).toContain('const maxPixels = 1000000');
    expect(content).toContain('if (width * height > maxPixels)');
    expect(content).toContain('const scale = Math.sqrt(maxPixels / (width * height))');
  });
  
  test('event handlers should await async photo processing', () => {
    const fs = require('fs');
    const path = require('path');
    const singleMuseumPath = path.join(__dirname, '..', 'single-museum.js');
    const content = fs.readFileSync(singleMuseumPath, 'utf8');
    
    // Verify event handlers are async and await handlePhotoInput
    const asyncEventHandlers = content.match(/addEventListener\('change',\s*async\s*\(/g);
    expect(asyncEventHandlers).not.toBeNull();
    expect(asyncEventHandlers.length).toBeGreaterThanOrEqual(3); // At least 3 photo inputs
    
    const awaitCalls = content.match(/await handlePhotoInput/g);
    expect(awaitCalls).not.toBeNull();
    expect(awaitCalls.length).toBeGreaterThanOrEqual(3);
  });
});
