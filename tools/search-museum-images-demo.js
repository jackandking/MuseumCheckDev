#!/usr/bin/env node

/**
 * Demo/Mock Version of Bing Image Search Tool
 * 
 * This is a demonstration version that simulates the Bing Image Search API
 * without requiring an actual API key. Useful for testing and understanding
 * the tool's functionality.
 * 
 * For real image searches, use search-museum-images.js with a valid API key.
 * 
 * Usage:
 *   node tools/search-museum-images-demo.js <museum-name> [treasure-name]
 */

/**
 * Mock search results for demonstration
 */
function getMockMuseumPhotos(museumName) {
    const mockResults = [
        {
            index: 1,
            url: 'https://example.com/museum-photo-1.jpg',
            thumbnailUrl: 'https://example.com/museum-thumb-1.jpg',
            name: `${museumName} 外观 - 建筑摄影`,
            hostPageUrl: 'https://example.com/museum-page',
            width: 1920,
            height: 1080,
            fileSize: '245KB'
        },
        {
            index: 2,
            url: 'https://example.com/museum-photo-2.jpg',
            thumbnailUrl: 'https://example.com/museum-thumb-2.jpg',
            name: `${museumName} 正门 - 高清照片`,
            hostPageUrl: 'https://example.com/museum-page-2',
            width: 1600,
            height: 900,
            fileSize: '198KB'
        },
        {
            index: 3,
            url: 'https://example.com/museum-photo-3.jpg',
            thumbnailUrl: 'https://example.com/museum-thumb-3.jpg',
            name: `${museumName} 全景 - 建筑艺术`,
            hostPageUrl: 'https://example.com/museum-page-3',
            width: 2048,
            height: 1152,
            fileSize: '312KB'
        }
    ];
    
    return mockResults;
}

/**
 * Mock search results for treasures
 */
function getMockTreasurePhotos(museumName, treasureName) {
    const mockResults = [
        {
            index: 1,
            url: 'https://example.com/treasure-photo-1.jpg',
            thumbnailUrl: 'https://example.com/treasure-thumb-1.jpg',
            name: `${treasureName} - ${museumName} 藏品`,
            hostPageUrl: 'https://example.com/treasure-page',
            width: 1200,
            height: 800,
            fileSize: '156KB'
        },
        {
            index: 2,
            url: 'https://example.com/treasure-photo-2.jpg',
            thumbnailUrl: 'https://example.com/treasure-thumb-2.jpg',
            name: `${treasureName} 细节 - 高清图片`,
            hostPageUrl: 'https://example.com/treasure-page-2',
            width: 1500,
            height: 1000,
            fileSize: '203KB'
        }
    ];
    
    return mockResults;
}

/**
 * Format image results for display
 */
function displayResults(images, title) {
    if (images.length === 0) {
        return;
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📸 ${title}`);
    console.log('='.repeat(80));
    
    images.forEach((img) => {
        console.log(`\n[${img.index}] ${img.name}`);
        console.log(`    URL: ${img.url}`);
        console.log(`    Thumbnail: ${img.thumbnailUrl}`);
        console.log(`    Size: ${img.width}x${img.height}`);
        console.log(`    Source: ${img.hostPageUrl}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('💡 Usage: Copy the URL from the results above');
    console.log('='.repeat(80) + '\n');
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.error('\n❌ Error: Museum name is required');
        console.error('\nUsage:');
        console.error('  node tools/search-museum-images-demo.js <museum-name> [treasure-name]');
        console.error('\nExamples:');
        console.error('  node tools/search-museum-images-demo.js "故宫博物院"');
        console.error('  node tools/search-museum-images-demo.js "故宫博物院" "清明上河图"');
        console.error('  node tools/search-museum-images-demo.js "中国国家博物馆" "后母戊鼎"\n');
        process.exit(1);
    }
    
    const museumName = args[0];
    const treasureName = args[1];
    
    console.log('\n🏛️  Bing Image Search Tool - DEMO MODE');
    console.log('='.repeat(80));
    console.log('⚠️  This is a demonstration using mock data');
    console.log('    For real searches, use search-museum-images.js with an API key');
    console.log('='.repeat(80));
    console.log(`Museum: ${museumName}`);
    if (treasureName) {
        console.log(`Treasure: ${treasureName}`);
    }
    console.log('='.repeat(80));
    
    // Simulate API delay
    console.log('\n🔍 Searching for museum photos...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get mock results
    const museumPhotos = getMockMuseumPhotos(museumName);
    console.log(`✅ Found ${museumPhotos.length} results\n`);
    displayResults(museumPhotos, `Museum Building Photos - ${museumName}`);
    
    if (treasureName) {
        console.log('\n🔍 Searching for treasure photos...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const treasurePhotos = getMockTreasurePhotos(museumName, treasureName);
        console.log(`✅ Found ${treasurePhotos.length} results\n`);
        displayResults(treasurePhotos, `Treasure Photos - ${treasureName}`);
    }
    
    // Summary
    console.log('\n✅ Demo search completed!');
    console.log(`   Museum photos found: ${museumPhotos.length}`);
    if (treasureName) {
        console.log(`   Treasure photos found: 2`);
    }
    console.log('\n💾 Next steps to use the REAL tool:');
    console.log('   1. Get a Bing Search API key from Azure');
    console.log('   2. Set environment variable: export BING_SEARCH_API_KEY=your_key');
    console.log('   3. Run: node tools/search-museum-images.js "故宫博物院"');
    console.log('   4. Use verify-treasure-images.js to validate URLs\n');
}

main();
