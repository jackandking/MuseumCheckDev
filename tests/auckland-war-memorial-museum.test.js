const fs = require('fs');
const path = require('path');

describe('Auckland War Memorial Museum metadata', () => {
  const museumsMetaPath = path.join(__dirname, '../data/museums-meta.json');
  const museums = JSON.parse(fs.readFileSync(museumsMetaPath, 'utf-8'));

  test('includes 奥克兰战争纪念馆 entry', () => {
    const museum = museums.find(m => m.id === 'auckland-war-memorial-museum');

    expect(museum).toBeTruthy();
    expect(museum.name).toBe('奥克兰战争纪念馆');
    expect(museum.location).toBe('新西兰·奥克兰');
    expect(museum.tags).toEqual(
      expect.arrayContaining(['历史', '战争纪念', '毛利文化', '海外博物馆'])
    );
    expect(museum.image).toMatch(/^https?:\/\/.+/);
    expect(museum.hasCollections).toBe(true);
    expect(museum.level).toBe('未定级');
  });
});
