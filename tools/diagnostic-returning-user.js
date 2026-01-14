/**
 * Diagnostic script to check returning user detection
 * Run in browser console to diagnose issues
 */

console.log('=== MuseumCheck Returning User Diagnostic ===\n');

// Check localStorage data
console.log('1. LocalStorage Contents:');
console.log('  visitedMuseums:', localStorage.getItem('visitedMuseums'));
console.log('  visitedMuseumsMeta:', localStorage.getItem('visitedMuseumsMeta'));
console.log('  showOnlyMuseumsWithCollections:', localStorage.getItem('showOnlyMuseumsWithCollections'));

// Check if app is initialized
console.log('\n2. App State:');
if (typeof app !== 'undefined' && app) {
    console.log('  ✅ app instance exists');
    console.log('  visitedMuseums array:', app.visitedMuseums);
    console.log('  showOnlyMuseumsWithCollections:', app.showOnlyMuseumsWithCollections);
    
    // Check the returning user logic
    const isReturningUser = (Array.isArray(app.visitedMuseums) && app.visitedMuseums.length > 0)
        || (Object.keys(app.loadVisitedMuseumsMeta() || {}).length > 0);
    console.log('  ✅ isReturningUser:', isReturningUser);
    
    // Check visited museums meta
    const meta = app.loadVisitedMuseumsMeta() || {};
    console.log('  ✅ visitedMuseumsMeta loaded:', meta);
    console.log('  ✅ visitedMuseumsMeta keys:', Object.keys(meta));
} else {
    console.log('  ❌ app instance not found');
}

console.log('\n3. Testing Data:');
console.log('  To test returning user experience:');
console.log('  1. Add test data: localStorage.setItem("visitedMuseumsMeta", JSON.stringify({"forbidden-city": Date.now() - 3600000, "national-museum": Date.now()}))');
console.log('  2. Refresh page');
console.log('  3. Should see only visited museums with national-museum at top');

console.log('\n4. Resetting for fresh test:');
console.log('  To start fresh: localStorage.clear(); location.reload()');
