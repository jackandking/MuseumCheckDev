/**
 * Test to verify browser cache busting for admin leaderboard page
 * 
 * Issue: User reported empty data in admin page even after checking in museums
 * Root cause: Browser cache serving old admin-leaderboard.js file
 * Solution: Version bump from 2.1.3 to 2.1.4 in HTML script tag
 */

const fs = require('fs');
const path = require('path');

describe('Leaderboard Admin Page Cache Busting', () => {
  test('admin-leaderboard.html should reference version 2.1.4 or higher', () => {
    const htmlPath = path.join(__dirname, '..', 'admin-leaderboard.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Check that script tag includes version parameter
    const scriptTagMatch = htmlContent.match(/<script\s+src="\.\/admin-leaderboard\.js\?v=([^"]+)"><\/script>/);
    
    expect(scriptTagMatch).toBeTruthy();
    expect(scriptTagMatch).toHaveLength(2);
    
    const version = scriptTagMatch[1];
    
    // Version should be 2.1.4 or higher
    const versionParts = version.split('.').map(Number);
    expect(versionParts[0]).toBeGreaterThanOrEqual(2);
    expect(versionParts[1]).toBeGreaterThanOrEqual(1);
    expect(versionParts[2]).toBeGreaterThanOrEqual(4);
  });
  
  test('admin-leaderboard.js should have version header comment', () => {
    const jsPath = path.join(__dirname, '..', 'admin-leaderboard.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    
    // Check for version header
    expect(jsContent).toContain('* Version: 2.1.4');
    expect(jsContent).toContain('* Last Updated:');
  });
  
  test('package.json version should be 2.1.4 or higher', () => {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const version = packageJson.version;
    const versionParts = version.split('.').map(Number);
    
    expect(versionParts[0]).toBeGreaterThanOrEqual(2);
    expect(versionParts[1]).toBeGreaterThanOrEqual(1);
    expect(versionParts[2]).toBeGreaterThanOrEqual(4);
  });
  
  test('admin-leaderboard.js should still have both code fixes applied', () => {
    const jsPath = path.join(__dirname, '..', 'admin-leaderboard.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    
    // Check for items/Items compatibility fix
    expect(jsContent).toContain('data.items || data.Items');
    expect(jsContent).toContain("Support both 'items' (lowercase) and 'Items' (capital I) for AWS DynamoDB compatibility");
    
    // Check for expireAt fix
    expect(jsContent).toContain('expireAt: CONFIG.TIMESTAMP_2124');
    expect(jsContent).toContain("IMPORTANT: API requires 'expireAt' in seconds");
  });
});
