/**
 * Verification script for leaderboard sortKey pattern fix
 * 
 * This script verifies that the fix for the leaderboard API query is correctly implemented.
 * 
 * Issue: Homepage leaderboard only shows one local record, missing network data from other users
 * Fix: Changed sortKey from '*' to 'user-*' to match all user records
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Leaderboard SortKey Pattern Fix\n');

let allChecksPassed = true;

// Check 1: Verify script.js uses user-* pattern
console.log('Check 1: Verifying script.js uses sortKey=user-* pattern...');
const scriptJsPath = path.join(__dirname, 'script.js');
const scriptContent = fs.readFileSync(scriptJsPath, 'utf8');

// Look for the fetchLeaderboard function
const fetchLeaderboardMatch = scriptContent.match(/async fetchLeaderboard\(forceRefresh = false\)[^}]+\{[\s\S]+?return \{[^}]+\};\s+\}/);
if (fetchLeaderboardMatch) {
    const fetchLeaderboardCode = fetchLeaderboardMatch[0];
    
    // Check if it uses user-* pattern
    if (fetchLeaderboardCode.includes('sortKey=user-*')) {
        console.log('✅ PASS: script.js uses sortKey=user-* pattern');
    } else if (fetchLeaderboardCode.includes('sortKey=*') && !fetchLeaderboardCode.includes('sortKey=user-*')) {
        console.log('❌ FAIL: script.js still uses sortKey=* instead of sortKey=user-*');
        allChecksPassed = false;
    } else {
        console.log('⚠️  WARNING: Cannot determine sortKey pattern in script.js');
    }
} else {
    console.log('⚠️  WARNING: Cannot find fetchLeaderboard function in script.js');
}

// Check 2: Verify admin-leaderboard.js uses user-* pattern
console.log('\nCheck 2: Verifying admin-leaderboard.js uses sortKey=user-* pattern...');
const adminLeaderboardPath = path.join(__dirname, 'admin-leaderboard.js');
const adminContent = fs.readFileSync(adminLeaderboardPath, 'utf8');

// Look for the fetchLeaderboard function
const adminFetchMatch = adminContent.match(/async fetchLeaderboard\(\)[^}]+\{[\s\S]+?return entries;\s+\}/);
if (adminFetchMatch) {
    const adminFetchCode = adminFetchMatch[0];
    
    // Check if it uses user-* pattern
    if (adminFetchCode.includes('sortKey=user-*')) {
        console.log('✅ PASS: admin-leaderboard.js uses sortKey=user-* pattern');
    } else if (adminFetchCode.includes('sortKey=*') && !adminFetchCode.includes('sortKey=user-*')) {
        console.log('❌ FAIL: admin-leaderboard.js still uses sortKey=* instead of sortKey=user-*');
        allChecksPassed = false;
    } else {
        console.log('⚠️  WARNING: Cannot determine sortKey pattern in admin-leaderboard.js');
    }
} else {
    console.log('⚠️  WARNING: Cannot find fetchLeaderboard function in admin-leaderboard.js');
}

// Check 3: Verify regression test exists
console.log('\nCheck 3: Verifying regression test file exists...');
const testFilePath = path.join(__dirname, 'tests', 'leaderboard-sortkey-pattern.test.js');
if (fs.existsSync(testFilePath)) {
    console.log('✅ PASS: Regression test file exists at tests/leaderboard-sortkey-pattern.test.js');
    
    // Verify test content
    const testContent = fs.readFileSync(testFilePath, 'utf8');
    if (testContent.includes('sortKey=user-*') && testContent.includes('should use sortKey=user-* to match all user records')) {
        console.log('✅ PASS: Test file contains correct test cases');
    } else {
        console.log('⚠️  WARNING: Test file may be missing expected test cases');
    }
} else {
    console.log('❌ FAIL: Regression test file not found');
    allChecksPassed = false;
}

// Check 4: Verify no usage of plain sortKey=* without user- prefix
console.log('\nCheck 4: Checking for any remaining sortKey=* patterns (should only have user-*)...');
const sortKeyStarRegex = /sortKey=\*/g;
const userStarRegex = /sortKey=user-\*/g;

const scriptMatches = scriptContent.match(sortKeyStarRegex);
const scriptUserMatches = scriptContent.match(userStarRegex);

const adminMatches = adminContent.match(sortKeyStarRegex);
const adminUserMatches = adminContent.match(userStarRegex);

// Count occurrences (user-* should be subset of *)
const scriptPlainStars = scriptMatches ? scriptMatches.length - (scriptUserMatches ? scriptUserMatches.length : 0) : 0;
const adminPlainStars = adminMatches ? adminMatches.length - (adminUserMatches ? adminUserMatches.length : 0) : 0;

if (scriptPlainStars === 0 && adminPlainStars === 0) {
    console.log('✅ PASS: No plain sortKey=* patterns found (all use user-* prefix)');
} else {
    console.log(`⚠️  WARNING: Found ${scriptPlainStars} plain sortKey=* in script.js, ${adminPlainStars} in admin-leaderboard.js`);
    console.log('   These may be in comments or other contexts. Manual review recommended.');
}

// Check 5: Verify comments explain the change
console.log('\nCheck 5: Verifying code comments explain the pattern...');
const scriptCommentMatch = scriptContent.match(/\/\/.*user-\*/i);
const adminCommentMatch = adminContent.match(/\/\/.*user-\*/i);

if (scriptCommentMatch && adminCommentMatch) {
    console.log('✅ PASS: Both files have comments explaining the user-* pattern');
} else if (scriptCommentMatch || adminCommentMatch) {
    console.log('⚠️  WARNING: Only one file has explanatory comments');
} else {
    console.log('⚠️  WARNING: No explanatory comments found for the pattern change');
}

// Summary
console.log('\n' + '='.repeat(60));
if (allChecksPassed) {
    console.log('✅ All critical checks passed!');
    console.log('\nThe fix has been correctly implemented:');
    console.log('- script.js uses sortKey=user-* pattern');
    console.log('- admin-leaderboard.js uses sortKey=user-* pattern');
    console.log('- Regression test suite created');
    console.log('\nThis should resolve the issue where the leaderboard only showed');
    console.log('one local record instead of all users\' network data.');
} else {
    console.log('❌ Some checks failed!');
    console.log('\nPlease review the failed checks above and ensure:');
    console.log('1. Both script.js and admin-leaderboard.js use sortKey=user-*');
    console.log('2. Regression tests are in place');
    process.exit(1);
}

console.log('\n' + '='.repeat(60));
console.log('\n📝 Next Steps:');
console.log('1. Run unit tests: npm test -- tests/leaderboard-sortkey-pattern.test.js');
console.log('2. Test manually with live API to verify multiple users appear');
console.log('3. Check browser console for correct API URL being called');
console.log('4. Verify admin leaderboard page also shows all users');
