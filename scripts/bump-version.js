/**
 * scripts/bump-version.js
 *
 * Automatically runs before every `npm run build`.
 * - Increments the patch version in package.json  (e.g. 1.0.3 → 1.0.4)
 * - Writes the new versionCode + versionName into android/app/build.gradle
 *
 * versionCode formula: major*10000 + minor*100 + patch
 *   1.0.0  → 10000
 *   1.0.4  → 10004
 *   1.2.10 → 10210
 *
 * This ensures Android always sees a higher versionCode and allows
 * direct APK updates without uninstalling first.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── 1. Read & bump package.json version ──────────────────────────────────────
const pkgPath = join(ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

const [major, minor, patch] = pkg.version.split('.').map(Number);
const newPatch = patch + 1;
const newVersion = `${major}.${minor}.${newPatch}`;

pkg.version = newVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`[bump-version] 📦 Version: ${major}.${minor}.${patch} → ${newVersion}`);

// ── 2. Compute versionCode ────────────────────────────────────────────────────
const versionCode = major * 10000 + minor * 100 + newPatch;
console.log(`[bump-version] 🤖 Android versionCode: ${versionCode}`);

// ── 3. Patch android/app/build.gradle ────────────────────────────────────────
const gradlePath = join(ROOT, 'android', 'app', 'build.gradle');
let gradle = readFileSync(gradlePath, 'utf8');

// Replace versionCode line
gradle = gradle.replace(
  /versionCode\s+\d+/,
  `versionCode ${versionCode}`
);

// Replace versionName line
gradle = gradle.replace(
  /versionName\s+"[^"]+"/,
  `versionName "${newVersion}"`
);

writeFileSync(gradlePath, gradle);
console.log(`[bump-version] ✅ android/app/build.gradle updated`);

// ── 4. Write version.json for update checks ──────────────────────────────────
const versionJsonPath = join(ROOT, 'public', 'version.json');
const versionJsonContent = JSON.stringify({ version: newVersion }, null, 2) + '\n';
writeFileSync(versionJsonPath, versionJsonContent);
console.log(`[bump-version] 🌐 public/version.json updated with version ${newVersion}`);

