#!/usr/bin/env node

/**
 * Museum Data Validation Tool
 * 
 * Validates museum metadata quality in data/museums-meta.json.
 * This is a lightweight metadata file; full descriptions and checklists are stored separately.
 * 
 * Detects:
 * - Duplicate names and IDs
 * - Missing required metadata fields
 * - Missing image URLs
 * - Invalid tag structure
 * 
 * Usage: node tools/validate-museum-data.js
 */

const fs = require('fs');
const path = require('path');

const MUSEUMS_META_PATH = path.join(__dirname, '..', 'data', 'museums-meta.json');

function validateMuseumData() {
    console.log('🔍 Museum Data Validation Tool');
    console.log('=====================================\n');
    
    // Read and parse museum metadata from JSON
    let museums;
    try {
        if (!fs.existsSync(MUSEUMS_META_PATH)) {
            throw new Error(`museums-meta.json not found at ${MUSEUMS_META_PATH}`);
        }
        
        const content = fs.readFileSync(MUSEUMS_META_PATH, 'utf8');
        museums = JSON.parse(content);
        
        if (!Array.isArray(museums)) {
            throw new Error('museums-meta.json must contain an array');
        }
        
        console.log(`✅ Successfully loaded ${museums.length} museums from data/museums-meta.json\n`);
    } catch (error) {
        console.error('❌ Error loading museum data:', error.message);
        process.exit(1);
    }
    
    let hasErrors = false;
    
    // 1. Check for duplicate names
    console.log('🏛️  Checking for duplicate museum names...');
    const nameMap = new Map();
    const duplicateNames = [];
    
    museums.forEach((museum, index) => {
        if (!museum.name) {
            console.log(`❌ Museum at index ${index} has no name`);
            hasErrors = true;
            return;
        }
        
        if (nameMap.has(museum.name)) {
            const firstIndex = nameMap.get(museum.name);
            duplicateNames.push({
                name: museum.name,
                indices: [firstIndex, index],
                ids: [museums[firstIndex].id, museum.id]
            });
            console.log(`❌ DUPLICATE NAME: "${museum.name}"`);
            console.log(`   First occurrence: "${museums[firstIndex].id}" at index ${firstIndex}`);
            console.log(`   Duplicate: "${museum.id}" at index ${index}`);
            hasErrors = true;
        } else {
            nameMap.set(museum.name, index);
        }
    });
    
    if (duplicateNames.length === 0) {
        console.log('✅ No duplicate museum names found');
    } else {
        console.log(`❌ Found ${duplicateNames.length} duplicate museum names`);
    }
    console.log('');
    
    // 2. Check for duplicate IDs
    console.log('🆔 Checking for duplicate museum IDs...');
    const idMap = new Map();
    const duplicateIds = [];
    
    museums.forEach((museum, index) => {
        if (!museum.id) {
            console.log(`❌ Museum at index ${index} has no ID`);
            hasErrors = true;
            return;
        }
        
        if (idMap.has(museum.id)) {
            const firstIndex = idMap.get(museum.id);
            duplicateIds.push({
                id: museum.id,
                indices: [firstIndex, index],
                names: [museums[firstIndex].name, museum.name]
            });
            console.log(`❌ DUPLICATE ID: "${museum.id}"`);
            console.log(`   First occurrence: "${museums[firstIndex].name}" at index ${firstIndex}`);
            console.log(`   Duplicate: "${museum.name}" at index ${index}`);
            hasErrors = true;
        } else {
            idMap.set(museum.id, index);
        }
    });
    
    if (duplicateIds.length === 0) {
        console.log('✅ No duplicate museum IDs found');
    } else {
        console.log(`❌ Found ${duplicateIds.length} duplicate museum IDs`);
    }
    console.log('');
    
    // 3. Check for missing required metadata fields
    console.log('📋 Checking required metadata fields...');
    const requiredFields = ['id', 'name', 'location'];
    let fieldErrors = 0;
    
    museums.forEach((museum, index) => {
        requiredFields.forEach(field => {
            if (!museum[field] || museum[field] === undefined) {
                console.log(`❌ Museum "${museum.name || 'unnamed'}" at index ${index} missing field: ${field}`);
                fieldErrors++;
                hasErrors = true;
            }
        });
    });
    
    if (fieldErrors === 0) {
        console.log('✅ All museums have required metadata fields');
    } else {
        console.log(`❌ Found ${fieldErrors} missing field issues`);
    }
    console.log('');
    
    // 4. Check for proper image URLs (optional but recommended)
    console.log('📸 Checking image URLs...');
    let imageErrors = 0;
    
    museums.forEach((museum, index) => {
        if (!museum.image) {
            console.log(`⚠️ Museum "${museum.name}" at index ${index} missing image URL`);
            imageErrors++;
        }
    });
    
    if (imageErrors === 0) {
        console.log('✅ All museums have image URLs');
    } else {
        console.log(`⚠️ Found ${imageErrors} museums without images`);
    }
    console.log('');
    
    // 5. Check tags structure
    console.log('🏷️  Checking tags...');
    let tagErrors = 0;
    
    museums.forEach((museum, index) => {
        if (!museum.tags || !Array.isArray(museum.tags) || museum.tags.length === 0) {
            console.log(`⚠️ Museum "${museum.name}" at index ${index} missing or empty tags`);
            tagErrors++;
        }
    });
    
    if (tagErrors === 0) {
        console.log('✅ All museums have tags');
    } else {
        console.log(`⚠️ Found ${tagErrors} museums with missing/empty tags`);
    }
    console.log('');
    
    // Summary
    console.log('📊 VALIDATION SUMMARY');
    console.log('===================');
    console.log(`Total museums: ${museums.length}`);
    console.log(`Duplicate names: ${duplicateNames.length}`);
    console.log(`Duplicate IDs: ${duplicateIds.length}`);
    console.log(`Missing images: ${imageErrors}`);
    console.log(`Missing/empty tags: ${tagErrors}`);
    console.log('');
    
    if (hasErrors) {
        console.log('🚨 CRITICAL ISSUES DETECTED');
        console.log('============================');
        process.exit(1);
    } else {
        console.log('✅ DATA VALIDATION PASSED');
        console.log('All museum metadata is valid and consistent.');
        process.exit(0);
    }
}

validateMuseumData();
