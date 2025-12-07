/**
 * Test for Issue: 默认显示所有博物馆
 * 
 * Verifies that museums without treasure collections are shown by default,
 * since there is already functionality to encourage user participation.
 */

describe('Default Display All Museums', () => {
    let originalLocalStorage;

    beforeEach(() => {
        // Mock localStorage
        originalLocalStorage = global.localStorage;
        global.localStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        };
    });

    afterEach(() => {
        global.localStorage = originalLocalStorage;
    });

    test('loadShowOnlyMuseumsWithCollections should return false by default', () => {
        // Mock localStorage to return null (no saved value)
        global.localStorage.getItem.mockReturnValue(null);

        // Read the script.js file
        const fs = require('fs');
        const path = require('path');
        const scriptPath = path.join(__dirname, '..', 'script.js');
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');

        // Verify the function has the correct default behavior
        expect(scriptContent).toContain('loadShowOnlyMuseumsWithCollections()');
        
        // Check that the default return value when saved === null is false
        const defaultFalsePattern = /saved === null \? false : saved === 'true'/;
        expect(scriptContent).toMatch(defaultFalsePattern);
        
        // Check that the error handler also returns false
        const errorDefaultPattern = /return false; \/\/ Default to showing all museums/;
        expect(scriptContent).toMatch(errorDefaultPattern);
    });

    test('checkbox in index.html should not be checked by default', () => {
        // Read the index.html file
        const fs = require('fs');
        const path = require('path');
        const indexPath = path.join(__dirname, '..', 'index.html');
        const indexContent = fs.readFileSync(indexPath, 'utf8');

        // Find the checkbox
        const checkboxPattern = /<input type="checkbox" id="showOnlyMuseumsWithCollections"[^>]*>/;
        const checkboxMatch = indexContent.match(checkboxPattern);
        
        expect(checkboxMatch).not.toBeNull();
        
        // Verify it does NOT have the 'checked' attribute
        const checkbox = checkboxMatch[0];
        expect(checkbox).not.toContain(' checked');
        
        // Verify the checkbox has the correct id
        expect(checkbox).toContain('id="showOnlyMuseumsWithCollections"');
    });

    test('function comments should reflect showing all museums by default', () => {
        // Read the script.js file
        const fs = require('fs');
        const path = require('path');
        const scriptPath = path.join(__dirname, '..', 'script.js');
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');

        // Check for updated comment in loadShowOnlyMuseumsWithCollections
        expect(scriptContent).toContain('// Default to false (show all museums) if not saved');
        
        // Make sure the old comment is removed
        expect(scriptContent).not.toContain('// Default to true (only show museums with collections) if not saved');
    });

    test('setting should persist user preference when enabled', () => {
        const fs = require('fs');
        const path = require('path');
        const scriptPath = path.join(__dirname, '..', 'script.js');
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');

        // Verify that the function still respects saved values
        expect(scriptContent).toContain("return saved === null ? false : saved === 'true'");
        
        // This ensures:
        // 1. When saved is null -> returns false (show all)
        // 2. When saved is 'true' -> returns true (only with collections)
        // 3. When saved is 'false' -> returns false (show all)
    });

    test('renderMuseums should still filter when setting is enabled', () => {
        const fs = require('fs');
        const path = require('path');
        const scriptPath = path.join(__dirname, '..', 'script.js');
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');

        // Verify the filtering logic is still present (for when users enable it)
        expect(scriptContent).toContain('if (this.showOnlyMuseumsWithCollections)');
        expect(scriptContent).toContain('museumsToRender = this.filteredMuseums.filter(museum => this.museumHasCollections(museum))');
    });

    test('UI hint text should accurately describe the feature', () => {
        const fs = require('fs');
        const path = require('path');
        const indexPath = path.join(__dirname, '..', 'index.html');
        const indexContent = fs.readFileSync(indexPath, 'utf8');

        // The hint should explain that checking shows only museums with collections
        // and unchecking shows all museums
        expect(indexContent).toContain('勾选后主页仅显示有镇馆之宝或藏品信息的博物馆');
        expect(indexContent).toContain('取消勾选则显示全部博物馆');
    });
});
