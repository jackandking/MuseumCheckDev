#!/usr/bin/env node
/**
 * QR Code Generator for Museum Check-in Pages
 * 
 * This script generates QR codes for museum-specific check-in pages.
 * QR codes should link to museum-checkin.html with ONLY the museum parameter,
 * NOT including the age parameter, so users can select their age group after scanning.
 * 
 * Usage:
 *   node tools/generate-museum-qr.js <museum-id> <output-filename>
 * 
 * Example:
 *   node tools/generate-museum-qr.js zhaoyuan-hengli-watch-museum MuseumCheck_QRCode_ZhaoyuanHengliWatchMuseum.png
 */

const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'https://museumcheck.cn/museum-checkin.html';
const QR_CODE_OPTIONS = {
    errorCorrectionLevel: 'H',  // High error correction for better scanning
    type: 'image/png',
    quality: 0.95,
    margin: 4,
    width: 512,  // Good size for scanning
    color: {
        dark: '#000000',
        light: '#FFFFFF'
    }
};

/**
 * Generate QR code for a museum check-in page
 * @param {string} museumId - The museum ID (e.g., 'forbidden-city')
 * @param {string} outputFilename - The output filename (e.g., 'MuseumCheck_QRCode_ForbiddenCity.png')
 */
async function generateMuseumQRCode(museumId, outputFilename) {
    // Build URL WITHOUT age parameter - users will select age after scanning
    const url = `${BASE_URL}?museum=${museumId}`;
    
    console.log(`Generating QR code for: ${museumId}`);
    console.log(`URL: ${url}`);
    console.log(`Output: ${outputFilename}`);
    
    try {
        // Determine standardized output filename if not provided
        function toPascalCase(id) {
            return String(id)
                .split('-')
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join('');
        }
        function trimSuffix(id, suffix) {
            return String(id).endsWith(suffix) ? String(id).slice(0, -suffix.length) : id;
        }
        const standardizedName = (() => {
            if (outputFilename && typeof outputFilename === 'string' && outputFilename.trim()) {
                return outputFilename;
            }
            const trimmed = trimSuffix(museumId, '-museum');
            const base = toPascalCase(trimmed);
            return `MuseumCheck_QRCode_${base}.png`;
        })();

        // Generate QR code
        const outputPath = path.join(__dirname, '..', '..', standardizedName);
        await QRCode.toFile(outputPath, url, QR_CODE_OPTIONS);
        
        console.log(`✓ QR code generated successfully: ${outputPath}`);
        console.log(`✓ File size: ${fs.statSync(outputPath).size} bytes`);
        
        return outputPath;
    } catch (error) {
        console.error(`✗ Error generating QR code: ${error.message}`);
        throw error;
    }
}

/**
 * Validate museum ID format
 */
function validateMuseumId(museumId) {
    if (!museumId || typeof museumId !== 'string') {
        throw new Error('Museum ID must be a non-empty string');
    }
    
    // Museum IDs should be lowercase with hyphens
    if (!/^[a-z0-9-]+$/.test(museumId)) {
        console.warn(`Warning: Museum ID "${museumId}" may not follow naming convention (lowercase-with-hyphens)`);
    }
    
    return true;
}

/**
 * Main execution
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.error('Usage: node tools/generate-museum-qr.js <museum-id> <output-filename>');
        console.error('');
        console.error('Example:');
        console.error('  node tools/generate-museum-qr.js forbidden-city MuseumCheck_QRCode_ForbiddenCity.png');
        console.error('  node tools/generate-museum-qr.js zhaoyuan-hengli-watch-museum MuseumCheck_QRCode_ZhaoyuanHengliWatchMuseum.png');
        console.error('');
        console.error('Note: QR codes will NOT include age parameter - users select age after scanning');
        process.exit(1);
    }
    
    const [museumId, outputFilename] = args;
    
    try {
        validateMuseumId(museumId);
        await generateMuseumQRCode(museumId, outputFilename);
        process.exit(0);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

// Export for testing
module.exports = {
    generateMuseumQRCode,
    validateMuseumId,
    BASE_URL,
    QR_CODE_OPTIONS
};
