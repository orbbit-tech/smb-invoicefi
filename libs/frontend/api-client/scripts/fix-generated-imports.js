/**
 * Post-generation script to fix OpenAPI Generator bugs
 *
 * Fixes:
 * 1. Duplicate import statements
 * 2. Missing OneOf imports
 * 3. Problematic string type imports
 * 4. instanceOfstring checks
 */

const fs = require('fs');
const path = require('path');

const generatedDir = path.join(__dirname, '../src/generated');

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix 1: Remove duplicate imports
  const imports = {};
  const lines = content.split('\n');
  const newLines = [];

  for (const line of lines) {
    if (line.startsWith('import ')) {
      if (!imports[line]) {
        imports[line] = true;
        newLines.push(line);
      } else {
        modified = true;
      }
    } else {
      newLines.push(line);
    }
  }

  content = newLines.join('\n');

  // Fix 2: Remove problematic 'string' type imports
  if (content.includes("import { string } from")) {
    content = content.replace(/import \{ string \} from ['"]\.\/string['"];?\n/g, '');
    modified = true;
  }

  // Fix 3: Fix instanceOfstring checks
  if (content.includes('instanceOfstring')) {
    content = content.replace(/instanceOfstring\(/g, 'typeof value === "string" || (');
    modified = true;
  }

  // Fix 4: Fix stringFromJSONTyped and stringToJSON calls
  if (content.includes('stringFromJSONTyped') || content.includes('stringToJSON')) {
    content = content.replace(/stringFromJSONTyped\(json, '.*?'\)/g, 'json');
    content = content.replace(/stringToJSON\(value\)/g, 'value');
    modified = true;
  }

  // Fix 5: Fix missing 'import {' after 'import type' statements
  // Pattern: import type { X } from 'Y';\n    Z, (missing import {)
  const missingImportPattern = /(import type \{ [^}]+ \} from ['"][^'"]+['"];\n)(\s{4}[A-Z][a-zA-Z]+)/g;
  if (missingImportPattern.test(content)) {
    content = content.replace(missingImportPattern, '$1import {\n$2');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ Fixed: ${path.basename(filePath)}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fixImports(filePath);
    }
  }
}

console.log('Fixing generated TypeScript files...');
processDirectory(generatedDir);
console.log('Done!');
