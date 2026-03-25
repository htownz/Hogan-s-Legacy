/**
 * Migration script for extended Scout Bot schema
 * 
 * This script imports and runs the TypeScript migration file to create 
 * the extended tables and update the schema for Scout Bot.
 */

import { buildSync } from 'esbuild';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use esbuild to compile the TypeScript file
buildSync({
  entryPoints: [path.join(__dirname, 'push-scout-bot-extended-schema.ts')],
  bundle: true,
  platform: 'node',
  outfile: path.join(__dirname, 'temp-migration.js'),
});

// Execute the compiled file using child_process
execSync('node ' + path.join(__dirname, 'temp-migration.js'), { stdio: 'inherit' });

console.log('Scout Bot Extended Schema Migration script executed');