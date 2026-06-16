import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, Search, X, Loader2, ChevronDown } from 'lucide-react';

const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export function TarifCalculator() {
  const [tarifData, setTarifData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetch('/data/tarif_inacbg.json')
      .then(res => res.json())
      .then(data => {
        setTarifData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load tarif data:', err);
        setLoading(false);
      });
  }, []);

  const filteredData = useMemo(() => {
    if (!inputValue.trim()) return [];
    const q = inputValue.toLowerCase();
    return tarifData.filter(item =>
      item.code.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q)
    );
  }, [tarifData, inputValue]);

  const totalKode = tarifData.length;

  const handleSearch = () => {
    if (inputValue.trim()) {
      setHasSearched(true);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* Homepage-style centered search */}
      {!hasSearched ? (
        <div className="flex flex-col items-center justify-center min-h-[72vh] px-4">
          
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-2">
              <div className="relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 relative z-10 shadow-md">
                  <Calculator className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Tarif INA-CBG</h1>
            </div>
            <p className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] sm:text-xs mt-1 uppercase tracking-widest">Estimasi Biaya Rawat Inap BPJS</p>
            
            <h3 className="text-sm sm:text-base text-slate-600 dark:text-slate-350 mt-6 font-semibold">
              Cari kode ICD atau nama diagnosis untuk melihat tarif
            </h3>
          </div>

          {/* Search Bar — same style as main search */}
          <div className="w-full max-w-2xl relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-emerald-500">
              <Search className="w-6 h-6 animate-pulse" />
            </div>
            <input
              type="text"
              className="block w-full h-16 pl-14 pr-14 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 outline-none rounded-full shadow-lg text-base sm:text-lg transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 hover:border-slate-350 dark:border-slate-750 dark:text-slate-100"
              placeholder="Cari kode ICD atau diagnosis (mis. Pneumonia, J18.9, Stroke)..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-1.5">
              {inputValue && (
                <button
                  onClick={() => { setInputValue(''); setHasSearched(false); }}
                  className="p-1 text-slate-400 dark:text-slate-550 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick codes */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['J18.9', 'E11.9', 'I63', 'I21.9', 'K35.8', 'O80'].map(code => (
              <button
                key={code}
                onClick={() => { setInputValue(code); setHasSearched(true); }}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-sm"
              >
                {code}
              </button>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
            {totalKode} kode ICD populer • Data referensi Permenkes No. 3/2023
          </p>
        </div>
      ) : (
        /* Results view */
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-400 pb-32">
          
          {/* Compact search bar at top */}
          <div className="mb-6">
            <div className="relative group max-w-3xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-emerald-500">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                className="block w-full h-14 pl-13 pr-14 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 outline-none rounded-full shadow-lg text-sm sm:text-base transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:text-slate-100"
                placeholder="Cari kode ICD atau diagnosis..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                autoFocus
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-1.5">
                {inputValue && (
                  <button
                    onClick={() => { setInputValue(''); setHasSearched(false); }}
                    className="p-1 text-slate-400 dark:text-slate-550 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="max-w-3xl mx-auto mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 flex items-start gap-2">
            <span className="text-amber-600 text-sm mt-0.5 shrink-0">⚠</span>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Estimasi berdasarkan Permenkes No. 3/2023. Tarif aktual bervariasi menurut regional, special casemix, dan kebijakan BPJS.
            </p>
          </div>

          {/* Results */}
          {filteredData.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm max-w-3xl mx-auto">
              <Search className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600 animate-pulse" />
              <p className="text-base font-bold text-slate-600 dark:text-slate-300">Tidak ada tarif ditemukan</p>
              <p className="text-xs text-slate-400 mt-1.5">Coba kode lain seperti J18.9, E11.9, atau kata kunci Pneumonia</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-3">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 px-1">
                {filteredData.length} hasil untuk "{inputValue}"
              </p>
              
              {filteredData.map((item) => (
                <div key={item.code} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Header: code badge + title — same style as ResultCard */}
                  <div className="px-5 pt-4 pb-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-[#2AA79B] text-white rounded-full font-mono tracking-wide">
                        {item.code}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                        {item.code.length <= 4 ? 'ICD-9-CM' : 'ICD-10'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  {/* Tarif cards — 3 columns */}
                  <div className="grid grid-cols-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="px-4 py-3 text-center border-r border-slate-100 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-950/20">
                      <p className="text-[9px] font-bold text-blue-400 dark:text-blue-500 uppercase tracking-widest mb-0.5">Kelas 3</p>
                      <p className="text-sm font-extrabold text-blue-600 dark:text-blue-300">{formatRupiah(item.kelas3)}</p>
                    </div>
                    <div className="px-4 py-3 text-center border-r border-slate-100 dark:border-slate-800 bg-purple-50/50 dark:bg-purple-950/20">
                      <p className="text-[9px] font-bold text-purple-400 dark:text-purple-500 uppercase tracking-widest mb-0.5">Kelas 2</p>
                      <p className="text-sm font-extrabold text-purple-600 dark:text-purple-300">{formatRupiah(item.kelas2)}</p>
                    </div>
                    <div className="px-4 py-3 text-center bg-amber-50/50 dark:bg-amber-950/20">
                      <p className="text-[9px] font-bold text-amber-400 dark:text-amber-500 uppercase tracking-widest mb-0.5">Kelas 1</p>
                      <p className="text-sm font-extrabold text-amber-600 dark:text-amber-300">{formatRupiah(item.kelas1)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="max-w-3xl mx-auto mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
            <p>Data referensi: Permenkes No. 3/2023 tentang Standar Tarif Pelayanan Kesehatan dalam Program JKN</p>
            <p className="mt-1">Mulai Oktober 2025, sistem beralih ke <span className="font-semibold text-slate-500 dark:text-slate-400">iDRG</span> (Indonesia Diagnosis Related Group)</p>
          </div>
        </div>
      )}
    </div>
  );
}
