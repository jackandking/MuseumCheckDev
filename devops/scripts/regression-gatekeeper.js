#!/usr/bin/env node

/**
 * Regression Gatekeeper - Intelligent Regression Testing
 * 
 * Analyzes branch differences against main, identifies affected modules,
 * and runs targeted tests using npm test -- --findRelatedTests
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class RegressionGatekeeper {
  constructor(options = {}) {
    this.options = {
      verbose: options.verbose || false,
      dryRun: options.dryRun || false,
      branch: options.branch || null,
      mainBranch: options.mainBranch || 'origin/main',
      outputDir: options.outputDir || './regression-results',
      ...options
    };
    
    this.results = {
      changedFiles: [],
      testPatterns: [],
      testResults: null,
      exitCode: 0,
      duration: 0,
      timestamp: new Date().toISOString()
    };
    
    // Module mapping for intelligent test selection
    this.moduleMapping = {
      // Core functionality
      'script.js': ['tests/unit/', 'tests/integration/'],
      'js/': ['tests/unit/', 'tests/features/'],
      'core/': ['tests/unit/core/', 'tests/integration/'],
      
      // UI Components
      'css/': ['tests/ui/', 'tests/e2e/'],
      '*.html': ['tests/e2e/', 'tests/pages/'],
      
      // Data and configuration
      'data/': ['tests/data-quality/', 'tests/unit/'],
      'config/': ['tests/unit/', 'tests/integration/'],
      
      // Tools and utilities
      'tools/': ['tests/tools/', 'tests/unit/'],
      'scripts/': ['tests/scripts/', 'tests/unit/'],
      
      // Survey and quiz modules
      'survey/': ['tests/features/survey/', 'tests/e2e/'],
      'quiz/': ['tests/features/quiz/', 'tests/unit/quiz/'],
      
      // Admin functionality
      'admin/': ['tests/features/admin/', 'tests/e2e/admin/']
    };
    
    // Dependency graph for advanced impact analysis
    this.dependencyGraph = {
      'script.js': ['js/', 'core/', 'css/', 'data/'],
      'core/data-manager.js': ['data/', 'core/storage/'],
      'js/achievement-gamification.js': ['css/achievement-gamification.css'],
      'quiz/js/quiz-engine.js': ['quiz/css/', 'quiz/data/'],
      'js/leaderboard-modal.js': ['css/leaderboard.css'],
      'core/adapters/': ['core/storage/', 'data/']
    };
  }

  /**
   * Run the complete regression analysis
   */
  async run() {
    const startTime = Date.now();
    
    try {
      this.log('🚀 Starting Regression Gatekeeper');
      this.log(`📊 Branch: ${this.getCurrentBranch()}`);
      this.log(`🔍 Comparison: ${this.options.mainBranch}...${this.getCurrentBranch()}`);
      
      // Step 1: Verify environment
      await this.verifyEnvironment();
      
      // Step 2: Analyze changes
      await this.analyzeChanges();
      
      // Step 3: Generate test patterns
      await this.generateTestPatterns();
      
      // Step 4: Execute tests (unless dry run)
      if (!this.options.dryRun) {
        await this.executeTests();
      }
      
      // Step 5: Generate report
      await this.generateReport();
      
      this.results.duration = Date.now() - startTime;
      this.displaySummary();
      
    } catch (error) {
      this.log(`❌ Error: ${error.message}`, 'error');
      this.results.exitCode = 1;
      throw error;
    }
  }

  /**
   * Verify the testing environment
   */
  async verifyEnvironment() {
    this.log('🔧 Verifying environment...');
    
    // Check git status
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim() && !this.options.dryRun) {
        this.log('⚠️ Working directory not clean. Tests may be affected by uncommitted changes.');
      }
    } catch (error) {
      throw new Error('Git repository not found or not accessible');
    }
    
    // Check main branch
    try {
      execSync(`git rev-parse --verify ${this.options.mainBranch}`, { encoding: 'utf8' });
    } catch (error) {
      // Try local main branch
      try {
        execSync('git rev-parse --verify main', { encoding: 'utf8' });
        this.options.mainBranch = 'main';
        this.log('⚠️ Using local main branch (origin/main not available)');
      } catch (localError) {
        throw new Error('Main branch not found. Please ensure main branch exists.');
      }
    }
    
    // Check Jest availability
    try {
      const help = execSync('npm test -- --help', { encoding: 'utf8' });
      if (!help.includes('findRelatedTests')) {
        throw new Error('Jest --findRelatedTests not available');
      }
    } catch (error) {
      throw new Error('Jest testing framework not properly configured');
    }
    
    // Check tests directory
    if (!fs.existsSync('./tests')) {
      throw new Error('No tests directory found');
    }
    
    // Create output directory
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
    
    this.log('✅ Environment verification complete');
  }

  /**
   * Analyze changes between branches
   */
  async analyzeChanges() {
    this.log('📝 Analyzing changes...');
    
    const currentBranch = this.getCurrentBranch();
    const diffBase = `${this.options.mainBranch}...${currentBranch}`;
    
    try {
      // Get all changed files
      const changedFiles = execSync(`git diff --name-only ${diffBase}`, { encoding: 'utf8' });
      this.results.changedFiles = changedFiles.trim().split('\n').filter(Boolean);
      
      // Get file statistics
      const stats = execSync(`git diff --stat ${diffBase}`, { encoding: 'utf8' });
      this.log(`📊 Found ${this.results.changedFiles.length} changed files:`);
      
      if (this.options.verbose) {
        this.results.changedFiles.forEach(file => {
          this.log(`   ${file}`);
        });
      }
      
      // Categorize changes
      const categories = this.categorizeChanges(this.results.changedFiles);
      this.log(`📂 Impact categories: ${categories.join(', ')}`);
      
    } catch (error) {
      throw new Error(`Failed to analyze changes: ${error.message}`);
    }
  }

  /**
   * Categorize changes by impact level
   */
  categorizeChanges(files) {
    const categories = new Set();
    
    files.forEach(file => {
      if (file.endsWith('.js')) {
        categories.add('JavaScript (High Impact)');
      } else if (file.endsWith('.html')) {
        categories.add('HTML (Medium Impact)');
      } else if (file.endsWith('.css')) {
        categories.add('CSS (Medium Impact)');
      } else if (file.startsWith('data/')) {
        categories.add('Data (High Impact)');
      } else if (file.startsWith('config/')) {
        categories.add('Configuration (Medium Impact)');
      } else if (file.startsWith('test')) {
        categories.add('Test Files (Low Impact)');
      } else {
        categories.add('Other (Low Impact)');
      }
    });
    
    return Array.from(categories);
  }

  /**
   * Generate test patterns based on changed files
   */
  async generateTestPatterns() {
    this.log('🎯 Generating test patterns...');
    
    const testPatterns = new Set();
    
    for (const file of this.results.changedFiles) {
      // Direct test file mapping
      if (file.endsWith('.js')) {
        const testFile = `tests/${path.basename(file, '.js')}.test.js`;
        if (fs.existsSync(testFile)) {
          testPatterns.add(testFile);
        }
      }
      
      // Directory-based mapping
      const dir = path.dirname(file);
      const mappedTests = this.getTestsForDirectory(dir);
      mappedTests.forEach(test => testPatterns.add(test));
      
      // Dependency-based mapping
      const affectedFiles = this.getAffectedFiles(file);
      affectedFiles.forEach(affectedFile => {
        const affectedDir = path.dirname(affectedFile);
        const dependentTests = this.getTestsForDirectory(affectedDir);
        dependentTests.forEach(test => testPatterns.add(test));
      });
    }
    
    this.results.testPatterns = Array.from(testPatterns);
    
    this.log(`🧪 Generated ${this.results.testPatterns.length} test patterns:`);
    if (this.options.verbose) {
      this.results.testPatterns.forEach(pattern => {
        this.log(`   ${pattern}`);
      });
    }
  }

  /**
   * Get test patterns for a directory
   */
  getTestsForDirectory(dir) {
    const tests = [];
    
    // Direct mapping
    if (this.moduleMapping[dir]) {
      tests.push(...this.moduleMapping[dir]);
    }
    
    // Pattern matching
    Object.keys(this.moduleMapping).forEach(key => {
      if (key.endsWith('/') && dir.startsWith(key)) {
        tests.push(...this.moduleMapping[key]);
      } else if (key.includes('*') && this.matchesPattern(dir, key)) {
        tests.push(...this.moduleMapping[key]);
      }
    });
    
    return tests.filter(testPattern => {
      // Check if test pattern exists
      if (testPattern.endsWith('/')) {
        return fs.existsSync(testPattern);
      } else {
        return fs.existsSync(testPattern) || fs.existsSync(testPattern.replace(/\*$/, ''));
      }
    });
  }

  /**
   * Get files affected by dependencies
   */
  getAffectedFiles(file) {
    const affected = new Set([file]);
    
    // Add dependencies
    if (this.dependencyGraph[file]) {
      this.dependencyGraph[file].forEach(dep => affected.add(dep));
    }
    
    // Add dependents (reverse lookup)
    Object.entries(this.dependencyGraph).forEach(([sourceFile, deps]) => {
      if (deps.includes(file)) {
        affected.add(sourceFile);
      }
    });
    
    return Array.from(affected);
  }

  /**
   * Execute the regression tests
   */
  async executeTests() {
    this.log('🧪 Executing regression tests...');
    
    let testCommand;
    
    if (this.results.testPatterns.length > 0) {
      // Build Jest command with patterns
      const patternArgs = this.results.testPatterns.map(p => `'${p}'`).join(' ');
      testCommand = `npm test -- --findRelatedTests ${patternArgs} --coverage --verbose --json`;
    } else {
      // Fallback to all tests
      this.log('⚠️ No specific test patterns found, running full test suite');
      testCommand = 'npm test -- --coverage --verbose --json';
    }
    
    this.log(`🔧 Command: ${testCommand}`);
    
    try {
      const startTime = Date.now();
      
      // Execute tests and capture output
      const output = execSync(testCommand, { 
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });
      
      this.results.duration = Date.now() - startTime;
      this.results.testResults = this.parseTestResults(output);
      this.results.exitCode = 0;
      
      this.log(`✅ Tests completed in ${this.results.duration}ms`);
      
    } catch (error) {
      this.results.exitCode = error.status || 1;
      
      // Try to parse partial results from error output
      if (error.stdout) {
        try {
          this.results.testResults = this.parseTestResults(error.stdout);
        } catch (parseError) {
          this.log('⚠️ Could not parse test results from error output');
        }
      }
      
      this.log(`❌ Tests failed with exit code ${this.results.exitCode}`);
      
      if (this.options.verbose && error.stdout) {
        this.log('📄 Test output:');
        this.log(error.stdout);
      }
    }
  }

  /**
   * Parse Jest JSON output
   */
  parseTestResults(output) {
    try {
      // Find JSON in output (Jest outputs JSON at the end)
      const jsonMatch = output.match(/\{[\s\S]*\}$/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      this.log('⚠️ Could not parse JSON test results');
    }
    
    return null;
  }

  /**
   * Generate comprehensive regression report
   */
  async generateReport() {
    this.log('📄 Generating regression report...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(this.options.outputDir, `regression-report-${timestamp}.md`);
    const resultsFile = path.join(this.options.outputDir, `regression-results-${timestamp}.json`);
    
    // Save detailed results
    if (this.results.testResults) {
      fs.writeFileSync(resultsFile, JSON.stringify(this.results.testResults, null, 2));
    }
    
    // Generate markdown report
    const report = this.generateMarkdownReport();
    fs.writeFileSync(reportFile, report);
    
    this.log(`📄 Report saved to: ${reportFile}`);
    if (this.results.testResults) {
      this.log(`📊 Results saved to: ${resultsFile}`);
    }
  }

  /**
   * Generate markdown report content
   */
  generateMarkdownReport() {
    const status = this.results.exitCode === 0 ? '✅ PASSED' : '❌ FAILED';
    const statusEmoji = this.results.exitCode === 0 ? '🎉' : '🚨';
    
    let report = `# Regression Test Report

**Generated:** ${new Date().toLocaleString()}  
**Branch:** ${this.getCurrentBranch()}  
**Comparison:** ${this.options.mainBranch}...${this.getCurrentBranch()}  
**Status:** ${status}  
**Duration:** ${this.results.duration}ms  

## Summary

| Metric | Value |
|--------|-------|
| Exit Code | ${this.results.exitCode} |
| Status | ${status} |
| Files Changed | ${this.results.changedFiles.length} |
| Test Patterns | ${this.results.testPatterns.length} |
| Duration | ${this.results.duration}ms |

## Changed Files Analysis

### Files Changed
\`\`\`
${this.results.changedFiles.join('\n')}
\`\`\`

### Impact Assessment
`;

    // Add impact analysis
    const categories = this.categorizeChanges(this.results.changedFiles);
    categories.forEach(category => {
      const impact = category.includes('High') ? '🔴' : category.includes('Medium') ? '🟡' : '🟢';
      report += `- ${impact} **${category}**\n`;
    });

    // Add test results if available
    if (this.results.testResults) {
      report += `

## Test Results

### Overall Statistics
- Total Tests: ${this.results.testResults.numTotalTests || 0}
- Passed: ${this.results.testResults.numPassedTests || 0}
- Failed: ${this.results.testResults.numFailedTests || 0}
- Skipped: ${this.results.testResults.numPendingTests || 0}
- Test Suites: ${this.results.testResults.numTotalTestSuites || 0}

### Coverage Summary
`;
      
      if (this.results.testResults.coverageMap) {
        const coverageFiles = Object.keys(this.results.testResults.coverageMap).length;
        report += `- Files with coverage: ${coverageFiles}\n`;
        
        // Add coverage percentages if available
        if (this.results.testResults.coverageMap) {
          Object.entries(this.results.testResults.coverageMap).forEach(([file, coverage]) => {
            if (coverage.statementMap && coverage.s) {
              const covered = Object.values(coverage.s).filter(Boolean).length;
              const total = Object.values(coverage.s).length;
              const percentage = total > 0 ? Math.round((covered / total) * 100) : 0;
              report += `- ${file}: ${percentage}%\n`;
            }
          });
        }
      }
    }

    // Add test patterns
    report += `

## Test Patterns Used
`;
    
    if (this.results.testPatterns.length > 0) {
      this.results.testPatterns.forEach(pattern => {
        report += `- \`${pattern}\`\n`;
      });
    } else {
      report += `- No specific patterns (full test suite)\n`;
    }

    // Add recommendations
    report += `

## Recommendations

`;

    if (this.results.exitCode === 0) {
      report += `✅ **No regressions detected** - Changes appear to be safe  
🚀 **Ready for merge** - All affected tests passing  
✨ **Good coverage** - Tests are properly targeting changed modules  
`;
    } else {
      report += `❌ **Regressions found** - Fix failing tests before merging  
🔧 **Action required** - Review and fix test failures  
🚫 **Merge blocked** - Wait for all tests to pass  
`;
    }

    if (this.results.testPatterns.length === 0 && this.results.changedFiles.length > 0) {
      report += `⚠️ **Consider adding tests** for modified modules to improve coverage  
📝 **Test gaps identified** - Some changed files lack corresponding tests  
`;
    }

    report += `

## Next Steps

${this.results.exitCode === 0 ? 
  '• Your changes are ready for review and merge\n• Consider adding tests for untested modules\n• Proceed with PR creation if needed' :
  '• Review and fix failing tests\n• Re-run regression tests after fixes\n• Ensure all tests pass before merging'
}

---

**Report generated by:** Regression Gatekeeper  
**Timestamp:** ${this.results.timestamp}  
**Environment:** Node.js ${process.version}
`;

    return report;
  }

  /**
   * Display user-friendly summary
   */
  displaySummary() {
    console.log('\n=== REGRESSION TEST SUMMARY ===\n');
    
    if (this.results.exitCode === 0) {
      console.log('🎉 RESULT: PASSED');
      console.log('✅ No regressions detected in your changes');
    } else {
      console.log('🚨 RESULT: FAILED');
      console.log('❌ Regressions detected - fixes needed');
    }
    
    console.log('\n📊 CHANGES ANALYSIS:');
    console.log(`   Files changed: ${this.results.changedFiles.length}`);
    console.log(`   Test patterns: ${this.results.testPatterns.length}`);
    console.log(`   Duration: ${this.results.duration}ms`);
    
    console.log('\n🔧 NEXT STEPS:');
    if (this.results.exitCode === 0) {
      console.log('   • Your changes are ready for review');
      console.log('   • Consider adding tests for untested modules');
      console.log('   • Proceed with merge/PR creation');
    } else {
      console.log('   • Review failed tests and fix issues');
      console.log('   • Re-run regression tests after fixes');
      console.log('   • Ensure all tests pass before merging');
    }
    
    // Show failed tests if available
    if (this.results.testResults && this.results.testResults.numFailedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.testResults.testResults
        .filter(test => test.status === 'failed')
        .forEach(test => {
          console.log(`   • ${test.name}`);
        });
    }
    
    console.log('\n📄 Detailed reports available in:', this.options.outputDir);
    console.log('');
  }

  /**
   * Get current git branch
   */
  getCurrentBranch() {
    try {
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Check if file matches pattern
   */
  matchesPattern(file, pattern) {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(file);
    }
    return file === pattern;
  }

  /**
   * Log message with optional level
   */
  log(message, level = 'info') {
    if (this.options.verbose || level === 'error') {
      console.log(message);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;
      case '--branch':
      case '-b':
        options.branch = args[++i];
        break;
      case '--main':
      case '-m':
        options.mainBranch = args[++i];
        break;
      case '--output':
      case '-o':
        options.outputDir = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Regression Gatekeeper - Intelligent Regression Testing

Usage: node regression-gatekeeper.js [options]

Options:
  --verbose, -v          Enable verbose output
  --dry-run, -d          Analyze changes without running tests
  --branch <branch>      Specify branch to test (default: current)
  --main <branch>        Specify main branch for comparison (default: origin/main)
  --output <dir>         Output directory for reports (default: ./regression-results)
  --help, -h             Show this help message

Examples:
  node regression-gatekeeper.js                    # Basic regression test
  node regression-gatekeeper.js --verbose          # With detailed output
  node regression-gatekeeper.js --dry-run          # Analysis only
  node regression-gatekeeper.js --branch feature-xyz  # Test specific branch
        `);
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        console.error('Use --help for available options');
        process.exit(1);
    }
  }
  
  // Create and run regression gatekeeper
  const gatekeeper = new RegressionGatekeeper(options);
  
  gatekeeper.run()
    .then(() => {
      process.exit(gatekeeper.results.exitCode);
    })
    .catch(error => {
      console.error('Regression gatekeeper failed:', error.message);
      process.exit(1);
    });
}

module.exports = RegressionGatekeeper;
