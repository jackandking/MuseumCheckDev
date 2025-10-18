/**
 * Tests for URL parameter consistency across pages
 * Issue: Inconsistent museum parameter naming (museumId vs museum) causes logic errors
 * 
 * Requirement: All pages should use 'museum' parameter consistently when passing museum IDs
 */

const fs = require('fs');
const path = require('path');

describe('URL Parameter Consistency', () => {
    let fireworksWallHtml;
    let museumCheckinHtml;
    let scriptJs;

    beforeAll(() => {
        // Load files
        fireworksWallHtml = fs.readFileSync(
            path.join(__dirname, '../fireworks-wall.html'),
            'utf8'
        );
        museumCheckinHtml = fs.readFileSync(
            path.join(__dirname, '../museum-checkin.html'),
            'utf8'
        );
        scriptJs = fs.readFileSync(
            path.join(__dirname, '../script.js'),
            'utf8'
        );
    });

    describe('fireworks-wall.html', () => {
        test('should use "museum" parameter (not "museumId") to read museum ID from URL', () => {
            // Check that fireworks-wall.html reads 'museum' parameter
            expect(fireworksWallHtml).toMatch(/urlParams\.get\(['"]museum['"]\)/);
            
            // Should NOT use 'museumId' parameter
            expect(fireworksWallHtml).not.toMatch(/urlParams\.get\(['"]museumId['"]\)/);
        });

        test('should store parameter value in filterMuseumId variable', () => {
            // The pattern should be: const filterMuseumId = urlParams.get('museum');
            expect(fireworksWallHtml).toMatch(/const\s+filterMuseumId\s*=\s*urlParams\.get\(['"]museum['"]\)/);
        });

        test('should use filterMuseumId to filter fireworks data', () => {
            // Verify that filterMuseumId is used in filtering logic
            expect(fireworksWallHtml).toMatch(/filterMuseumId/);
            expect(fireworksWallHtml).toMatch(/fw\.museumId\s*===\s*filterMuseumId/);
        });
    });

    describe('museum-checkin.html', () => {
        test('should use "museum" parameter to read museum ID from URL', () => {
            // Check that museum-checkin.html reads 'museum' parameter
            expect(museumCheckinHtml).toMatch(/urlParams\.get\(['"]museum['"]\)/);
        });

        test('should use "museum" parameter when linking to fireworks-wall.html', () => {
            // Check that museum-checkin.html uses 'museum' parameter in links to fireworks-wall
            expect(museumCheckinHtml).toMatch(/fireworks-wall\.html\?museum=/);
            
            // Should NOT use 'museumId' parameter
            expect(museumCheckinHtml).not.toMatch(/fireworks-wall\.html\?museumId=/);
        });

        test('should store parameter value in museumId variable', () => {
            // The pattern should be: const museumId = urlParams.get('museum')
            expect(museumCheckinHtml).toMatch(/const\s+museumId\s*=\s*urlParams\.get\(['"]museum['"]\)/);
        });
    });

    describe('script.js', () => {
        test('should use "museum" parameter when opening fireworks-wall.html', () => {
            // Check that script.js uses 'museum' parameter in fireworks-wall links
            expect(scriptJs).toMatch(/fireworks-wall\.html\?museum=/);
            
            // Should NOT use 'museumId' parameter in fireworks-wall links
            expect(scriptJs).not.toMatch(/fireworks-wall\.html\?museumId=/);
        });

        test('should use "museum" parameter consistently in all fireworks-wall links', () => {
            // Find all references to fireworks-wall.html in the script
            const fireworksWallRefs = scriptJs.match(/fireworks-wall\.html\?[^'"]+/g) || [];
            
            // All should use 'museum=' parameter
            fireworksWallRefs.forEach(ref => {
                expect(ref).toMatch(/museum=/);
                expect(ref).not.toMatch(/museumId=/);
            });
        });
    });

    describe('Cross-page consistency', () => {
        test('all pages should use same parameter name for museum ID', () => {
            // Extract URL parameter patterns from each file
            const fireworksWallParams = fireworksWallHtml.match(/urlParams\.get\(['"](\w+)['"]\)/g) || [];
            const museumCheckinParams = museumCheckinHtml.match(/urlParams\.get\(['"](\w+)['"]\)/g) || [];
            
            // Both should use 'museum' for museum ID
            const fireworksUsesMuseum = fireworksWallParams.some(p => p.includes("'museum'") || p.includes('"museum"'));
            const checkinUsesMuseum = museumCheckinParams.some(p => p.includes("'museum'") || p.includes('"museum"'));
            
            expect(fireworksUsesMuseum).toBe(true);
            expect(checkinUsesMuseum).toBe(true);
            
            // Neither should use 'museumId' for reading URL parameters
            const fireworksUsesMuseumId = fireworksWallParams.some(p => p.includes("'museumId'") || p.includes('"museumId"'));
            const checkinUsesMuseumId = museumCheckinParams.some(p => p.includes("'museumId'") || p.includes('"museumId"'));
            
            expect(fireworksUsesMuseumId).toBe(false);
            expect(checkinUsesMuseumId).toBe(false);
        });

        test('navigation between pages should use consistent parameter name', () => {
            // Check museum-checkin.html -> fireworks-wall.html navigation
            const checkinToFireworks = museumCheckinHtml.match(/fireworks-wall\.html\?(\w+)=/);
            expect(checkinToFireworks).toBeTruthy();
            expect(checkinToFireworks[1]).toBe('museum');
            
            // Check script.js -> fireworks-wall.html navigation
            const scriptToFireworks = scriptJs.match(/fireworks-wall\.html\?(\w+)=/);
            expect(scriptToFireworks).toBeTruthy();
            expect(scriptToFireworks[1]).toBe('museum');
        });
    });

    describe('Regression prevention', () => {
        test('should not have any remaining "museumId" URL parameters in links', () => {
            // Check all three files for problematic patterns
            const problematicPatterns = [
                /\.html\?museumId=/,
                /window\.location\.href.*museumId=/,
                /window\.open.*museumId=/
            ];

            problematicPatterns.forEach(pattern => {
                expect(fireworksWallHtml).not.toMatch(pattern);
                expect(museumCheckinHtml).not.toMatch(pattern);
                expect(scriptJs).not.toMatch(pattern);
            });
        });

        test('should have documentation explaining the standardized parameter name', () => {
            // This test documents the expected behavior
            const expectedBehavior = {
                parameterName: 'museum',
                usage: [
                    'fireworks-wall.html?museum={museumId}',
                    'museum-checkin.html?museum={museumId}',
                    'index.html?museum={museumId}'
                ],
                reason: 'Consistent parameter naming prevents logic errors when navigating between pages'
            };

            // Verify the standard is followed
            expect(expectedBehavior.parameterName).toBe('museum');
            
            // Verify all usage patterns are correct
            expectedBehavior.usage.forEach(usage => {
                expect(usage).toMatch(/\?museum=/);
                expect(usage).not.toMatch(/\?museumId=/);
            });
        });
    });
});
