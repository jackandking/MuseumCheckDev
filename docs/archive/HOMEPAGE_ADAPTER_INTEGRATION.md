# HomepageAdapter Integration Plan

## Current Status
✅ HomepageAdapter created and all unit tests passing (24/24 tests)
✅ museum-data-loader.js optimized to use MUSEUMS_META priority
🔄 Ready to integrate into script.js

## Integration Strategy

### 1. Current Architecture Analysis

**MuseumCheckApp Class** (`script.js` lines 3983-15462):
- Constructor initializes state from localStorage
- `this.filteredMuseums = MUSEUMS` (line 3997) - direct MUSEUMS array usage
- `filterMuseums()` method applies search/filters directly on MUSEUMS array
- `renderMuseums()` renders `this.filteredMuseums` to DOM
- Multiple methods depend on MUSEUMS array being synchronously available

**Key Dependencies**:
```javascript
// Current direct MUSEUMS array usage:
this.filteredMuseums = MUSEUMS;  // line 3997
this.filteredMuseums = MUSEUMS.filter(museum => ...);  // lines 5318, 5348, 5353
```

### 2. Integration Approach: Gradual Adapter Adoption

**Phase 1: Initialize Adapter (Non-Breaking)**
- Add HomepageAdapter as a property of MuseumCheckApp
- Initialize in `init()` method after existing initialization
- Keep existing MUSEUMS array usage for backward compatibility

**Phase 2: Redirect Museum Loading**
- Replace direct MUSEUMS array access with adapter methods
- Use `adapter.loadMuseumDetails()` for individual museum loads
- Keep search/filter/sort logic in adapter

**Phase 3: Cleanup**
- Remove redundant code in MuseumCheckApp
- Consolidate all museum data logic in adapter

### 3. Specific Integration Steps

#### Step 1: Add Adapter Initialization
```javascript
// In MuseumCheckApp constructor (after line 4047)
this.homepageAdapter = null;  // Will be initialized in init()
```

#### Step 2: Initialize Adapter in init()
```javascript
// In async init() method (after line 4050, before setupEventListeners)
// Initialize homepage adapter for museum data management
if (typeof HomepageAdapter !== 'undefined') {
    this.homepageAdapter = new HomepageAdapter(
        window.dataManager,
        window.eventBus,
        window.museumDataLoader
    );
    await this.homepageAdapter.init();
    
    // Use adapter's museums instead of MUSEUMS array
    this.filteredMuseums = this.homepageAdapter.getFilteredMuseums();
}
```

#### Step 3: Replace filterMuseums() Method
```javascript
// Find filterMuseums() method and redirect to adapter
filterMuseums() {
    // If adapter available, use it
    if (this.homepageAdapter) {
        // Apply search
        if (this.searchQuery) {
            this.homepageAdapter.search(this.searchQuery);
        } else {
            this.homepageAdapter.clearFilters();
        }
        
        // Apply collection filter if enabled
        if (this.showOnlyMuseumsWithCollections) {
            this.homepageAdapter.filterByCollections(true);
        }
        
        // Update filtered museums from adapter
        this.filteredMuseums = this.homepageAdapter.getFilteredMuseums();
    } else {
        // Fallback to original MUSEUMS array logic (backward compatibility)
        // ... existing code ...
    }
}
```

#### Step 4: Update sortMuseums() Method
```javascript
// Redirect sorting to adapter
sortMuseums(museums) {
    if (this.homepageAdapter) {
        // Let adapter handle sorting
        this.homepageAdapter.sort(this.sortBy || 'default');
        return this.homepageAdapter.getFilteredMuseums();
    } else {
        // Fallback to original sorting logic
        // ... existing code ...
    }
}
```

#### Step 5: Load Individual Museum Details
```javascript
// Add method to load museum details on demand
async loadMuseumDetails(museumId) {
    if (this.homepageAdapter) {
        return await this.homepageAdapter.loadMuseumDetails(museumId);
    } else {
        // Fallback: find in MUSEUMS array
        return MUSEUMS.find(m => m.id === museumId);
    }
}
```

#### Step 6: Update Statistics
```javascript
// In updateStats() method, use adapter statistics
updateStats() {
    if (this.homepageAdapter) {
        const stats = this.homepageAdapter.getStatistics();
        const totalElement = document.getElementById('totalMuseums');
        const visitedElement = document.getElementById('visitedCount');
        const percentageElement = document.getElementById('visitedPercentage');
        
        if (totalElement) totalElement.textContent = stats.total;
        if (visitedElement) visitedElement.textContent = stats.visited;
        if (percentageElement) percentageElement.textContent = stats.percentage;
    } else {
        // Fallback to existing logic
        // ... existing code ...
    }
}
```

### 4. Event Integration

**Listen to Adapter Events**:
```javascript
// In setupEventListeners() method, add adapter event listeners
if (this.homepageAdapter && window.eventBus) {
    window.eventBus.on('homepage:museums:loaded', (museums) => {
        this.filteredMuseums = museums;
        this.renderMuseums();
    });
    
    window.eventBus.on('homepage:search', (museums) => {
        this.filteredMuseums = museums;
        this.renderMuseums();
    });
    
    window.eventBus.on('homepage:sorted', (museums) => {
        this.filteredMuseums = museums;
        this.renderMuseums();
    });
    
    // ... other events ...
}
```

### 5. Data Flow Validation

**Expected Flow After Integration**:
1. User loads homepage → `MuseumCheckApp.init()` called
2. `HomepageAdapter.init()` loads museums via `museumDataLoader.loadAllMuseums()`
3. `loadAllMuseums()` prioritizes `MUSEUMS_META` for fast listing
4. User clicks museum card → `loadMuseumDetails(museumId)` called
5. Adapter calls `museumDataLoader.loadMuseum(museumId)` (Tier 2 → Tier 1)
6. Full museum data loaded dynamically, not from `MUSEUMS` array
7. Search/filter/sort handled by adapter, events emitted to app

**Fallback Behavior**:
- If `HomepageAdapter` not available → use existing MUSEUMS array logic
- If `museumDataLoader` fails → adapter falls back to MUSEUMS array
- If Tier 2 (KV) fails → adapter loads from Tier 1 (static JSON)

### 6. Testing Strategy

**Unit Tests** (Already Passing):
- ✅ All HomepageAdapter methods tested
- ✅ Mock dependencies validated
- ✅ Edge cases covered

**Integration Tests** (To Be Performed):
- [ ] Homepage loads with adapter initialized
- [ ] Museum list renders from MUSEUMS_META
- [ ] Search functionality works via adapter
- [ ] Filter (location, tags, collections) works
- [ ] Sort strategies apply correctly
- [ ] Individual museum loads via Tier 2 → Tier 1
- [ ] Statistics update correctly
- [ ] Fallback to MUSEUMS array when adapter unavailable

**Manual Testing Checklist**:
1. Load homepage → verify museum list displays
2. Search "故宫" → verify filtered results
3. Click museum card → verify full data loads
4. Change age group → verify checklists load
5. Filter by location → verify results
6. Sort by name/location/visited → verify order
7. Check browser console for errors
8. Verify no broken images/missing data

### 7. Backward Compatibility

**Graceful Degradation**:
- All adapter usage wrapped in `if (this.homepageAdapter)` checks
- Original MUSEUMS array logic preserved as fallback
- No breaking changes to existing functionality

**Migration Path**:
- Step 1: Integrate adapter (both systems coexist)
- Step 2: Validate adapter fully functional
- Step 3: Gradually remove redundant MUSEUMS array code
- Step 4: Complete migration (Phase 3)

### 8. Performance Considerations

**Benefits**:
- Faster initial load: MUSEUMS_META is lightweight
- On-demand loading: Full museum data loaded only when needed
- Reduced memory: Not all 120 museums loaded upfront
- Better caching: Tier 2 (KV) provides remote cache

**Tradeoffs**:
- Initial complexity: Two systems during migration
- Network dependency: Tier 2 requires API calls (with Tier 1 fallback)
- Testing overhead: Must validate both paths

### 9. Next Steps

**Immediate Actions**:
1. Add adapter initialization to MuseumCheckApp constructor
2. Initialize adapter in `init()` method
3. Add event listeners for adapter events
4. Test basic museum loading via adapter
5. Gradually redirect methods to adapter
6. Validate complete data flow
7. Document integration results

**Success Criteria**:
- Homepage loads with MUSEUMS_META (not full MUSEUMS array)
- Individual museums load via Tier 2 → Tier 1 strategy
- All search/filter/sort functionality works
- No console errors or broken functionality
- All existing tests still pass

## References
- HomepageAdapter: `core/adapters/homepage-adapter.js`
- Unit Tests: `tests/adapters/homepage-adapter.test.js`
- Museum Data Loader: `museum-data-loader.js`
- Main App: `script.js` (MuseumCheckApp class)
- Museums Meta: `museums-meta.js`
