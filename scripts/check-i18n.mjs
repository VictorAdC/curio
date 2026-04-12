import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const srcDir = join(root, 'src');

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith('.tsx') && !fullPath.endsWith('.test.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

const checks = [
  {
    label: 'JSX text',
    test: (line) => />(\s*)([A-Za-z][^<{]*?)(\s*)</.test(line),
  },
  {
    label: 'placeholder prop',
    test: (line) => /placeholder="([A-Za-z][^"\n]*)"/.test(line),
  },
  {
    label: 'aria-label prop',
    test: (line) => /aria-label="([A-Za-z][^"\n]*)"/.test(line),
  },
  {
    label: 'title prop',
    test: (line) => /title="([A-Za-z][^"\n]*)"/.test(line),
  },
];

const ignoreLine = (line) =>
  !line.trim() ||
  line.includes("t('") ||
  line.includes('t("') ||
  line.includes('import ') ||
  line.includes('export ') ||
  line.includes('interface ') ||
  line.includes('type ') ||
  line.includes('=>') ||
  line.includes('Promise<') ||
  line.includes('className=') ||
  line.includes('layout=') ||
  line.includes('variant=') ||
  line.includes('type="button"') ||
  line.includes('type="file"') ||
  line.includes('type="url"') ||
  line.includes('accept=') ||
  line.includes('role="button"') ||
  line.includes('EN') ||
  line.includes('PT');

const results = [];

for (const filePath of walk(srcDir)) {
  if (filePath.endsWith('messages.ts')) {
    continue;
  }

  const lines = readFileSync(filePath, 'utf8').split('\n');

  lines.forEach((line, index) => {
    if (ignoreLine(line)) {
      return;
    }

    for (const check of checks) {
      if (check.test(line)) {
        results.push({
          filePath: filePath.replace(`${root}/`, ''),
          lineNumber: index + 1,
          pattern: check.label,
          line: line.trim(),
        });
      }
    }
  });
}

if (results.length > 0) {
  console.error('Potential hardcoded user-facing text found:');

  for (const result of results) {
    console.error(`- ${result.filePath}:${result.lineNumber} [${result.pattern}] ${result.line}`);
  }

  process.exit(1);
}

console.log('No obvious hardcoded user-facing text found.');
