import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, Search, Building2, ChevronDown, Info, ExternalLink } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('all');
  const [sortBy, setSortBy] = useState('code');

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
    let result = tarifData;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.code.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'code') return a.code.localeCompare(b.code);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'kelas3') return a.kelas3 - b.kelas3;
      if (sortBy === 'kelas2') return a.kelas2 - b.kelas2;
      if (sortBy === 'kelas1') return a.kelas1 - b.kelas1;
      return 0;
    });

    return result;
  }, [tarifData, searchQuery, sortBy]);

  const totalKode = tarifData.length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#00B4A4]">
        <div className="w-10 h-10 border-4 border-[#2AA79B]/20 border-t-[#2AA79B] rounded-full animate-spin mb-4" />
        <p className="font-medium text-slate-500 dark:text-slate-400">Memuat data tarif...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Kalkulator Tarif INA-CBG</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Estimasi tarif berdasarkan kode ICD-10 ({totalKode} kode populer)</p>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-6 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Data bersifat <strong>estimasi</strong> berdasarkan Permenkes No. 3/2023. Tarif aktual dapat berbeda tergantung regional, special casemix, dan kebijakan BPJS. Mulai Oktober 2025, sistem beralih ke iDRG.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode ICD atau nama diagnosis..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:border-[#2AA79B] focus:ring-2 focus:ring-[#2AA79B]/20 outline-none transition-all"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 cursor-pointer focus:border-[#2AA79B] focus:ring-2 focus:ring-[#2AA79B]/20 outline-none"
        >
          <option value="code">Urut: Kode</option>
          <option value="title">Urut: Nama</option>
          <option value="kelas3">Urut: Kelas 3 (Termurah)</option>
          <option value="kelas1">Urut: Kelas 1 (Termahal)</option>
        </select>
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <Calculator className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Tidak ada data ditemukan</p>
          <p className="text-sm mt-1">Coba kata kunci lain</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredData.map((item) => (
            <div key={item.code} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#2AA79B] text-white rounded-full font-mono">
                      {item.code}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{item.code.length <= 4 ? 'ICD-9' : 'ICD-10'}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{item.title}</h3>
                </div>

                <div className="flex gap-2 sm:gap-3 shrink-0">
                  <div className="flex-1 sm:flex-none bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2 text-center min-w-[100px]">
                    <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider mb-0.5">Kelas 3</p>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{formatRupiah(item.kelas3)}</p>
                  </div>
                  <div className="flex-1 sm:flex-none bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl px-3 py-2 text-center min-w-[100px]">
                    <p className="text-[9px] font-bold text-purple-500 uppercase tracking-wider mb-0.5">Kelas 2</p>
                    <p className="text-sm font-bold text-purple-700 dark:text-purple-300">{formatRupiah(item.kelas2)}</p>
                  </div>
                  <div className="flex-1 sm:flex-none bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 text-center min-w-[100px]">
                    <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider mb-0.5">Kelas 1</p>
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-300">{formatRupiah(item.kelas1)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
        <p>Data referensi: Permenkes No. 3/2023 tentang Standar Tarif Pelayanan Kesehatan dalam Program JKN</p>
        <p className="mt-1">Untuk data lengkap, kunjungi <a href="https://bpjs.id" target="_blank" rel="noopener noreferrer" className="text-[#2AA79B] hover:underline">bpjs-kesehatan.go.id</a></p>
      </div>
    </div>
  );
}
