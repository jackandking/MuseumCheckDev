const { normalize, parse, create } = require('../js/contribution-records.js');

describe('统一贡献记录契约', () => {
  test('keeps museum data, consent and review state while excluding family identity', () => {
    const record = normalize({ id:'contrib-1', kind:'treasure_candidate', museum:{ id:'personal-1', name:'自贡恐龙博物馆', city:'自贡' },
      target:{ treasureName:'一件恐龙化石', taskIndex:1 }, content:{ imageUrl:'https://museumcheck.cn/a.jpg', text:'孩子想推荐它' },
      consent:{ publicScope:'review' }, alias:'小圆嘟妈妈', phone:'12345' });
    expect(record).toMatchObject({ kind:'treasure_candidate', museum:{ name:'自贡恐龙博物馆' }, consent:{ publicScope:'review', revocable:true }, visibility:'review_queue', review:{ status:'pending' } });
    expect(record).not.toHaveProperty('alias');
    expect(record).not.toHaveProperty('phone');
  });

  test('does not upgrade a photo to public merely because it is submitted', () => {
    const record = normalize({ id:'contrib-2', kind:'task_photo', imageUrl:'https://example.com/photo.jpg', consent:{ publicScope:'review' }, visibility:'public', review:{ status:'pending' } });
    expect(record.visibility).toBe('review_queue');
    expect(record.review.status).toBe('pending');
  });

  test('normalizes stored rows and rejects unsafe image URLs', () => {
    const rows = parse({ value:JSON.stringify([{ value:JSON.stringify({ id:'safe', kind:'entrance_photo', imageUrl:'javascript:alert(1)' }) }]) });
    expect(rows).toHaveLength(1);
    expect(rows[0].content.imageUrl).toBe('');
  });

  test('creates a revocable anonymous record with a stable schema version', () => {
    const record = create({ kind:'museum', museum:{ id:'personal-x', name:'新馆' }, consent:{ eventScope:'private' } });
    expect(record.schemaVersion).toBe(1);
    expect(record.id).toMatch(/^contrib-/);
    expect(record.consent.revocable).toBe(true);
  });
});
