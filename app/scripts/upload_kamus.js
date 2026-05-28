import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local file manually
const envPath = path.join(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env.local file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadData() {
  const filePath = path.join(__dirname, '../../data/kamus_terminologi_full.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const rows = data.rows;
  
  console.log(`\nStarting upload for Kamus Terminologi: ${rows.length} records...`);
  
  const batchSize = 1000;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize).map(item => ({
      kosa_kata: item[0],
      arti_kata: item[1]
    }));
    
    const { error } = await supabase.from('kamus_terminologi').insert(batch);
    if (error) {
      console.error(`Error uploading batch ${i} - ${i + batchSize}:`, error.message);
    } else {
      console.log(`Successfully uploaded ${Math.min(i + batchSize, rows.length)} / ${rows.length}`);
    }
  }
  console.log(`Kamus Terminologi upload complete!`);
}

async function main() {
  try {
    await uploadData();
    console.log('\nAll data migrated successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

main();
