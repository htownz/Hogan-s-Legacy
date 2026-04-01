/**
 * Migration script: Replace console.log/error/warn with pino structured logging
 * 
 * Run: npx tsx scripts/migrate-console-to-pino.ts [--dry-run]
 * 
 * This script:
 * 1. Finds all .ts files in server/ (excluding policy-intel, middleware, node_modules, logger.ts itself)
 * 2. Adds `import { createLogger } from './logger'` (or ../logger for subdirs)
 * 3. Adds `const log = createLogger('module-name')` after imports
 * 4. Replaces console.log → log.info, console.error → log.error, console.warn → log.warn
 * 5. Rewrites error patterns: console.error("msg", error) → log.error({ err: error }, "msg")
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DRY_RUN = process.argv.includes("--dry-run");
const serverDir = path.resolve(__dirname, "..", "server");

function findTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", "policy-intel", "middleware"].includes(entry.name)) continue;
      results.push(...findTsFiles(full));
    } else if (entry.name.endsWith(".ts") && entry.name !== "logger.ts") {
      results.push(full);
    }
  }
  return results;
}

function getModuleName(filePath: string): string {
  const base = path.basename(filePath, ".ts");
  return base;
}

function getImportPath(filePath: string): string {
  const rel = path.relative(path.dirname(filePath), serverDir);
  if (rel === "") return "./logger";
  return rel.replace(/\\/g, "/") + "/logger";
}

// Check if file already imports from logger
function hasLoggerImport(content: string): boolean {
  return /import\s+.*from\s+['"].*\/logger['"]/.test(content) ||
         /import\s+.*from\s+['"]\.\/logger['"]/.test(content);
}

function hasConsoleCall(content: string): boolean {
  return /console\.(log|error|warn)\s*\(/.test(content);
}

function transformFile(filePath: string): { changed: boolean; original: string; transformed: string } {
  const original = fs.readFileSync(filePath, "utf-8");
  
  if (!hasConsoleCall(original)) {
    return { changed: false, original, transformed: original };
  }

  if (hasLoggerImport(original)) {
    // Already has logger import - just replace console calls
    const transformed = replaceConsoleCalls(original);
    return { changed: transformed !== original, original, transformed };
  }

  const moduleName = getModuleName(filePath);
  const importPath = getImportPath(filePath);
  
  // Add import and logger constant
  let transformed = addLoggerImport(original, importPath, moduleName);
  transformed = replaceConsoleCalls(transformed);
  
  return { changed: transformed !== original, original, transformed };
}

function addLoggerImport(content: string, importPath: string, moduleName: string): string {
  const lines = content.split("\n");
  
  // Find the last import line
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("import ") || line.startsWith("import{")) {
      lastImportIdx = i;
      // Handle multi-line imports
    } else if (lastImportIdx >= 0 && (line.startsWith("} from") || line.includes("from '"))) {
      lastImportIdx = i;
    }
  }

  const importLine = `import { createLogger } from "${importPath}";`;
  const loggerLine = `const log = createLogger("${moduleName}");`;

  if (lastImportIdx === -1) {
    // No imports found - add at the top
    return importLine + "\n" + loggerLine + "\n\n" + content;
  }

  // Insert after the last import
  lines.splice(lastImportIdx + 1, 0, importLine, loggerLine, "");
  return lines.join("\n");
}

function replaceConsoleCalls(content: string): string {
  let result = content;

  // Pattern 1: console.error("msg", error) or console.error("msg:", error)
  // → log.error({ err: error }, "msg")
  result = result.replace(
    /console\.error\(\s*(['"`])(.*?)\1\s*,\s*(\w+(?:\.\w+)*)\s*\)/g,
    (match, quote, msg, errVar) => {
      // Clean trailing colon/comma from message
      const cleanMsg = msg.replace(/[,:]\s*$/, "").replace(/\s*$/, "");
      return `log.error({ err: ${errVar} }, ${quote}${cleanMsg}${quote})`;
    }
  );

  // Pattern 2: console.error(template literal with variable)
  // → log.error(template literal)
  result = result.replace(
    /console\.error\((`[^`]*`)\s*\)/g,
    "log.error($1)"
  );

  // Pattern 3: console.error("simple message")
  // → log.error("simple message")
  result = result.replace(
    /console\.error\(\s*(['"])([^'"]*)\1\s*\)/g,
    "log.error($1$2$1)"
  );

  // Pattern 4: console.warn("msg", var) → log.warn({ detail: var }, "msg")
  result = result.replace(
    /console\.warn\(\s*(['"`])(.*?)\1\s*,\s*(\w+(?:\.\w+)*)\s*\)/g,
    (match, quote, msg, varName) => {
      const cleanMsg = msg.replace(/[,:]\s*$/, "").replace(/\s*$/, "");
      return `log.warn({ detail: ${varName} }, ${quote}${cleanMsg}${quote})`;
    }
  );

  // Pattern 5: console.warn("simple") → log.warn("simple")
  result = result.replace(
    /console\.warn\(\s*(['"])([^'"]*)\1\s*\)/g,
    "log.warn($1$2$1)"
  );

  // Pattern 6: console.warn(template literal)
  result = result.replace(
    /console\.warn\((`[^`]*`)\s*\)/g,
    "log.warn($1)"
  );

  // Pattern 7: console.log(template literal)
  result = result.replace(
    /console\.log\((`[^`]*`)\s*\)/g,
    "log.info($1)"
  );

  // Pattern 8: console.log("msg", var) → log.info({ detail: var }, "msg")  
  result = result.replace(
    /console\.log\(\s*(['"`])(.*?)\1\s*,\s*(\w+(?:\.\w+)*)\s*\)/g,
    (match, quote, msg, varName) => {
      const cleanMsg = msg.replace(/[,:]\s*$/, "").replace(/\s*$/, "");
      return `log.info({ detail: ${varName} }, ${quote}${cleanMsg}${quote})`;
    }
  );

  // Pattern 9: console.log("simple message")
  result = result.replace(
    /console\.log\(\s*(['"])([^'"]*)\1\s*\)/g,
    "log.info($1$2$1)"
  );

  // Pattern 10: Any remaining console.log/error/warn with complex args
  // (these are rare edge cases - we convert but keep args as-is)
  result = result.replace(/console\.error\(/g, "log.error(");
  result = result.replace(/console\.warn\(/g, "log.warn(");
  result = result.replace(/console\.log\(/g, "log.info(");

  return result;
}

// Main
const files = findTsFiles(serverDir);
let totalChanged = 0;
let totalReplacements = 0;

for (const file of files) {
  const { changed, original, transformed } = transformFile(file);
  if (changed) {
    const relPath = path.relative(path.resolve(__dirname, ".."), file);
    const origCount = (original.match(/console\.(log|error|warn)\s*\(/g) || []).length;
    const remainCount = (transformed.match(/console\.(log|error|warn)\s*\(/g) || []).length;
    const replaced = origCount - remainCount;
    
    console.log(`${DRY_RUN ? "[DRY RUN] " : ""}${relPath}: ${replaced} replacements (${origCount} → ${remainCount})`);
    totalReplacements += replaced;
    totalChanged++;
    
    if (!DRY_RUN) {
      fs.writeFileSync(file, transformed, "utf-8");
    }
  }
}

console.log(`\n${DRY_RUN ? "[DRY RUN] " : ""}Done: ${totalChanged} files changed, ${totalReplacements} console calls replaced`);
