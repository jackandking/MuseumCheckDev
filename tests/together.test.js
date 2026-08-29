const { AGE_GROUPS, normalizeEvent, eventIsReady, countJoins, publicAliases, publicEventsFromPayload, buildVisitUrl, buildEventUrl, humanDate, createEventId, publicEventState, PUBLIC_EVENTS, LEGACY_EVENTS } = require('../js/together.js');

describe('同行探索活动入口', () => {
  test('only accepts controlled event configuration', () => {
    expect(normalizeEvent({ eventId:'shanghai-sunday-1', museumId:'shanghai-museum', date:'2026-08-16', time:'10:30', limit:'5', ageGroup:'7-12' }))
      .toEqual({ eventId:'shanghai-sunday-1', museumId:'shanghai-museum', date:'2026-08-16', time:'10:30', limit:5, ageGroup:'7-12' });
    expect(normalizeEvent({ eventId:'<script>', museumId:'x', date:'tomorrow', time:'late', limit:'99' }))
      .toEqual({ eventId:'', museumId:'x', date:'', time:'', limit:8, ageGroup:'' });
  });

  test('requires a real configured event before a family can join', () => {
    expect(eventIsReady({ eventId:'shanghai-sunday-1', museumId:'shanghai-museum', date:'2026-08-16', time:'10:30' })).toBe(true);
    expect(eventIsReady({ eventId:'shanghai-sunday-1', museumId:'shanghai-museum', date:'', time:'10:30' })).toBe(false);
  });

  test('counts unique anonymous join ids and nothing else', () => {
    const payload = { value: JSON.stringify([
      { value: JSON.stringify({ type:'together_join', eventId:'shanghai-sunday-1', joinId:'a' }) },
      { value: JSON.stringify({ type:'together_join', eventId:'shanghai-sunday-1', joinId:'a' }) },
      { value: JSON.stringify({ type:'together_join', eventId:'another-event', joinId:'b' }) },
      { value: 'not-json' }
    ]) };
    expect(countJoins(payload, 'shanghai-sunday-1')).toBe(1);
  });

  test('only returns aliases a family chose to show for this activity', () => {
    const payload = { value: JSON.stringify([
      { value: JSON.stringify({ type:'together_join', eventId:'shanghai-sunday-1', joinId:'a', alias:'小小探险队', showAlias:true }) },
      { value: JSON.stringify({ type:'together_join', eventId:'shanghai-sunday-1', joinId:'b', alias:'不公开的家', showAlias:false }) },
      { value: JSON.stringify({ type:'together_join', eventId:'another-event', joinId:'c', alias:'别场活动', showAlias:true }) },
      { value: JSON.stringify({ type:'together_join', eventId:'shanghai-sunday-1', joinId:'a', alias:'重复写入', showAlias:true }) }
    ]) };
    expect(publicAliases(payload, 'shanghai-sunday-1')).toEqual(['重复写入']);
  });

  test('builds an on-site visit link without aliases or contact information', () => {
    const url = buildVisitUrl({ eventId:'shanghai-sunday-1', ageGroup:'7-12' }, { id:'shanghai-museum' }, '7-12', 'share');
    const parsed = new URL(url, 'https://museumcheck.cn');
    expect(parsed.pathname).toBe('/museum-checkin.html');
    expect(parsed.searchParams.get('museum')).toBe('shanghai-museum');
    expect(parsed.searchParams.get('together')).toBe('shanghai-sunday-1');
    expect(parsed.searchParams.get('age')).toBe('7-12');
    expect(parsed.searchParams.get('togetherMode')).toBe('share');
    expect(parsed.search).not.toContain('alias');
  });

  test('formats configured time for the activity card', () => {
    expect(humanDate('2026-08-16', '10:30')).toContain('10:30');
  });

  test('generates an opaque event id rather than using a parent or child name', () => {
    expect(createEventId()).toMatch(/^visit-[a-z0-9]+-[a-z0-9]{5}$/);
  });

  test('public activity links preserve only the configured activity data', () => {
    const url = new URL(buildEventUrl(PUBLIC_EVENTS[0]), 'https://museumcheck.cn');
    expect(url.pathname).toBe('/together.html');
    expect(url.searchParams.get('event')).toBe('shanghai-museum-aug22');
    expect(url.searchParams.get('ageGroup')).toBe('7-12');
    expect(url.searchParams.get('v')).toBe('together-20260815b');
    expect(url.search).not.toContain('alias');
  });

  test('an activity can be recruiting or briefly observable while it is happening', () => {
    const event = { eventId:'test', museumId:'shanghai-museum', date:'2026-08-22', time:'10:30', limit:5, status:'recruiting' };
    expect(publicEventState(event, new Date(2026, 7, 22, 10, 29).getTime())).toBe('recruiting');
    expect(publicEventState(event, new Date(2026, 7, 22, 11, 0).getTime())).toBe('ongoing');
    expect(publicEventState(event, new Date(2026, 7, 22, 16, 0).getTime())).toBe('past');
  });

  test('only shows valid, deduplicated public activities from the shared activity feed', () => {
    const payload = { value: JSON.stringify([
      { value: JSON.stringify({ type:'together_public_event', event:{ eventId:'new-zealand-visit', museumId:'shanghai-museum', date:'2026-08-30', time:'10:30', limit:4, ageGroup:'3-6' } }) },
      { value: JSON.stringify({ type:'together_public_event', event:{ eventId:'new-zealand-visit', museumId:'shanghai-museum', date:'2026-08-30', time:'10:30', limit:4, ageGroup:'3-6' } }) },
      { value: JSON.stringify({ type:'together_public_event', event:{ eventId:'<script>', museumId:'shanghai-museum', date:'bad', time:'later' } }) },
      { value: JSON.stringify({ type:'together_join', eventId:'new-zealand-visit', joinId:'not-an-event' }) }
    ]) };
    expect(publicEventsFromPayload(payload)).toEqual([{ eventId:'new-zealand-visit', museumId:'shanghai-museum', date:'2026-08-30', time:'10:30', limit:4, ageGroup:'3-6', status:'recruiting' }]);
  });

  test('the curated public activity keeps its recruiting status after URL normalization', () => {
    const event = { ...PUBLIC_EVENTS[0], ...normalizeEvent(PUBLIC_EVENTS[0]) };
    expect(publicEventState(event, new Date(2026, 7, 15, 12, 0).getTime())).toBe('recruiting');
  });

  test('keeps old id-only Shanghai registrations recoverable', () => {
    expect(LEGACY_EVENTS).toContainEqual(expect.objectContaining({ eventId:'shanghai-sunday-1', museumId:'shanghai-museum', date:'2026-08-16' }));
  });

  test('uses the shared three age groups and rejects invented brackets', () => {
    expect(Object.keys(AGE_GROUPS)).toEqual(['3-6', '7-12', '13-18']);
    expect(normalizeEvent({ ageGroup:'4-10' }).ageGroup).toBe('');
    expect(PUBLIC_EVENTS[0].ageGroup).toBe('7-12');
  });

  test('activity page keeps photo sharing scoped to joined families and supports explicit temporary aliases', () => {
    const html = require('fs').readFileSync(require('path').join(__dirname, '..', 'together.html'), 'utf8');
    expect(html).toContain('只给本场同行家庭看');
    expect(html).toContain('eventDiscoveriesGrid');
    expect(html).toContain('showAlias');
    expect(html).toContain('familyAliases');
    expect(html).toContain('createAgeGroup');
    expect(html).toContain('joinAgeGroup');
    expect(html).toContain('createPublicEvent');
    expect(html).toContain('myActivityList');
    expect(html).toContain('查看全部活动');
    expect(html).toContain('together.html?v=together-20260815b');
  });

  test('keeps shared discoveries opt-in and gives the homepage a conditional activity entry', () => {
    const checkin = require('fs').readFileSync(require('path').join(__dirname, '..', 'js', 'museum-checkin.js'), 'utf8');
    const home = require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
    expect(checkin).toContain("togetherMode === 'share'");
    expect(checkin).toContain('togetherSharedGoal');
    expect(home).toContain('togetherHomeEntry');
    expect(home).toContain('together-home-entry.js');
  });
});
