#!/usr/bin/env node
/**
 * Switch or inspect local vs deploy environment settings.
 *
 * Usage:
 *   node scripts/env-mode.mjs status
 *   node scripts/env-mode.mjs local
 *   node scripts/env-mode.mjs deploy
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const modesDir = join(root, 'env', 'modes');
const PLACEHOLDER = 'YOUR_EC2_PUBLIC_IP';

const parseEnv = (content) => {
  const map = new Map();
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map.set(key, value);
  }

  return map;
};

const serializeEnv = (content, updates, removals = []) => {
  const lines = content.split(/\r?\n/);
  const seen = new Set();
  const removalSet = new Set(removals);
  const out = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      out.push(line);
      continue;
    }

    const eq = line.indexOf('=');
    if (eq === -1) {
      out.push(line);
      continue;
    }

    const key = line.slice(0, eq).trim();
    if (removalSet.has(key)) {
      out.push(`# ${key}= (removed by env-mode — unset for this mode)`);
      seen.add(key);
      continue;
    }

    if (updates.has(key)) {
      const value = updates.get(key);
      out.push(`${key}="${value}"`);
      seen.add(key);
    } else {
      out.push(line);
      seen.add(key);
    }
  }

  for (const [key, value] of updates) {
    if (!seen.has(key)) {
      out.push(`${key}="${value}"`);
    }
  }

  return out.join('\n').replace(/\n?$/, '\n');
};

const readEnvFile = (relPath) => {
  const path = join(root, relPath);
  if (!existsSync(path)) return { path, content: '', map: new Map() };
  const content = readFileSync(path, 'utf8');
  return { path, content, map: parseEnv(content) };
};

const parseModeFile = (mode) => {
  const path = join(modesDir, `${mode}.env`);
  if (!existsSync(path)) {
    throw new Error(`Mode file not found: ${path}`);
  }

  const sections = new Map();
  let currentFile = null;
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('@file ')) {
      currentFile = trimmed.slice(6).trim();
      if (!sections.has(currentFile)) sections.set(currentFile, new Map());
      continue;
    }
    if (!currentFile || !trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    sections.get(currentFile).set(key, value);
  }

  return sections;
};

const isLocalFrontendUrl = (url) =>
  !url ||
  /localhost|127\.0\.0\.1/i.test(url) ||
  url === 'http://localhost' ||
  url.startsWith('http://localhost:');

const isPlaceholderUrl = (url) => !url || url.includes(PLACEHOLDER);

const detectMode = () => {
  const backend = readEnvFile('backend/.env');
  const rootEnv = readEnvFile('.env');
  const frontend = readEnvFile('frontend/.env');

  const backendPort = backend.map.get('PORT') || '5000';
  const backendFrontendUrl = backend.map.get('FRONTEND_URL') || '';
  const rootFrontendUrl = rootEnv.map.get('FRONTEND_URL') || '';
  const viteApiBase = frontend.map.get('VITE_API_BASE_URL') || '';
  const backendDevPort = frontend.map.get('BACKEND_PORT');
  const backendDevPortDisplay = backendDevPort ?? '(unset, vite default 5001)';

  const signals = {
    local: 0,
    deploy: 0,
    issues: [],
  };

  if (backendPort === '5001') signals.local += 2;
  if (backendPort === '5000') signals.deploy += 2;
  if (backendPort !== '5001' && backendPort !== '5000') {
    signals.issues.push(`backend/.env PORT=${backendPort} (expected 5001 local or 5000 deploy)`);
  }

  if (isLocalFrontendUrl(backendFrontendUrl)) signals.local += 2;
  else if (!isPlaceholderUrl(backendFrontendUrl)) signals.deploy += 2;
  else signals.issues.push('backend/.env FRONTEND_URL is still a placeholder');

  if (!isPlaceholderUrl(rootFrontendUrl)) signals.deploy += 1;
  else if (rootEnv.map.size > 0) {
    signals.issues.push('.env FRONTEND_URL unset — set for email reminders on EC2 (npm run env:deploy)');
  }

  if (!viteApiBase) signals.local += 1;
  if (!viteApiBase) signals.deploy += 1;
  else signals.issues.push('frontend/.env VITE_API_BASE_URL is set — usually wrong for proxy/nginx modes');

  if (backendPort === '5001' && backendDevPort && backendDevPort !== '5001') {
    signals.issues.push(
      `frontend BACKEND_PORT=${backendDevPort} does not match backend PORT=5001 (Vite proxy)`
    );
  }

  if (backendPort === '5000' && frontend.map.has('BACKEND_PORT')) {
    signals.issues.push(
      `frontend BACKEND_PORT=${backendDevPort} is set but backend PORT=5000 (run npm run env:deploy to clear)`
    );
  }

  if (backendPort === '5000' && !frontend.map.has('BACKEND_PORT')) {
    signals.issues.push(
      'backend PORT=5000 (deploy) but Vite will proxy to default 5001 — run npm run env:local before local npm dev'
    );
  }

  if (backendPort === '5000' && existsSync(join(root, '.env')) && rootEnv.map.size > 0) {
    signals.deploy += 1;
  }

  let mode = 'unclear';
  if (signals.local > signals.deploy) mode = 'local';
  else if (signals.deploy > signals.local) mode = 'deploy';
  else if (signals.local === signals.deploy && signals.local > 0) mode = 'mixed';

  return {
    mode,
    backendPort,
    backendFrontendUrl,
    rootFrontendUrl,
    viteApiBase,
    backendDevPort: backendDevPortDisplay,
    hasRootEnv: rootEnv.map.size > 0,
    hasBackendEnv: backend.map.size > 0,
    hasFrontendEnv: frontend.map.size > 0,
    issues: signals.issues,
  };
};

const printStatus = () => {
  const s = detectMode();

  console.log('Environment status\n');
  console.log(`  Detected mode: ${s.mode}`);
  console.log(`  backend/.env:  PORT=${s.backendPort}, FRONTEND_URL=${s.backendFrontendUrl || '(unset)'}`);
  console.log(`  .env (compose):  FRONTEND_URL=${s.rootFrontendUrl || '(unset)'}, keys=${s.hasRootEnv ? 'present' : 'missing'}`);
  console.log(
    `  frontend/.env:   BACKEND_PORT=${s.backendDevPort}, VITE_API_BASE_URL=${s.viteApiBase || '(unset — good)'}`
  );

  console.log('\n  How to run:');
  if (s.mode === 'local' || s.mode === 'mixed') {
    console.log('    Local npm:  backend npm run dev (or start) + frontend npm run dev');
    console.log('                API via Vite proxy http://localhost:5173/api → backend:' + s.backendPort);
  }
  if (s.mode === 'deploy' || s.mode === 'mixed') {
    console.log('    Deploy:     docker compose up -d --build  (nginx on :80, API internal)');
  }

  if (s.issues.length) {
    console.log('\n  Issues:');
    for (const issue of s.issues) console.log(`    - ${issue}`);
  }

  console.log('\n  Switch: npm run env:local  |  npm run env:deploy');
};

const applyMode = (mode) => {
  const sections = parseModeFile(mode);
  const backendEnv = readEnvFile('backend/.env');
  const backendFrontendUrl = backendEnv.map.get('FRONTEND_URL');

  for (const [relPath, updates] of sections) {
    const { path, content, map } = readEnvFile(relPath);
    const merged = new Map(updates);
    const removals = [];

    if (relPath === 'frontend/.env' && mode === 'deploy') {
      removals.push('BACKEND_PORT');
    }

    for (const [key, value] of merged) {
      if (key === 'FRONTEND_URL' && isPlaceholderUrl(value)) {
        const existing = map.get(key);
        if (!isPlaceholderUrl(existing)) {
          merged.set(key, existing);
        } else if (backendFrontendUrl && !isPlaceholderUrl(backendFrontendUrl)) {
          merged.set(key, backendFrontendUrl);
        }
      } else if (isPlaceholderUrl(value) && map.has(key) && !isPlaceholderUrl(map.get(key))) {
        merged.set(key, map.get(key));
      }
    }

    if (!existsSync(path) && merged.size === 0) continue;

    const next = serializeEnv(content || '', merged, removals);
    writeFileSync(path, next);
    console.log(`Updated ${relPath}`);
  }

  const markerPath = join(root, '.env.mode');
  writeFileSync(markerPath, `${mode}\n`);
  console.log(`\nApplied mode: ${mode}`);
  printStatus();
};

const command = process.argv[2] || 'status';

if (command === 'status') {
  printStatus();
} else if (command === 'local' || command === 'deploy') {
  applyMode(command);
} else {
  console.error('Usage: node scripts/env-mode.mjs [status|local|deploy]');
  process.exit(1);
}
