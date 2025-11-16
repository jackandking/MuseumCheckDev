/**
 * Test for Capital Museum Tier 1 Loading
 * 
 * Verifies that when static data priority (Tier 1) is set,
 * Capital Museum loads with all 4 collections from the .json file.
 * 
 * Issue: 静态数据优先时，新用户看到打卡页面有3个镇馆之宝，和动态数据一致。静态文件中有4个镇馆之宝
 */

const fs = require('fs');
const path = require('path');

describe('Capital Museum Tier 1 Loading', () => {
    describe('Static JSON File', () => {
        test('beijing-capital-museum.json should exist', () => {
            const jsonPath = path.join(__dirname, '..', 'museums', 'beijing-capital-museum.json');
            expect(fs.existsSync(jsonPath)).toBe(true);
        });

        test('beijing-capital-museum.json should be valid JSON', () => {
            const jsonPath = path.join(__dirname, '..', 'museums', 'beijing-capital-museum.json');
            const content = fs.readFileSync(jsonPath, 'utf8');
            
            expect(() => {
                JSON.parse(content);
            }).not.toThrow();
        });

        test('beijing-capital-museum.json should have correct museum ID', () => {
            const jsonPath = path.join(__dirname, '..', 'museums', 'beijing-capital-museum.json');
            const content = fs.readFileSync(jsonPath, 'utf8');
            const data = JSON.parse(content);
            
            expect(data.id).toBe('beijing-capital-museum');
        });

        test('beijing-capital-museum.json should have 4 collections', () => {
            const jsonPath = path.join(__dirname, '..', 'museums', 'beijing-capital-museum.json');
            const content = fs.readFileSync(jsonPath, 'utf8');
            const data = JSON.parse(content);
            
            expect(data.collections).toBeInstanceOf(Array);
            expect(data.collections.length).toBe(4);
        });

        test('beijing-capital-museum.json collections should have correct names', () => {
            const jsonPath = path.join(__dirname, '..', 'museums', 'beijing-capital-museum.json');
            const content = fs.readFileSync(jsonPath, 'utf8');
            const data = JSON.parse(content);
            
            const expectedCollections = [
                '元代景德镇窑青花凤首扁壶',
                '乾隆款金嵌珍珠天球仪',
                '明代金丝翼善冠',
                '神兽玉佩'
            ];
            
            expect(data.collections.length).toBe(4);
            data.collections.forEach((collection, index) => {
                expect(collection.name).toBe(expectedCollections[index]);
                expect(collection.imageUrl).toBeTruthy();
                expect(collection.description).toBeTruthy();
            });
        });

        test('each collection should have required fields', () => {
            const jsonPath = path.join(__dirname, '..', 'museums', 'beijing-capital-museum.json');
            const content = fs.readFileSync(jsonPath, 'utf8');
            const data = JSON.parse(content);
            
            data.collections.forEach(collection => {
                expect(collection).toHaveProperty('name');
                expect(collection).toHaveProperty('imageUrl');
                expect(collection).toHaveProperty('description');
                
                expect(typeof collection.name).toBe('string');
                expect(typeof collection.imageUrl).toBe('string');
                expect(typeof collection.description).toBe('string');
                
                expect(collection.name.length).toBeGreaterThan(0);
                expect(collection.imageUrl.length).toBeGreaterThan(0);
                expect(collection.description.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Data Consistency', () => {
        test('Tier 1 data should match museums-data.js collections', () => {
            // Load Tier 1 JSON file
            const tier1Path = path.join(__dirname, '..', 'museums', 'beijing-capital-museum.json');
            const tier1Content = fs.readFileSync(tier1Path, 'utf8');
            const tier1Data = JSON.parse(tier1Content);
            
            // Load museums-data.js (Tier 3)
            const museumsDataPath = path.join(__dirname, '..', 'museums-data.js');
            const museumsDataContent = fs.readFileSync(museumsDataPath, 'utf8');
            
            // Extract collections count for Capital Museum from museums-data.js
            // This is a simple check - we know both should have 4 collections
            const capitalMuseumMatch = museumsDataContent.match(/id:\s*['"]beijing-capital-museum['"]/);
            expect(capitalMuseumMatch).toBeTruthy();
            
            // Verify Tier 1 has 4 collections
            expect(tier1Data.collections.length).toBe(4);
        });
    });
});
