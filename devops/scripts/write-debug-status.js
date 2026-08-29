#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const outputPath = path.join(process.cwd(), 'debug/status/status.json');
const commit = process.env.GITHUB_SHA || 'unknown';
const branch = process.env.GITHUB_REF_NAME || process.env.GITHUB_REF || 'unknown';

const metadata = {
  schemaVersion: 1,
  app: 'MuseumCheck',
  environment: process.env.DEBUG_STATUS_ENVIRONMENT || 'local',
  branch,
  commit,
  commitShort: commit === 'unknown' ? 'unknown' : commit.slice(0, 7),
  workflow: process.env.GITHUB_WORKFLOW || 'local',
  runId: process.env.GITHUB_RUN_ID || 'local',
  runAttempt: process.env.GITHUB_RUN_ATTEMPT || 'local',
  repository: process.env.GITHUB_REPOSITORY || 'jackandking/MuseumCheck',
  deployedAt: new Date().toISOString(),
  generatedBy: 'devops/scripts/write-debug-status.js'
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(metadata, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
