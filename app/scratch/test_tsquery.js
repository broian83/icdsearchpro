import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testTsQuery() {
  const { data, error } = await supabase.rpc('search_icd', { search_term: 'fever', search_category: 'all' });
  console.log("Results from search_icd:", data);
  
  // Let's execute raw SQL if possible, or just a REST query
  const { data: rawFts, error: err } = await supabase.from('icd_codes').select('code, fts').textSearch('fts', 'fever', { config: 'simple' }).limit(5);
  console.log("Results from textSearch directly:", rawFts);
}

testTsQuery();
