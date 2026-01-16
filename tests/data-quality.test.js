const fs = require('fs');
const path = require('path');

const museumsMetaPath = path.join(__dirname, '../data/museums-meta.json');

describe('Museum Data Quality', () => {
  let museums;

  beforeAll(() => {
    const raw = fs.readFileSync(museumsMetaPath, 'utf-8');
    museums = JSON.parse(raw);
  });

  test('museums-meta.json is valid JSON array', () => {
    expect(Array.isArray(museums)).toBe(true);
    expect(museums.length).toBeGreaterThan(0);
  });

  test('each museum has required fields', () => {
    const requiredFields = ['id', 'name', 'location'];

    museums.forEach((museum) => {
      requiredFields.forEach(field => {
        expect(museum).toHaveProperty(field);
        expect(museum[field]).toBeTruthy();
      });
    });
  });

  test('each museum id is unique', () => {
    const ids = museums.map(m => m.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('each museum id is a valid slug', () => {
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

    museums.forEach(museum => {
      expect(museum.id).toMatch(slugRegex);
    });
  });

  test('each museum has valid tags array', () => {
    museums.forEach(museum => {
      if (museum.tags) {
        expect(Array.isArray(museum.tags)).toBe(true);
        museum.tags.forEach(tag => {
          expect(typeof tag).toBe('string');
          expect(tag.length).toBeGreaterThan(0);
        });
      }
    });
  });

  test('each museum image URL is valid format', () => {
    museums.forEach(museum => {
      if (museum.image) {
        expect(museum.image).toMatch(/^https?:\/\/.+/);
      }
    });
  });

  test('hasCollections field is boolean when present', () => {
    museums.forEach(museum => {
      if (museum.hasCollections !== undefined) {
        expect(typeof museum.hasCollections).toBe('boolean');
      }
    });
  });

  test('level field has valid value when present', () => {
    const validLevels = ['一级', '二级', '三级', '未定级'];

    museums.forEach(museum => {
      if (museum.level) {
        expect(validLevels).toContain(museum.level);
      }
    });
  });
});
