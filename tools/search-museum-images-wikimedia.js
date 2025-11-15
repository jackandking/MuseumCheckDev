#!/usr/bin/env node

/**
 * Wikimedia Commons Image Search Tool for Museum Photos
 * 
 * This tool searches Wikimedia Commons for museum building photos and treasure photos.
 * No API key required - uses Wikimedia's free API.
 * 
 * Usage:
 *   node tools/search-museum-images-wikimedia.js <museum-name> [treasure-name]
 * 
 * Examples:
 *   node tools/search-museum-images-wikimedia.js "故宫博物院"
 *   node tools/search-museum-images-wikimedia.js "故宫博物院" "清明上河图"
 */

const https = require('https');

// Configuration
const WIKIMEDIA_API_ENDPOINT = 'commons.wikimedia.org';
const DEFAULT_IMAGE_COUNT = 10;

/**
 * Search Wikimedia Commons for images
 * @param {string} query - Search query
 * @param {number} limit - Number of results to return
 * @returns {Promise<Array>} - Array of image results
 */
function searchWikimediaImages(query, limit = DEFAULT_IMAGE_COUNT) {
    return new Promise((resolve, reject) => {
        // Use MediaWiki API with generator to search for images
        const params = new URLSearchParams({
            action: 'query',
            format: 'json',
            generator: 'search',
            gsrnamespace: '6', // File namespace
            gsrsearch: query,
            gsrlimit: limit.toString(),
            prop: 'imageinfo|info',
            iiprop: 'url|size|mime',
            iiurlwidth: '800',
            inprop: 'url'
        });

        const options = {
            hostname: WIKIMEDIA_API_ENDPOINT,
            path: `/w/api.php?${params.toString()}`,
            method: 'GET',
            headers: {
                'User-Agent': 'MuseumCheck/1.0 (Museum Image Search Tool)'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        const pages = result.query?.pages || {};
                        const images = Object.values(pages)
                            .filter(page => page.imageinfo && page.imageinfo.length > 0)
                            .map(page => ({
                                title: page.title,
                                url: page.imageinfo[0].url,
                                thumbUrl: page.imageinfo[0].thumburl || page.imageinfo[0].url,
                                width: page.imageinfo[0].width,
                                height: page.imageinfo[0].height,
                                pageUrl: page.fullurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
                                mime: page.imageinfo[0].mime
                            }));
                        resolve(images);
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${error.message}`));
                    }
                } else {
                    reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`Network error: ${error.message}`));
        });

        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

/**
 * Search for museum building photos
 * @param {string} museumName - Name of the museum
 * @returns {Promise<Array>} - Array of image URLs
 */
async function searchMuseumPhotos(museumName) {
    console.log(`\n🔍 Searching Wikimedia Commons for museum photos: ${museumName}`);
    
    // Try multiple query variations for better results
    const queries = [
        `${museumName}`,
        `${museumName} building`,
        `${museumName} exterior`,
        `Forbidden City Beijing` // English fallback for 故宫
    ];
    
    let allResults = [];
    
    for (const query of queries) {
        try {
            console.log(`   Trying query: "${query}"`);
            const results = await searchWikimediaImages(query, 5);
            allResults = allResults.concat(results);
            
            if (results.length > 0) {
                console.log(`   ✅ Found ${results.length} results`);
            }
        } catch (error) {
            console.log(`   ⚠️  Query failed: ${error.message}`);
        }
        
        // Small delay to be nice to the API
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Remove duplicates by URL
    const uniqueResults = Array.from(
        new Map(allResults.map(img => [img.url, img])).values()
    );
    
    console.log(`\n✅ Total unique results: ${uniqueResults.length}`);
    
    return uniqueResults.slice(0, 10).map((img, index) => ({
        index: index + 1,
        url: img.url,
        thumbnailUrl: img.thumbUrl,
        name: img.title.replace('File:', ''),
        hostPageUrl: img.pageUrl,
        width: img.width,
        height: img.height,
        mime: img.mime
    }));
}

/**
 * Search for treasure/collection photos
 * @param {string} museumName - Name of the museum
 * @param {string} treasureName - Name of the treasure
 * @returns {Promise<Array>} - Array of image URLs
 */
async function searchTreasurePhotos(museumName, treasureName) {
    console.log(`\n🔍 Searching Wikimedia Commons for treasure photos: ${treasureName}`);
    
    // Try multiple query variations
    const queries = [
        `${treasureName}`,
        `${treasureName} ${museumName}`,
        `${treasureName} painting`, // For artworks
        `${treasureName} artifact`  // For artifacts
    ];
    
    // Add English translations for common treasures
    const englishQueries = {
        '清明上河图': 'Along the River During Qingming Festival',
        '太和殿金漆雕龙宝座': 'Imperial Throne Hall of Supreme Harmony',
        '翠玉白菜': 'Jadeite Cabbage'
    };
    
    if (englishQueries[treasureName]) {
        queries.push(englishQueries[treasureName]);
    }
    
    let allResults = [];
    
    for (const query of queries) {
        try {
            console.log(`   Trying query: "${query}"`);
            const results = await searchWikimediaImages(query, 5);
            allResults = allResults.concat(results);
            
            if (results.length > 0) {
                console.log(`   ✅ Found ${results.length} results`);
            }
        } catch (error) {
            console.log(`   ⚠️  Query failed: ${error.message}`);
        }
        
        // Small delay to be nice to the API
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Remove duplicates by URL
    const uniqueResults = Array.from(
        new Map(allResults.map(img => [img.url, img])).values()
    );
    
    console.log(`\n✅ Total unique results: ${uniqueResults.length}`);
    
    return uniqueResults.slice(0, 10).map((img, index) => ({
        index: index + 1,
        url: img.url,
        thumbnailUrl: img.thumbUrl,
        name: img.title.replace('File:', ''),
        hostPageUrl: img.pageUrl,
        width: img.width,
        height: img.height,
        mime: img.mime
    }));
}

/**
 * Format image results for display
 * @param {Array} images - Array of image objects
 * @param {string} title - Title for the results
 */
function displayResults(images, title) {
    if (images.length === 0) {
        console.log(`\n⚠️  No results found for ${title}`);
        return;
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📸 ${title}`);
    console.log('='.repeat(80));
    
    images.forEach((img) => {
        console.log(`\n[${img.index}] ${img.name}`);
        console.log(`    URL: ${img.url}`);
        console.log(`    Thumbnail: ${img.thumbnailUrl}`);
        console.log(`    Size: ${img.width}x${img.height} (${img.mime})`);
        console.log(`    Source: ${img.hostPageUrl}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('💡 Usage: Copy the URL from the results above');
    console.log('💡 All images from Wikimedia Commons are under free licenses');
    console.log('='.repeat(80) + '\n');
}

/**
 * Main CLI function
 */
async function main() {
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.error('\n❌ Error: Museum name is required');
        console.error('\nUsage:');
        console.error('  node tools/search-museum-images-wikimedia.js <museum-name> [treasure-name]');
        console.error('\nExamples:');
        console.error('  node tools/search-museum-images-wikimedia.js "故宫博物院"');
        console.error('  node tools/search-museum-images-wikimedia.js "故宫博物院" "清明上河图"');
        console.error('  node tools/search-museum-images-wikimedia.js "中国国家博物馆" "后母戊鼎"\n');
        process.exit(1);
    }
    
    const museumName = args[0];
    const treasureName = args[1];
    
    console.log('\n🏛️  Wikimedia Commons Image Search Tool for Museums');
    console.log('='.repeat(80));
    console.log('📚 Source: Wikimedia Commons (Free, no API key required)');
    console.log('='.repeat(80));
    console.log(`Museum: ${museumName}`);
    if (treasureName) {
        console.log(`Treasure: ${treasureName}`);
    }
    console.log('='.repeat(80));
    
    try {
        // Search for museum photos
        const museumPhotos = await searchMuseumPhotos(museumName);
        displayResults(museumPhotos, `Museum Building Photos - ${museumName}`);
        
        // Search for treasure photos if provided
        let treasurePhotos = [];
        if (treasureName) {
            treasurePhotos = await searchTreasurePhotos(museumName, treasureName);
            displayResults(treasurePhotos, `Treasure Photos - ${treasureName}`);
        }
        
        // Summary
        console.log('\n✅ Search completed successfully!');
        console.log(`   Museum photos found: ${museumPhotos.length}`);
        if (treasureName) {
            console.log(`   Treasure photos found: ${treasurePhotos.length}`);
        }
        console.log('\n📝 All images are from Wikimedia Commons under free licenses');
        console.log('   Common licenses: Public Domain, CC0, CC BY-SA');
        console.log('\n💾 Next steps:');
        console.log('   1. Review the image URLs above');
        console.log('   2. Verify the images are appropriate and high quality');
        console.log('   3. Copy the URLs to your museum data structure');
        console.log('   4. Consider using verify-treasure-images.js to validate URLs\n');
        
    } catch (error) {
        console.error(`\n❌ Error: ${error.message}\n`);
        process.exit(1);
    }
}

// Export functions for testing
if (require.main === module) {
    main();
} else {
    module.exports = {
        searchWikimediaImages,
        searchMuseumPhotos,
        searchTreasurePhotos
    };
}
