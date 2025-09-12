/**
 * Tests for the 80 additional museums expansion (Issue #147)
 */

const fs = require('fs');
const path = require('path');

describe('Museum Expansion to 204 Total Museums', () => {
    let scriptContent;

    beforeAll(() => {
        // Read script.js file
        const scriptPath = path.join(__dirname, '..', 'script.js');
        scriptContent = fs.readFileSync(scriptPath, 'utf8');
    });

    test('should have exactly 204 museums total', () => {
        // Count museum IDs
        const museumIds = scriptContent.match(/id: '[^']*'/g);
        expect(museumIds).not.toBeNull();
        expect(museumIds.length).toBe(204);
    });

    test('should have unique museum IDs', () => {
        const museumIds = scriptContent.match(/id: '([^']*)'/g);
        expect(museumIds).not.toBeNull();
        
        const ids = museumIds.map(match => match.match(/id: '([^']*)'/)[1]);
        const uniqueIds = [...new Set(ids)];
        
        expect(uniqueIds.length).toBe(ids.length); // No duplicates
        expect(uniqueIds.length).toBe(204);
    });

    test('version should be updated to 3.1.0', () => {
        const versionMatch = scriptContent.match(/version: "([^"]+)"/);
        expect(versionMatch).not.toBeNull();
        expect(versionMatch[1]).toBe('3.1.0');
    });

    test('should have changelog entry for museum expansion', () => {
        expect(scriptContent).toContain('3.1.0');
        expect(scriptContent).toContain('博物馆数量至204家');
        expect(scriptContent).toContain('新增80家');
    });

    test('all museum entries should have required fields', () => {
        // Count each required field to ensure consistency
        const nameCount = scriptContent.match(/name: '[^']*'/g)?.length || 0;
        const locationCount = scriptContent.match(/location: '[^']*'/g)?.length || 0;
        const descriptionCount = scriptContent.match(/description: '[^']*'/g)?.length || 0;
        const tagsCount = scriptContent.match(/tags: \[/g)?.length || 0;
        
        expect(nameCount).toBe(204);
        expect(locationCount).toBe(204);
        expect(descriptionCount).toBe(204);
        expect(tagsCount).toBe(204);
    });

    test('should have Chinese content for all museums', () => {
        // Test for Chinese characters in names and locations
        const chineseNameMatches = scriptContent.match(/name: '[^']*[\u4e00-\u9fff][^']*'/g);
        const chineseLocationMatches = scriptContent.match(/location: '[^']*[\u4e00-\u9fff][^']*'/g);
        
        expect(chineseNameMatches).not.toBeNull();
        expect(chineseLocationMatches).not.toBeNull();
        expect(chineseNameMatches.length).toBe(204);
        expect(chineseLocationMatches.length).toBe(204);
    });

    test('should have checklists for all age groups', () => {
        // Count age group entries
        const ageGroup36Count = scriptContent.match(/'3-6': \[/g)?.length || 0;
        const ageGroup712Count = scriptContent.match(/'7-12': \[/g)?.length || 0;
        const ageGroup1318Count = scriptContent.match(/'13-18': \[/g)?.length || 0;
        
        // Each museum should have 2 checklists (parent + child) × 3 age groups = 6 entries per museum
        expect(ageGroup36Count).toBe(204 * 2); // 408 total (parent + child)
        expect(ageGroup712Count).toBe(204 * 2); // 408 total
        expect(ageGroup1318Count).toBe(204 * 2); // 408 total
    });

    test('should have diverse geographic coverage', () => {
        // Check for presence of museums from different regions
        const regions = ['北京', '上海', '广州', '西安', '南京', '杭州', '成都', '武汉', '重庆'];
        regions.forEach(region => {
            expect(scriptContent).toContain(`location: '${region}'`);
        });
    });

    test('should have diverse museum types', () => {
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
});