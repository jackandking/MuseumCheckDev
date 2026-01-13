#!/usr/bin/env node

/**
 * Museum Data Validation Tool
 * 
 * Validates museum data quality in museums-data.js (canonical source for tools/tests).
 * Note: Runtime no longer depends on museums-data.js; it uses Tier2→Tier1 loader.
 * This tool checks the source data that generates museums-meta.js and test fixtures.
 * 
 * Detects:
 * - Duplicate names and IDs
 * - Missing required fields
 * - Data integrity issues
 * - Inconsistent data structure
 * 
 * Usage: node tools/validate-museum-data.js
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_PATH = path.join(__dirname, '..', 'script.js');
const MUSEUMS_DATA_PATH = path.join(__dirname, '..', 'museums-data.js');

function validateMuseumData() {
    console.log('🔍 Museum Data Validation Tool');
    console.log('=====================================\n');
    
    // Read and parse museum data
    let museums;
    try {
        let content;
        let sourcePath;
        
        // Try loading from museums-data.js first (new structure)
        if (fs.existsSync(MUSEUMS_DATA_PATH)) {
            content = fs.readFileSync(MUSEUMS_DATA_PATH, 'utf8');
            sourcePath = 'museums-data.js';
        } else {
            // Fallback to script.js (legacy structure)
            content = fs.readFileSync(SCRIPT_PATH, 'utf8');
            sourcePath = 'script.js';
        }
        
        const startIndex = content.indexOf('const MUSEUMS = [');
        const endIndex = content.indexOf('];', startIndex) + 2;
        
        if (startIndex === -1 || endIndex === -1) {
            throw new Error(`Could not find MUSEUMS array in ${sourcePath}`);
        }
        
        const museumsCode = content.substring(startIndex, endIndex);
        museums = eval(museumsCode.replace('const MUSEUMS = ', ''));
        console.log(`✅ Successfully loaded ${museums.length} museums from ${sourcePath}\n`);
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
            console.log(`   First occurrence: ID "${museums[firstIndex].id}" at index ${firstIndex}`);
            console.log(`   Duplicate: ID "${museum.id}" at index ${index}`);
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
    
    // 3. Check for missing required fields
    console.log('📋 Checking required fields...');
    const requiredFields = ['id', 'name', 'location', 'description', 'tags'];
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
        console.log('✅ All museums have required fields');
    } else {
        console.log(`❌ Found ${fieldErrors} missing field issues`);
    }
    console.log('');
    
    // 4. Check checklist structure
    console.log('📝 Checking checklist structure...');
    let checklistErrors = 0;
    
    museums.forEach((museum, index) => {
        if (!museum.checklists) {
            console.log(`❌ Museum "${museum.name}" at index ${index} missing checklists`);
            checklistErrors++;
            hasErrors = true;
            return;
        }
        
        if (!museum.checklists.parent || !museum.checklists.child) {
            console.log(`❌ Museum "${museum.name}" at index ${index} missing parent or child checklists`);
            checklistErrors++;
            hasErrors = true;
            return;
        }
        
        const ageGroups = ['3-6', '7-12', '13-18'];
        ageGroups.forEach(age => {
            if (!museum.checklists.parent[age] || !museum.checklists.child[age]) {
                console.log(`❌ Museum "${museum.name}" at index ${index} missing checklist for age ${age}`);
                checklistErrors++;
                hasErrors = true;
            }
        });
    });
    
    if (checklistErrors === 0) {
        console.log('✅ All museums have proper checklist structure');
    } else {
        console.log(`❌ Found ${checklistErrors} checklist structure issues`);
    }
    console.log('');
    
    // 5. Summary and recommendations
    console.log('📊 VALIDATION SUMMARY');
    console.log('===================');
    console.log(`Total museums: ${museums.length}`);
    console.log(`Duplicate names: ${duplicateNames.length}`);
    console.log(`Duplicate IDs: ${duplicateIds.length}`);
    console.log(`Field errors: ${fieldErrors}`);
    console.log(`Checklist errors: ${checklistErrors}`);
    
    if (hasErrors) {
        console.log('\n🚨 CRITICAL ISSUES DETECTED');
        console.log('============================');
        console.log('STOP: Do not proceed with changes until data quality issues are resolved.');
        console.log('');
        console.log('REQUIRED ACTIONS:');
        console.log('1. Report all discovered issues to user');
        console.log('2. Get guidance on systematic fix vs. individual fix');
        console.log('3. Create comprehensive deduplication plan');
        console.log('4. Update tests to reflect corrected data');
        console.log('');
        console.log('IMPACT: These issues affect user experience through:');
        console.log('- Search confusion from duplicate entries');
        console.log('- Data inconsistency in progress tracking');
        console.log('- Potential application errors from missing fields');
        
        process.exit(1);
    } else {
        console.log('\n✅ DATA VALIDATION PASSED');
        console.log('All museum data is valid and consistent.');
        process.exit(0);
    }
}

// Run validation
validateMuseumData();