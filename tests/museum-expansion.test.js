/**
 * Tests for the systematic museum data quality improvement (Issue #200 - deduplication)
 * After v4.7.0: Museum count reduced from 302 to 257 high-quality unique museums
 */

const fs = require('fs');
const path = require('path');

describe('Museum Data Quality After Systematic Deduplication', () => {
    let scriptContent;

    beforeAll(() => {
        // Load from appropriate file - museums-data.js (new structure) or script.js (legacy)
        const scriptPath = path.join(__dirname, '..', 'script.js');
        const museumsDataPath = path.join(__dirname, '..', 'museums-data.js');
        
        if (fs.existsSync(museumsDataPath)) {
            scriptContent = fs.readFileSync(museumsDataPath, 'utf8');
        } else {
            scriptContent = fs.readFileSync(scriptPath, 'utf8');
        }
    });

    test('should have exactly 257 high-quality museums after deduplication', () => {
        // Count museum names within the MUSEUMS array (this is what users see)
        const museumsSection = scriptContent.match(/const MUSEUMS = \[([\s\S]*?)\];/)[1];
        const museumNames = museumsSection.match(/name: '[^']*'/g);
        expect(museumNames).not.toBeNull();
        expect(museumNames.length).toBe(257);
    });

    test('should have no duplicate museum names or IDs', () => {
        // Check that all museum names and IDs are unique
        const museumsSection = scriptContent.match(/const MUSEUMS = \[([\s\S]*?)\];/)[1];
        
        // Check names
        const museumNames = museumsSection.match(/name: '[^']*'/g) || [];
        const names = museumNames.map(match => match.match(/name: '([^']*)'/)[1]);
        const uniqueNames = [...new Set(names)];
        expect(uniqueNames.length).toBe(names.length); // No duplicates
        
        // Check IDs 
        const museumIds = museumsSection.match(/id: '([^']*)'/g) || [];
        const ids = museumIds.map(match => match.match(/id: '([^']*)'/)[1]);
        const uniqueIds = [...new Set(ids)];
        expect(uniqueIds.length).toBe(ids.length); // No duplicates
        
        // Should have exactly 257 unique museums
        expect(uniqueNames.length).toBe(257);
        expect(uniqueIds.length).toBe(257);
    });



    test('all museum entries should have complete required fields', () => {
        // Count each required field within the MUSEUMS array only
        const museumsSection = scriptContent.match(/const MUSEUMS = \[([\s\S]*?)\];/)[1];
        const nameCount = museumsSection.match(/name: '[^']*'/g)?.length || 0;
        const locationCount = museumsSection.match(/location: '[^']*'/g)?.length || 0;
        const descriptionCount = museumsSection.match(/description: '[^']*'/g)?.length || 0;
        const tagsCount = museumsSection.match(/tags: \[/g)?.length || 0;
        
        // Should have exactly 257 entries of each type (no missing fields)
        expect(nameCount).toBe(257);
        expect(locationCount).toBe(257);
        expect(descriptionCount).toBe(257);
        expect(tagsCount).toBe(257);
    });

    test('should have Chinese content for all museums', () => {
        // Test for Chinese characters in names and locations within MUSEUMS array only
        const museumsSection = scriptContent.match(/const MUSEUMS = \[([\s\S]*?)\];/)[1];
        const chineseNameMatches = museumsSection.match(/name: '[^']*[\u4e00-\u9fff][^']*'/g);
        const chineseLocationMatches = museumsSection.match(/location: '[^']*[\u4e00-\u9fff][^']*'/g);
        
        expect(chineseNameMatches).not.toBeNull();
        expect(chineseLocationMatches).not.toBeNull();
        expect(chineseNameMatches.length).toBe(257);
        expect(chineseLocationMatches.length).toBe(257);
    });

    test('should have complete checklists for all age groups', () => {
        // Count age group entries within MUSEUMS array only
        const museumsSection = scriptContent.match(/const MUSEUMS = \[([\s\S]*?)\];/)[1];
        const ageGroup36Count = museumsSection.match(/'3-6': \[/g)?.length || 0;
        const ageGroup712Count = museumsSection.match(/'7-12': \[/g)?.length || 0;
        const ageGroup1318Count = museumsSection.match(/'13-18': \[/g)?.length || 0;
        
        // Each museum should have 2 checklists (parent + child) × 3 age groups = 6 entries per museum
        // Should have exactly 1542 entries for 257 museums (257 × 6 = 1542)
        expect(ageGroup36Count).toBe(514); // 257 × 2 (parent + child)
        expect(ageGroup712Count).toBe(514); // 257 × 2 (parent + child)
        expect(ageGroup1318Count).toBe(514); // 257 × 2 (parent + child)
    });

    test('should maintain diverse geographic coverage', () => {
        // Check for presence of museums from different regions
        const regions = ['北京', '上海', '广州', '西安', '南京', '杭州', '成都', '武汉', '重庆'];
        regions.forEach(region => {
            expect(scriptContent).toContain(`location: '${region}'`);
        });
    });

    test('should maintain diverse museum types', () => {
        // Check for different types of museums in tags
        const museumTypes = ['历史', '文化', '艺术', '博物院', '纪念馆'];
        museumTypes.forEach(type => {
            expect(scriptContent.indexOf(type)).toBeGreaterThan(-1);
        });
    });

    test('museums should follow ID naming convention', () => {
        const museumIds = scriptContent.match(/id: '([^']*)'/g);
        expect(museumIds).not.toBeNull();
        
        museumIds.forEach(idMatch => {
            const id = idMatch.match(/id: '([^']*)'/)[1];
            // Should be lowercase with hyphens, no spaces or underscores
            expect(id).toMatch(/^[a-z0-9-]+$/);
            expect(id).not.toContain('_');
            expect(id).not.toContain(' ');
        });
    });

    test('should have improved data quality metrics', () => {
        // Verify the systematic improvement achieved
        const museumsSection = scriptContent.match(/const MUSEUMS = \[([\s\S]*?)\];/)[1];
        
        // No undefined or null names
        expect(museumsSection).not.toContain('name: undefined');
        expect(museumsSection).not.toContain('name: null');
        expect(museumsSection).not.toContain('name: \'\'');
        
        // All entries should be properly structured
        const museumObjects = museumsSection.match(/{\s*id:/g);
        expect(museumObjects).not.toBeNull();
        expect(museumObjects.length).toBe(257);
    });
});