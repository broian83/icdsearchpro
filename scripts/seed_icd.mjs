/**
 * Seed ICD codes into Supabase icd_codes table.
 * Uses Supabase REST API directly (no @supabase/supabase-js dependency).
 * 
 * Usage:
 *   node scripts/seed_icd.mjs
 * 
 * Requires:
 *   - VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment
 *   - Schema deployed (run supabase_schema.sql first)
 * 
 * Reads: app/public/icd10.json, app/public/icd9.json
 * Inserts into: public.icd_codes
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const APP_PUBLIC = join(PROJECT_ROOT, 'app', 'public');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const REST_URL = `${supabaseUrl}/rest/v1`;

async function supabaseQuery(table, method, body = null, extraHeaders = {}) {
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=minimal' : 'return=representation',
    ...extraHeaders
  };

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${REST_URL}/${table}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return { data: null, error: null };
  }
  const text = await res.text();
  if (!text) return { data: null, error: null };
  const data = JSON.parse(text);
  return { data, error: null };
}

async function getCount(table) {
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Prefer': 'count=exact',
    'Range-Unit': 'items',
    'Range': '0-0'
  };
  const res = await fetch(`${REST_URL}/${table}?select=code`, { headers });
  const contentRange = res.headers.get('content-range');
  if (contentRange) {
    const match = contentRange.match(/\/(\d+)/);
    if (match) return parseInt(match[1], 10);
  }
  return 0;
}

function getChapter(code) {
  if (!code) return null;
  const first = code.charAt(0).toUpperCase();
  if (first >= 'A' && first <= 'B') return 'A|B';
  if (first >= 'C' && first <= 'D') return 'C|D';
  return first;
}

async function seedVersion(version, filePath) {
  console.log(`Reading ${filePath}...`);
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  console.log(`  ${data.length} records found. Preparing batch insert...`);

  const batchSize = 500;
  let inserted = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map(item => ({
      code: item.code,
      title: item.title,
      desc: item.desc,
      icd_version: version,
      chapter: getChapter(item.code)
    }));

    try {
      await supabaseQuery('icd_codes', 'POST', batch, {
        'Prefer': 'return=minimal'
      });
      inserted += batch.length;
      process.stdout.write(`\r  Inserted ${inserted}/${data.length}...`);
    } catch (err) {
      console.error(`\n  Batch ${Math.floor(i / batchSize) + 1} error:`, err.message);
    }
  }

  console.log(`\n  Done: ${inserted} records inserted for ${version}.`);
}

async function main() {
  console.log('=== ICD Search Pro — Seed Script ===\n');

  const existingCount = await getCount('icd_codes');
  console.log(`Existing records in icd_codes: ${existingCount}\n`);

  await seedVersion('icd10', join(APP_PUBLIC, 'icd10.json'));
  await seedVersion('icd9', join(APP_PUBLIC, 'icd9.json'));

  const finalCount = await getCount('icd_codes');
  console.log(`\n=== Total records in icd_codes: ${finalCount} ===`);
  console.log('Seeding complete!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
