import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testSearch() {
  console.log("Searching for 'fever' using updated RPC...");
  const { data, error } = await supabase.rpc('search_icd', {
    search_term: 'fever',
    search_category: 'icd10',
    search_chapter: 'all'
  });

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Top 15 results for 'fever':");
  data.slice(0, 15).forEach((d, i) => {
    console.log(`${i+1}. ${d.code} - ${d.title} (Score: ${d.score.toFixed(4)})`);
  });

  console.log("\nSearching specifically for 'fever' in chapter 'R'...");
  const { data: rData } = await supabase.rpc('search_icd', {
    search_term: 'fever',
    search_category: 'icd10',
    search_chapter: 'R'
  });
  
  if (rData) {
    console.log("Top 5 results in R chapter:");
    rData.slice(0, 5).forEach((d, i) => {
      console.log(`${i+1}. ${d.code} - ${d.title} (Score: ${d.score.toFixed(4)})`);
    });
  }
}

testSearch();
