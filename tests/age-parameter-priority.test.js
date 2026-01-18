/**
 * Tests for Age Parameter Priority Fix
 * Issue: museum-checkin.html should use localStorage 'ageGroup' setting instead of URL parameter
 * 
 * The URL parameter should only be used as a fallback when localStorage is empty.
 * This ensures consistency with the main app's age settings.
 */

const fs = require('fs');
const path = require('path');

describe('Age Parameter Priority in museum-checkin.html', () => {
    let htmlContent;
    let jsContent;
    
    beforeAll(() => {
        htmlContent = fs.readFileSync(
            path.join(__dirname, '..', 'museum-checkin.html'), 
            'utf8'
        );
        // Load the external JS file (CSS/JS refactored from museum-checkin.html)
        jsContent = fs.readFileSync(
            path.join(__dirname, '..', 'js', 'museum-checkin.js'), 
            'utf8'
        );
    });

    describe('Age Group Loading', () => {
        test('should check localStorage for ageGroup first', () => {
            // Should contain localStorage.getItem('ageGroup')
            expect(jsContent).toContain("localStorage.getItem('ageGroup')");
        });

        test('should use localStorage as primary source, URL as fallback', () => {
            // The code should follow pattern: savedAgeGroup || urlParam || default
            const ageGroupPattern = /const\s+savedAgeGroup\s*=\s*localStorage\.getItem\(['"]ageGroup['"]\)/;
            expect(jsContent).toMatch(ageGroupPattern);
            
            // Should use savedAgeGroup first in the assignment
            const assignmentPattern = /const\s+ageGroup\s*=\s*savedAgeGroup\s*\|\|/;
            expect(jsContent).toMatch(assignmentPattern);
        });

        test('should fall back to URL parameter if localStorage is empty', () => {
            // Should still support URL parameter as fallback
            expect(jsContent).toContain("urlParams.get('age')");
            
            // Check the order: savedAgeGroup || urlParam || '7-12'
            const fullPattern = /const\s+ageGroup\s*=\s*savedAgeGroup\s*\|\|\s*urlParams\.get\(['"]age['"]\)\s*\|\|\s*['"]7-12['"]/;
            expect(jsContent).toMatch(fullPattern);
        });
    });

    describe('Age Group Saving', () => {
        test('should save age group to correct localStorage key', () => {
            // Should use 'ageGroup' key, not 'selectedAgeGroup'
            const savePattern = /function\s+saveAgeGroup[\s\S]{0,200}localStorage\.setItem\(['"]ageGroup['"]/;
            expect(jsContent).toMatch(savePattern);
        });

        test('should not use deprecated selectedAgeGroup key', () => {
            // Should NOT use 'selectedAgeGroup' anywhere
            expect(jsContent).not.toContain("'selectedAgeGroup'");
        });
    });

    describe('Age Group Change Behavior', () => {
        test('should remove age parameter from URL on age change', () => {
            // When changing age, should delete the URL parameter
            const deletePattern = /url\.searchParams\.delete\(['"]age['"]\)/;
            expect(jsContent).toMatch(deletePattern);
        });

        test('should reload page without age parameter', () => {
            // Check that age group change handler deletes the parameter
            const changeHandlerPattern = /ageGroupSelector\.addEventListener\(['"]change['"][\s\S]{0,300}url\.searchParams\.delete\(['"]age['"]\)/;
            expect(jsContent).toMatch(changeHandlerPattern);
        });

        test('should not set age parameter in URL on change', () => {
            // The old behavior was: url.searchParams.set('age', newAgeGroup)
            // This should no longer exist in the age change handler
            const ageChangeSection = jsContent.match(/ageGroupSelector\.addEventListener\(['"]change['"][\s\S]{0,500}window\.location\.href/);
            if (ageChangeSection) {
                expect(ageChangeSection[0]).not.toContain("url.searchParams.set('age'");
            }
        });
    });

    describe('Consistency with Main App', () => {
        test('should use same localStorage key as script.js', () => {
            // Both should use 'ageGroup' key
            expect(jsContent).toContain("localStorage.getItem('ageGroup')");
            expect(jsContent).toContain("localStorage.setItem('ageGroup'");
        });

        test('should support all three age groups', () => {
            // Should support 3-6, 7-12, and 13-18 (in HTML or JS)
            const combined = htmlContent + jsContent;
            expect(combined).toContain('3-6');
            expect(combined).toContain('7-12');
            expect(combined).toContain('13-18');
        });
    });

    describe('Settings Modal Integration', () => {
        test('should display current age group in settings', () => {
            // HTML structure
            expect(htmlContent).toContain('currentAgeGroupDisplay');
            expect(htmlContent).toContain('ageGroupSelector');
        });

        test('should save age group when changed in settings', () => {
            // Settings change should call saveAgeGroup (in JS)
            const settingsPattern = /ageGroupSelector.*addEventListener[\s\S]{0,300}saveAgeGroup/;
            expect(jsContent).toMatch(settingsPattern);
        });
    });

    describe('Backward Compatibility', () => {
        test('should still support URL parameter for first-time users', () => {
            // URL parameter should work as fallback (in JS)
            expect(jsContent).toContain("urlParams.get('age')");
        });

        test('should have default age group', () => {
            // Should default to '7-12' if neither localStorage nor URL has value
            expect(jsContent).toContain("'7-12'");
        });
    });
});
