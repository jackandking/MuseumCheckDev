#!/usr/bin/env node

/**
 * Version validation script for MuseumCheck
 * 
 * This script validates that version information is consistent across files
 * and helps developers ensure version updates are complete.
 * 
 * Usage: node validate-version.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

function validateVersionConsistency() {
    log('\n🔍 Validating MuseumCheck version consistency...', 'blue');
    
    try {
        // Read script.js to extract version information
        const scriptPath = path.join(__dirname, 'script.js');
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');
        
        // Extract RECENT_CHANGES object
        const versionRegex = /version:\s*["']([^"']+)["']/;
        
        const versionMatch = scriptContent.match(versionRegex);
        
        if (!versionMatch) {
            log('❌ Error: Could not extract version information from script.js', 'red');
            return false;
        }
        
        const currentVersion = versionMatch[1];
        
        log(`📋 Found version information:`, 'blue');
        log(`   Version: ${currentVersion}`, 'green');
        
        let hasIssues = false;
        
        // Read index.html to check for hardcoded versions
        const htmlPath = path.join(__dirname, 'index.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        // Look for any hardcoded version numbers that don't match the pattern
        const hardcodedVersions = htmlContent.match(/v\d+\.\d+\.\d+/g) || [];
        
        log(`\n🔍 Checking for hardcoded values in HTML...`, 'blue');
        
        // Check if there are any hardcoded versions that don't match expected placeholders
        const expectedPlaceholders = ['v0.0.0']; // Our placeholder version
        const unexpectedVersions = hardcodedVersions.filter(v => !expectedPlaceholders.includes(v));
        
        if (unexpectedVersions.length > 0) {
            log(`⚠️  Warning: Found unexpected hardcoded versions in HTML:`, 'yellow');
            unexpectedVersions.forEach(v => log(`   - ${v}`, 'yellow'));
            log(`   These should be replaced with placeholders and updated via JavaScript.`, 'yellow');
            hasIssues = true;
        } else {
            log(`✅ No unexpected hardcoded versions found in HTML`, 'green');
        }
        
        if (!hasIssues) {
            log(`✅ Version consistency check passed!`, 'green');
            log(`   All version information is properly centralized in script.js`, 'green');
        }
        
        // Provide guidance for developers
        log(`\n📝 To update the version:`, 'blue');
        log(`   1. Edit the RECENT_CHANGES object in script.js`, 'blue');
        log(`   2. Update the version field: version: "${currentVersion}" → "x.x.x"`, 'blue');
        log(`   3. Add new entry to changes array with your update details`, 'blue');
        log(`   4. Run this script again to validate: node validate-version.js`, 'blue');
        
        return !hasIssues;
        
    } catch (error) {
        log(`❌ Error validating version: ${error.message}`, 'red');
        return false;
    }
}

// Run validation
if (require.main === module) {
    const success = validateVersionConsistency();
    process.exit(success ? 0 : 1);
}

module.exports = { validateVersionConsistency };