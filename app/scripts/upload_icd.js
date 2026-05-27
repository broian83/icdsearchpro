import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file manually
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
  console.error("Missing Supabase URL or Key in .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadData(filename, category) {
  const filePath = path.join(__dirname, '../public', filename);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  console.log(`\nStarting upload for ${category}: ${data.length} records...`);
  
  const batchSize = 1000;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map(item => ({
      code: item.code,
      title: item.title || null,
      desc: item.desc || null,
      category: category
    }));
    
    const { error } = await supabase.from('icd_codes').insert(batch);
    if (error) {
      console.error(`Error uploading batch ${i} - ${i + batchSize}:`, error.message);
    } else {
      console.log(`Successfully uploaded ${Math.min(i + batchSize, data.length)} / ${data.length}`);
    }
  }
  console.log(`${category} upload complete!`);
}

async function main() {
  try {
    await uploadData('icd10.json', 'icd10');
    await uploadData('icd9.json', 'icd9');
    console.log('\nAll data migrated successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

main();
