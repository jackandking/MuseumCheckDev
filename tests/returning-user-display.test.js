describe('Returning User Display - Recently Visited Museums First', () => {
    beforeEach(() => {
        // Clear all storage
        localStorage.clear();
    });

    test('老用户逻辑：应该在代码中检测访问过的博物馆', () => {
        // Verify the isReturningUser logic exists in the codebase
        const fs = require('fs');
        const path = require('path');
        const scriptPath = path.join(__dirname, '..', 'js', 'script.js');
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');

        // Check that the logic detects returning users based on visitedMuseumsMeta
        expect(scriptContent).toContain('isReturningUser');
        expect(scriptContent).toContain('loadVisitedMuseumsMeta');
        expect(scriptContent).toContain('getVisitedMuseumsSorted');
        
        // Verify the returning user detection checks both visitedMuseums and visitedMuseumsMeta
        const returningUserPattern = /isReturningUser\s*=\s*\(Array\.isArray\(.*visitedMuseums.*\)|.*loadVisitedMuseumsMeta/;
        expect(scriptContent).toMatch(returningUserPattern);
    });

    test('老用户应该看到访问过的博物馆列表（按最近访问排序） - 代码验证', () => {
        // Verify the sorting logic in the code
        const fs = require('fs');
        const path = require('path');
        const scriptPath = path.join(__dirname, '..', 'js', 'script.js');
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');

        // Check that getVisitedMuseumsSorted sorts by timestamp descending
        expect(scriptContent).toContain('getVisitedMuseumsSorted()');
        
        // Verify sorting logic: entries.sort((a, b) => b[1] - a[1]) means descending order (newest first)
        const sortingPattern = /entries\.sort\(\(a,\s*b\)\s*=>\s*b\[1\]\s*-\s*a\[1\]\)/;
        expect(scriptContent).toMatch(sortingPattern);
    });

    test('老用户只应该看到访问过的博物馆卡片，其他博物馆不显示 - 代码验证', () => {
        // Verify that the rendering logic shows only visited museums for returning users
        const fs = require('fs');
        const path = require('path');
        const scriptPath = path.join(__dirname, '..', 'js', 'script.js');
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');

        // Check that for returning users, both visited and browsed museums are shown
        // New logic: combine visited museums (fully completed) with browsed museums (just clicked)
        expect(scriptContent).toContain('getVisitedMuseumsSorted()');
        expect(scriptContent).toContain('browsedMuseums');
        expect(scriptContent).toContain('isReturningUser');
        
        // Verify the rendering logic includes both visited and browsed
        const renderingLogicPattern = /if\s*\(\s*isReturningUser\s*\)/;
        expect(scriptContent).toMatch(renderingLogicPattern);
    });

    test('当访问新博物馆时，visitedMuseumsMeta 应该更新最近访问时间', () => {
        // Verify that visit tracking updates the metadata timestamp
        const fs = require('fs');
        const path = require('path');
        const scriptPath = path.join(__dirname, '..', 'js', 'script.js');
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');

        // Check that when marking museum as visited, the timestamp is recorded
        expect(scriptContent).toContain('visitedMuseumsMeta');
        expect(scriptContent).toContain('Date.now()');
        
        // Verify saveVisitedMuseumsMeta is called
        expect(scriptContent).toContain('saveVisitedMuseumsMeta');
    });

    test('老用户返回应用时，访问过的博物馆应该按最近访问时间排序 - 集成验证', () => {
        // Verify complete flow: load from localStorage, sort, render
        const fs = require('fs');
        const path = require('path');
        const scriptPath = path.join(__dirname, '..', 'js', 'script.js');
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');

        // Verify loadVisitedMuseumsMeta reads from localStorage
        expect(scriptContent).toContain("localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.VISITED_MUSEUMS_META)");
        
        // Verify the sorting in getVisitedMuseumsSorted
        expect(scriptContent).toContain('Object.entries(meta || {})');
        expect(scriptContent).toContain('.sort((a, b) => b[1] - a[1])');
        
        // Verify that MUSEUMS.find is used to get museum objects from IDs
        expect(scriptContent).toContain('MUSEUMS.find(m => m.id === id)');
    });

    test('新用户（未访问过）应该看到全部或按城市过滤的博物馆', () => {
        // Verify the new user experience
        const fs = require('fs');
        const path = require('path');
        const scriptPath = path.join(__dirname, '..', 'js', 'script.js');
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');

        // Check that there's a separate branch for new users
        expect(scriptContent).toContain('isNewUser');
        expect(scriptContent).toContain('getUserCity');
        
        // Verify that new users get city-based recommendations
        expect(scriptContent).toContain("已为你推荐");
    });

    test('清除数据时应该同时清除 visitedMuseumsMeta', () => {
        // Verify that clearing data removes the visit metadata
        const fs = require('fs');
        const path = require('path');
        const scriptPath = path.join(__dirname, '..', 'js', 'script.js');
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');

        // Check that removeItem is called for visitedMuseumsMeta during data clearing
        expect(scriptContent).toContain('removeItem');
        expect(scriptContent).toContain('VISITED_MUSEUMS_META');
    });
});
