# Testing Guide for MuseumCheck

## Overview

This document outlines the testing strategy for MuseumCheck to prevent regression issues when making bug fixes and enhancements.

## Why Unit Testing?

The issue identified was that bug fixes sometimes broke existing functionality due to lack of regression testing. This testing framework ensures:

1. **Regression Prevention**: Every bug fix must include corresponding tests
2. **Code Quality**: Tests catch edge cases and integration issues
3. **Confidence**: Developers can refactor safely knowing tests will catch breaking changes
4. **Documentation**: Tests serve as living documentation of expected behavior

## Testing Framework

We use **Jest** with **jsdom** for testing:
- **Jest**: Popular JavaScript testing framework with built-in mocking
- **jsdom**: Simulates browser environment for DOM-dependent code
- **Coverage Reports**: Track which code is tested

## Setup Instructions

### 1. Install Dependencies

```bash
# Navigate to repository root
cd /home/runner/work/MuseumCheck/MuseumCheck

# Install Jest and dependencies (first time only)
npm install

# Or install manually
npm install --save-dev jest jest-environment-jsdom @jest/globals
```

### 2. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npx jest tests/core.test.js

# Run tests matching a pattern
npx jest --testNamePattern="localStorage"
```

## Test Structure

### Test Organization

```
tests/
├── setup.js           # Test configuration and mocks
├── core.test.js       # Core functionality tests
├── regression.test.js # Tests for previously fixed bugs
└── [feature].test.js  # Feature-specific tests
```

### Test Categories

1. **Core Tests** (`core.test.js`): Essential app functionality
   - LocalStorage data management
   - Version management
   - Progress calculations
   - Age group content validation

2. **Regression Tests** (`regression.test.js`): Previously fixed bugs
   - Canvas rendering bugs (v2.1.3)
   - Date consistency bugs (v2.1.2)
   - Version management issues

3. **Feature Tests**: New functionality as it's added

## Writing Tests for Bug Fixes

### Mandatory Process

**Every bug fix MUST include corresponding unit tests.**

### Step-by-Step Process

1. **Identify the Bug**: Understand what broke and why
2. **Write Failing Test**: Create a test that reproduces the bug
3. **Fix the Bug**: Implement the fix
4. **Verify Test Passes**: Ensure your fix makes the test pass
5. **Run All Tests**: Ensure no regressions were introduced

### Example: Canvas Height Bug Fix

```javascript
// Bug: Canvas height not adjusting to content
// Fix: Calculate height based on actual content

describe('Canvas Rendering', () => {
  test('should auto-adjust canvas height based on content', () => {
    const canvas = document.createElement('canvas');
    canvas.height = 400; // Initial height
    
    const contentEndY = 800;
    const padding = 40;
    const minHeight = 400;
    
    // The fix: calculate proper height
    const calculatedHeight = Math.max(contentEndY + padding, minHeight);
    canvas.height = calculatedHeight;
    
    expect(canvas.height).toBe(840); // 800 + 40
    expect(canvas.height).toBeGreaterThan(400);
  });
});
```

## Test Utilities

### Global Utilities (`testUtils`)

Available in all tests via `global.testUtils`:

```javascript
// Setup minimal DOM for testing
testUtils.setupMinimalDOM();

// Get mock museum data
const mockMuseum = testUtils.getMockMuseumData()[0];
```

### Mocked Services

- **localStorage**: Fully mocked with in-memory storage
- **Google Analytics**: `gtag` function is mocked
- **DOM Elements**: Essential elements are mocked

## Running Tests in Development

### Integration with Development Workflow

1. **Before Making Changes**: Run tests to ensure baseline
2. **During Development**: Use watch mode for immediate feedback
3. **Before Committing**: Run full test suite including coverage
4. **After Bug Fixes**: Verify new regression tests pass

### Commands Integration

```bash
# Combined development workflow
python3 -m http.server 8000 &  # Start dev server
npm run test:watch             # Start test watcher

# Or run tests before manual testing
npm test && python3 -m http.server 8000
```

## Coverage Targets

- **Core Functions**: 100% coverage required
- **Bug Fix Areas**: 100% coverage for fixed bugs
- **Overall Target**: 80%+ coverage

View coverage report:
```bash
npm run test:coverage
# Open coverage/lcov-report/index.html in browser
```

## Common Test Patterns

### Testing LocalStorage

```javascript
test('should save data to localStorage', () => {
  const data = ['museum1', 'museum2'];
  localStorage.setItem('visitedMuseums', JSON.stringify(data));
  
  const loaded = JSON.parse(localStorage.getItem('visitedMuseums') || '[]');
  expect(loaded).toEqual(data);
});
```

### Testing DOM Updates

```javascript
test('should update DOM element', () => {
  testUtils.setupMinimalDOM();
  const element = document.getElementById('stats');
  
  element.textContent = '1/26 已参观 (3.8%)';
  
  expect(element.textContent).toContain('1/26');
});
```

### Testing Error Handling

```javascript
test('should handle localStorage errors gracefully', () => {
  localStorage.setItem = jest.fn(() => {
    throw new Error('QuotaExceededError');
  });
  
  expect(() => {
    // Your error handling code here
  }).not.toThrow();
});
```

## Debugging Tests

### Common Issues

1. **DOM Not Available**: Use `testUtils.setupMinimalDOM()`
2. **localStorage Not Mocked**: Check `tests/setup.js` is loaded
3. **Async Issues**: Use `async/await` or return promises
4. **Module Import Issues**: Tests run in Node.js, not browser

### Debug Commands

```bash
# Run specific test with verbose output
npx jest tests/core.test.js --verbose

# Debug with Node.js inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Show console.log output
npx jest --verbose --no-silent
```

## Integration with CI/CD

### GitHub Actions Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
```

### Pre-commit Hooks

```bash
# Install husky for git hooks
npm install --save-dev husky

# Add pre-commit test
npx husky add .husky/pre-commit "npm test"
```

## Maintenance

### Regular Tasks

1. **Update Test Data**: Keep mock data consistent with real data
2. **Add Regression Tests**: For every bug fix
3. **Review Coverage**: Identify untested areas
4. **Performance**: Keep test suite fast (< 30 seconds)

### When Tests Fail

1. **Don't Skip Tests**: Fix the test or the code
2. **Update Tests**: When requirements change legitimately
3. **Add More Tests**: If edge case discovered
4. **Document Changes**: Update test descriptions

## Best Practices

### DO:
- Write tests for every bug fix
- Keep tests simple and focused
- Use descriptive test names
- Mock external dependencies
- Test edge cases and error conditions

### DON'T:
- Skip tests when in a hurry
- Write tests that depend on external services
- Test implementation details (test behavior)
- Leave commented-out tests
- Write overly complex tests

---

**Remember**: The goal is preventing regressions and maintaining confidence in the codebase. Every bug fix must include tests to prevent the same issue from recurring.