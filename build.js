#!/usr/bin/env node

/**
 * Simple ES6 Module Bundler for MuseumCheck
 * 
 * This build script combines all ES6 modules into a single file that can be
 * loaded in browsers without module support. It maintains all functionality
 * while providing a clean integration path.
 */

const fs = require('fs').promises;
const path = require('path');

class ModuleBundler {
    constructor() {
        this.modules = new Map();
        this.processed = new Set();
    }

    async loadModule(modulePath) {
        if (this.processed.has(modulePath)) return;
        
        try {
            const content = await fs.readFile(modulePath, 'utf8');
            this.modules.set(modulePath, content);
            this.processed.add(modulePath);
            
            // Extract import statements and recursively load dependencies
            const imports = this.extractImports(content);
            for (const importPath of imports) {
                const resolvedPath = path.resolve(path.dirname(modulePath), importPath);
                await this.loadModule(resolvedPath);
            }
        } catch (error) {
            console.warn(`Warning: Could not load module ${modulePath}:`, error.message);
        }
    }

    extractImports(content) {
        const imports = [];
        const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
            let importPath = match[1];
            if (!importPath.endsWith('.js')) {
                importPath += '.js';
            }
            imports.push(importPath);
        }
        
        return imports;
    }

    transformModule(content, modulePath) {
        // Remove import statements
        content = content.replace(/import\s+.*?\s+from\s+['"`][^'"`]+['"`];?\s*\n?/g, '');
        
        // Transform exports to window assignments for global access
        const moduleName = path.basename(modulePath, '.js');
        
        // Handle default exports
        content = content.replace(/export\s+default\s+class\s+(\w+)/g, 'class $1');
        content = content.replace(/export\s+default\s+/g, '');
        
        // Handle named exports
        content = content.replace(/export\s+class\s+(\w+)/g, 'class $1');
        content = content.replace(/export\s+const\s+(\w+)/g, 'const $1');
        content = content.replace(/export\s+function\s+(\w+)/g, 'function $1');
        content = content.replace(/export\s+\{([^}]+)\}/g, '// Exported: $1');
        
        return content;
    }

    async bundle(entryPoints, outputPath) {
        console.log('🔄 Starting module bundling...');
        
        // Load all modules
        for (const entryPoint of entryPoints) {
            await this.loadModule(entryPoint);
        }
        
        console.log(`📦 Loaded ${this.modules.size} modules`);
        
        // Create bundle content
        let bundleContent = `/**
 * MuseumCheck - Bundled Application
 * Generated on ${new Date().toISOString()}
 * 
 * This file contains all application modules bundled for browser compatibility.
 * Original ES6 modules are preserved in the src/ directory.
 */

// Module System Polyfill for older browsers
if (!window.moduleSystem) {
    window.moduleSystem = {
        modules: {},
        exports: {},
        register: function(name, factory) {
            this.modules[name] = factory;
        },
        require: function(name) {
            if (!this.exports[name]) {
                if (this.modules[name]) {
                    this.exports[name] = this.modules[name]();
                } else {
                    throw new Error('Module not found: ' + name);
                }
            }
            return this.exports[name];
        }
    };
}

`;

        // Add each module to the bundle
        const moduleOrder = this.getModuleLoadOrder();
        for (const modulePath of moduleOrder) {
            const content = this.modules.get(modulePath);
            const transformed = this.transformModule(content, modulePath);
            const moduleName = path.basename(modulePath, '.js');
            
            bundleContent += `
// ================================================
// Module: ${moduleName}
// Path: ${modulePath}
// ================================================

${transformed}

`;
        }

        // Write bundle to output
        await fs.writeFile(outputPath, bundleContent, 'utf8');
        console.log(`✅ Bundle created: ${outputPath}`);
        
        const stats = await fs.stat(outputPath);
        console.log(`📊 Bundle size: ${(stats.size / 1024).toFixed(2)} KB`);
    }

    getModuleLoadOrder() {
        // Simple dependency ordering - services first, then components
        const services = Array.from(this.modules.keys()).filter(path => path.includes('/services/'));
        const components = Array.from(this.modules.keys()).filter(path => path.includes('/components/'));
        const data = Array.from(this.modules.keys()).filter(path => path.includes('/data/'));
        const others = Array.from(this.modules.keys()).filter(path => 
            !path.includes('/services/') && 
            !path.includes('/components/') &&
            !path.includes('/data/')
        );
        
        return [...data, ...services, ...components, ...others];
    }
}

async function main() {
    const bundler = new ModuleBundler();
    
    const entryPoints = [
        'src/services/index.js',
        'src/components/index.js',
        'src/data/index.js'
    ];
    
    try {
        await bundler.bundle(entryPoints, 'dist/modules-bundle.js');
        console.log('🎉 Build completed successfully!');
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

// Run the bundler
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { ModuleBundler };