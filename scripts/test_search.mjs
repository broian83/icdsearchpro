const key = process.env.VITE_SUPABASE_ANON_KEY;
const url = process.env.VITE_SUPABASE_URL;

async function test() {
  const h = {'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json'};
  
  console.log('Testing search_icd RPC...\n');

  const tests = ['pneumonia', 'diabetes', 'I10', 'stroke', 'fraktur'];
  
  for (const q of tests) {
    const r = await fetch(`${url}/rest/v1/rpc/search_icd`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({search_term: q, search_category: 'icd10', search_chapter: 'all'})
    });
    const data = await r.json();
    console.log(`"${q}": ${data.length} results`);
    if (data.length > 0) {
      data.slice(0, 2).forEach(d => console.log(`  ${d.code} - ${d.title} | score: ${d.score?.toFixed(4)}`));
    }
    console.log('');
  }
}

test().catch(console.error);
