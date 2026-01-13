#!/usr/bin/env node
/*
 Generates data/museums-meta.json from museums-data.js
 
 Note: museums-data.js is deprecated for runtime use but retained as the canonical
 source for generating museums-meta.json and as test data. This tool extracts metadata
 to create the lightweight listing used by the homepage.
 
 Output format: JSON array with { id, name, location, tags, image, hasCollections }
*/
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataFile = path.join(root, 'museums-data.js');
const outFile = path.join(root, 'data', 'museums-meta.json');

function extractArrayLiteral(js) {
  // Try to locate the array literal assigned to MUSEUMS
  const startIdx = js.indexOf('const MUSEUMS =');
  if (startIdx === -1) throw new Error('Cannot find const MUSEUMS =');
  const arrStart = js.indexOf('[', startIdx);
  if (arrStart === -1) throw new Error('Cannot find array start');
  // Naive bracket match for array
  let i = arrStart, depth = 0;
  for (; i < js.length; i++) {
    const ch = js[i];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) { i++; break; }
    }
  }
  if (depth !== 0) throw new Error('Array bracket mismatch');
  return js.slice(arrStart, i);
}

function toMeta(arrayJs) {
  // Convert JS array text to an actual array via eval in a sandbox
  const vm = require('vm');
  const sandbox = {};
  const code = 'arr = ' + arrayJs + '; arr';
  const script = new vm.Script(code, { filename: 'extract-meta.vm' });
  const context = vm.createContext(sandbox);
  const arr = script.runInContext(context, { timeout: 10000 });
  if (!Array.isArray(arr)) throw new Error('Parsed value is not array');
  return arr.map(m => ({
    id: m.id,
    name: m.name,
    location: m.location,
    tags: m.tags || [],
    image: m.image || '',
    hasCollections: !!(m.collections && Array.isArray(m.collections) && m.collections.length > 0)
  }));
}

function main(){
  const js = fs.readFileSync(dataFile, 'utf8');
  const arrJs = extractArrayLiteral(js);
  const meta = toMeta(arrJs);
  
  // Ensure output directory exists
  const outDir = path.dirname(outFile);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  // Write as pure JSON (no JS wrapper)
  fs.writeFileSync(outFile, JSON.stringify(meta, null, 2), 'utf8');
  console.log(`Wrote ${outFile} with ${meta.length} entries.`);
}

if (require.main === module) {
  main();
}
