import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import { 
  Search, Loader2, Database, AlertCircle, X, Clock, Brain, Filter, BookOpen, Menu, 
  Grid, Sun, Moon, Star, Cloud, Settings, HelpCircle, User, ArrowUpRight, LogOut,
  ChevronUp, ChevronDown, Copy, Check, Info, Sparkles, BookMarked, FileText, CheckCircle2, Plus, Mic, MicOff
} from 'lucide-react';
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
  { id: '5', base: '5', label: '50-59: Cerna (Bawah) & Sal. Kemih [Alt+Shift+5]' },
  { id: '6', label: '60-69: Kelamin (Pria & Wanita) [Alt+Shift+6]' },
  { id: '7', label: '70-79: Kebidanan & Tulang [Alt+Shift+7]' },
  { id: '8', label: '80-89: Otot, Kulit, Diagnostik [Alt+Shift+8]' },
  { id: '9', label: '90-99: Terapi & Diagnostik Lain [Alt+Shift+9]' }
];

const HIGH_FREQUENCY_ICD10 = {
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
  'T30': 0.001,
  
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
  'T14': 0.01,
  'T31': 0.01,
};

const HIGH_FREQUENCY_ICD9 = {
  '39.95': 0.001,
  '74.1': 0.001,
  
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

const calculateClinicalScore = (res, query, searchType) => {
  const code = res.item.code || '';
  const title = res.item.title || '';
  const desc = res.item.desc || '';
  const originalScore = res.score !== undefined ? res.score : 0.5;
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
    score = score * 0.001;
  } else if (code.toLowerCase().startsWith(cleanQuery)) {
    score = score * 0.05;
  } else if (title.toLowerCase() === cleanQuery || desc.toLowerCase() === cleanQuery) {
    score = score * 0.1;
  } else if (title.toLowerCase().includes(cleanQuery) || desc.toLowerCase().includes(cleanQuery)) {
    score = score * 0.5;
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

  return score;
};

function App() {
  const { isLoggedIn, user, loginWithGoogle, logout } = useAuth();
  const { showToast } = useToast();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // mobile drawer
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  
  const [isAppsDrawerOpen, setIsAppsDrawerOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [selectedCodeDetail, setSelectedCodeDetail] = useState(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('icd_theme_preference');
    if (saved) return saved;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

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
  
  const searchType = useMemo(() => {
    const path = location.pathname.substring(1).replace(/\/$/, '');
    if (path === 'icd10') return 'icd10';
    if (path === 'icd9') return 'icd9';
    if (path === 'case') return 'case';
    if (path === 'profile') return 'profile';
    if (path === 'help') return 'help';
    if (path === 'bookmark') return 'bookmark';
    if (path === 'history') return 'history';
    if (path === 'settings') return 'settings';
    return 'all'; // Default path `/` memetakan ke 'all' (Semua)
  }, [location.pathname]);
  
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState(''); // Teks real-time yang diketik user
  const [query, setQuery] = useState(''); // Teks pencarian yang SUDAH dikonfirmasi (Enter / klik suggestion / klik CTA)
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterChapter, setFilterChapter] = useState('all');
  const [error, setError] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsQuery, setSuggestionsQuery] = useState('');

  // Voice Search States
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = React.useRef(null);

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Browser Anda tidak mendukung fitur Dikte Suara. Silakan gunakan Google Chrome, Edge, atau Safari terbaru.", 'error');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      showToast('Dikte suara dihentikan', 'info');
    } else {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false; // Stop when the user stops speaking
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        showToast('Mulai mendengarkan suara...', 'info');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
           const transcript = event.results[i][0].transcript;
           if (event.results[i].isFinal) {
             finalTranscript += transcript;
           } else {
             currentInterim += transcript;
           }
        }
        
        // Update input value with the dictated text
        if (finalTranscript || currentInterim) {
          setInputValue(prev => {
             const newText = (prev ? prev + ' ' : '') + (finalTranscript || currentInterim);
             return newText;
          });
          setShowSuggestions(true);
        }
        
        if (finalTranscript) {
          // Trigger search automatically when dictation is done
          setQuery(finalTranscript);
          setDebouncedQuery(finalTranscript);
        }
      };

      recognition.onerror = (err) => {
        setIsListening(false);
        showToast('Terjadi kesalahan dikte suara: ' + (err.error || ''), 'error');
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  // Sinkronisasi Tema
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('icd_theme_preference', theme);
  }, [theme]);

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
      if (
        document.activeElement && (
          document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA' ||
          document.activeElement.isContentEditable
        )
      ) {
        return;
      }

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
    if (tab === 'new_search') {
      setInputValue('');
      setQuery('');
      setDebouncedQuery('');
      setSelectedCodeDetail(null);
      navigate('/');
      return;
    }

    if (['case', 'bookmark', 'history', 'locked_bookmark', 'locked_history'].includes(tab) && !isLoggedIn) {
      let msg = "Gunakan asisten Klinik AI untuk koding medis otomatis. Masuk atau buat akun gratis dahulu.";
      if (tab.includes('bookmark')) msg = "Login untuk menyimpan bookmark dan mengakses kode ICD favorit Anda.";
      if (tab.includes('history')) msg = "Login untuk melihat histori pencarian dan konsultasi klinis Anda.";
      
      setAuthModalConfig({ isOpen: true, message: msg });
      return;
    }
    
    if (tab === 'locked_bookmark') tab = 'bookmark';
    if (tab === 'locked_history') tab = 'history';
    
    if (!['all', 'icd10', 'icd9'].includes(tab)) {
      setSelectedCodeDetail(null);
    }

    if (tab === 'all') {
      navigate('/');
    } else {
      navigate('/' + tab);
    }
  };

  useEffect(() => {
    setFilterChapter('all');
    setSelectedCodeDetail(null);
  }, [searchType]);
  
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('icd_recent_searches');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return parsed.map(item => typeof item === 'object' ? item : { query: item, type: 'icd10' });
    } catch {
      return [];
    }
  });

  // Debounce search query — hanya dipicu oleh query yang sudah dikonfirmasi
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

  // Debounce suggestions query — dipicu oleh inputValue (ketikan real-time)
  useEffect(() => {
    if (!inputValue) {
      setSuggestionsQuery('');
      return;
    }
    const timer = setTimeout(() => {
      setSuggestionsQuery(inputValue);
    }, 150);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Handler konfirmasi pencarian (Enter key)
  const handleSearchConfirm = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      setQuery(trimmed);
      setDebouncedQuery(trimmed);
      setShowSuggestions(false);
    }
  };

  // Simpan ke riwayat kueri saat ter-debounce
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

    if (debouncedQuery.trim().length >= 3 && ['icd10', 'icd9'].includes(searchType)) {
      setRecentSearches(prev => {
        const lowerQuery = debouncedQuery.trim().toLowerCase();
        const filtered = prev.filter(item => item.query.toLowerCase() !== lowerQuery);
        const newEntry = { query: debouncedQuery.trim(), type: searchType };
        const newRecent = [newEntry, ...filtered].slice(0, 8);
        localStorage.setItem('icd_recent_searches', JSON.stringify(newRecent));
        return newRecent;
      });
      saveToSupabase(debouncedQuery.trim());
    }
  }, [debouncedQuery, isLoggedIn, user, searchType]);

  const handleSelectDetail = (sub) => {
    setSelectedCodeDetail(sub);
    if (query.trim()) {
      setRecentSearches(prev => {
        const currentQuery = query.trim();
        const lowerQuery = currentQuery.toLowerCase();
        const filtered = prev.filter(item => item.query.toLowerCase() !== lowerQuery);
        const newEntry = { query: currentQuery, code: sub.code, type: searchType };
        const newRecent = [newEntry, ...filtered].slice(0, 8);
        localStorage.setItem('icd_recent_searches', JSON.stringify(newRecent));
        return newRecent;
      });
    }
  };

  const fetchDynamicAliases = async () => {
    let combined = {};
    try {
      const localCustom = JSON.parse(localStorage.getItem('icd_custom_abbreviations')) || {};
      Object.assign(combined, localCustom);
    } catch (e) {
      console.warn("Failed to parse custom local abbreviations:", e);
    }
    
    try {
      const { data, error } = await supabase
        .from('custom_abbreviations')
        .select('keyword, expansion');
      if (!error && data) {
        data.forEach(item => {
          combined[item.keyword.trim().toUpperCase()] = item.expansion.trim();
        });
      }
    } catch (e) {
      console.warn("Failed to fetch abbreviations from Supabase:", e);
    }
    return combined;
  };

  const reloadAliases = async () => {
    try {
      const resAliases = await fetch('/singkatan.json').then(res => res.json()).catch(() => ({}));
      const dynamic = await fetchDynamicAliases();
      setAliases({ ...resAliases, ...dynamic });
    } catch (e) {
      console.warn("Reload aliases failed:", e);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      let cached10, cached9;
      let hasCache = false;
      
      try {
        const [c10, c9, cK, cDA, cA] = await Promise.all([
          getCache('icd10'),
          getCache('icd9'),
          getCache('knowledge'),
          getCache('daggerAsterisk'),
          getCache('aliases')
        ]);

        if (c10 && c9) {
          cached10 = c10;
          cached9 = c9;
          setIcd10Data(c10);
          setIcd9Data(c9);
          if (cK) setKnowledgeText(cK);
          if (cDA) setDaggerAsteriskData(cDA);
          if (cA) setAliases(cA);
          setLoading(false);
          hasCache = true;
        }
      } catch (err) {
        console.warn("Cache retrieval failed:", err);
      }

      try {
        if (!hasCache) {
          setLoading(true);
        }

        const [res10, res9, resKnowledge, resDA, resAliases, resCrossref] = await Promise.all([
          fetch('/icd10.json').then(res => res.json()),
          fetch('/icd9.json').then(res => res.json()),
          fetch('/knowledge.md').then(res => res.text()),
          fetch('/kodedeggerdanasterik.json').then(res => res.json()).catch(() => null),
          fetch('/singkatan.json').then(res => res.json()).catch(() => ({})),
          fetch('/crossref.json').then(res => res.json()).catch(() => ({}))
        ]);

        setCrossrefData(resCrossref || {});

        const isDataChanged = !hasCache || 
          JSON.stringify(res10) !== JSON.stringify(cached10) || 
          JSON.stringify(res9) !== JSON.stringify(cached9);

        const dynamicAliases = await fetchDynamicAliases();
        const finalAliases = { ...resAliases, ...dynamicAliases };

        if (isDataChanged || JSON.stringify(finalAliases) !== JSON.stringify(aliases)) {
          setIcd10Data(res10);
          setIcd9Data(res9);
          setKnowledgeText(resKnowledge);
          setDaggerAsteriskData(resDA);
          setAliases(finalAliases);

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
    'BATUK': { target: 'R05', label: 'R05 (Batuk / Cough)' },
    'SAKIT KEPALA': { target: 'R51', label: 'R51 (Sakit Kepala / Headache)' },
    'MAAG': { target: 'K29.7', label: 'K29.7 / K30 (Gastritis / Dispepsia / Maag)' },
    'PNEUMONIA ASPIRASI': { target: 'J69.0', label: 'J69.0 (Pneumonia Aspirasi)' },
    'DM DENGAN GANGREN': { target: 'E11.5', label: 'E11.5 (DM Tipe 2 dengan Gangren)' },
    'HIPERTENSI DALAM KEHAMILAN': { target: 'O1', label: 'O10-O14 (Hipertensi dalam Kehamilan, Pre-eklampsia, Eklampsia)' },
    'FRAKTUR TERBUKA FEMUR': { target: 'S72.90', label: 'S72.90 (Fraktur Femur Terbuka - pilih subkode spesifik berdasarkan lokasi & pair dengan penyebab luar W-kode)' }
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
    let trimmed = suggestionsQuery.replace(/\+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!trimmed || trimmed.length < 2) return [];

    const cleanQueryForAlias = trimmed.toUpperCase();

    if (searchType === 'all') {
      const expandedQuery10 = ICD10_UMBRELLA[cleanQueryForAlias] ? ICD10_UMBRELLA[cleanQueryForAlias].target : (aliases[cleanQueryForAlias] || trimmed);
      const isCodeQuery10 = /^[A-Z]$|^[A-Z][0-9]/i.test(expandedQuery10.trim()) && expandedQuery10.trim().length >= 2;
      let results10 = [];
      if (isCodeQuery10) {
        const cleanCodeQuery = expandedQuery10.trim().replace('.', '').toUpperCase();
        const matchedItems = icd10Data.filter(item => item.code.replace('.', '').toUpperCase().startsWith(cleanCodeQuery));
        results10 = matchedItems.map(item => ({ item, score: item.code.replace('.', '').toUpperCase() === cleanCodeQuery ? 0.001 : 0.05, matches: [] }));
      } else {
        results10 = fuse10.search(expandedQuery10, { limit: 20 });
      }
      const scoredResults10 = results10.map(res => ({ ...res, clinicalScore: calculateClinicalScore(res, expandedQuery10, 'icd10'), type: 'icd10' }));

      const expandedQuery9 = ICD9_UMBRELLA[cleanQueryForAlias] ? ICD9_UMBRELLA[cleanQueryForAlias].target : (aliases[cleanQueryForAlias] || trimmed);
      const isCodeQuery9 = /^[0-9]/i.test(expandedQuery9.trim()) && expandedQuery9.trim().length >= 2;
      let results9 = [];
      if (isCodeQuery9) {
        const cleanCodeQuery = expandedQuery9.trim().replace('.', '').toUpperCase();
        const matchedItems = icd9Data.filter(item => item.code.replace('.', '').toUpperCase().startsWith(cleanCodeQuery));
        results9 = matchedItems.map(item => ({ item, score: item.code.replace('.', '').toUpperCase() === cleanCodeQuery ? 0.001 : 0.05, matches: [] }));
      } else {
        results9 = fuse9.search(expandedQuery9, { limit: 20 });
      }
      const scoredResults9 = results9.map(res => ({ ...res, clinicalScore: calculateClinicalScore(res, expandedQuery9, 'icd9'), type: 'icd9' }));

      const combined = [...scoredResults10, ...scoredResults9];
      combined.sort((a, b) => a.clinicalScore - b.clinicalScore);

      const uniqueTerms = [];
      for (const res of combined) {
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
    }

    const UMBRELLA = searchType === 'icd10' ? ICD10_UMBRELLA : ICD9_UMBRELLA;
    const expandedQuery = UMBRELLA[cleanQueryForAlias] ? UMBRELLA[cleanQueryForAlias].target : (aliases[cleanQueryForAlias] || trimmed);
    const fuse = searchType === 'icd10' ? fuse10 : fuse9;
    
    const isCodeQuery = searchType === 'icd10' 
      ? /^[A-Z]$|^[A-Z][0-9]/i.test(expandedQuery.trim()) && expandedQuery.trim().length >= 2
      : /^[0-9]/i.test(expandedQuery.trim()) && expandedQuery.trim().length >= 2;

    let results = [];
    if (isCodeQuery) {
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
      setInputValue(code);
      setQuery(code);
      setDebouncedQuery(code);
    } else {
      setInputValue(suggestion);
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
  const { searchQuery, activeAlias } = useMemo(() => {
    if (!debouncedQuery) return { searchQuery: '', activeAlias: null };
    const cleanQuery = debouncedQuery.replace(/\+/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
    
    if (searchType === 'all') {
      const alias10 = ICD10_UMBRELLA[cleanQuery];
      const alias9 = ICD9_UMBRELLA[cleanQuery];
      if (alias10 && alias9) {
        return {
          searchQuery: debouncedQuery,
          activeAlias: { key: cleanQuery, value: `${alias10.label} & ${alias9.label}` }
        };
      }
      if (alias10) {
        return {
          searchQuery: alias10.target,
          activeAlias: { key: cleanQuery, value: alias10.label }
        };
      }
      if (alias9) {
        return {
          searchQuery: alias9.target,
          activeAlias: { key: cleanQuery, value: alias9.label }
        };
      }
    }

    const UMBRELLA = searchType === 'icd10' ? ICD10_UMBRELLA : ICD9_UMBRELLA;

    if (UMBRELLA[cleanQuery]) {
      return { 
        searchQuery: UMBRELLA[cleanQuery].target, 
        activeAlias: { key: cleanQuery, value: UMBRELLA[cleanQuery].label }
      };
    }

    if (aliases[cleanQuery]) {
      return { 
        searchQuery: aliases[cleanQuery], 
        activeAlias: { key: cleanQuery, value: aliases[cleanQuery] }
      };
    }
    return { searchQuery: debouncedQuery.replace(/\+/g, ' ').replace(/\s+/g, ' ').trim(), activeAlias: null };
  }, [debouncedQuery, aliases, searchType, ICD10_UMBRELLA, ICD9_UMBRELLA]);

  // Handle Search
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    
    if (searchType === 'all') {
      const cleanQuery = debouncedQuery.replace(/\+/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
      
      const q10 = ICD10_UMBRELLA[cleanQuery] ? ICD10_UMBRELLA[cleanQuery].target : (aliases[cleanQuery] || debouncedQuery.trim());
      const q9 = ICD9_UMBRELLA[cleanQuery] ? ICD9_UMBRELLA[cleanQuery].target : (aliases[cleanQuery] || debouncedQuery.trim());

      const isCodeQuery10 = /^[A-Z]$|^[A-Z][0-9]/i.test(q10);
      let results10 = [];
      if (isCodeQuery10) {
        const cleanCodeQuery = q10.replace('.', '').toUpperCase();
        results10 = icd10Data.filter(item => item.code.replace('.', '').toUpperCase().startsWith(cleanCodeQuery))
          .map(item => ({ item, score: item.code.replace('.', '').toUpperCase() === cleanCodeQuery ? 0.001 : 0.05, matches: [] }));
      } else {
        results10 = fuse10.search(q10, { limit: 60 });
      }
      const scoredResults10 = results10.map(res => ({ ...res, clinicalScore: calculateClinicalScore(res, q10, 'icd10'), type: 'icd10' }));

      const isCodeQuery9 = /^[0-9]/i.test(q9);
      let results9 = [];
      if (isCodeQuery9) {
        const cleanCodeQuery = q9.replace('.', '').toUpperCase();
        results9 = icd9Data.filter(item => item.code.replace('.', '').toUpperCase().startsWith(cleanCodeQuery))
          .map(item => ({ item, score: item.code.replace('.', '').toUpperCase() === cleanCodeQuery ? 0.001 : 0.05, matches: [] }));
      } else {
        results9 = fuse9.search(q9, { limit: 60 });
      }
      const scoredResults9 = results9.map(res => ({ ...res, clinicalScore: calculateClinicalScore(res, q9, 'icd9'), type: 'icd9' }));

      const combined = [...scoredResults10, ...scoredResults9];
      combined.sort((a, b) => a.clinicalScore - b.clinicalScore);
      return combined.slice(0, 60);
    }
    
    const isCodeQuery = searchType === 'icd10' 
      ? /^[A-Z]$|^[A-Z][0-9]/i.test(searchQuery.trim()) 
      : /^[0-9]/i.test(searchQuery.trim());

    let results = [];
    if (isCodeQuery) {
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
      return { ...res, clinicalScore, type: searchType };
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
    if (searchType === 'icd9') {
      return { primaryResults: searchResults, supplementaryResults: [] };
    }
    const primary = [];
    const supplementary = [];
    const cleanQuery = searchQuery.trim().toLowerCase();
    const isSpecificSupplQuery = 
      /^[ztvywx]/i.test(cleanQuery) || 
      ['kontrol', 'imunisasi', 'kecelakaan', 'tabrak', 'racun', 'jatuh', 'kontrasepsi', 'lahir', 'periksa', 'neonatus', 'bayi baru lahir', 'bbl', 'anc', 'skrining', 'vaksin', 'kunjungan', 'rujukan'].some(w => cleanQuery.includes(w));

    searchResults.forEach(res => {
      if (res.type === 'icd9') {
        primary.push(res);
        return;
      }

      const firstChar = res.item.code.charAt(0).toUpperCase();
      let isSupplChapter = false;
      if (['V', 'W', 'X', 'Y', 'Z'].includes(firstChar)) {
        isSupplChapter = true;
      } else if (firstChar === 'T') {
        const numPart = parseInt(res.item.code.substring(1), 10);
        if (!isNaN(numPart) && numPart >= 90 && numPart <= 98) {
          isSupplChapter = true;
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
    const groups = {};

    primaryResults.forEach(res => {
      const code = res.item.code;
      const currentType = res.type || (searchType === 'all' ? 'icd10' : searchType);
      const catCode = getCategoryCode(code, currentType);
      const groupKey = `${currentType}_${catCode}`;
      
      const rawData = currentType === 'icd10' ? icd10Data : icd9Data;

      if (!groups[groupKey]) {
        const catItem = rawData.find(item => item.code === catCode);
        groups[groupKey] = {
          categoryCode: catCode,
          categoryItem: catItem || { code: catCode, title: 'Kategori ' + catCode, desc: '' },
          matchedCodes: [],
          matchedMatches: {},
          bestScore: res.clinicalScore,
          allSubcodes: [],
          type: currentType
        };
      }
      groups[groupKey].matchedCodes.push(code);
      groups[groupKey].matchedMatches[code] = res.matches || [];
      if (res.clinicalScore < groups[groupKey].bestScore) {
        groups[groupKey].bestScore = res.clinicalScore;
      }
    });

    Object.keys(groups).forEach(groupKey => {
      const currentType = groups[groupKey].type;
      const catCode = groups[groupKey].categoryCode;
      const rawData = currentType === 'icd10' ? icd10Data : icd9Data;
      groups[groupKey].allSubcodes = rawData.filter(item => 
        item.code === catCode || item.code.startsWith(catCode + '.')
      );
    });

    return Object.values(groups).sort((a, b) => a.bestScore - b.bestScore);
  }, [primaryResults, searchType, icd10Data, icd9Data]);

  const supplementaryGroups = useMemo(() => {
    const groups = {};

    supplementaryResults.forEach(res => {
      const code = res.item.code;
      const currentType = res.type || (searchType === 'all' ? 'icd10' : searchType);
      const catCode = getCategoryCode(code, currentType);
      const groupKey = `${currentType}_${catCode}`;
      
      const rawData = currentType === 'icd10' ? icd10Data : icd9Data;

      if (!groups[groupKey]) {
        const catItem = rawData.find(item => item.code === catCode);
        groups[groupKey] = {
          categoryCode: catCode,
          categoryItem: catItem || { code: catCode, title: 'Kategori ' + catCode, desc: '' },
          matchedCodes: [],
          matchedMatches: {},
          bestScore: res.clinicalScore,
          allSubcodes: [],
          type: currentType
        };
      }
      groups[groupKey].matchedCodes.push(code);
      groups[groupKey].matchedMatches[code] = res.matches || [];
      if (res.clinicalScore < groups[groupKey].bestScore) {
        groups[groupKey].bestScore = res.clinicalScore;
      }
    });

    Object.keys(groups).forEach(groupKey => {
      const currentType = groups[groupKey].type;
      const catCode = groups[groupKey].categoryCode;
      const rawData = currentType === 'icd10' ? icd10Data : icd9Data;
      groups[groupKey].allSubcodes = rawData.filter(item => 
        item.code === catCode || item.code.startsWith(catCode + '.')
      );
    });

    return Object.values(groups).sort((a, b) => a.bestScore - b.bestScore);
  }, [supplementaryResults, searchType, icd10Data, icd9Data]);

  // See also banner
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

  const isSearchMode = ['all', 'icd10', 'icd9'].includes(searchType);
  const hasResults = !!query.trim() && isSearchMode;

  // Click Outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#apps-drawer-toggle') && !e.target.closest('#apps-drawer')) {
        setIsAppsDrawerOpen(false);
      }
      if (!e.target.closest('#profile-dropdown-toggle') && !e.target.closest('#profile-dropdown')) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // UI Render Helpers
  const renderAppsDrawer = () => {
    const menuGrid = [
      { name: 'Beranda', icon: <BookOpen className="w-5 h-5" />, action: () => handleTabClick('new_search') },
      { name: 'ICD-10', icon: <Search className="w-5 h-5" />, action: () => handleTabClick('icd10') },
      { name: 'ICD-9', icon: <Search className="w-5 h-5" />, action: () => handleTabClick('icd9') },
      { name: 'Klinik AI', icon: <Brain className="w-5 h-5" />, action: () => handleTabClick('case') },
      { name: 'Ekspor', icon: <FileText className="w-5 h-5" />, action: () => handleTabClick('history') },
      { name: 'Profil', icon: <User className="w-5 h-5" />, action: () => handleTabClick('profile') },
      { name: 'FAQ', icon: <HelpCircle className="w-5 h-5" />, action: () => handleTabClick('help') },
      { name: 'Pengaturan', icon: <Settings className="w-5 h-5" />, action: () => handleTabClick('settings') },
      { name: 'Tentang', icon: <Info className="w-5 h-5" />, action: () => setIsAboutOpen(true) }
    ];

    if (!isAppsDrawerOpen) return null;

    return (
      <div 
        id="apps-drawer"
        className="absolute top-14 right-4 sm:right-14 w-[calc(100vw-2rem)] sm:w-80 max-w-80 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200"
      >
        <div className="grid grid-cols-3 gap-3">
          {menuGrid.map((menu, idx) => (
            <button
              key={idx}
              onClick={() => { menu.action(); setIsAppsDrawerOpen(false); }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-300 hover:text-[#2AA79B] dark:hover:text-[#2AA79B] transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850 dark:group-hover:bg-[#2AA79B]/10 text-slate-500 dark:text-slate-400 group-hover:text-[#2AA79B] group-hover:bg-[#2AA79B]/5 transition-colors">
                {menu.icon}
              </div>
              <span className="text-[10px] font-bold mt-1.5 text-center leading-tight truncate w-full">{menu.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderProfileDropdown = () => {
    if (!isProfileDropdownOpen) return null;

    return (
      <div 
        id="profile-dropdown"
        className="absolute top-14 right-4 w-[calc(100vw-2rem)] sm:w-72 max-w-[18rem] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200"
      >
        {isLoggedIn ? (
          <div>
            <div className="flex items-center gap-3 p-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 border border-[#2AA79B]/40 flex items-center justify-center">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-extrabold text-sm text-slate-555 dark:text-slate-455">
                    {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || 'B'}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-855 dark:text-slate-100 truncate">{user?.user_metadata?.full_name || 'Rekan PMIK'}</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-1">
              <button 
                onClick={() => { handleTabClick('profile'); setIsProfileDropdownOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-655 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-slate-400" /> Profil Saya
              </button>
              <button 
                onClick={() => { handleTabClick('bookmark'); setIsProfileDropdownOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-655 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 text-slate-400" /> Bookmark Saya
              </button>
              <button 
                onClick={() => { handleTabClick('history'); setIsProfileDropdownOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-655 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5 text-slate-400" /> Histori Cloud
              </button>
              <button 
                onClick={() => { handleTabClick('settings'); setIsProfileDropdownOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-655 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" /> Setelan
              </button>
              <button 
                onClick={() => { handleTabClick('help'); setIsProfileDropdownOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-655 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Bantuan & FAQ
              </button>
              <div className="border-t border-slate-100 dark:border-slate-800/60 my-1"></div>
              <button 
                onClick={() => { logout(); setIsProfileDropdownOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-2 cursor-pointer animate-pulse-subtle"
              >
                <LogOut className="w-3.5 h-3.5" /> Keluar Akun
              </button>
            </div>
          </div>
        ) : (
          <div className="p-1">
            <h4 className="text-sm font-bold text-slate-855 dark:text-slate-100 mb-1 px-1">Masuk ke ICD Search</h4>
            <p className="text-[10px] text-slate-455 dark:text-slate-500 mb-3 px-1">Sinkronisasikan bookmark Anda di cloud dan akses asisten koding AI.</p>
            <button
              onClick={() => { loginWithGoogle(); setIsProfileDropdownOpen(false); }}
              className="w-full bg-[#2AA79B] hover:bg-[#208f84] text-white py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer mb-3"
            >
              Masuk / Daftar
            </button>
            <div className="border-t border-slate-100 dark:border-slate-800/60 my-2"></div>
            <div className="space-y-1">
              <button 
                onClick={() => { handleTabClick('settings'); setIsProfileDropdownOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-655 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" /> Setelan
              </button>
              <button 
                onClick={() => { handleTabClick('help'); setIsProfileDropdownOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-655 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Bantuan & FAQ
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderKnowledgePanelContent = (sub) => {
    if (!sub) return null;
    const isInjury = ['S', 'T'].includes(sub.code.charAt(0).toUpperCase());
    
    return (
      <div className="flex flex-col gap-5">
        <div>
          <span className="inline-block px-2.5 py-1 bg-[#2AA79B] text-white font-mono font-bold rounded-lg text-sm sm:text-base mb-2 shadow-sm">
            {sub.code}
          </span>
          <h3 className="text-lg font-bold text-slate-855 dark:text-slate-100 leading-snug">
            {sub.title}
          </h3>
          {sub.desc && (
            <p className="text-slate-500 dark:text-slate-455 mt-1.5 text-xs sm:text-sm italic bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              Deskripsi: {sub.desc}
            </p>
          )}
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Informasi Bab & Rujukan</h4>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 block mb-0.5">Klasifikasi</span>
              <span className="font-semibold text-slate-700 dark:text-slate-350">
                {/^[A-Z]/i.test(sub.code) ? 'ICD-10 Vol. 1' : 'ICD-9-CM Prosedur'}
              </span>
            </div>
            
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 block mb-0.5">Tipe Kode</span>
              <span className="font-semibold text-slate-700 dark:text-slate-350">
                {sub.code.includes('.') ? 'Sub-Kategori / Kode Spesifik' : 'Kategori Utama'}
              </span>
            </div>
          </div>

          {isInjury && (
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50 rounded-xl text-xs text-orange-700 dark:text-orange-400">
              <span className="font-bold flex items-center gap-1 mb-1">🚨 Peringatan Penyebab Luar</span>
              Cedera terdeteksi. Koder wajib menyertakan kode tambahan dari Bab XX (V01-Y98) sebagai diagnosis komorbid untuk menjelaskan penyebab cedera (misal KLL, jatuh, dll.).
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tindakan Cepat</h4>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(sub.code);
                showToast(`Kode ${sub.code} disalin!`, 'success');
              }}
              className="w-full py-2.5 bg-slate-50 hover:bg-[#2AA79B]/10 dark:bg-slate-850 dark:hover:bg-[#2AA79B]/20 text-slate-650 dark:text-slate-300 hover:text-[#2AA79B] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-4 h-4" /> Salin Kode Utama
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${sub.code} ${sub.title}`);
                showToast(`Kode & deskripsi disalin!`, 'success');
              }}
              className="w-full py-2.5 bg-slate-50 hover:bg-[#2AA79B]/10 dark:bg-slate-850 dark:hover:bg-[#2AA79B]/20 text-slate-650 dark:text-slate-300 hover:text-[#2AA79B] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-4 h-4" /> Salin Lengkap
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Nama chapter medis lengkap & jelas untuk chip filter cepat di homepage
  const quickFiltersICD10 = [
    { id: 'A|B', label: 'Infeksi (A-B)' },
    { id: 'C|D', label: 'Neoplasma (C-D)' },
    { id: 'E', label: 'Endokrin / Gizi (E)' },
    { id: 'G', label: 'Penyakit Saraf (G)' },
    { id: 'I', label: 'Kardiovaskular (I)' },
    { id: 'J', label: 'Pernapasan (J)' },
    { id: 'K', label: 'Pencernaan (K)' },
    { id: 'S|T', label: 'Cedera / Racun (S-T)' }
  ];

  const quickFiltersICD9 = [
    { id: '00', label: 'Prosedur Lain (00)' },
    { id: '0', label: 'Bedah Saraf (01-09)' },
    { id: '3', label: 'Jantung / Napas (30-39)' },
    { id: '5', label: 'Cerna / Kemih (50-59)' },
    { id: '7', label: 'Kebidanan / Obgyn (70-79)' },
    { id: '8', label: 'Otot / Kulit (80-89)' }
  ];

  const renderHeaderRight = (isFloating) => {
    return (
      <div className={`flex items-center gap-3 relative ${isFloating ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-md' : ''}`}>
        
        {/* Toggle ICD-10 / ICD-9 */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-bold mr-1">
          <button 
            onClick={() => handleTabClick('icd10')}
            className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
              searchType === 'icd10' ? 'bg-white dark:bg-slate-900 text-[#2AA79B] shadow-sm font-extrabold' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            ICD-10
          </button>
          <button 
            onClick={() => handleTabClick('icd9')}
            className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
              searchType === 'icd9' ? 'bg-white dark:bg-slate-900 text-[#2AA79B] shadow-sm font-extrabold' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            ICD-9
          </button>
        </div>

        {/* Mode Malam */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-[#2AA79B] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          title="Ganti Tema"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* Apps Drawer Toggle */}
        <button
          id="apps-drawer-toggle"
          onClick={() => setIsAppsDrawerOpen(!isAppsDrawerOpen)}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isAppsDrawerOpen ? 'bg-[#2AA79B]/10 text-[#2AA79B]' : 'text-slate-500 dark:text-slate-400 hover:text-[#2AA79B] hover:bg-slate-105 dark:hover:bg-slate-800'
          }`}
          title="Menu Aplikasi"
        >
          <Grid className="w-5 h-5" />
        </button>

        {/* Apps Drawer Panel */}
        {renderAppsDrawer()}

        {/* Profile Avatar */}
        <button
          id="profile-dropdown-toggle"
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center cursor-pointer hover:border-[#2AA79B]/55 transition-colors font-extrabold text-xs text-slate-655 dark:text-slate-300"
          title="Akun Saya"
        >
          {isLoggedIn && user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span>{user?.user_metadata?.full_name?.charAt(0).toUpperCase() || 'B'}</span>
          )}
        </button>

        {/* Profile Dropdown Panel */}
        {renderProfileDropdown()}
      </div>
    );
  }  // Google Search filter tab horizontal bar
  const renderTabFilterBar = () => {
    if (!hasResults && isSearchMode) return null;

    const tabs = [
      { id: 'all', label: 'Semua', action: () => { handleTabClick('all'); } },
      { id: 'icd10', label: 'ICD-10', action: () => { handleTabClick('icd10'); } },
      { id: 'icd9', label: 'ICD-9', action: () => { handleTabClick('icd9'); } },
      { id: 'case', label: 'Klinik AI', action: () => { handleTabClick('case'); } },
      { id: 'history', label: 'Ekspor', action: () => { handleTabClick('history'); } }
    ];

    const getActiveTabId = () => {
      if (searchType === 'case') return 'case';
      if (searchType === 'history') return 'history';
      if (searchType === 'icd9') return 'icd9';
      if (searchType === 'icd10') return 'icd10';
      if (searchType === 'all') return 'all';
      return '';
    };

    const activeTabId = getActiveTabId();

    return (
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-850 sticky top-[68px] lg:top-0 z-30 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-6 text-xs sm:text-sm overflow-x-auto scrollbar-none h-full">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  onClick={tab.action}
                  className={`relative h-full px-1 flex items-center justify-center font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive 
                      ? 'text-[#2AA79B] font-black' 
                      : 'text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2AA79B] rounded-full animate-in fade-in" />
                  )}
                </button>
              );
            })}
            </div>

            {/* Header Right Menu sebaris dengan Filter Tabs di Desktop */}
            <div className="hidden lg:flex items-center">
              {renderHeaderRight(false)}
            </div>
          </div>

          {/* Sub-Filter Row (Hanya muncul jika tab aktif adalah icd10 atau icd9 DAN hasResults === true) */}
          {hasResults && ['icd10', 'icd9'].includes(searchType) && (
            <div className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/40 pt-2 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kategori:</span>
                <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                  {(searchType === 'icd10' ? icd10Chapters : icd9Chapters).find(c => c.id === filterChapter)?.label.split('[')[0]}
                </span>
                {activeAlias && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#2AA79B]/10 text-[#2AA79B] border border-[#2AA79B]/20 text-[11px] font-bold rounded">
                    <Brain className="w-3 h-3" />
                    Alias: {activeAlias.key} → {activeAlias.value}
                  </span>
                )}
              </div>
              
              <div className="relative w-full sm:w-60 h-8 shrink-0">
                <select
                  value={filterChapter}
                  onChange={(e) => setFilterChapter(e.target.value)}
                  className="block w-full h-full appearance-none pl-3 pr-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none rounded-lg text-xs text-slate-700 dark:text-slate-300 transition-all focus:border-[#2AA79B] focus:ring-2 focus:ring-[#2AA79B]/10 truncate font-semibold cursor-pointer"
                >
                  {(searchType === 'icd10' ? icd10Chapters : icd9Chapters).map(c => (
                    <option key={c.id} value={c.id}>{c.label.split('[')[0]}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0b0f19] text-slate-850 dark:text-slate-150 font-sans selection:bg-[#2AA79B] selection:text-white transition-colors duration-300">
      
      {/* Sidebar Kiri — Selalu muncul (Google AI pattern) */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onSelectTab={handleTabClick}
        isExpanded={isSidebarExpanded}
        onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
        recentSearches={recentSearches}
        onRemoveRecent={(item) => setRecentSearches(prev => {
          const updated = prev.filter(x => x.query !== item.query);
          localStorage.setItem('icd_recent_searches', JSON.stringify(updated));
          return updated;
        })}
        onClearRecent={() => {
          setRecentSearches([]);
          localStorage.removeItem('icd_recent_searches');
        }}
        onSearchSelect={(q, type) => {
          setInputValue(q);
          setQuery(q);
          setDebouncedQuery(q);
          if (type === 'icd10') navigate('/');
          else navigate('/' + type);
        }}
        activeTab={searchType}
      />

      <AuthModal 
        isOpen={authModalConfig.isOpen} 
        onClose={() => setAuthModalConfig({ ...authModalConfig, isOpen: false })} 
        message={authModalConfig.message} 
      />

      {/* Kontainer Konten Utama */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 relative ${
          isSidebarExpanded ? 'lg:pl-[260px]' : 'lg:pl-[76px]'
        }`}
      >
        
        {/* Header Kanan Atas Melayang (Desktop/Tablet) HANYA DI HOMEPAGE */}
        {!hasResults && isSearchMode && (
          <div className="fixed top-4 right-6 z-40 hidden lg:block">
            {renderHeaderRight(true)}
          </div>
        )}

        {/* Mobile Header (Hanya muncul di layar kecil < 1024px) */}
        <div className="lg:hidden sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200/60 dark:border-slate-850 transition-all duration-300 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            

          </div>

          {/* Kanan: Navigasi, Toggle, Profil dsb (mode non-floating) */}
          <div className="flex items-center">
            {renderHeaderRight(false)}
          </div>
        </div>

        {/* Tab horizontal bar Google filter di bawah header kompak */}
        {renderTabFilterBar()}

        {/* Area Konten Utama */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
          
          {/* RUTE PENCARIAN & HOMEPAGE TERPUSAT */}
          <Routes>
            <Route path="/settings" element={<SettingsView onAliasesUpdated={reloadAliases} />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/help" element={<HelpView />} />
            <Route path="/bookmark" element={<BookmarkView />} />
            <Route path="/history" element={
              <HistoryView onSearchHistory={(q, type) => {
                navigate(type === 'icd10' ? '/icd10' : type === 'icd9' ? '/icd9' : '/');
                setInputValue(q);
                setQuery(q);
              }} />
            } />
            <Route path="/case" element={<CaseConsultation knowledgeText={knowledgeText} initialResume={inputValue || query} />} />
            
            {/* Rute Pencarian: Semua, ICD-10 & ICD-9 */}
            {['/', '/icd10', '/icd9'].map((path) => (
              <Route 
                key={path}
                path={path} 
                element={
                  !hasResults ? (
                    // HOMEPAGE TERPUSAT (GOOGLE PATTERN)
                    <div className="flex flex-col items-center justify-center min-h-[72vh] px-4 animate-in fade-in duration-500 relative">
                      
                      {/* Brand Logo & Personal Greeting */}
                      <div className="flex flex-col items-center mb-8 text-center mt-8 md:mt-0">
                        <div className="relative mb-6 group">
                          <div className="absolute -inset-1.5 bg-gradient-to-r from-[#2AA79B] to-[#D6E400] rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                          {/* Bingkai bulat keping emblem premium untuk logo PMIK-id agar tampak rapi di dark mode */}
                          <div className="relative rounded-3xl bg-white dark:bg-white p-3 shadow-md border border-slate-150 dark:border-slate-800 flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28">
                            <img 
                              src="/PMIK-id%20Logo.png" 
                              alt="PMIK Logo" 
                              className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0 transition-transform duration-350 hover:scale-105" 
                            />
                          </div>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">ICD Search Pro</h1>
                        <p className="text-[#2AA79B] font-extrabold text-[10px] sm:text-xs mt-1 uppercase tracking-widest">Smart Clinical Coding Assistant</p>
                        
                        <h3 className="text-sm sm:text-base text-slate-655 dark:text-slate-350 mt-6 font-semibold">
                          {isLoggedIn 
                            ? `Halo ${user?.user_metadata?.full_name || 'Bro Ian'}, mau cari kode apa?` 
                            : 'Halo Rekan PMIK, mau cari kode apa?'}
                        </h3>
                      </div>

                      {/* Search Bar Terpusat */}
                      <div className="w-full max-w-2xl relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#2AA79B]">
                          <Search className="w-6 h-6 animate-pulse" />
                        </div>
                        <input
                          type="text"
                          className="block w-full h-16 pl-14 pr-24 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 outline-none rounded-full shadow-lg text-base sm:text-lg transition-all focus:border-[#2AA79B] focus:ring-4 focus:ring-[#2AA79B]/10 hover:border-slate-350 dark:border-slate-750 dark:text-slate-100"
                          placeholder={searchType === 'icd10' ? "Cari kode, diagnosa, atau lead term (mis. Pneumonia)..." : "Cari prosedur medis (mis. Sectio Caesarea, ORIF)..."}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { handleSearchConfirm(); } }}
                          onFocus={() => { setIsFocused(true); setShowSuggestions(true); }}
                          onBlur={() => { setTimeout(() => { setIsFocused(false); setShowSuggestions(false); }, 200); }}
                          disabled={loading}
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-1.5">
                          {inputValue && !loading && (
                            <button
                              onClick={() => { setInputValue(''); setQuery(''); setDebouncedQuery(''); }}
                              className="p-1 text-slate-450 dark:text-slate-550 hover:text-slate-655 dark:hover:text-slate-300 transition-colors focus:outline-none rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Hapus"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                          {!loading && (
                            <button
                              type="button"
                              onClick={toggleListening}
                              className={`p-1.5 rounded-full transition-all duration-300 focus:outline-none ${
                                isListening 
                                  ? 'bg-red-500 text-white shadow-md shadow-red-500/30 animate-pulse hover:bg-red-600' 
                                  : 'text-slate-450 dark:text-slate-550 hover:text-[#2AA79B] hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                              title="Pencarian Suara"
                            >
                              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>
                          )}
                          {loading && (
                            <div className="p-1 text-[#2AA79B]">
                              <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                          )}
                        </div>
                        {showSuggestions && inputValue.trim().length >= 2 && suggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-2">
                            {suggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); }}
                                onClick={() => handleSelectSuggestion(suggestion)}
                                className="w-full px-6 py-4 text-left hover:bg-[#2AA79B]/5 dark:hover:bg-[#2AA79B]/10 transition-colors flex items-center gap-3.5 text-sm sm:text-base font-semibold text-slate-750 dark:text-slate-200 cursor-pointer"
                              >
                                <Search className="w-4 h-4 text-slate-450 dark:text-slate-550 shrink-0" />
                                <span className="truncate">{suggestion}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 2 Tombol CTA */}
                      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md px-4">
                        <button
                          onClick={() => {
                            if (inputValue.trim()) {
                              handleSearchConfirm();
                            }
                          }}
                          className="w-full sm:w-auto px-8 py-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer hover:shadow-md active:scale-[0.98]"
                        >
                          Cari Kode ICD
                        </button>
                        <button
                          onClick={() => {
                            handleTabClick('case');
                          }}
                          className="w-full sm:w-auto px-8 py-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer hover:shadow-md active:scale-[0.98]"
                        >
                          Tanya Klinik AI
                        </button>
                      </div>

                    </div>
                  ) : (
                    // TATA LETAK HASIL PENCARIAN (GRID KIRI HASIL, KANAN DETAIL PANEL)
                    <div className="animate-in fade-in slide-in-from-bottom-3 duration-400 pb-32">
                      
                      {/* Rujukan Silang Medis Banner */}
                      {matchedCrossref && (
                        <div className="mb-6 bg-[#2AA79B]/5 dark:bg-slate-900 border border-[#2AA79B]/20 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-start justify-between gap-3 relative overflow-hidden animate-in fade-in">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#2AA79B]" />
                          <div className="flex items-start gap-3 pl-1.5">
                            <div className="bg-[#2AA79B]/10 text-[#2AA79B] p-2 rounded-xl mt-0.5 shrink-0">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-855 dark:text-slate-100 text-sm">
                                Rujukan Silang Medis (Cross-Reference)
                              </h4>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                  {matchedCrossref.see ? 'Lihat (See):' : 'Lihat juga (See also):'}
                                </span>
                                {matchedCrossref.see && (
                                  <button
                                    onClick={() => { setInputValue(matchedCrossref.see); setQuery(matchedCrossref.see); setDebouncedQuery(matchedCrossref.see); }}
                                    className="px-2.5 py-1 bg-[#2AA79B]/10 hover:bg-[#2AA79B]/20 border border-[#2AA79B]/25 text-[#2AA79B] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                  >
                                    {matchedCrossref.see}
                                  </button>
                                )}
                                {matchedCrossref.see_also && matchedCrossref.see_also.map((code, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      const cleanCode = code.split(' ')[0];
                                      setInputValue(cleanCode);
                                      setQuery(cleanCode);
                                      setDebouncedQuery(cleanCode);
                                    }}
                                    className="px-2.5 py-1 bg-[#2AA79B]/10 hover:bg-[#2AA79B]/20 border border-[#2AA79B]/25 text-[#2AA79B] text-xs font-bold rounded-lg transition-colors cursor-pointer"
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
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none shrink-0"
                            title="Tutup banner"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Not found state */}
                      {!loading && debouncedQuery && searchResults.length === 0 && (
                        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                          <Search className="w-12 h-12 mx-auto mb-4 text-slate-350 dark:text-slate-600 animate-pulse" />
                          <p className="text-base font-bold text-slate-600 dark:text-slate-300">Tidak ada hasil pencarian statis ditemukan.</p>
                          <p className="text-xs text-slate-400 mt-1.5">Coba gunakan kata kunci lain.</p>
                        </div>
                      )}

                      {/* Grid Container 1 Kolom atau 2 Kolom */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* Kiri: Daftar kartu hasil */}
                        <div 
                          className={`space-y-4 transition-all duration-300 ${
                            selectedCodeDetail ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12 max-w-5xl mx-auto w-full'
                          }`}
                        >
                          {primaryGroups.map((group, index) => (
                            <ResultCard 
                              key={group.categoryCode + index}
                              group={group}
                              searchType={searchType}
                              knowledgeText={knowledgeText}
                              daggerAsteriskData={daggerAsteriskData}
                              onRequireAuth={() => setAuthModalConfig({ isOpen: true, message: 'Login untuk menyimpan bookmark dan mengakses kode ICD favorit Anda.' })}
                              onReportIncorrectOrder={reportIncorrectOrder}
                              onSelectDetail={handleSelectDetail}
                              selectedCode={selectedCodeDetail?.code}
                            />
                          ))}

                          {supplementaryGroups.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-dashed border-slate-200 dark:border-slate-800">
                              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-[#2AA79B]" />
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
                                    onRequireAuth={() => setAuthModalConfig({ isOpen: true, message: 'Login untuk menyimpan bookmark dan mengakses kode ICD favorit Anda.' })}
                                    onReportIncorrectOrder={reportIncorrectOrder}
                                    onSelectDetail={handleSelectDetail}
                                    selectedCode={selectedCodeDetail?.code}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Kanan: Detail Panel (Knowledge Panel) Desktop */}
                        {selectedCodeDetail && (
                          <aside 
                            className="hidden lg:block lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm sticky top-[132px] max-h-[calc(100vh-160px)] overflow-y-auto"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-450 dark:text-slate-500 flex items-center gap-1.5">
                                <Info className="w-4 h-4 text-[#2AA79B]" /> Detail Kode
                              </h3>
                              <button 
                                onClick={() => setSelectedCodeDetail(null)}
                                className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-250 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Tutup detail panel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            {renderKnowledgePanelContent(selectedCodeDetail)}
                          </aside>
                        )}

                        {/* Bottom Sheet Detail Panel Mobile */}
                        {selectedCodeDetail && (
                          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
                            <div 
                              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                              onClick={() => setSelectedCodeDetail(null)}
                            />
                            
                            <div 
                              className="relative bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-[2.5rem] p-6 pb-8 shadow-2xl z-10 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-20 duration-300"
                            >
                              {/* Drag Handle */}
                              <div 
                                className="w-12 h-1.5 bg-slate-250 dark:bg-slate-850 rounded-full mx-auto mb-5 cursor-pointer"
                                onClick={() => setSelectedCodeDetail(null)}
                              />
                              
                              <button 
                                onClick={() => setSelectedCodeDetail(null)}
                                className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 text-slate-450 hover:text-slate-655 dark:hover:text-slate-250 rounded-full transition-colors focus:outline-none"
                              >
                                <X className="w-5 h-5" />
                              </button>
                              {renderKnowledgePanelContent(selectedCodeDetail)}
                            </div>
                          </div>
                        )}

                      </div>

                    </div>
                  )
                }
              />
            ))}
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

        </main>

        {/* Floating Search Bar di Halaman Hasil (Google AI pattern) */}
        {hasResults && (
          <div className="sticky bottom-0 left-0 w-full bg-gradient-to-t from-slate-50 dark:from-[#0b0f19] via-slate-50/95 dark:via-[#0b0f19]/95 to-transparent pt-6 pb-6 px-4 z-40">
            <div className="max-w-3xl mx-auto w-full relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Plus className="w-6 h-6" />
              </div>
              <input
                type="text"
                className="block w-full h-14 pl-14 pr-16 bg-[#e3e6eb] dark:bg-slate-800 border-0 outline-none rounded-full shadow-sm text-base transition-all focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 hover:bg-[#d8dce2] dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 placeholder-slate-500"
                placeholder="Tanyakan apa saja..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { handleSearchConfirm(); } }}
                onFocus={() => { setIsFocused(true); setShowSuggestions(true); }}
                onBlur={() => { setTimeout(() => { setIsFocused(false); setShowSuggestions(false); }, 200); }}
                disabled={loading}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                {inputValue && !loading && (
                  <button
                    onClick={() => { setInputValue(''); setQuery(''); setDebouncedQuery(''); }}
                    className="p-2 text-slate-450 dark:text-slate-550 hover:text-slate-655 dark:hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                {loading && (
                  <div className="p-2 text-[#2AA79B]">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
                <button 
                  onClick={() => { if(inputValue.trim()) handleSearchConfirm(); }}
                  className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                </button>
              </div>
              
              {showSuggestions && inputValue.trim().length >= 2 && suggestions.length > 0 && (
                <div className="absolute bottom-full mb-3 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-bottom-2">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); }}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3.5 text-sm sm:text-base font-semibold text-slate-750 dark:text-slate-200 cursor-pointer"
                    >
                      <Search className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Action Button - Scroll to Top */}
        <button
          onClick={scrollToTop}
          className={`fixed bottom-6 right-6 p-3 bg-[#2AA79B] text-white rounded-full shadow-lg hover:shadow-xl hover:bg-[#208f84] transition-all duration-300 active:scale-95 z-40 flex items-center justify-center cursor-pointer ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
          aria-label="Scroll to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
        </button>

        {/* Footer */}
        <footer className="mt-auto py-6 text-center text-slate-400 dark:text-slate-550 text-xs font-bold uppercase tracking-wider border-t border-slate-150 dark:border-slate-850 bg-white/40 dark:bg-slate-900/10">
          <p>&copy; {new Date().getFullYear()} PMIK-id. All rights reserved.</p>
        </footer>
      </div>

      {/* Modal Tentang App */}
      {isAboutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAboutOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 text-center animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsAboutOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-250 rounded-lg hover:bg-slate-105 transition-colors focus:outline-none"
            >
              <X className="w-4.5 h-4.5" />
            </button>
            
            <div className="rounded-2xl bg-white p-2 border border-slate-150 shadow-sm flex items-center justify-center w-20 h-20 mx-auto mb-4">
              <img src="/PMIK-id%20Logo.png" alt="Logo" className="w-14 h-14 object-contain" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-855 dark:text-slate-100">ICD Search Pro</h3>
            <p className="text-[#2AA79B] font-bold text-xs uppercase tracking-widest mt-0.5">Premium Version 2.5.0</p>
            
            <p className="text-slate-550 dark:text-slate-400 text-xs sm:text-sm mt-4 leading-relaxed">
              Aplikasi pendukung koding medis pintar (smart coding assistant) yang dikembangkan khusus untuk profesional PMIK (Perekam Medis dan Informasi Kesehatan) di Indonesia. Membantu mempercepat koding diagnosis (ICD-10) dan tindakan (ICD-9-CM) dengan akurasi klinis tinggi sesuai aturan BPJS Kesehatan.
            </p>
            
            <div className="mt-6 border-t border-slate-150 dark:border-slate-800 pt-4 flex flex-col gap-2">
              <a 
                href="https://pmik.id" 
                target="_blank" 
                rel="noreferrer"
                className="w-full py-2.5 bg-[#2AA79B] hover:bg-[#208f84] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                Kunjungi Website PMIK-id <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <button 
                onClick={() => setIsAboutOpen(false)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
