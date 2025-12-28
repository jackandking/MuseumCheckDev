/*
Repro script: create a sample `museumPosters` JSON and print a browser-console snippet
Usage (locally):
  node tests/reproduce_poster_localstorage.js

Then copy the printed JS and paste into browser console on the served site (http://localhost:8000/achievements.html), or run as-is in DevTools "Console" to set localStorage and reload.
*/

const fs = require('fs');
const path = require('path');

const sample = {
  "sample-museum-001": {
    dataURL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA\nAAAFCAYAAACNbyblAAAAHElEQVQI12P4\n9/wHAAwDAAIYAFiZB9sAAAAASUVORK5CYII=",
    museumId: "sample-museum-001",
    museumName: "示例博物馆",
    ageGroup: "7-12",
    timestamp: Date.now(),
    date: new Date().toLocaleDateString('zh-CN')
  }
};

const out = JSON.stringify(sample, null, 2);
const outFile = path.resolve(__dirname, 'museumPosters_sample.json');
fs.writeFileSync(outFile, out, 'utf8');

console.log('Wrote sample file:', outFile);
console.log('\nPaste the following into the browser console on the served site (example: http://localhost:8000/achievements.html) to simulate a saved poster:');
console.log('--- BEGIN CONSOLE SNIPPET ---');
console.log("localStorage.setItem('museumPosters', `" + out.replace(/`/g, '\\`') + "`);\nlocation.reload();");
console.log('--- END CONSOLE SNIPPET ---');

console.log('\nAlternatively run this small one-liner in browser console:');
console.log("(()=>{const s='" + out.replace(/'/g, "\\'") + "';localStorage.setItem('museumPosters', s);console.info('museumPosters set');location.reload();})()\n");

console.log('Verification note: after reload open Developer Tools Console and look for the [achievements.loadPosters] logs added by the debug instrumentation.');
