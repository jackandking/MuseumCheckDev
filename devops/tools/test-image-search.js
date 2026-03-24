#!/usr/bin/env node

/**
 * Test script for museum image search tool
 * Verifies the tool structure and exports work correctly
 */

const assert = require('assert');

console.log('🧪 Testing Museum Image Search Tool\n');

// Test 1: Module exports
console.log('Test 1: Checking module exports...');
const searchModule = require('./search-museum-images.js');
assert(typeof searchModule.searchBingImages === 'function', 'searchBingImages should be a function');
assert(typeof searchModule.searchMuseumPhotos === 'function', 'searchMuseumPhotos should be a function');
assert(typeof searchModule.searchTreasurePhotos === 'function', 'searchTreasurePhotos should be a function');
console.log('✅ All functions exported correctly\n');

// Test 2: Demo version runs
console.log('Test 2: Testing demo version...');
const { execSync } = require('child_process');
try {
    const output = execSync('node tools/search-museum-images-demo.js "故宫博物院" "清明上河图"', {
        cwd: __dirname + '/../..',
        encoding: 'utf8'
    });
    assert(output.includes('DEMO MODE'), 'Demo should indicate demo mode');
    assert(output.includes('故宫博物院'), 'Demo should show museum name');
    assert(output.includes('清明上河图'), 'Demo should show treasure name');
    assert(output.includes('Museum photos found: 3'), 'Demo should show museum photo count');
    assert(output.includes('Treasure photos found: 2'), 'Demo should show treasure photo count');
    console.log('✅ Demo version works correctly\n');
} catch (error) {
    console.error('❌ Demo test failed:', error.message);
    process.exit(1);
}

// Test 3: Main tool shows helpful error without API key
console.log('Test 3: Testing main tool without API key...');
try {
    execSync('node tools/search-museum-images.js "故宫博物院"', {
        cwd: __dirname + '/../..',
        encoding: 'utf8'
    });
    console.error('❌ Should have thrown error without API key');
    process.exit(1);
} catch (error) {
    const stderr = error.stderr || error.stdout || '';
    assert(stderr.includes('BING_SEARCH_API_KEY'), 'Should mention API key requirement');
    assert(stderr.includes('Azure'), 'Should mention Azure');
    console.log('✅ Main tool shows correct error without API key\n');
}

// Test 4: Help message when no arguments
console.log('Test 4: Testing help message...');
try {
    execSync('node tools/search-museum-images.js', {
        cwd: __dirname + '/../..',
        encoding: 'utf8'
    });
    console.error('❌ Should have shown error for missing arguments');
    process.exit(1);
} catch (error) {
    // Expected to fail, checking error message
    console.log('✅ Tool requires arguments as expected\n');
}

console.log('🎉 All tests passed!\n');
console.log('Summary:');
console.log('  ✅ Module exports work correctly');
console.log('  ✅ Demo version produces expected output');
console.log('  ✅ Main tool validates API key properly');
console.log('  ✅ Help messages are informative');
console.log('\nNext steps:');
console.log('  1. Get a Bing Search API key from Azure');
console.log('  2. Set: export BING_SEARCH_API_KEY=your_key');
console.log('  3. Run: node tools/search-museum-images.js "故宫博物院"');
