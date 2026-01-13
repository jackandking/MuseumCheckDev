const QuizData = require('../quiz/js/quiz-data');

class MockQuizAdapter {
  constructor(meta, details) {
    this.meta = meta;
    this.details = details;
    this.initCalled = false;
  }

  async init() {
    this.initCalled = true;
    return this.meta;
  }

  getMuseums() {
    return this.meta;
  }

  getMuseumsMeta() {
    return this.meta;
  }

  async preloadMuseums(ids) {
    for (const id of ids) {
      const detail = this.details[id];
      if (detail) {
        // Replace meta entry with detailed one
        const idx = this.meta.findIndex(m => m.id === id);
        if (idx >= 0) this.meta[idx] = detail;
      }
    }
    return this.meta;
  }

  async loadMuseumDetails(id) {
    return this.details[id] || null;
  }
}

describe('QuizData with QuizAdapter', () => {
  beforeEach(() => {
    QuizData.resetForTests();
    localStorage.clear();
  });

  test('initializes with adapter and preloads visited museums', async () => {
    const meta = [
      { id: 'a', name: 'A馆', location: '北京', tags: ['历史'] },
      { id: 'b', name: 'B馆', location: '上海', tags: ['艺术'] }
    ];
    const details = {
      a: { id: 'a', name: 'A馆', location: '北京', description: '描述', tags: ['历史'], collections: [{ name: '宝物', description: 'xxx' }] }
    };
    localStorage.setItem('visitedMuseums', JSON.stringify(['a']));

    const adapter = new MockQuizAdapter(meta, details);
    await QuizData.init(adapter);

    const museums = QuizData.getMuseums();
    expect(museums.find(m => m.id === 'a').description).toBe('描述');
    expect(museums.find(m => m.id === 'b').name).toBe('B馆');
  });

  test('generateQuestionsForMuseum uses detailed data when available', async () => {
    const meta = [{ id: 'c', name: 'C馆', location: '西安', tags: ['历史'] }];
    const details = {
      c: {
        id: 'c',
        name: 'C馆',
        location: '西安',
        description: '著名的历史博物馆',
        tags: ['历史'],
        collections: [{ name: '珍宝', description: '珍宝描述', imageUrl: '' }]
      }
    };

    localStorage.setItem('visitedMuseums', JSON.stringify(['c']));
    const adapter = new MockQuizAdapter(meta, details);
    await QuizData.init(adapter);

    const questions = QuizData.generateQuestionsForMuseum('c', '7-12');
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.some(q => q.id.includes('collection'))).toBe(true);
  });
});
