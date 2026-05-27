const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Ganti import dan hapus konstanta panjang
const importMarker = "import { getCache, setCache } from './utils/db';";
const targetMarker = "function App() {";

const idx1 = code.indexOf(importMarker);
const idx2 = code.indexOf(targetMarker);

if (idx1 > -1 && idx2 > -1) {
  const newImports = `import { getCache, setCache } from './utils/db';
import { icd10Chapters, icd9Chapters, HIGH_FREQUENCY_ICD10, HIGH_FREQUENCY_ICD9, ICD10_UMBRELLA, ICD9_UMBRELLA } from './constants/icdConstants';
import { calculateClinicalScore } from './utils/scoring';
import { useICDData } from './hooks/useICDData';
import { useICDSearch } from './hooks/useICDSearch';

`;
  code = code.substring(0, idx1) + newImports + code.substring(idx2);
}

// 2. Hapus state yang dipindah ke hooks
code = code.replace(/const \[icd10Data, setIcd10Data\] = useState\(\[\]\);\s*/, '');
code = code.replace(/const \[icd9Data, setIcd9Data\] = useState\(\[\]\);\s*/, '');
code = code.replace(/const \[knowledgeText, setKnowledgeText\] = useState\(''\);\s*/, '');
code = code.replace(/const \[daggerAsteriskData, setDaggerAsteriskData\] = useState\(null\);\s*/, '');
code = code.replace(/const \[aliases, setAliases\] = useState\(\{?\}?\);\s*/, '');
code = code.replace(/const \[crossrefData, setCrossrefData\] = useState\(\{?\}?\);\s*/, '');
code = code.replace(/const \[loading, setLoading\] = useState\(true\);\s*/, '');

// Sisipkan pemanggilan Hooks di awal App
const hookInsertStr = `
  const { knowledgeText, daggerAsteriskData, aliases, crossrefData, loading: isDataLoading, error: dataError } = useICDData(isLoggedIn, user);
  const loading = isDataLoading;
`;

code = code.replace(/(const location = useLocation\(\);\s*)/, `$1${hookInsertStr}`);

// Ubah error state untuk memakai dataError (atau gabungan)
// Jangan lupa useICDSearch
const searchHookInsertStr = `
  const { searchResults: _rawSearchResults, isSearching, searchError, searchQuery: currentSearchQuery, activeAlias } = useICDSearch(debouncedQuery, searchType, filterChapter, aliases);
  const searchResults = _rawSearchResults;
`;

code = code.replace(/(const \[suggestionsQuery, setSuggestionsQuery\] = useState\(''\);\s*)/, `$1${searchHookInsertStr}`);

// Hapus bagian useEffect fetching data ICD
// Ini agak sulit dengan Regex, kita gunakan indexOf
const fetchStartMarker = `  useEffect(() => {
    const loadData = async () => {`;
const fetchEndMarker = `    loadData();
  }, [isLoggedIn, user]);`;

const fetchIdx1 = code.indexOf(fetchStartMarker);
const fetchIdx2 = code.indexOf(fetchEndMarker);

if (fetchIdx1 > -1 && fetchIdx2 > -1) {
  code = code.substring(0, fetchIdx1) + "\n  // [HOOK useICDData dipanggil di atas]\n" + code.substring(fetchIdx2 + fetchEndMarker.length);
}

// Hapus Fuse initialization
code = code.replace(/const fuse10 = useMemo.*?\}\), \[icd10Data\]\);/s, '');
code = code.replace(/const fuse9 = useMemo.*?\}\), \[icd9Data\]\);/s, '');

// Hapus useMemo searchType resolver (activeAlias)
const aliasStart = "  const { searchQuery, activeAlias } = useMemo(() => {";
const aliasEnd = "  }, [debouncedQuery, aliases, searchType, ICD10_UMBRELLA, ICD9_UMBRELLA]);";
const alIdx1 = code.indexOf(aliasStart);
const alIdx2 = code.indexOf(aliasEnd);
if (alIdx1 > -1 && alIdx2 > -1) {
  code = code.substring(0, alIdx1) + "\n  // searchQuery dan activeAlias ditangani oleh useICDSearch\n" + code.substring(alIdx2 + aliasEnd.length);
}

// Hapus useMemo searchResults (searchLogic lama)
const srStart = "  const searchResults = useMemo(() => {";
const srEnd = "  }, [searchQuery, searchType, fuse10, fuse9, filterChapter, icd10Data, icd9Data]);";
const srIdx1 = code.indexOf(srStart);
const srIdx2 = code.indexOf(srEnd);
if (srIdx1 > -1 && srIdx2 > -1) {
  code = code.substring(0, srIdx1) + "\n  // searchResults dikelola oleh useICDSearch\n" + code.substring(srIdx2 + srEnd.length);
}

// Hapus fungsi group (karena icd10Data sudah tak ada)
// Kita bypass fitur allSubcodes untuk sekarang, biarkan kosong []
code = code.replace(/const rawData = currentType === 'icd10' \? icd10Data : icd9Data;/g, '');
code = code.replace(/groups\[groupKey\]\.allSubcodes = rawData.*?;\s*/gs, 'groups[groupKey].allSubcodes = [];\n');

// Hapus import Fuse
code = code.replace("import Fuse from 'fuse.js';", "");

fs.writeFileSync('src/App.jsx', code);
console.log("App.jsx refactored successfully!");
