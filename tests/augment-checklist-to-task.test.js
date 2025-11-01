// Reuse the app environment from setup.js by loading index.html assets
const fs = require('fs');
const path = require('path');

describe('Checklist augmentation to workflow tasks', () => {
  beforeAll(() => {
    // Ensure feature flag
    localStorage.setItem('feature:cl-augment', '1');
    // Prevent auto init in single-museum.js by faking readyState
    const desc = Object.getOwnPropertyDescriptor(document, 'readyState');
    try { Object.defineProperty(document, 'readyState', { configurable: true, get: () => 'loading' }); } catch(_) {}
    const smPath = path.join(__dirname, '..', 'single-museum.js');
    const code = fs.readFileSync(smPath, 'utf8');
    // Evaluate in current context to populate window.__augmentWorkflowWithChecklists
    // eslint-disable-next-line no-new-func
    Function(code)();
    // Restore readyState if descriptor existed
    if (desc && (desc.get || desc.value)) {
      try { Object.defineProperty(document, 'readyState', desc); } catch(_) {}
    }
  });

  test('__markDone dual-writes checklist legacy store', () => {
    // Feature flag not required for adapter
    const uid = 'cl:demo-museum:child:7-12:0';
    expect(typeof window.__progress.__markDone).toBe('function');
    // Clear legacy store
    localStorage.removeItem('museumChecklists');
    window.__progress.__markDone('demo-museum', uid, true);
    const store = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
    expect(Array.isArray(store['demo-museum-child-7-12'])).toBe(true);
    expect(store['demo-museum-child-7-12']).toContain(0);
  });

  test('augment injects at most one parent TTS and one child confirm when flag on', () => {
    // Enable feature flag
    localStorage.setItem('feature:cl-augment', '1');

    // Fake a museum with checklists
    const museum = {
      id: 'demo-museum',
      name: 'Demo',
      checklists: {
        parent: { '7-12': ['家长提示A', '家长提示B'] },
        child: { '7-12': ['孩子任务A', '孩子任务B'] }
      }
    };

    // Age group default is 7-12 per single-museum.js helper
    expect(typeof window.__augmentWorkflowWithChecklists).toBe('function');

    const wf = {
      id: 'wf0',
      tasks: { enroute: [], visit: [] }
    };

    const out = window.__augmentWorkflowWithChecklists(museum, wf);
    expect(out.tasks.enroute.length).toBeGreaterThanOrEqual(1);
    expect(out.tasks.visit.length).toBeGreaterThanOrEqual(1);

    const en = out.tasks.enroute[0];
    const vi = out.tasks.visit[0];
    expect(en.role).toBe('parent');
    expect(en.type).toBe('tts');
    expect(vi.role).toBe('child');
    expect(vi.type).toBe('confirm');

    // De-dupe: injecting twice with same data should not double count
    const out2 = window.__augmentWorkflowWithChecklists(museum, out);
    expect(out2.tasks.enroute.length).toBe(out.tasks.enroute.length);
    expect(out2.tasks.visit.length).toBe(out.tasks.visit.length);
  });
});
