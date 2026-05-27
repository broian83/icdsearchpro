import { HIGH_FREQUENCY_ICD10, HIGH_FREQUENCY_ICD9, RARE_ICD10, RARE_ICD9 } from '../constants/icdConstants';

export const calculateClinicalScore = (res, query, searchType) => {
  // Jika res.item tidak ada (karena data dari Supabase langsung), sesuaikan strukturnya
  const item = res.item ? res.item : res;
  
  const code = item.code || '';
  const title = item.title || '';
  const desc = item.desc || '';
  // Supabase mengembalikan 'score' di mana MAKIN BESAR MAKIN BAIK.
  // Tapi algoritma frontend (Fuse.js dulunya) berasumsi MAKIN KECIL MAKIN BAIK (0 = sempurna).
  // Maka kita harus membalik (invert) score dari Supabase.
  const originalScore = res.score !== undefined ? (1 / (res.score + 0.01)) : (res.rank !== undefined ? (1 - res.rank) : 0.5);
  let score = originalScore;

  const cleanQuery = query.trim().toLowerCase();
  const cleanCode = code.replace('.', '').toLowerCase();

  const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 2);
  const itemText = (code + ' ' + title + ' ' + desc).toLowerCase();
  let matchCount = 0;
  queryWords.forEach(word => {
    if (itemText.includes(word)) {
      matchCount++;
    }
  });

  const exactWordMatch = queryWords.length > 0 && matchCount === queryWords.length;

  if (cleanQuery === cleanCode || cleanQuery === code.toLowerCase()) {
    score = score * 0.00001;
  } else if (code.toLowerCase().startsWith(cleanQuery)) {
    score = score * 0.005;
  } else if (title.toLowerCase() === cleanQuery || desc.toLowerCase() === cleanQuery) {
    score = score * 0.0001;
  } else if (title.toLowerCase().includes(cleanQuery) || desc.toLowerCase().includes(cleanQuery)) {
    // Cek apakah itu exact word match (berdiri sendiri)
    const exactWordInTitle = queryWords.length > 0 && queryWords.every(word => new RegExp(`\\b${word}\\b`, 'i').test(title));
    if (exactWordInTitle) {
      score = score * 0.001;
    } else {
      score = score * 0.05;
    }
  }

  if (exactWordMatch || queryWords.length === 0) {
    if (searchType === 'icd10') {
      const mainCode = code.split('.')[0].toUpperCase();
      if (HIGH_FREQUENCY_ICD10[mainCode]) {
        score = score * HIGH_FREQUENCY_ICD10[mainCode];
      }
      const exactCode = code.toUpperCase();
      if (HIGH_FREQUENCY_ICD10[exactCode]) {
        score = score * HIGH_FREQUENCY_ICD10[exactCode];
      }
    } else {
      const exactCode = code;
      if (HIGH_FREQUENCY_ICD9[exactCode]) {
        score = score * HIGH_FREQUENCY_ICD9[exactCode];
      }
      const mainCode = code.split('.')[0];
      if (HIGH_FREQUENCY_ICD9[mainCode]) {
        score = score * HIGH_FREQUENCY_ICD9[mainCode];
      }
    }
  }

  const isParent = searchType === 'icd10' ? code.length === 3 : code.length <= 4 && !code.includes('.');
  const queryHasDetail = cleanQuery.includes('.') || cleanQuery.replace(/[^0-9]/g, '').length >= 3;
  
  if (isParent && !queryHasDetail) {
    score = score * 0.5;
  } else if (!isParent && !queryHasDetail) {
    score = score * 1.5;
  }

  if (searchType === 'icd10') {
    const firstChar = code.charAt(0).toUpperCase();
    if (firstChar >= 'A' && firstChar <= 'N') {
      score = score * 0.8;
    } else if (['V', 'W', 'X', 'Y', 'Z'].includes(firstChar)) {
      const isSupplementaryQuery = /^[ztvywx]/i.test(cleanQuery) || 
        ['kontrol', 'imunisasi', 'kecelakaan', 'tabrak', 'racun', 'jatuh', 'kontrasepsi', 'lahir', 'periksa', 'neonatus', 'bayi baru lahir', 'bbl', 'anc', 'skrining', 'vaksin', 'kunjungan', 'rujukan'].some(w => cleanQuery.includes(w));
      if (!isSupplementaryQuery) {
        score = score * 1.8;
      }
    }
  }

  if (queryWords.length > 0 && matchCount < queryWords.length) {
    const missingRatio = (queryWords.length - matchCount) / queryWords.length;
    score = score * (1 + missingRatio * 20.0);
  }

  // RARE CODE BOOST
  if (searchType === 'icd10' && RARE_ICD10[code]) {
    score = score / RARE_ICD10[code];
  } else if (searchType === 'icd9' && RARE_ICD9[code]) {
    score = score / RARE_ICD9[code];
  }

  return score;
};
