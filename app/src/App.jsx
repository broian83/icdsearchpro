import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import { Search, Loader2, Database, AlertCircle, X, Clock, Brain, Filter, BookOpen, Menu } from 'lucide-react';
import { ResultCard } from './components/ResultCard';
import { CaseConsultation } from './components/CaseConsultation';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { SettingsView } from './components/SettingsView';
import { HelpView } from './components/HelpView';
import { BookmarkView } from './components/BookmarkView';
import { HistoryView } from './components/HistoryView';
import { ProfileView } from './components/ProfileView';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { supabase } from './lib/supabase';
import { getCache, setCache } from './utils/db';

const icd10Chapters = [
  { id: 'all', label: 'Semua Kategori (ICD-10) [Alt+Shift+X]' },
  { id: 'A|B', label: 'A-B: Infeksi & Parasit [Alt+Shift+A]' },
  { id: 'C|D', label: 'C-D: Neoplasma / Darah [Alt+Shift+C]' },
  { id: 'E', label: 'E: Endokrin & Metabolik [Alt+Shift+E]' },
  { id: 'F', label: 'F: Gangguan Mental [Alt+Shift+F]' },
  { id: 'G', label: 'G: Saraf (Nervous) [Alt+Shift+G]' },
  { id: 'H', label: 'H: Mata & Telinga [Alt+Shift+H]' },
  { id: 'I', label: 'I: Sirkulasi (Kardio) [Alt+Shift+I]' },
  { id: 'J', label: 'J: Pernapasan [Alt+Shift+J]' },
  { id: 'K', label: 'K: Pencernaan [Alt+Shift+K]' },
  { id: 'L', label: 'L: Kulit & Jaringan [Alt+Shift+L]' },
  { id: 'M', label: 'M: Otot & Tulang [Alt+Shift+M]' },
  { id: 'N', label: 'N: Genitourinari [Alt+Shift+N]' },
  { id: 'O', label: 'O: Kehamilan & Melahirkan [Alt+Shift+O]' },
  { id: 'P', label: 'P: Perinatal [Alt+Shift+P]' },
  { id: 'Q', label: 'Q: Kelainan Bawaan [Alt+Shift+Q]' },
  { id: 'R', label: 'R: Gejala & Tanda [Alt+Shift+R]' },
  { id: 'S|T', label: 'S-T: Cedera & Keracunan [Alt+Shift+S]' },
  { id: 'V|W|X|Y', label: 'V-Y: Penyebab Eksternal (KLL) [Alt+Shift+V]' },
  { id: 'Z', label: 'Z: Faktor Status Kesehatan [Alt+Shift+Z]' }
];

const icd9Chapters = [
  { id: 'all', label: 'Semua Kategori (ICD-9) [Alt+Shift+X]' },
  { id: '00', label: '00: Prosedur Lainnya [Alt+Shift+O]' },
  { id: '0', label: '01-09: Saraf & Endokrin [Alt+Shift+0]' },
  { id: '1', label: '10-19: Mata & Telinga [Alt+Shift+1]' },
  { id: '2', label: '20-29: Hidung & Mulut [Alt+Shift+2]' },
  { id: '3', label: '30-39: Napas & Jantung [Alt+Shift+3]' },
  { id: '4', label: '40-49: Cerna (Atas) [Alt+Shift+4]' },
  { id: '5', label: '50-59: Cerna (Bawah) & Sal. Kemih [Alt+Shift+5]' },
  { id: '6', label: '60-69: Kelamin (Pria & Wanita) [Alt+Shift+6]' },
  { id: '7', label: '70-79: Kebidanan & Tulang [Alt+Shift+7]' },
  { id: '8', label: '80-89: Otot, Kulit, Diagnostik [Alt+Shift+8]' },
  { id: '9', label: '90-99: Terapi & Diagnostik Lain [Alt+Shift+9]' }
];

const HIGH_FREQUENCY_ICD10 = {
  // Tier 1 (0.001) - Top BPJS
  'J18.9': 0.001, 
  'I10': 0.001,
  'E11.9': 0.001, 
  'E11': 0.002,   
  'I64': 0.001,   
  'K35.8': 0.001, 
  'K35': 0.001,
  'O82': 0.001,   
  'N18.5': 0.001, 
  'A09': 0.001,
  'A09.9': 0.001,
  'A09.0': 0.001,
  'J06.9': 0.001, 
  
  // Tier 2 (0.01) - Common Specialty (K80.1 removed, K80.2 and K80.20 retained)
  'D64.9': 0.01, 
  'A90': 0.01,   
  'A91': 0.01,   
  'A01.0': 0.01, 
  'A01': 0.01,
  'B20': 0.01,   
  'I21.9': 0.01, 
  'I21': 0.01,
  'I50.0': 0.01, 
  'I50.9': 0.01, 
  'I50': 0.01,
  'J45.9': 0.01, 
  'J45': 0.01,
  'K80.20': 0.01, 
  'K80.2': 0.01,
  'K80': 0.01,
  'N18.9': 0.01, 
  'N18': 0.01,
  'O80': 0.01,   
  'O80.9': 0.01,
  'S72.0': 0.01, 
  'S72': 0.01,
  'Z38.0': 0.01, 
};

const HIGH_FREQUENCY_ICD9 = {
  // Tier 1 (0.001) - Top BPJS
  '39.95': 0.001,
  '74.1': 0.001,
  
  // Tier 2 (0.01) - Common Specialty
  '79.3': 0.01, 
  '78.6': 0.01, 
  '47.09': 0.01,
  '99.25': 0.01,
  '93.94': 0.01,
  '88.72': 0.01,
  '90.59': 0.01,
  '87.44': 0.01,
  '96.71': 0.01,
  '96.72': 0.01,
  '88.76': 0.01,
  '13.71': 0.01,
  '13.19': 0.01,
};

const OMIT_CODES_ICD9 = {
  '99.18': 'Omit jika merupakan bagian rutin dari terapi cairan intravena.',
  '99.29': 'Omit jika merupakan bagian dari injeksi obat terapeutik rutin.',
  '99.21': 'Omit jika merupakan bagian dari pemberian antibiotik rutin.',
  '57.94': 'Omit jika pemasangan kateter urin dilakukan secara rutin selama operasi atau persalinan.',
  '96.07': 'Omit jika pemasangan NGT merupakan bagian rutin dari prosedur pembedahan.',
  '86.59': 'Omit jika hanya penutupan luka post-operasi rutin. Kode jika tindakan utama di IGD.',
  '38.93': 'Omit jika kanulasi vena/kateterisasi vena dilakukan untuk jalur infus rutin.',
  '93.94': 'Omit jika pemberian terapi oksigen merupakan bagian dari prosedur anestesi atau pemulihan pasca operasi.',
  '89.52': 'Omit jika perekaman EKG merupakan bagian dari pemeriksaan pra-bedah rutin.'
};

const calculateClinicalScore = (res, query, searchType) => {
  const code = res.item.code || '';
  const title = res.item.title || '';
  const desc = res.item.desc || '';
  const originalScore = res.score !== undefined ? res.score : 0.5;
  let score = originalScore;

  const cleanQuery = query.trim().toLowerCase();
  const cleanCode = code.replace('.', '').toLowerCase();

  // Pre-calculate word matches
  const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 2);
  const itemText = (code + ' ' + title + ' ' + desc).toLowerCase();
  let matchCount = 0;
  queryWords.forEach(word => {
    if (itemText.includes(word)) {
      matchCount++;
    }
  });

  const exactWordMatch = queryWords.length > 0 && matchCount === queryWords.length;

  // 1. Exact Match / Prefix Match Bonus
  if (cleanQuery === cleanCode || cleanQuery === code.toLowerCase()) {
    score = score * 0.001;
  } else if (code.toLowerCase().startsWith(cleanQuery)) {
    score = score * 0.05;
  } else if (title.toLowerCase() === cleanQuery || desc.toLowerCase() === cleanQuery) {
    score = score * 0.1;
  } else if (title.toLowerCase().includes(cleanQuery) || desc.toLowerCase().includes(cleanQuery)) {
    score = score * 0.5;
  }

  // 2. Clinical Frequency Weighting (Only if all keywords are present)
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

  // 3. Parent-before-child rule
  const isParent = searchType === 'icd10' ? code.length === 3 : code.length <= 4 && !code.includes('.');
  const queryHasDetail = cleanQuery.includes('.') || cleanQuery.replace(/[^0-9]/g, '').length >= 3;
  
  if (isParent && !queryHasDetail) {
    score = score * 0.5;
  } else if (!isParent && !queryHasDetail) {
    score = score * 1.5;
  }

  // 4. Chapter boost
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

  // 5. Query words matching penalty (Fuzzy match false-positive mitigation)
  if (queryWords.length > 0 && matchCount < queryWords.length) {
    const missingRatio = (queryWords.length - matchCount) / queryWords.length;
    score = score * (1 + missingRatio * 20.0);
  }

  return score;
};

function App() {
  const { isLoggedIn, user } = useAuth();
  const { showToast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState({ isOpen: false, message: '' });

  const [icd10Data, setIcd10Data] = useState([]);
  const [icd9Data, setIcd9Data] = useState([]);
  const [knowledgeText, setKnowledgeText] = useState('');
  const [daggerAsteriskData, setDaggerAsteriskData] = useState(null);
  const [aliases, setAliases] = useState({});
  const [crossrefData, setCrossrefData] = useState({});
  const [dismissedCrossrefs, setDismissedCrossrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('icd_dismissed_crossrefs')) || {};
    } catch {
      return {};
    }
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const searchType = location.pathname === '/' ? 'icd10' : location.pathname.substring(1).replace(/\/$/, '');
  
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterChapter, setFilterChapter] = useState('all');
  const [error, setError] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsQuery, setSuggestionsQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard Shortcuts untuk Filter Kategori
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Abaikan jika sedang mengetik di input/textarea
      if (
        document.activeElement && (
          document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA' ||
          document.activeElement.isContentEditable
        )
      ) {
        return;
      }

      // Kombinasi Alt + Shift
      if (e.altKey && e.shiftKey) {
        const key = e.key.toUpperCase();
        
        if (searchType === 'icd10') {
          const mapping = {
            'A': { id: 'A|B', label: 'A-B: Infeksi & Parasit' },
            'C': { id: 'C|D', label: 'C-D: Neoplasma / Darah' },
            'E': { id: 'E', label: 'E: Endokrin & Metabolik' },
            'F': { id: 'F', label: 'F: Gangguan Mental' },
            'G': { id: 'G', label: 'G: Saraf (Nervous)' },
            'H': { id: 'H', label: 'H: Mata & Telinga' },
            'I': { id: 'I', label: 'I: Sirkulasi (Kardio)' },
            'J': { id: 'J', label: 'J: Pernapasan' },
            'K': { id: 'K', label: 'K: Pencernaan' },
            'L': { id: 'L', label: 'L: Kulit & Jaringan' },
            'M': { id: 'M', label: 'M: Otot & Tulang' },
            'N': { id: 'N', label: 'N: Genitourinari' },
            'O': { id: 'O', label: 'O: Kehamilan & Melahirkan' },
            'P': { id: 'P', label: 'P: Perinatal' },
            'Q': { id: 'Q', label: 'Q: Kelainan Bawaan' },
            'R': { id: 'R', label: 'R: Gejala & Tanda' },
            'S': { id: 'S|T', label: 'S-T: Cedera & Keracunan' },
            'V': { id: 'V|W|X|Y', label: 'V-Y: Penyebab Eksternal (KLL)' },
            'Z': { id: 'Z', label: 'Z: Faktor Status Kesehatan' },
            'X': { id: 'all', label: 'Semua Kategori (ICD-10)' }
          };

          if (mapping[key]) {
            e.preventDefault();
            setFilterChapter(mapping[key].id);
            showToast(`Filter aktif: ${mapping[key].label}`, 'info', 2000);
          }
        } else if (searchType === 'icd9') {
          const mapping = {
            'O': { id: '00', label: '00: Prosedur Lainnya' },
            '0': { id: '0', label: '01-09: Saraf & Endokrin' },
            '1': { id: '1', label: '10-19: Mata & Telinga' },
            '2': { id: '2', label: '20-29: Hidung & Mulut' },
            '3': { id: '3', label: '30-39: Napas & Jantung' },
            '4': { id: '4', label: '40-49: Cerna (Atas)' },
            '5': { id: '5', label: '50-59: Cerna (Bawah) & Sal. Kemih' },
            '6': { id: '6', label: '60-69: Kelamin (Pria & Wanita)' },
            '7': { id: '7', label: '70-79: Kebidanan & Tulang' },
            '8': { id: '8', label: '80-89: Otot, Kulit, Diagnostik' },
            '9': { id: '9', label: '90-99: Terapi & Diagnostik Lain' },
            'X': { id: 'all', label: 'Semua Kategori (ICD-9)' }
          };

          if (mapping[key]) {
            e.preventDefault();
            setFilterChapter(mapping[key].id);
            showToast(`Filter aktif: ${mapping[key].label}`, 'info', 2000);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchType, showToast]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabClick = (tab) => {
    if (['case', 'bookmark', 'history', 'locked_bookmark', 'locked_history'].includes(tab) && !isLoggedIn) {
      let msg = "Gunakan asisten Klinik AI untuk pengkodean otomatis yang lebih akurat. Silakan masuk atau buat akun gratis terlebih dahulu.";
      if (tab.includes('bookmark')) msg = "Login untuk menyimpan bookmark dan mengakses kode ICD favorit Anda dari mana saja.";
      if (tab.includes('history')) msg = "Login untuk melihat histori pencarian dan konsultasi klinis Anda yang tersimpan di cloud.";
      
      setAuthModalConfig({ isOpen: true, message: msg });
      return;
    }
    
    if (tab === 'locked_bookmark') tab = 'bookmark';
    if (tab === 'locked_history') tab = 'history';
    
    if (tab === 'icd10') {
      navigate('/');
    } else {
      navigate('/' + tab);
    }
  };

  // Reset filter on tab change
  useEffect(() => {
    setFilterChapter('all');
  }, [searchType]);
  
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('icd_recent_searches')) || [];
    } catch {
      return [];
    }
  });

  // Debounce search query to prevent typing lag
  useEffect(() => {
    if (!query) {
      setDebouncedQuery('');
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Debounce suggestions query (150ms) to prevent typing lag
  useEffect(() => {
    if (!query) {
      setSuggestionsQuery('');
      return;
    }

    const timer = setTimeout(() => {
      setSuggestionsQuery(query);
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Save to recent searches when debounced query changes
  useEffect(() => {
    const saveToSupabase = async (queryText) => {
      if (isLoggedIn && user) {
        try {
          await supabase.from('search_history').insert({
            user_id: user.id,
            query: queryText,
            search_type: searchType
          });
        } catch (err) {
          // ignore
        }
      }
    };

    if (debouncedQuery.trim().length >= 3) {
      setRecentSearches(prev => {
        const lowerQuery = debouncedQuery.trim().toLowerCase();
        const filtered = prev.filter(q => q.toLowerCase() !== lowerQuery);
        const newRecent = [debouncedQuery.trim(), ...filtered].slice(0, 6);
        localStorage.setItem('icd_recent_searches', JSON.stringify(newRecent));
        return newRecent;
      });
      saveToSupabase(debouncedQuery.trim());
    }
  }, [debouncedQuery, isLoggedIn, user, searchType]);

  const fetchDynamicAliases = async () => {
    let combined = {};
    
    // 1. Ambil dari LocalStorage (offline/local fallback)
    try {
      const localCustom = JSON.parse(localStorage.getItem('icd_custom_abbreviations')) || {};
      Object.assign(combined, localCustom);
    } catch (e) {
      console.warn("Failed to parse custom local abbreviations:", e);
    }
    
    // 2. Ambil dari Supabase (publik + milik user)
    try {
      const { data, error } = await supabase
        .from('custom_abbreviations')
        .select('keyword, expansion');
        
      if (!error && data) {
        data.forEach(item => {
          combined[item.keyword.toUpperCase()] = item.expansion;
        });
      }
    } catch (err) {
      console.log("Supabase custom abbreviations table fetch failed (might not exist yet):", err);
    }
    
    return combined;
  };

  const reloadAliases = async () => {
    try {
      const resAliases = await fetch('/singkatan.json').then(res => res.json()).catch(() => ({}));
      const dynamic = await fetchDynamicAliases();
      setAliases({ ...resAliases, ...dynamic });
    } catch (e) {
      console.warn("Failed to reload aliases:", e);
    }
  };

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      let hasCache = false;
      let cached10 = null;
      let cached9 = null;
      
      try {
        // 1. Coba memuat dari cache IndexedDB terlebih dahulu
        cached10 = await getCache('icd10');
        cached9 = await getCache('icd9');
        const cachedDA = await getCache('daggerAsterisk');
        const cachedAliases = await getCache('aliases');
        const cachedKnowledge = await getCache('knowledge');

        if (cached10 && cached9) {
          setIcd10Data(cached10);
          setIcd9Data(cached9);
          if (cachedKnowledge) setKnowledgeText(cachedKnowledge);
          if (cachedDA) setDaggerAsteriskData(cachedDA);
          if (cachedAliases) setAliases(cachedAliases);
          setLoading(false); // Selesai memuat instan dari cache lokal
          hasCache = true;
        }
      } catch (cacheErr) {
        console.warn("IndexedDB cache read failed, falling back to network:", cacheErr);
      }

      try {
        // Jika belum ada cache, tampilkan loading spinner
        if (!hasCache) {
          setLoading(true);
        }

        // 2. Fetch data terbaru dari server secara senyap
        const [res10, res9, resKnowledge, resDA, resAliases, resCrossref] = await Promise.all([
          fetch('/icd10.json').then(res => res.json()),
          fetch('/icd9.json').then(res => res.json()),
          fetch('/knowledge.md').then(res => res.text()),
          fetch('/kodedeggerdanasterik.json').then(res => res.json()).catch(() => null),
          fetch('/singkatan.json').then(res => res.json()).catch(() => ({})),
          fetch('/crossref.json').then(res => res.json()).catch(() => ({}))
        ]);

        setCrossrefData(resCrossref || {});

        // Cek apakah ada perubahan data dibanding cache
        const isDataChanged = !hasCache || 
          JSON.stringify(res10) !== JSON.stringify(cached10) || 
          JSON.stringify(res9) !== JSON.stringify(cached9);

        // Ambil singkatan kustom dinamis
        const dynamicAliases = await fetchDynamicAliases();
        const finalAliases = { ...resAliases, ...dynamicAliases };

        if (isDataChanged || JSON.stringify(finalAliases) !== JSON.stringify(aliases)) {
          setIcd10Data(res10);
          setIcd9Data(res9);
          setKnowledgeText(resKnowledge);
          setDaggerAsteriskData(resDA);
          setAliases(finalAliases);

          // Simpan data terbaru ke dalam cache IndexedDB secara asinkron
          setCache('icd10', res10);
          setCache('icd9', res9);
          setCache('knowledge', resKnowledge);
          if (resDA) setCache('daggerAsterisk', resDA);
          setCache('aliases', finalAliases);
        }

        setError(null);
      } catch (err) {
        console.error("Error loading data from network:", err);
        if (!hasCache) {
          setError('Gagal memuat data. Silakan hubungkan perangkat Anda ke internet untuk pemuatan pertama.');
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isLoggedIn, user]);

  // Initialize Fuse instances
  const fuse10 = useMemo(() => new Fuse(icd10Data, {
    keys: ['code', 'title', 'desc'],
    includeMatches: true,
    includeScore: true,
    threshold: 0.3,
    ignoreLocation: true,
    useExtendedSearch: true
  }), [icd10Data]);

  const fuse9 = useMemo(() => new Fuse(icd9Data, {
    keys: ['code', 'title', 'desc'],
    includeMatches: true,
    includeScore: true,
    threshold: 0.3,
    ignoreLocation: true,
    useExtendedSearch: true
  }), [icd9Data]);

  const ICD10_UMBRELLA = useMemo(() => ({
    'DM': { target: 'Diabetes mellitus', label: 'E10-E14 (Diabetes Mellitus)' },
    'DM TIPE 2': { target: 'E11', label: 'E11 (DM Tipe 2)' },
    'DM TIPE 1': { target: 'E10', label: 'E10 (DM Tipe 1)' },
    'STROKE NON HEMORAGIK': { target: 'I63', label: 'I63 (Stroke Non Hemoragik / SNH)' },
    'SNH': { target: 'I63', label: 'I63 (Stroke Non Hemoragik / SNH)' },
    'GEA': { target: 'Gastroenteritis', label: 'A09 / K52 (Gastroenteritis Akut)' },
    'DBD': { target: 'Dengue haemorrhagic fever', label: 'A90-A91 (Demam Berdarah Dengue)' },
    'DHF': { target: 'Dengue haemorrhagic fever', label: 'A90-A91 (Dengue Haemorrhagic Fever)' },
    'ISK': { target: 'Urinary tract infection', label: 'N39.0 (Infeksi Saluran Kemih)' },
    'UTI': { target: 'Urinary tract infection', label: 'N39.0 (Urinary Tract Infection)' },
    'TB': { target: 'Tuberculosis', label: 'A15-A16 (TBC / Tuberculosis)' },
    'TBC': { target: 'Tuberculosis', label: 'A15-A16 (TBC / Tuberculosis)' },
    'PJK': { target: 'Coronary heart disease', label: 'I20-I25 (Penyakit Jantung Koroner)' },
    'PPOK': { target: 'Chronic obstructive pulmonary disease', label: 'J44 (Penyakit Paru Obstruktif Kronis)' },
    'COPD': { target: 'Chronic obstructive pulmonary disease', label: 'J44 (Chronic Obstructive Pulmonary Disease)' },
    'SC': { target: 'O82', label: 'O82 (Persalinan Sectio Caesarea)' },
  }), []);

  const ICD9_UMBRELLA = useMemo(() => ({
    'SC': { target: '74.1', label: '74.1 (Sectio Caesarea / Cesarean Section)' },
    'HD': { target: '39.95', label: '39.95 (Hemodialisis / Hemodialysis)' },
    'ORIF': { target: '79.3', label: '79.3 (Open Reduction Internal Fixation)' },
    'AFF': { target: '78.6', label: '78.6 (Pelepasan Alat Implan / Removal of Fixation)' },
    'LAP EKS': { target: '54.11', label: '54.11 (Laparotomi Eksplorasi)' },
    'AP': { target: '47.09', label: '47.09 (Apendektomi / Appendectomy)' },
    'VK': { target: '73.21', label: '73.21 (Versi Kompromi)' },
    'EKC': { target: '72.29', label: '72.29 (Ekstraksi Kepala Cunam / Forceps)' },
    'EVD': { target: '72.71', label: '72.71 (Ekstraksi Vakum / Vacuum Extraction)' },
    'HECTING': { target: '86.59', label: '86.59 (Penjahitan Luka)' },
    'INSISI': { target: '86.04', label: '86.04 (Insisi Abses)' },
    'BIOPSI': { target: '86.11', label: '86.11 (Biopsi Kulit/Umum)' },
    'CATH': { target: '57.94', label: '57.94 (Kateterisasi Urin)' },
    'NGT': { target: '96.07', label: '96.07 (Pemasangan NGT)' },
    'WSD': { target: '34.04', label: '34.04 (Water Seal Drainage)' },
    'TRACH': { target: '31.1', label: '31.1 (Trakeostomi)' },
    'PTCA': { target: '36.01', label: '36.01 (Balloon Catheter / Angioplasty)' }
  }), []);

  const suggestions = useMemo(() => {
    // Query pre-processing: Replace '+' with space, normalize multiple spaces
    let trimmed = suggestionsQuery.replace(/\+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!trimmed || trimmed.length < 2) return [];

    const cleanQueryForAlias = trimmed.toUpperCase();
    const UMBRELLA = searchType === 'icd10' ? ICD10_UMBRELLA : ICD9_UMBRELLA;

    const expandedQuery = UMBRELLA[cleanQueryForAlias] ? UMBRELLA[cleanQueryForAlias].target : (aliases[cleanQueryForAlias] || trimmed);
    const isUmbrellaQuery = !!UMBRELLA[cleanQueryForAlias];

    const fuse = searchType === 'icd10' ? fuse10 : fuse9;
    
    const isCodeQuery = searchType === 'icd10' 
      ? /^[A-Z]$|^[A-Z][0-9]/i.test(expandedQuery.trim()) && expandedQuery.trim().length >= 2
      : /^[0-9]/i.test(expandedQuery.trim()) && expandedQuery.trim().length >= 2;

    let results = [];
    if (isCodeQuery && !isUmbrellaQuery) {
      const cleanCodeQuery = expandedQuery.trim().replace('.', '').toUpperCase();
      const rawData = searchType === 'icd10' ? icd10Data : icd9Data;
      
      const matchedItems = rawData.filter(item => {
        const cleanItemCode = item.code.replace('.', '').toUpperCase();
        return cleanItemCode.startsWith(cleanCodeQuery);
      });

      results = matchedItems.map(item => ({
        item,
        score: item.code.replace('.', '').toUpperCase() === cleanCodeQuery ? 0.001 : 0.05,
        matches: []
      }));
    } else {
      results = fuse.search(expandedQuery, { limit: 40 });
    }

    const scoredResults = results.map(res => {
      const clinicalScore = calculateClinicalScore(res, expandedQuery, searchType);
      return { ...res, clinicalScore };
    });

    scoredResults.sort((a, b) => a.clinicalScore - b.clinicalScore);

    const uniqueTerms = [];
    for (const res of scoredResults) {
      let suggestionText = res.item.title;
      if (res.item.code) {
        suggestionText = `${res.item.title} (${res.item.code})`;
      }
      
      if (suggestionText && !uniqueTerms.includes(suggestionText)) {
        uniqueTerms.push(suggestionText);
        if (uniqueTerms.length >= 6) break;
      }
    }
    return uniqueTerms;
  }, [suggestionsQuery, searchType, fuse10, fuse9, aliases, icd10Data, icd9Data, ICD10_UMBRELLA, ICD9_UMBRELLA]);

  const handleSelectSuggestion = (suggestion) => {
    const codeMatch = suggestion.match(/\(([^)]+)\)$/);
    if (codeMatch && codeMatch[1]) {
      const code = codeMatch[1];
      setQuery(code);
      setDebouncedQuery(code);
    } else {
      setQuery(suggestion);
      setDebouncedQuery(suggestion);
    }
    setShowSuggestions(false);
  };

  const reportIncorrectOrder = async (code) => {
    showToast(`Terima kasih! Laporan urutan kode ${code} untuk kueri "${query}" berhasil dikirim.`, 'success', 4000);
    if (isLoggedIn && user) {
      try {
        await supabase.from('ranking_feedback').insert({
          user_id: user.id,
          code,
          query: query,
          search_type: searchType
        });
      } catch (err) {
        console.warn("Supabase ranking feedback save failed:", err);
      }
    }
  };

  // Handle Smart Alias
  const { searchQuery, activeAlias, isUmbrella } = useMemo(() => {
    if (!debouncedQuery) return { searchQuery: '', activeAlias: null, isUmbrella: false };
    // Pre-process: replace '+' with space, normalize multiple spaces
    const cleanQuery = debouncedQuery.replace(/\+/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
    const UMBRELLA = searchType === 'icd10' ? ICD10_UMBRELLA : ICD9_UMBRELLA;

    if (UMBRELLA[cleanQuery]) {
      return { 
        searchQuery: UMBRELLA[cleanQuery].target, 
        activeAlias: { key: cleanQuery, value: UMBRELLA[cleanQuery].label }, 
        isUmbrella: true 
      };
    }

    if (aliases[cleanQuery]) {
      return { 
        searchQuery: aliases[cleanQuery], 
        activeAlias: { key: cleanQuery, value: aliases[cleanQuery] }, 
        isUmbrella: false 
      };
    }
    return { searchQuery: debouncedQuery.replace(/\+/g, ' ').replace(/\s+/g, ' ').trim(), activeAlias: null, isUmbrella: false };
  }, [debouncedQuery, aliases, searchType, ICD10_UMBRELLA, ICD9_UMBRELLA]);

  // Handle Search
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    
    const isCodeQuery = searchType === 'icd10' 
      ? /^[A-Z]$|^[A-Z][0-9]/i.test(searchQuery.trim()) 
      : /^[0-9]/i.test(searchQuery.trim());

    let results = [];
    if (isCodeQuery && !isUmbrella) {
      const cleanCodeQuery = searchQuery.trim().replace('.', '').toUpperCase();
      const rawData = searchType === 'icd10' ? icd10Data : icd9Data;
      const matchedItems = rawData.filter(item => {
        const cleanItemCode = item.code.replace('.', '').toUpperCase();
        return cleanItemCode.startsWith(cleanCodeQuery);
      });
      results = matchedItems.map(item => ({
        item,
        score: item.code.replace('.', '').toUpperCase() === cleanCodeQuery ? 0.001 : 0.05,
        matches: []
      }));
    } else {
      const fuse = searchType === 'icd10' ? fuse10 : fuse9;
      results = fuse.search(searchQuery, { limit: 120 });
    }

    if (filterChapter !== 'all') {
      const prefixes = filterChapter.split('|');
      results = results.filter(res => {
        const char0 = searchType === 'icd10' ? res.item.code.charAt(0).toUpperCase() : res.item.code.charAt(0);
        if (searchType === 'icd9') {
           if (filterChapter === '00') return res.item.code.startsWith('00');
           if (filterChapter === '0') return res.item.code.startsWith('0') && !res.item.code.startsWith('00');
        }
        return prefixes.includes(char0);
      });
    }

    const scoredResults = results.map(res => {
      const clinicalScore = calculateClinicalScore(res, searchQuery, searchType);
      return { ...res, clinicalScore };
    });

    scoredResults.sort((a, b) => a.clinicalScore - b.clinicalScore);

    return scoredResults.slice(0, 60);
  }, [searchQuery, searchType, fuse10, fuse9, filterChapter, icd10Data, icd9Data]);

  // Group Category helper
  const getCategoryCode = (code, type) => {
    if (!code) return '';
    if (type === 'icd10') {
      return code.includes('.') ? code.split('.')[0] : code.substring(0, 3);
    } else {
      return code.includes('.') ? code.split('.')[0] : code;
    }
  };

  const { primaryResults, supplementaryResults } = useMemo(() => {
    if (searchType !== 'icd10') {
      return { primaryResults: searchResults, supplementaryResults: [] };
    }
    const primary = [];
    const supplementary = [];

    const cleanQuery = searchQuery.trim().toLowerCase();
    const isSpecificSupplQuery = 
      /^[ztvywx]/i.test(cleanQuery) || 
      ['kontrol', 'imunisasi', 'kecelakaan', 'tabrak', 'racun', 'jatuh', 'kontrasepsi', 'lahir', 'periksa', 'neonatus', 'bayi baru lahir', 'bbl', 'anc', 'skrining', 'vaksin', 'kunjungan', 'rujukan'].some(w => cleanQuery.includes(w));

    searchResults.forEach(res => {
      const firstChar = res.item.code.charAt(0).toUpperCase();
      
      let isSupplChapter = false;
      if (['V', 'W', 'X', 'Y', 'Z'].includes(firstChar)) {
        isSupplChapter = true;
      } else if (firstChar === 'T') {
        const numPart = parseInt(res.item.code.substring(1), 10);
        if (!isNaN(numPart)) {
          if (numPart >= 90 && numPart <= 98) {
            isSupplChapter = true;
          }
        }
      }
      
      if (isSupplChapter && !isSpecificSupplQuery) {
        supplementary.push(res);
      } else {
        primary.push(res);
      }
    });

    return { primaryResults: primary, supplementaryResults: supplementary };
  }, [searchResults, searchType, searchQuery]);

  // Group Category Memos
  const primaryGroups = useMemo(() => {
    const rawData = searchType === 'icd10' ? icd10Data : icd9Data;
    const groups = {};

    primaryResults.forEach(res => {
      const code = res.item.code;
      const catCode = getCategoryCode(code, searchType);
      
      if (!groups[catCode]) {
        const catItem = rawData.find(item => item.code === catCode);
        groups[catCode] = {
          categoryCode: catCode,
          categoryItem: catItem || { code: catCode, title: 'Kategori ' + catCode, desc: '' },
          matchedCodes: [],
          matchedMatches: {},
          bestScore: res.clinicalScore,
          allSubcodes: []
        };
      }
      groups[catCode].matchedCodes.push(code);
      groups[catCode].matchedMatches[code] = res.matches || [];
      if (res.clinicalScore < groups[catCode].bestScore) {
        groups[catCode].bestScore = res.clinicalScore;
      }
    });

    Object.keys(groups).forEach(catCode => {
      groups[catCode].allSubcodes = rawData.filter(item => 
        item.code === catCode || item.code.startsWith(catCode + '.')
      );
    });

    return Object.values(groups).sort((a, b) => a.bestScore - b.bestScore);
  }, [primaryResults, searchType, icd10Data, icd9Data]);

  const supplementaryGroups = useMemo(() => {
    const rawData = searchType === 'icd10' ? icd10Data : icd9Data;
    const groups = {};

    supplementaryResults.forEach(res => {
      const code = res.item.code;
      const catCode = getCategoryCode(code, searchType);
      
      if (!groups[catCode]) {
        const catItem = rawData.find(item => item.code === catCode);
        groups[catCode] = {
          categoryCode: catCode,
          categoryItem: catItem || { code: catCode, title: 'Kategori ' + catCode, desc: '' },
          matchedCodes: [],
          matchedMatches: {},
          bestScore: res.clinicalScore,
          allSubcodes: []
        };
      }
      groups[catCode].matchedCodes.push(code);
      groups[catCode].matchedMatches[code] = res.matches || [];
      if (res.clinicalScore < groups[catCode].bestScore) {
        groups[catCode].bestScore = res.clinicalScore;
      }
    });

    Object.keys(groups).forEach(catCode => {
      groups[catCode].allSubcodes = rawData.filter(item => 
        item.code === catCode || item.code.startsWith(catCode + '.')
      );
    });

    return Object.values(groups).sort((a, b) => a.bestScore - b.bestScore);
  }, [supplementaryResults, searchType, icd10Data, icd9Data]);

  // See also banner calculation
  const matchedCrossref = useMemo(() => {
    if (!query) return null;
    const clean = query.trim().toLowerCase();
    const matchedKey = Object.keys(crossrefData).find(key => 
      clean.includes(key.toLowerCase()) || key.toLowerCase().includes(clean)
    );
    if (matchedKey && !dismissedCrossrefs[matchedKey]) {
      return { key: matchedKey, ...crossrefData[matchedKey] };
    }
    return null;
  }, [query, crossrefData, dismissedCrossrefs]);

  const handleDismissCrossref = (key) => {
    const updated = { ...dismissedCrossrefs, [key]: true };
    setDismissedCrossrefs(updated);
    localStorage.setItem('icd_dismissed_crossrefs', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 font-sans selection:bg-[#00B4A4] selection:text-white">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onSelectTab={handleTabClick} />
      <AuthModal 
        isOpen={authModalConfig.isOpen} 
        onClose={() => setAuthModalConfig({ ...authModalConfig, isOpen: false })} 
        message={authModalConfig.message} 
      />
      {/* Header */}
      <header className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-[#00B4A4] hover:bg-slate-100 dark:bg-slate-700 rounded-xl transition-all active:scale-95 focus:outline-none flex items-center justify-center"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div 
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
              onClick={() => navigate('/')}
              title="Kembali ke Beranda"
            >
              <img 
                src="/PMIK-id%20Logo.png" 
                alt="PMIK Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain shrink-0 group-hover:opacity-90 transition-opacity" 
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-[#00B4A4] transition-colors">ICD Search Pro</h1>
                <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  <span className="text-[#00B4A4] font-bold">by PMIK-id</span> <span className="px-1.5 opacity-40">•</span> Smart Clinical Coding Assistant
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:flex bg-slate-100/80 dark:bg-slate-700/80 p-1.5 rounded-xl w-full sm:w-auto gap-1 backdrop-blur-sm">
            <button 
              onClick={() => handleTabClick('icd10')}
              className={`px-2 sm:px-4 py-2 sm:py-2 text-sm font-semibold rounded-lg transition-all active:scale-95 text-center ${searchType === 'icd10' ? 'bg-white dark:bg-slate-800 shadow-sm text-[#00B4A4]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:bg-slate-700/50'}`}
            >
              ICD-10
            </button>
            <button 
              onClick={() => handleTabClick('icd9')}
              className={`px-2 sm:px-4 py-2 sm:py-2 text-sm font-semibold rounded-lg transition-all active:scale-95 text-center ${searchType === 'icd9' ? 'bg-white dark:bg-slate-800 shadow-sm text-[#00B4A4]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:bg-slate-700/50'}`}
            >
              ICD-9
            </button>
            <button 
              onClick={() => handleTabClick('case')}
              className={`px-2 sm:px-4 py-2 sm:py-2 text-sm font-semibold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 ${searchType === 'case' ? 'bg-white dark:bg-slate-800 shadow-sm text-[#00B4A4]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:bg-slate-700/50'}`}
            >
              <Brain className="w-4 h-4 shrink-0" /> <span className="hidden sm:inline">Klinik AI</span><span className="sm:hidden">AI</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
        
        <Routes>
          <Route path="/settings" element={<SettingsView onAliasesUpdated={reloadAliases} />} />
          <Route path="/profile" element={<ProfileView />} />
          <Route path="/help" element={<HelpView />} />
          <Route path="/bookmark" element={<BookmarkView />} />
          <Route path="/history" element={
            <HistoryView onSearchHistory={(q, type) => {
              navigate(type === 'icd10' ? '/' : '/' + type);
              setQuery(q);
            }} />
          } />
          <Route path="/case" element={<CaseConsultation knowledgeText={knowledgeText} />} />
          
          <Route path="/" element={
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Search Bar & Filter */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <div className="relative group flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#00B4A4]">
                    <Search className="w-6 h-6" />
                  </div>
                  <input
                    type="text"
                    className="block w-full h-14 sm:h-16 pl-12 pr-12 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200 dark:border-slate-700 outline-none rounded-2xl shadow-sm text-base sm:text-lg transition-all focus:border-[#00B4A4] focus:ring-4 focus:ring-[#00B4A4]/20 hover:border-slate-300 dark:border-slate-600 hover:shadow-md placeholder:text-slate-400 dark:text-slate-500"
                    placeholder={`Cari kode, deskripsi, atau diagnosa...`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                      setIsFocused(true);
                      setShowSuggestions(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setIsFocused(false);
                        setShowSuggestions(false);
                      }, 200);
                    }}
                    disabled={loading}
                  />
                  {query && !loading && (
                    <button
                      onClick={() => {
                        setQuery('');
                        setDebouncedQuery('');
                      }}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 transition-colors focus:outline-none"
                      title="Hapus pencarian"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  {loading && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#00B4A4]">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}
                  {activeAlias && (
                    <div className="absolute -bottom-7 left-4 text-xs text-[#00B4A4] flex items-center gap-1 font-bold bg-[#00B4A4]/10 px-2 py-1 rounded-md shadow-sm border border-[#00B4A4]/20 animate-in fade-in slide-in-from-top-1">
                      <Brain className="w-3 h-3" />
                      Smart Alias: {activeAlias.key} → {activeAlias.value}
                    </div>
                  )}
                  {showSuggestions && query.trim().length >= 2 && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/50 transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                          }}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="w-full px-5 py-3.5 text-left hover:bg-[#00B4A4]/5 dark:hover:bg-[#00B4A4]/10 transition-colors flex items-center gap-3 text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate">{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter Dropdown */}
                <div className="w-full sm:w-64 shrink-0 relative h-14 sm:h-16">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Filter className="w-5 h-5" />
                  </div>
                  <select 
                    value={filterChapter}
                    onChange={(e) => setFilterChapter(e.target.value)}
                    className="block w-full h-full appearance-none pl-11 pr-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none rounded-2xl shadow-sm text-sm text-slate-700 dark:text-slate-200 transition-all focus:border-[#00B4A4] focus:ring-4 focus:ring-[#00B4A4]/20 hover:border-slate-300 dark:border-slate-600 truncate font-medium cursor-pointer"
                  >
                    {(searchType === 'icd10' ? icd10Chapters : icd9Chapters).map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Rujukan Silang Banner */}
              {matchedCrossref && (
                <div className="mb-6 bg-[#00B4A4]/5 dark:bg-slate-800/80 border border-[#00B4A4]/20 dark:border-slate-700/80 p-4 rounded-2xl shadow-sm flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-300 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00B4A4]" />
                  <div className="flex items-start gap-3 pl-1.5">
                    <div className="bg-[#00B4A4]/10 text-[#00B4A4] p-1.5 rounded-xl mt-0.5">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        Rujukan Silang Medis (Cross-Reference)
                      </h4>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {matchedCrossref.see ? 'Lihat (See):' : 'Lihat juga (See also):'}
                        </span>
                        {matchedCrossref.see && (
                          <button
                            onClick={() => {
                              setQuery(matchedCrossref.see);
                              setDebouncedQuery(matchedCrossref.see);
                            }}
                            className="px-2 py-0.5 bg-[#00B4A4]/10 hover:bg-[#00B4A4]/20 border border-[#00B4A4]/20 text-[#00B4A4] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            {matchedCrossref.see}
                          </button>
                        )}
                        {matchedCrossref.see_also && matchedCrossref.see_also.map((code, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              const cleanCode = code.split(' ')[0];
                              setQuery(cleanCode);
                              setDebouncedQuery(cleanCode);
                            }}
                            className="px-2 py-0.5 bg-[#00B4A4]/10 hover:bg-[#00B4A4]/20 border border-[#00B4A4]/20 text-[#00B4A4] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            {code}
                          </button>
                        ))}
                      </div>
                      {matchedCrossref.note && (
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 italic">
                          Petunjuk: {matchedCrossref.note}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDismissCrossref(matchedCrossref.key)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors focus:outline-none"
                    title="Tutup & simpan pilihan"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Recent Searches */}
              {!query && !loading && recentSearches.length > 0 && (
                <div className="mb-8 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-2">
                    <Clock className="w-4 h-4" /> Riwayat:
                  </span>
                  {recentSearches.map((s, idx) => (
                    <div key={idx} className="flex items-center bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-full transition-all hover:shadow hover:border-[#00B4A4] overflow-hidden group">
                      <button
                        onClick={() => setQuery(s)}
                        className="px-3 py-1.5 text-slate-600 dark:text-slate-300 text-sm font-medium group-hover:text-[#00B4A4] transition-colors"
                      >
                        {s}
                      </button>
                      <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 group-hover:bg-[#00B4A4]/20 transition-colors"></div>
                      <button
                        onClick={() => {
                          setRecentSearches(prev => {
                            const newHistory = prev.filter(item => item !== s);
                            localStorage.setItem('icd_recent_searches', JSON.stringify(newHistory));
                            return newHistory;
                          });
                        }}
                        className="px-2 py-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors hover:bg-red-50"
                        title="Hapus dari riwayat"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {recentSearches.length > 1 && (
                    <button
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem('icd_recent_searches');
                      }}
                      className="ml-auto sm:ml-2 mt-1 sm:mt-0 px-3 py-1.5 text-[13px] text-slate-400 dark:text-slate-500 hover:text-red-600 transition-colors font-medium flex items-center justify-center gap-1 rounded-md hover:bg-red-50"
                    >
                      Hapus Semua
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-100">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Results */}
              {!loading && debouncedQuery && searchResults.length === 0 && (
                <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                  <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Tidak ada hasil pencarian statis ditemukan.</p>
                  <p className="text-sm mt-1">Coba gunakan kata kunci lain.</p>
                </div>
              )}

              <div className="space-y-4">
                {primaryGroups.map((group, index) => (
                  <ResultCard 
                    key={group.categoryCode + index}
                    group={group}
                    searchType={searchType}
                    knowledgeText={knowledgeText}
                    daggerAsteriskData={daggerAsteriskData}
                    onRequireAuth={() => setAuthModalConfig({ isOpen: true, message: 'Login untuk menyimpan bookmark dan mengakses kode ICD favorit Anda dari mana saja.' })}
                    onReportIncorrectOrder={reportIncorrectOrder}
                  />
                ))}

                {supplementaryGroups.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-dashed border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#00B4A4]" />
                      Kode Penunjang / External / Status (T, V-Z)
                    </h3>
                    <div className="space-y-4">
                      {supplementaryGroups.map((group, index) => (
                        <ResultCard 
                          key={group.categoryCode + index}
                          group={group}
                          searchType={searchType}
                          knowledgeText={knowledgeText}
                          daggerAsteriskData={daggerAsteriskData}
                          onRequireAuth={() => setAuthModalConfig({ isOpen: true, message: 'Login untuk menyimpan bookmark dan mengakses kode ICD favorit Anda dari mana saja.' })}
                          onReportIncorrectOrder={reportIncorrectOrder}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          } />
          
          <Route path="/icd9" element={
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Search Bar & Filter */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <div className="relative group flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#00B4A4]">
                    <Search className="w-6 h-6" />
                  </div>
                  <input
                    type="text"
                    className="block w-full h-14 sm:h-16 pl-12 pr-12 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200 dark:border-slate-700 outline-none rounded-2xl shadow-sm text-base sm:text-lg transition-all focus:border-[#00B4A4] focus:ring-4 focus:ring-[#00B4A4]/20 hover:border-slate-300 dark:border-slate-600 hover:shadow-md placeholder:text-slate-400 dark:text-slate-500"
                    placeholder={`Cari kode, deskripsi, atau diagnosa...`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                      setIsFocused(true);
                      setShowSuggestions(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setIsFocused(false);
                        setShowSuggestions(false);
                      }, 200);
                    }}
                    disabled={loading}
                  />
                  {query && !loading && (
                    <button
                      onClick={() => {
                        setQuery('');
                        setDebouncedQuery('');
                      }}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 transition-colors focus:outline-none"
                      title="Hapus pencarian"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  {loading && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#00B4A4]">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}
                  {activeAlias && (
                    <div className="absolute -bottom-7 left-4 text-xs text-[#00B4A4] flex items-center gap-1 font-bold bg-[#00B4A4]/10 px-2 py-1 rounded-md shadow-sm border border-[#00B4A4]/20 animate-in fade-in slide-in-from-top-1">
                      <Brain className="w-3 h-3" />
                      Smart Alias: {activeAlias.key} → {activeAlias.value}
                    </div>
                  )}
                  {showSuggestions && query.trim().length >= 2 && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/50 transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                          }}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="w-full px-5 py-3.5 text-left hover:bg-[#00B4A4]/5 dark:hover:bg-[#00B4A4]/10 transition-colors flex items-center gap-3 text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate">{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter Dropdown */}
                <div className="w-full sm:w-64 shrink-0 relative h-14 sm:h-16">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Filter className="w-5 h-5" />
                  </div>
                  <select 
                    value={filterChapter}
                    onChange={(e) => setFilterChapter(e.target.value)}
                    className="block w-full h-full appearance-none pl-11 pr-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none rounded-2xl shadow-sm text-sm text-slate-700 dark:text-slate-200 transition-all focus:border-[#00B4A4] focus:ring-4 focus:ring-[#00B4A4]/20 hover:border-slate-300 dark:border-slate-600 truncate font-medium cursor-pointer"
                  >
                    {(searchType === 'icd10' ? icd10Chapters : icd9Chapters).map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Rujukan Silang Banner */}
              {matchedCrossref && (
                <div className="mb-6 bg-[#00B4A4]/5 dark:bg-slate-800/80 border border-[#00B4A4]/20 dark:border-slate-700/80 p-4 rounded-2xl shadow-sm flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-300 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00B4A4]" />
                  <div className="flex items-start gap-3 pl-1.5">
                    <div className="bg-[#00B4A4]/10 text-[#00B4A4] p-1.5 rounded-xl mt-0.5">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        Rujukan Silang Medis (Cross-Reference)
                      </h4>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {matchedCrossref.see ? 'Lihat (See):' : 'Lihat juga (See also):'}
                        </span>
                        {matchedCrossref.see && (
                          <button
                            onClick={() => {
                              setQuery(matchedCrossref.see);
                              setDebouncedQuery(matchedCrossref.see);
                            }}
                            className="px-2 py-0.5 bg-[#00B4A4]/10 hover:bg-[#00B4A4]/20 border border-[#00B4A4]/20 text-[#00B4A4] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            {matchedCrossref.see}
                          </button>
                        )}
                        {matchedCrossref.see_also && matchedCrossref.see_also.map((code, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              const cleanCode = code.split(' ')[0];
                              setQuery(cleanCode);
                              setDebouncedQuery(cleanCode);
                            }}
                            className="px-2 py-0.5 bg-[#00B4A4]/10 hover:bg-[#00B4A4]/20 border border-[#00B4A4]/20 text-[#00B4A4] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            {code}
                          </button>
                        ))}
                      </div>
                      {matchedCrossref.note && (
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 italic">
                          Petunjuk: {matchedCrossref.note}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDismissCrossref(matchedCrossref.key)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors focus:outline-none"
                    title="Tutup & simpan pilihan"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Recent Searches */}
              {!query && !loading && recentSearches.length > 0 && (
                <div className="mb-8 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-2">
                    <Clock className="w-4 h-4" /> Riwayat:
                  </span>
                  {recentSearches.map((s, idx) => (
                    <div key={idx} className="flex items-center bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-full transition-all hover:shadow hover:border-[#00B4A4] overflow-hidden group">
                      <button
                        onClick={() => setQuery(s)}
                        className="px-3 py-1.5 text-slate-600 dark:text-slate-300 text-sm font-medium group-hover:text-[#00B4A4] transition-colors"
                      >
                        {s}
                      </button>
                      <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 group-hover:bg-[#00B4A4]/20 transition-colors"></div>
                      <button
                        onClick={() => {
                          setRecentSearches(prev => {
                            const newHistory = prev.filter(item => item !== s);
                            localStorage.setItem('icd_recent_searches', JSON.stringify(newHistory));
                            return newHistory;
                          });
                        }}
                        className="px-2 py-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors hover:bg-red-50"
                        title="Hapus dari riwayat"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {recentSearches.length > 1 && (
                    <button
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem('icd_recent_searches');
                      }}
                      className="ml-auto sm:ml-2 mt-1 sm:mt-0 px-3 py-1.5 text-[13px] text-slate-400 dark:text-slate-500 hover:text-red-600 transition-colors font-medium flex items-center justify-center gap-1 rounded-md hover:bg-red-50"
                    >
                      Hapus Semua
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-100">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Results */}
              {!loading && debouncedQuery && searchResults.length === 0 && (
                <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                  <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Tidak ada hasil pencarian statis ditemukan.</p>
                  <p className="text-sm mt-1">Coba gunakan kata kunci lain.</p>
                </div>
              )}

              <div className="space-y-4">
                {primaryGroups.map((group, index) => (
                  <ResultCard 
                    key={group.categoryCode + index}
                    group={group}
                    searchType={searchType}
                    knowledgeText={knowledgeText}
                    daggerAsteriskData={daggerAsteriskData}
                    onRequireAuth={() => setAuthModalConfig({ isOpen: true, message: 'Login untuk menyimpan bookmark dan mengakses kode ICD favorit Anda dari mana saja.' })}
                    onReportIncorrectOrder={reportIncorrectOrder}
                  />
                ))}
              </div>
            </div>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

      </main>

      {/* Floating Action Button - Scroll to Top */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 p-3 bg-[#00B4A4] text-white rounded-full shadow-lg hover:shadow-xl hover:bg-[#009B8D] transition-all duration-300 active:scale-95 z-50 flex items-center justify-center ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        aria-label="Scroll to top"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
      </button>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
        <p>&copy; {new Date().getFullYear()} PMIK-id. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
