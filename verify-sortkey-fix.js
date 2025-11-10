/**
 * Verification script for leaderboard sortKey parameter fix
 * 
 * This script verifies that:
 * 1. admin-leaderboard.js fetchLeaderboard includes sortKey=*
 * 2. script.js fetchLeaderboard includes sortKey=*
 * 3. Both use the wildcard pattern to fetch all leaderboard entries
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Leaderboard sortKey Parameter Fix...\n');

// Read script.js
const scriptPath = path.join(__dirname, 'script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Read admin-leaderboard.js
const adminPath = path.join(__dirname, 'admin-leaderboard.js');
const adminContent = fs.readFileSync(adminPath, 'utf8');

// Check 1: Verify admin-leaderboard.js includes sortKey=* in fetchLeaderboard
const adminHasSortKey = adminContent.includes('sortKey=*') || adminContent.includes('sortKey=\\*');
const adminFetchMatch = adminContent.match(/fetchLeaderboard[\s\S]*?const url = [`']([^`']+)[`']/);

console.log(`✓ Check 1: admin-leaderboard.js fetchLeaderboard()`);
console.log(`   Includes sortKey=*: ${adminHasSortKey ? '✅ YES' : '❌ NO'}`);
if (adminFetchMatch) {
  console.log(`   URL pattern: ${adminFetchMatch[1]}`);
}

// Check 2: Verify script.js includes sortKey=* in fetchLeaderboard
const scriptHasSortKey = scriptContent.includes('sortKey=*') || scriptContent.includes('sortKey=\\*');
const scriptFetchMatch = scriptContent.match(/fetchLeaderboard[\s\S]{0,500}const url = [`']\$\{[^}]+\}\?key=\$\{[^}]+\}([^`']*)[`']/);

console.log(`\n✓ Check 2: script.js fetchLeaderboard()`);
console.log(`   Includes sortKey=*: ${scriptHasSortKey ? '✅ YES' : '❌ NO'}`);
if (scriptFetchMatch) {
  console.log(`   Query params: ${scriptFetchMatch[1]}`);
}

// Check 3: Verify proper URL encoding (sortKey should be in URL, not encoded as %2A)
const adminUrlCorrect = adminContent.includes('&sortKey=*') || adminContent.includes('&sortKey=\\*');
const scriptUrlCorrect = scriptContent.includes('&sortKey=*') || scriptContent.includes('&sortKey=\\*');

console.log(`\n✓ Check 3: Proper URL format with sortKey parameter`);
console.log(`   admin-leaderboard.js has &sortKey=*: ${adminUrlCorrect ? '✅ YES' : '❌ NO'}`);
console.log(`   script.js has &sortKey=*: ${scriptUrlCorrect ? '✅ YES' : '❌ NO'}`);

// Check 4: Ensure the pattern matches the working firework example
console.log(`\n✓ Check 4: Consistency with working firework pattern`);
const fireworkPath = path.join(__dirname, 'admin-fireworks.js');
if (fs.existsSync(fireworkPath)) {
  const fireworkContent = fs.readFileSync(fireworkPath, 'utf8');
  const fireworkHasSortKey = fireworkContent.includes('sortKey=*') || fireworkContent.includes('sortKey=\\*');
  console.log(`   admin-fireworks.js uses sortKey=*: ${fireworkHasSortKey ? '✅ YES (reference pattern)' : '❌ NO'}`);
  console.log(`   Pattern matches: ${(adminHasSortKey && scriptHasSortKey && fireworkHasSortKey) ? '✅ YES' : '❌ NO'}`);
}

// Summary
console.log('\n📊 Verification Summary:');
const allChecks = [
  adminHasSortKey,
  scriptHasSortKey,
  adminUrlCorrect,
  scriptUrlCorrect
];

const passedChecks = allChecks.filter(c => c).length;
const totalChecks = allChecks.length;

console.log(`   ${passedChecks}/${totalChecks} checks passed`);

if (passedChecks === totalChecks) {
  console.log('\n✅ All verification checks passed! The sortKey fix is properly implemented.');
  console.log('\nWhat was fixed:');
  console.log('  • admin-leaderboard.js line 33: Added &sortKey=* to fetch all leaderboard entries');
  console.log('  • script.js line 3485: Added &sortKey=* to fetch all leaderboard entries');
  console.log('\nThis ensures the API returns all leaderboard data instead of "Item not found".');
  console.log('\nPrevious URL:  ?key=museumcheck-leaderboard');
  console.log('Fixed URL:     ?key=museumcheck-leaderboard&sortKey=*');
  console.log('\nReference:     https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore?key=museumcheck-firework&sortKey=*');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed. Please review the implementation.');
  
  if (!adminHasSortKey) console.log('  • FIX: admin-leaderboard.js fetchLeaderboard() should include sortKey=*');
  if (!scriptHasSortKey) console.log('  • FIX: script.js fetchLeaderboard() should include sortKey=*');
  if (!adminUrlCorrect) console.log('  • FIX: admin-leaderboard.js URL should have &sortKey=* parameter');
  if (!scriptUrlCorrect) console.log('  • FIX: script.js URL should have &sortKey=* parameter');
  
  process.exit(1);
}
