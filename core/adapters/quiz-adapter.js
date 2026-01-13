// QuizAdapter: loads quiz museum data using tiered loader (Tier2 -> Tier1) and emits events
class QuizAdapter {
  constructor(museumDataLoader, eventBus) {
    this.museumDataLoader = museumDataLoader;
    this.eventBus = eventBus;
    this.museumsMeta = [];
    this.museumCache = new Map();
  }

  async init() {
    if (!this.museumDataLoader || typeof this.museumDataLoader.loadAllMuseums !== 'function') {
      throw new Error('museumDataLoader is required for QuizAdapter');
    }

    this.museumsMeta = await this.museumDataLoader.loadAllMuseums();
    if (Array.isArray(this.museumsMeta)) {
      this.museumsMeta.forEach(m => this.museumCache.set(m.id, m));
    }

    if (this.eventBus && typeof this.eventBus.emit === 'function') {
      this.eventBus.emit('quiz:museums:loaded', this.getMuseums());
    }
    return this.getMuseums();
  }

  getMuseums() {
    return Array.from(this.museumCache.values());
  }

  getMuseumsMeta() {
    return this.museumsMeta || [];
  }

  async preloadMuseums(museumIds = []) {
    const ids = Array.isArray(museumIds) ? museumIds : [];
    for (const id of ids) {
      await this.loadMuseumDetails(id, true);
    }
    return this.getMuseums();
  }

  async loadMuseumDetails(museumId, useCache = true) {
    if (!museumId) return null;

    if (useCache && this.museumCache.has(museumId)) {
      return this.museumCache.get(museumId);
    }

    try {
      const museum = await this.museumDataLoader.loadMuseum(museumId, useCache);
      if (museum) {
        this.museumCache.set(museumId, museum);
        if (this.eventBus && typeof this.eventBus.emit === 'function') {
          this.eventBus.emit('quiz:museum:loaded', museum);
        }
        return museum;
      }
    } catch (error) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('[QuizAdapter] Failed to load museum', museumId, error);
      }
    }

    // Fallback to meta if detailed load failed
    if (this.museumCache.has(museumId)) {
      return this.museumCache.get(museumId);
    }
    return null;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuizAdapter;
}
