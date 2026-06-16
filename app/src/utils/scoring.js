import { HIGH_FREQUENCY_ICD10, HIGH_FREQUENCY_ICD9, RARE_ICD10, RARE_ICD9 } from '../constants/icdConstants';

const levenshtein = (a, b) => {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0)
      );
  return dp[m][n];
};

export const calculateClinicalScore = (res, query, searchType) => {
  const item = res.item ? res.item : res;

  const code = item.code || '';
  const title = item.title || '';
  const desc = item.desc || '';

  // Supabase score: larger = better. Frontend: smaller = better (0 = perfect).
  const originalScore = res.score !== undefined
    ? (1 / (res.score + 0.01))
    : (res.rank !== undefined ? (1 - res.rank) : 0.5);
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

  // --- Scoring rules (ordered by strength) ---
  if (cleanQuery === cleanCode || cleanQuery === code.toLowerCase()) {
    // Exact code match
    score = score * 0.00001;
  } else if (code.toLowerCase().startsWith(cleanQuery)) {
    // Code prefix match (e.g., query "I10" matches "I10")
    score = score * 0.003;
  } else if (title.toLowerCase() === cleanQuery && desc.toLowerCase() === cleanQuery) {
    // Both title and desc exact match
    score = score * 0.00005;
  } else if (title.toLowerCase() === cleanQuery) {
    // Title exact match (ranks higher than desc)
    score = score * 0.00008;
  } else if (desc.toLowerCase() === cleanQuery) {
    // Desc exact match (slightly weaker than title)
    score = score * 0.00015;
  } else if (title.toLowerCase().includes(cleanQuery)) {
    // Title contains query
    const exactWordInTitle = queryWords.length > 0 && queryWords.every(word => new RegExp(`\\b${word}\\b`, 'i').test(title));
    if (exactWordInTitle) {
      score = score * 0.0008;
    } else {
      score = score * 0.01;
    }
  } else if (desc.toLowerCase().includes(cleanQuery)) {
    // Desc contains query (slightly weaker than title)
    const exactWordInDesc = queryWords.length > 0 && queryWords.every(word => new RegExp(`\\b${word}\\b`, 'i').test(desc));
    if (exactWordInDesc) {
      score = score * 0.002;
    } else {
      score = score * 0.03;
    }
  }

  // --- High-frequency code boost ---
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

  // --- Parent vs subcode preference ---
  const isParent = searchType === 'icd10' ? code.length === 3 : code.length <= 4 && !code.includes('.');
  const queryHasDetail = cleanQuery.includes('.') || cleanQuery.replace(/[^0-9]/g, '').length >= 3;

  if (isParent && !queryHasDetail) {
    score = score * 0.5; // Prefer parent categories for vague queries
  } else if (!isParent && !queryHasDetail) {
    score = score * 1.5; // Penalize subcodes for vague queries
  }

  // --- Chapter preference (ICD-10) ---
  if (searchType === 'icd10') {
    const firstChar = code.charAt(0).toUpperCase();
    if (firstChar >= 'A' && firstChar <= 'N') {
      score = score * 0.8; // Slight boost for clinical codes
    } else if (['V', 'W', 'X', 'Y', 'Z'].includes(firstChar)) {
      const isSupplementaryQuery = /^[ztvywx]/i.test(cleanQuery) ||
        ['kontrol', 'imunisasi', 'kecelakaan', 'tabrak', 'racun', 'jatuh', 'kontrasepsi', 'lahir', 'periksa', 'neonatus', 'bayi baru lahir', 'bbl', 'anc', 'skrining', 'vaksin', 'kunjungan', 'rujukan'].some(w => cleanQuery.includes(w));
      if (!isSupplementaryQuery) {
        score = score * 1.8; // Penalize supplementary codes for non-supplementary queries
      }
    }
  }

  // --- Missing word penalty (reduced from 20x to 5x) ---
  if (queryWords.length > 0 && matchCount < queryWords.length) {
    const missingRatio = (queryWords.length - matchCount) / queryWords.length;
    score = score * (1 + missingRatio * 5.0);
  }

  // --- Rare code boost ---
  if (searchType === 'icd10' && RARE_ICD10[code]) {
    score = score / RARE_ICD10[code];
  } else if (searchType === 'icd9' && RARE_ICD9[code]) {
    score = score / RARE_ICD9[code];
  }

  // --- Fuzzy code match (Levenshtein) for typos ---
  if (cleanQuery.length >= 3 && cleanCode.length >= 3) {
    const lev = levenshtein(cleanQuery, cleanCode);
    if (lev === 1) score *= 0.01;   // 1-char typo in code
    else if (lev === 2) score *= 0.1; // 2-char typo
  }

  // --- Indonesian-only match boost ---
  if (desc.toLowerCase().includes(cleanQuery) && !title.toLowerCase().includes(cleanQuery)) {
    score *= 0.85; // Indonesian-only match gets slight boost
  }

  return score;
};
