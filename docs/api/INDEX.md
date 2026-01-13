# API Documentation Index

This directory contains comprehensive API documentation for the MuseumCheck application.

## Table of Contents

1. [DataManager API](#datamanager-api)
2. [Storage Adapters API](#storage-adapters-api)
3. [Letmetry Web Service API](#letmetry-web-service-api)
4. [EventBus API](#eventbus-api)

---

## DataManager API

**Full Documentation**: [DataManager API Reference](../architecture/API_REFERENCE.md)

The DataManager provides a unified interface for data persistence across multiple storage tiers.

### Quick Reference

```javascript
// Import
import DataManager from './core/data-manager.js';

// Basic operations
await dataManager.get('museum-id');
await dataManager.set('museum-id', data);
await dataManager.delete('museum-id');
```

---

## Storage Adapters API

Storage adapters provide pluggable storage backends.

### Available Adapters

- **LocalStorageAdapter**: Browser localStorage
- **KVStorageAdapter**: Key-value store (composite keys)
- **SQLStorageAdapter**: MySQL database
- **FileStorageAdapter**: Static JSON files

**⚠️ CRITICAL**: KV Store uses composite keys. Always include both `key` and `sortKey`.

---

## Letmetry Web Service API

**Live Swagger UI**: https://letmetry.cloud/api-docs/

### MySQL Operations

```bash
# Query
curl -X POST https://letmetry.cloud/mysql/query \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT * FROM museums WHERE id = ?", "params": [123]}'
```

---

## EventBus API

The EventBus provides pub-sub messaging for decoupled communication.

```javascript
import EventBus from './core/event-bus.js';

const eventBus = new EventBus();

// Subscribe
eventBus.on('museum:visited', (data) => {
    console.log('Museum visited:', data);
});

// Publish
eventBus.emit('museum:visited', { museumId: 'forbidden-city' });
```

---

## Related Documentation

- [Technical Specifications](../architecture/TECH_SPEC_TEMPLATE.md)
- [Architecture Overview](../ARCHITECTURE_OVERVIEW.md)
- [Testing Guide](../guides/testing.md)

---

**Last Updated**: January 13, 2026  
**Questions?**: Create an issue on [GitHub](https://github.com/jackandking/MuseumCheck/issues)
