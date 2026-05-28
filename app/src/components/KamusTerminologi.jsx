import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Loader2, ChevronLeft, ChevronRight, Hash, X, BookText, Mic, MicOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function KamusTerminologi() {
  const { isLoggedIn, user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const [selectedLetter, setSelectedLetter] = useState('');

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = React.useRef(null);

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser Anda tidak mendukung fitur Dikte Suara. Silakan gunakan Google Chrome, Edge, atau Safari terbaru.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
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
        
        if (finalTranscript || currentInterim) {
          setInputValue(prev => {
             const newText = (prev ? prev + ' ' : '') + (finalTranscript || currentInterim);
             return newText;
          });
        }
        
        if (finalTranscript) {
          setDebouncedQuery(finalTranscript);
        }
      };

      recognition.onerror = (err) => {
        setIsListening(false);
        console.error('Terjadi kesalahan dikte suara:', err);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue);
      setPage(0);
      if (inputValue.trim() !== '') {
        setSelectedLetter('');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let supaQuery = supabase
        .from('kamus_terminologi')
        .select('*', { count: 'exact' });

      if (debouncedQuery.trim() !== '') {
        supaQuery = supaQuery.or(`kosa_kata.ilike.%${debouncedQuery}%,arti_kata.ilike.%${debouncedQuery}%`);
      } else if (selectedLetter !== '') {
        supaQuery = supaQuery.ilike('kosa_kata', `${selectedLetter}%`);
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: result, count, error } = await supaQuery
        .order('kosa_kata', { ascending: true })
        .range(from, to);

      if (error) {
        console.error('Error fetching kamus terminologi:', error);
      } else {
        setData(result || []);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error('Unexpected error fetching kamus terminologi:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const hasResults = debouncedQuery.trim() !== '' || selectedLetter !== '' || page > 0 || data.length > 0;

  // Jika belum ada pencarian dan belum ganti halaman, tampilkan style beranda terpusat
  const isCenteredMode = debouncedQuery.trim() === '' && selectedLetter === '' && page === 0;

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() ? 
        <span key={index} className="bg-yellow-200 dark:bg-yellow-800/50 text-slate-900 dark:text-yellow-50 rounded px-0.5">{part}</span> : part
    );
  };

  if (isCenteredMode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[72vh] px-4 animate-in fade-in duration-500 relative">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center mb-8 text-center mt-8 md:mt-0">
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-2">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-[#2AA79B] to-[#D6E400] rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <img 
                src="/icdsearchpro_transparan.png" 
                alt="PMIK Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain shrink-0 transition-transform duration-350 hover:scale-105 relative z-10 drop-shadow-md" 
                fetchpriority="high"
              />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">ICD Pro</h1>
          </div>
          <p className="text-[#2AA79B] font-extrabold text-[10px] sm:text-xs mt-1 uppercase tracking-widest">Medical Terminology Dictionary</p>
          
          <h3 className="text-sm sm:text-base text-slate-655 dark:text-slate-350 mt-6 font-semibold">
            {isLoggedIn 
              ? `Halo ${user?.user_metadata?.full_name || 'Bro Ian'}, mau cari terminologi apa?` 
              : 'Halo Rekan PMIK, mau cari terminologi apa?'}
          </h3>
        </div>

        {/* Search Bar Terpusat */}
        <div className="w-full max-w-2xl relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#2AA79B]">
            <Search className="w-6 h-6 animate-pulse" />
          </div>
          <input
            type="text"
            className="block w-full h-16 pl-14 pr-16 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 outline-none rounded-full shadow-lg text-base sm:text-lg transition-all focus:border-[#2AA79B] focus:ring-4 focus:ring-[#2AA79B]/10 hover:border-slate-350 dark:border-slate-750 dark:text-slate-100"
            placeholder="Cari kosa kata atau terminologi medis..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-1.5">
            {inputValue && (
              <button
                onClick={() => { setInputValue(''); setDebouncedQuery(''); }}
                aria-label="Hapus Pencarian"
                className="p-1 text-slate-450 dark:text-slate-550 hover:text-slate-655 dark:hover:text-slate-300 transition-colors focus:outline-none rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleListening}
              aria-label={isListening ? "Hentikan Perekaman Suara" : "Mulai Pencarian Suara"}
              className={`p-1.5 rounded-full transition-all duration-300 focus:outline-none shrink-0 ${
                isListening 
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/30 animate-pulse hover:bg-red-600' 
                  : 'text-slate-450 dark:text-slate-550 hover:text-[#2AA79B] hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Pencarian Suara"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pt-16 sm:pt-20">
      {/* Header Kecil di mode pencarian */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-800 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#2AA79B]/10 rounded-xl text-[#2AA79B] hidden sm:block">
              <BookText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="sm:hidden text-[#2AA79B]"><BookText className="w-5 h-5" /></span>
                Kamus Terminologi
              </h2>
            </div>
          </div>
          
          <div className="relative shrink-0">
            {/* Optional: we can put a small button or nothing here since search is at the bottom */}
          </div>
        </div>
      </div>

        {/* Alphabet Filter */}
        {!isCenteredMode && (
          <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 custom-scrollbar">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => { setSelectedLetter(''); setPage(0); setInputValue(''); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  selectedLetter === '' && debouncedQuery === ''
                    ? 'bg-[#2AA79B] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Semua
              </button>
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
                <button
                  key={letter}
                  onClick={() => { setSelectedLetter(letter); setPage(0); setInputValue(''); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    selectedLetter === letter
                      ? 'bg-[#2AA79B] text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Table/List */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-800 p-4 sm:p-6 mb-8">
          <div className="relative min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#2AA79B]" />
              <p className="text-sm">Memuat data terminologi...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Search className="w-10 h-10 mb-4 opacity-50" />
              <p className="text-sm">Tidak ada terminologi yang cocok dengan pencarian Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-[#2AA79B]/30 hover:shadow-sm transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-[#2AA79B]/10 rounded-lg group-hover:bg-[#2AA79B]/20 transition-colors">
                      <Hash className="w-4 h-4 text-[#2AA79B]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{highlightText(item.kosa_kata, debouncedQuery)}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{highlightText(item.arti_kata, debouncedQuery)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && totalCount > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center sm:text-left">
              Menampilkan <span className="font-medium text-slate-800 dark:text-slate-200">{page * pageSize + 1}</span> hingga <span className="font-medium text-slate-800 dark:text-slate-200">{Math.min((page + 1) * pageSize, totalCount)}</span> dari <span className="font-medium text-slate-800 dark:text-slate-200">{totalCount}</span> data
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200">
                Halaman {page + 1} dari {totalPages}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Floating Search Bar di Halaman Hasil */}
      <div className="sticky bottom-0 left-0 w-full bg-gradient-to-t from-slate-50 dark:from-[#0b0f19] via-slate-50/95 dark:via-[#0b0f19]/95 to-transparent pt-6 pb-6 px-4 z-40 mt-8 -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full">
        <div className="max-w-3xl mx-auto w-full relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-6 h-6" />
          </div>
          <input
            type="text"
            className="block w-full h-14 pl-14 pr-16 bg-[#e3e6eb] dark:bg-slate-800 border-0 outline-none rounded-full shadow-sm text-base transition-all focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#2AA79B] hover:bg-[#d8dce2] dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 placeholder-slate-500"
            placeholder="Cari kosa kata atau terminologi medis..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading && data.length === 0}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
            {inputValue && (
              <button
                onClick={() => { setInputValue(''); setDebouncedQuery(''); }}
                aria-label="Hapus Pencarian"
                className="p-1 text-slate-450 dark:text-slate-550 hover:text-slate-655 dark:hover:text-slate-300 transition-colors focus:outline-none rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleListening}
              aria-label={isListening ? "Hentikan Perekaman Suara" : "Mulai Pencarian Suara"}
              className={`p-1.5 rounded-full transition-all duration-300 focus:outline-none shrink-0 ${
                isListening 
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/30 animate-pulse hover:bg-red-600' 
                  : 'text-slate-450 dark:text-slate-550 hover:text-[#2AA79B] hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Pencarian Suara"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
