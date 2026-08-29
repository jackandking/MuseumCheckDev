const { normalizeContribution, parse } = require('../js/family-photo-sharing.js');

describe('家庭照片分享的隐私边界', () => {
  test('normalizes contribution metadata and does not keep a family alias', () => {
    const photo = normalizeContribution({
      id:'family-photo-1', eventId:'shanghai-museum-aug22', museumId:'shanghai-museum', taskIndex:2,
      taskTitle:'最想推荐的展品', imageUrl:'https://museumcheck.cn/images/photo.jpg', alias:'小圆嘟妈妈', reviewStatus:'pending'
    });
    expect(photo).toMatchObject({ eventId:'shanghai-museum-aug22', museumId:'shanghai-museum', taskIndex:2, reviewStatus:'pending' });
    expect(photo).not.toHaveProperty('alias');
  });

  test('only allows HTTPS image URLs and controlled review states', () => {
    expect(normalizeContribution({ id:'x', imageUrl:'javascript:alert(1)', reviewStatus:'approved' }).imageUrl).toBe('');
    expect(normalizeContribution({ id:'x', imageUrl:'https://example.com/a.jpg', reviewStatus:'invented' }).reviewStatus).toBe('pending');
  });

  test('parses remote records without treating pending photos as public approval', () => {
    const records = parse({ value: JSON.stringify([
      { value: JSON.stringify({ id:'pending', museumId:'shanghai-museum', imageUrl:'https://example.com/p.jpg', reviewStatus:'pending' }) },
      { value: JSON.stringify({ id:'approved', museumId:'shanghai-museum', imageUrl:'https://example.com/a.jpg', reviewStatus:'approved' }) }
    ]) });
    expect(records).toHaveLength(2);
    expect(records.find(item => item.id === 'pending').reviewStatus).toBe('pending');
    expect(records.find(item => item.id === 'approved').reviewStatus).toBe('approved');
  });
});
