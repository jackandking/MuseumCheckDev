/**
 * Museum Count Consistency Test
 * 
 * This test ensures that the museum count is consistent across the application
 * and prevents future regressions where hardcoded numbers get out of sync with
 * the actual MUSEUMS array length.
 */

const fs = require('fs');
const path = require('path');

// Read the script.js file to extract museum data
const scriptPath = path.join(__dirname, '../script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Extract MUSEUMS array
const startIdx = scriptContent.indexOf('const MUSEUMS = [');
const endIdx = scriptContent.indexOf('];', startIdx) + 2;
const MUSEUMS = eval(scriptContent.substring(startIdx, endIdx).replace('const MUSEUMS = ', ''));

// Extract MUSEUM_COUNT constant
const museumCountMatch = scriptContent.match(/const MUSEUM_COUNT = MUSEUMS\.length;/);

describe('Museum Count Consistency', () => {
    test('MUSEUM_COUNT constant should exist and match MUSEUMS.length', () => {
        expect(museumCountMatch).toBeTruthy();
        expect(MUSEUMS.length).toBeGreaterThan(0);
    });

    test('MUSEUM_COUNT should be used consistently in JavaScript code', () => {
        // Check that hardcoded museum counts are replaced with MUSEUM_COUNT
        // Match all integer literals in the code
        const hardcodedCountRegex = /\b\d+\b/g;
        const matches = scriptContent.match(hardcodedCountRegex) || [];
        
        // Only consider numbers that match the current museum count
        const museumCountNumbers = [MUSEUMS.length];
        // Optionally, add previous known values if you want to catch regressions:
        // museumCountNumbers.push(120, 300);
        
        // Filter out numbers that are not museum counts
        const potentialCountMatches = matches.filter(match => museumCountNumbers.includes(Number(match)));
        
        // Filter out legitimate uses (like dimensions, timeouts, etc.)
        const suspiciousMatches = potentialCountMatches.filter(match => {
            const matchIndex = scriptContent.indexOf(match);
            const context = scriptContent.substring(Math.max(0, matchIndex - 100), matchIndex + 100);
            
            // These are legitimate uses of the number that are not museum counts
            const legitimateContexts = [
                'width', 'height', 'size', 'px', 'timeout', 'delay', 'duration',
                'Math.min', 'fillRect', 'strokeRect', 'canvas', 'ctx.', 'setTimeout',
                'setInterval', 'photo', 'image', '线', '年', '多年', '℃', '道工序'
            ];
            
            return !legitimateContexts.some(legitimate => context.includes(legitimate));
        });
        
        // Only flag potential museum count references
        const potentialMuseumCounts = suspiciousMatches.filter(match => {
            const matchIndex = scriptContent.indexOf(match);
            const context = scriptContent.substring(Math.max(0, matchIndex - 50), matchIndex + 50).toLowerCase();
            
            // Context that suggests this might be a museum count
            const museumContexts = [
                'museum', '博物馆', 'visited', 'total', 'count', 'percentage', 
                '家', '个', 'achievement', '成就', '收藏家', '完成', '全部'
            ];
            
            return museumContexts.some(museumContext => context.includes(museumContext));
        });
        
        if (potentialMuseumCounts.length > 0) {
            console.warn('Potential hardcoded museum counts found. Please verify these are not museum references:');
            potentialMuseumCounts.forEach(match => {
                const matchIndex = scriptContent.indexOf(match);
                const lineNumber = scriptContent.substring(0, matchIndex).split('\n').length;
                const context = scriptContent.substring(Math.max(0, matchIndex - 50), matchIndex + 50);
                console.warn(`  Line ${lineNumber}: "${context.trim()}" contains "${match}"`);
            });
        }
        
        // This test should pass as we've fixed the known hardcoded references
        expect(potentialMuseumCounts.length).toBe(0);
    });

    test('Achievement for completing all museums should use MUSEUM_COUNT', () => {
        // Check that the "博物馆收藏家" achievement uses MUSEUM_COUNT
        const achievementRegex = /visits:\s*MUSEUM_COUNT.*?博物馆收藏家.*?MUSEUM_COUNT.*?家博物馆/s;
        expect(scriptContent).toMatch(achievementRegex);
    });

    test('Progress displays should use MUSEUM_COUNT', () => {
        // Check that progress bars use MUSEUM_COUNT for calculations
        expect(scriptContent).toMatch(/visitedCount\s*\/\s*MUSEUM_COUNT/);
        expect(scriptContent).toMatch(/visitedCount.*MUSEUM_COUNT/);
    });

    test('Dynamic museum count updates should exist', () => {
        // Check that the updateDynamicMuseumCounts function exists
        expect(scriptContent.includes('updateDynamicMuseumCounts')).toBe(true);
    });

    test('HTML should not contain hardcoded museum counts', () => {
        const indexHtmlPath = path.join(__dirname, '../index.html');
        const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
        
        // Check that HTML uses placeholder spans for dynamic counts (section count still exists)
        expect(htmlContent).toMatch(/id="sectionMuseumCount"/);
        
        // Check that hardcoded counts are removed from meta tags
        expect(htmlContent).not.toMatch(/120家|300家/);
        expect(htmlContent).not.toMatch(/中国120家|中国300家/);
    });

    test('Current museum count should be reasonable', () => {
        // Sanity check that we have a reasonable number of museums
        expect(MUSEUMS.length).toBeGreaterThan(200);
        expect(MUSEUMS.length).toBeLessThan(500);
        
        console.log(`✅ Current museum count: ${MUSEUMS.length}`);
    });
});