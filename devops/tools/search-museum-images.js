#!/usr/bin/env node

/**
 * Bing Image Search Tool for Museum Photos
 * 
 * This tool searches Bing for museum building photos and treasure photos,
 * then returns the image URLs for use in museum data updates.
 * 
 * Usage:
 *   node tools/search-museum-images.js <museum-name> [treasure-name]
 * 
 * Examples:
 *   node tools/search-museum-images.js "故宫博物院"
 *   node tools/search-museum-images.js "故宫博物院" "清明上河图"
 * 
 * Environment Variables:
 *   BING_SEARCH_API_KEY - Your Bing Search API key (required)
 */

const https = require('https');

// Configuration
const BING_IMAGE_SEARCH_ENDPOINT = 'https://api.bing.microsoft.com/v7.0/images/search';
const DEFAULT_IMAGE_COUNT = 5;

/**
 * Search Bing Images for a query
 * @param {string} query - Search query
 * @param {string} apiKey - Bing API key
 * @param {number} count - Number of results to return
 * @returns {Promise<Array>} - Array of image results
 */
function searchBingImages(query, apiKey, count = DEFAULT_IMAGE_COUNT) {
    return new Promise((resolve, reject) => {
        const params = new URLSearchParams({
            q: query,
            count: count.toString(),
            imageType: 'Photo',
            safeSearch: 'Strict',
            aspect: 'All'
        });

        const options = {
            hostname: 'api.bing.microsoft.com',
            path: `/v7.0/images/search?${params.toString()}`,
            method: 'GET',
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey
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
                        resolve(result.value || []);
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${error.message}`));
                    }
                } else if (res.statusCode === 401) {
                    reject(new Error('Invalid API key. Please set BING_SEARCH_API_KEY environment variable.'));
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
 * @param {string} apiKey - Bing API key
 * @returns {Promise<Array>} - Array of image URLs
 */
async function searchMuseumPhotos(museumName, apiKey) {
    console.log(`\n🔍 Searching for museum photos: ${museumName}`);
    
    // Construct search query for museum building
    const query = `${museumName} 博物馆外观 建筑`;
    
    try {
        const results = await searchBingImages(query, apiKey);
        
        if (results.length === 0) {
            console.log('❌ No results found');
            return [];
        }
        
        console.log(`✅ Found ${results.length} results\n`);
        
        const imageUrls = results.map((img, index) => ({
            index: index + 1,
            url: img.contentUrl,
            thumbnailUrl: img.thumbnailUrl,
            name: img.name,
            hostPageUrl: img.hostPageUrl,
            width: img.width,
            height: img.height,
            fileSize: img.contentSize
        }));
        
        return imageUrls;
    } catch (error) {
        console.error(`❌ Error searching for museum photos: ${error.message}`);
        return [];
    }
}

/**
 * Search for treasure/collection photos
 * @param {string} museumName - Name of the museum
 * @param {string} treasureName - Name of the treasure
 * @param {string} apiKey - Bing API key
 * @returns {Promise<Array>} - Array of image URLs
 */
async function searchTreasurePhotos(museumName, treasureName, apiKey) {
    console.log(`\n🔍 Searching for treasure photos: ${treasureName} (${museumName})`);
    
    // Construct search query for treasure
    const query = `${treasureName} ${museumName} 文物 高清`;
    
    try {
        const results = await searchBingImages(query, apiKey);
        
        if (results.length === 0) {
            console.log('❌ No results found');
            return [];
        }
        
        console.log(`✅ Found ${results.length} results\n`);
        
        const imageUrls = results.map((img, index) => ({
            index: index + 1,
            url: img.contentUrl,
            thumbnailUrl: img.thumbnailUrl,
            name: img.name,
            hostPageUrl: img.hostPageUrl,
            width: img.width,
            height: img.height,
            fileSize: img.contentSize
        }));
        
        return imageUrls;
    } catch (error) {
        console.error(`❌ Error searching for treasure photos: ${error.message}`);
        return [];
    }
}

/**
 * Format image results for display
 * @param {Array} images - Array of image objects
 * @param {string} title - Title for the results
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
 * Main CLI function
 */
async function main() {
    // Check for API key
    const apiKey = process.env.BING_SEARCH_API_KEY;
    
    if (!apiKey) {
        console.error('\n❌ Error: BING_SEARCH_API_KEY environment variable not set');
        console.error('\n📝 How to get a Bing Search API key:');
        console.error('   1. Go to https://azure.microsoft.com/en-us/services/cognitive-services/bing-web-search-api/');
        console.error('   2. Sign up for a free Azure account');
        console.error('   3. Create a Bing Search resource');
        console.error('   4. Copy your API key');
        console.error('   5. Set it: export BING_SEARCH_API_KEY=your_key_here\n');
        process.exit(1);
    }
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.error('\n❌ Error: Museum name is required');
        console.error('\nUsage:');
        console.error('  node tools/search-museum-images.js <museum-name> [treasure-name]');
        console.error('\nExamples:');
        console.error('  node tools/search-museum-images.js "故宫博物院"');
        console.error('  node tools/search-museum-images.js "故宫博物院" "清明上河图"');
        console.error('  node tools/search-museum-images.js "中国国家博物馆" "后母戊鼎"\n');
        process.exit(1);
    }
    
    const museumName = args[0];
    const treasureName = args[1];
    
    console.log('\n🏛️  Bing Image Search Tool for Museums');
    console.log('='.repeat(80));
    console.log(`Museum: ${museumName}`);
    if (treasureName) {
        console.log(`Treasure: ${treasureName}`);
    }
    console.log('='.repeat(80));
    
    try {
        // Search for museum photos
        const museumPhotos = await searchMuseumPhotos(museumName, apiKey);
        displayResults(museumPhotos, `Museum Building Photos - ${museumName}`);
        
        // Search for treasure photos if provided
        if (treasureName) {
            const treasurePhotos = await searchTreasurePhotos(museumName, treasureName, apiKey);
            displayResults(treasurePhotos, `Treasure Photos - ${treasureName}`);
        }
        
        // Summary
        console.log('\n✅ Search completed successfully!');
        console.log(`   Museum photos found: ${museumPhotos.length}`);
        if (treasureName) {
            console.log(`   Treasure photos found: ${treasurePhotos.length || 0}`);
        }
        console.log('\n💾 Next steps:');
        console.log('   1. Review the image URLs above');
        console.log('   2. Verify the images are appropriate and high quality');
        console.log('   3. Copy the URLs to your museum data structure');
        console.log('   4. Use verify-treasure-images.js to validate URLs\n');
        
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
        searchBingImages,
        searchMuseumPhotos,
        searchTreasurePhotos
    };
}
