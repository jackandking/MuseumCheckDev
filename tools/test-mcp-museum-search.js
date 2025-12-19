#!/usr/bin/env node

/**
 * Test script for museum search MCP tool
 * Tests the search_official_museums tool to verify it works correctly
 */

async function testMuseumSearch() {
  console.log('🧪 Testing Museum Search API...\n');
  
  const testCases = [
    { name: '故宫', description: 'Search for Forbidden City museums' },
    { name: '国家博物馆', description: 'Search for National Museum' },
    { name: '上海博物馆', description: 'Search for Shanghai Museum' },
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📍 Test: ${testCase.description}`);
    console.log(`   Query: ${testCase.name}`);
    
    try {
      const response = await fetch('https://letmetry.cloud/museum/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ museumName: testCase.name }),
      });
      
      if (!response.ok) {
        console.error(`   ❌ HTTP error: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (!data.success) {
        console.error(`   ❌ API error: ${data.error || 'Unknown error'}`);
        continue;
      }
      
      console.log(`   ✅ Found ${data.count} museums:`);
      data.museums.forEach((museum, index) => {
        console.log(`      ${index + 1}. ${museum.name} (${museum.province})`);
        console.log(`         - Quality: ${museum.qualityGrade}`);
        console.log(`         - Collections: ${museum.collectionCount}`);
        console.log(`         - Visitors: ${museum.visitorCount}万人/年`);
      });
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n✅ Museum search API test completed!\n');
}

testMuseumSearch().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
