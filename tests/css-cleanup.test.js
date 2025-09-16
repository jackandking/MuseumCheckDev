/**
 * CSS Cleanup Test
 * 
 * Verifies that unused step indicator CSS has been removed
 * as part of issue #287 resolution.
 */

const fs = require('fs');
const path = require('path');

describe('CSS Cleanup - Step Indicator Styles Removal', () => {
    let cssContent;
    
    beforeAll(() => {
        const cssPath = path.join(__dirname, '..', 'style.css');
        cssContent = fs.readFileSync(cssPath, 'utf8');
    });

    test('should not contain step indicator CSS classes', () => {
        // Check that step-related CSS classes have been removed
        expect(cssContent).not.toContain('.step.active');
        expect(cssContent).not.toContain('.step.completed');
        expect(cssContent).not.toContain('.step.disabled');
        expect(cssContent).not.toContain('.step.current');
    });

    test('should not contain step indicator animation keyframes', () => {
        expect(cssContent).not.toContain('@keyframes pulse-glow');
        expect(cssContent).not.toContain('pulse-glow');
    });

    test('should not contain Enhanced Step Indicator comment', () => {
        expect(cssContent).not.toContain('Enhanced Step Indicator Styles');
    });

    test('should maintain Assessment UX Improvements section', () => {
        // The section header should remain for any future assessment improvements
        expect(cssContent).toContain('Assessment UX Improvements');
    });

    test('should maintain other important CSS sections', () => {
        // Verify essential CSS sections are still present
        expect(cssContent).toContain('Modal Styles');
        expect(cssContent).toContain('museum-card');
        expect(cssContent).toContain('assessment-content');
    });
});