#!/usr/bin/env node
// Compute the next collision-free link id for nianming_nav.
//
// links.json uses non-sequential string ids (e.g. "1", "334", "2", "360" mixed),
// so the next id is max(numeric id) + 1, never "last entry + 1".
//
// Usage: node next_link_id.mjs
// Prints the next id (string) to stdout, e.g. "361". Empty array -> "1".

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const linksPath = resolve(__dirname, '../../../../src/config/data/links.json');

const links = JSON.parse(readFileSync(linksPath, 'utf-8'));

const numericIds = links
  .map((l) => Number(l.id))
  .filter((n) => Number.isFinite(n) && n > 0);

const nextId = (numericIds.length === 0 ? 0 : Math.max(...numericIds)) + 1;

process.stdout.write(String(nextId));
