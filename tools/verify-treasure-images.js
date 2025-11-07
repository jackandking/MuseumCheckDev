/**
 * Museum Treasure Image Verification Tool
 * Verifies that image URLs are accessible before adding to museum data
 */

const https = require('https');
const http = require('http');

/**
 * Verify if an image URL is accessible
 * @param {string} url - The image URL to verify
 * @returns {Promise<object>} - Verification result with status and details
 */
function verifyImageUrl(url) {
    return new Promise((resolve) => {
        const protocol = url.startsWith('https') ? https : http;
        const startTime = Date.now();
        
        const request = protocol.get(url, (response) => {
            const duration = Date.now() - startTime;
            const { statusCode, headers } = response;
            
            // Consume response data to free up memory
            response.resume();
            
            const result = {
                url,
                accessible: statusCode === 200,
                statusCode,
                contentType: headers['content-type'],
                contentLength: headers['content-length'],
                duration: `${duration}ms`,
                timestamp: new Date().toISOString()
            };
            
            resolve(result);
        });
        
        request.on('error', (error) => {
            resolve({
                url,
                accessible: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        });
        
        request.setTimeout(10000, () => {
            request.destroy();
            resolve({
                url,
                accessible: false,
                error: 'Request timeout',
                timestamp: new Date().toISOString()
            });
        });
    });
}

/**
 * Verify multiple image URLs
 * @param {Array<{museum: string, url: string}>} images - Array of museum images to verify
 * @returns {Promise<Array>} - Array of verification results
 */
async function verifyMultipleImages(images) {
    console.log(`\n🔍 Verifying ${images.length} museum treasure images...\n`);
    
    const results = [];
    
    for (const { museum, url } of images) {
        console.log(`Checking: ${museum}`);
        const result = await verifyImageUrl(url);
        results.push({ museum, ...result });
        
        if (result.accessible) {
            console.log(`  ✅ ACCESSIBLE - ${result.statusCode} - ${result.contentType} - ${result.duration}`);
        } else {
            console.log(`  ❌ FAILED - ${result.error || result.statusCode}`);
        }
    }
    
    return results;
}

/**
 * Generate verification report
 * @param {Array} results - Verification results
 */
function generateReport(results) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 VERIFICATION REPORT');
    console.log('='.repeat(80));
    
    const successful = results.filter(r => r.accessible);
    const failed = results.filter(r => !r.accessible);
    
    console.log(`\nTotal images checked: ${results.length}`);
    console.log(`✅ Accessible: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`Success rate: ${((successful.length / results.length) * 100).toFixed(1)}%`);
    
    if (successful.length > 0) {
        console.log('\n✅ ACCESSIBLE IMAGES:');
        successful.forEach(r => {
            console.log(`  - ${r.museum}`);
            console.log(`    ${r.url}`);
        });
    }
    
    if (failed.length > 0) {
        console.log('\n❌ FAILED IMAGES:');
        failed.forEach(r => {
            console.log(`  - ${r.museum}: ${r.error || r.statusCode}`);
            console.log(`    ${r.url}`);
        });
    }
    
    console.log('\n' + '='.repeat(80));
}

// Example treasure images for major Chinese museums
// These are publicly available images of famous museum treasures
const treasureImages = [
    {
        museum: '秦始皇帝陵博物院',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Terracotta_Army_Pit_1_-_5.jpg/500px-Terracotta_Army_Pit_1_-_5.jpg'
    },
    {
        museum: '南京博物院',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Nanjing_Museum_2018.jpg/500px-Nanjing_Museum_2018.jpg'
    },
    {
        museum: '湖北省博物馆',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Bianzhong.jpg/500px-Bianzhong.jpg'
    },
    {
        museum: '陕西历史博物馆',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Shaanxi_History_Museum_2016.jpg/500px-Shaanxi_History_Museum_2016.jpg'
    },
    {
        museum: '苏州博物馆',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Suzhou_Museum_2015.jpg/500px-Suzhou_Museum_2015.jpg'
    },
    {
        museum: '浙江省博物馆',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Zhejiang_Museum_2017.jpg/500px-Zhejiang_Museum_2017.jpg'
    }
];

// Main execution
if (require.main === module) {
    (async () => {
        const results = await verifyMultipleImages(treasureImages);
        generateReport(results);
        
        // Save results to file
        const fs = require('fs');
        const reportPath = '/tmp/image-verification-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        console.log(`\n💾 Detailed results saved to: ${reportPath}`);
    })();
}

module.exports = {
    verifyImageUrl,
    verifyMultipleImages,
    generateReport
};
