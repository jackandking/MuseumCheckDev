# Quiz Module (考一考)

## 📁 Self-Contained Architecture

This module follows a self-contained architecture where all related files (HTML, JS, CSS) are co-located in a single directory. This approach:

- ✅ Keeps related code together (high cohesion)
- ✅ Makes the module easier to understand and maintain
- ✅ Clearly defines business boundaries
- ✅ Allows the module to be easily moved or refactored
- ✅ Reduces cross-directory dependencies

## 🏗️ Directory Structure

```
quiz/
├── index.html              # Quiz home page
├── session.html            # Active quiz session
├── result.html             # Results display
├── wrong-questions.html    # Wrong questions review
├── css/
│   └── quiz-style.css      # All quiz-specific styles
├── js/
│   ├── points-manager.js   # Points/XP management
│   ├── quiz-data.js        # Question generation
│   ├── quiz-engine.js      # Session management
│   ├── quiz-statistics.js  # Analytics
│   ├── quiz-limit.js       # Daily limits
│   └── quiz-ui.js          # UI helpers
└── README.md               # This file
```

## 🔗 External Dependencies

This module depends on:
- `../museums-meta.js` / museum data loader - Museum metadata for question generation (runtime: uses Tier2→Tier1 loader; tests: may use museums-data.js)
- `../achievement-gamification.js` - For XP/points integration (via PointsManager)

## 🎯 Module Entry Points

### From Main Application
```javascript
// In script.js
window.location.href = 'quiz/index.html';
```

### Internal Navigation
```javascript
// All internal navigation uses relative paths
window.location.href = 'session.html';
window.location.href = '../index.html'; // Back to main app
```

## 📝 Usage

### Starting a Quiz Session
1. User clicks 🎓 button on main page
2. Loads `quiz/index.html`
3. User selects a museum or quiz mode
4. Navigates to `session.html` with query params
5. After completion, shows `result.html`

### Reviewing Wrong Questions
1. From quiz home, click "错题本"
2. Loads `wrong-questions.html`
3. User can review mistakes and restart quiz

## 🔧 Maintenance

### Adding New Features
All quiz-related code should be added to this directory:
- New pages: Add HTML files to `/quiz/`
- New functionality: Add JS files to `/quiz/js/`
- New styles: Add to `/quiz/css/quiz-style.css`

### Modifying Styles
All quiz styles are in `css/quiz-style.css`. This provides:
- Style isolation (no conflicts with main app)
- Easy maintenance (all styles in one place)
- Clear ownership (quiz module owns its styles)

### Testing
Test the module by navigating to:
```
http://localhost:8000/quiz/index.html
```

## 🏛️ Design Principles

This module follows these architectural principles:

1. **High Cohesion**: Related functionality is grouped together
2. **Low Coupling**: Minimal dependencies on external modules
3. **Clear Boundaries**: Module scope is well-defined
4. **Self-Contained**: Can be understood in isolation
5. **Easy to Maintain**: Changes are localized to this directory

## 📚 API Reference

See main documentation in `../docs/features/quiz.md` for detailed API documentation.
