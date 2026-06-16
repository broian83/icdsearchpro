import React, { useState, useMemo } from 'react';
import { Calculator, Search, X, Plus, Trash2, AlertTriangle, CheckCircle, Info, ArrowRight, ChevronDown, FileText, Loader2, Shield, TrendingUp, TrendingDown } from 'lucide-react';
import { useDRGRules } from '../hooks/useDRGRules';
import { simulateClaim, generateWhatIfScenarios, findDRGGroup, classifyCode } from '../utils/drgEngine';

const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const exampleCases = [
  {
    name: "Pneumonia Sederhana",
    description: "Tanpa komorbiditas — Severity 0",
    principalDx: "J18.9",
    secondaryDx: [],
    procedures: [],
    kelas: "kelas2"
  },
  {
    name: "Pneumonia + Komorbiditas",
    description: "Dengan HT, DM, dan Gagal Jantung — Severity II",
    principalDx: "J18.9",
    secondaryDx: ["I10", "E11.9", "I50.9"],
    procedures: [],
    kelas: "kelas2"
  },
  {
    name: "Gagal Jantung + Ventilator",
    description: "Dengan Gagal Ginjal dan Gagal Napas — Severity III",
    principalDx: "I50.9",
    secondaryDx: ["N17.9", "J96.00", "I10"],
    procedures: ["96.71"],
    kelas: "kelas2"
  },
  {
    name: "Stroke Iskemik",
    description: "Dengan Hipertensi dan DM — Severity II",
    principalDx: "I63.9",
    secondaryDx: ["I10", "E11.9"],
    procedures: [],
    kelas: "kelas2"
  },
  {
    name: "Sepsis + Hemodialisis",
    description: "Kasus berat — Severity III",
    principalDx: "A41.9",
    secondaryDx: ["N17.9", "E11.9", "I10", "J96.00"],
    procedures: ["39.95"],
    kelas: "kelas2"
  }
];

export default function SimulasiKlaim() {
  const [principalDx, setPrincipalDx] = useState('');
  const [secondaryDx, setSecondaryDx] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [kelas, setKelas] = useState('kelas2');

  const [dxSearchQuery, setDxSearchQuery] = useState('');
  const [procSearchQuery, setProcSearchQuery] = useState('');
  const [showDxDropdown, setShowDxDropdown] = useState(false);
  const [showProcDropdown, setShowProcDropdown] = useState(false);

  const [hasSimulated, setHasSimulated] = useState(false);
  const [drgResult, setDrgResult] = useState(null);
  const [whatIfScenarios, setWhatIfScenarios] = useState([]);

  const [icd10Data, setIcd10Data] = useState([]);
  const [icd9Data, setIcd9Data] = useState([]);

  const { drgGroups, ccRules, procedureRules, loading: rulesLoading } = useDRGRules();

  React.useEffect(() => {
    Promise.all([
      fetch('/icd10.json').then(r => r.json()),
      fetch('/icd9.json').then(r => r.json())
    ]).then(([icd10, icd9]) => {
      setIcd10Data(icd10);
      setIcd9Data(icd9);
    }).catch(console.error);
  }, []);

  const filteredICD10 = useMemo(() => {
    if (!dxSearchQuery.trim()) return [];
    const q = dxSearchQuery.toLowerCase();
    return icd10Data
      .filter(item => item.code.toLowerCase().includes(q) || item.title?.toLowerCase().includes(q) || item.desc?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [icd10Data, dxSearchQuery]);

  const filteredICD9 = useMemo(() => {
    if (!procSearchQuery.trim()) return [];
    const q = procSearchQuery.toLowerCase();
    return icd9Data
      .filter(item => item.code.toLowerCase().includes(q) || item.title?.toLowerCase().includes(q) || item.desc?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [icd9Data, procSearchQuery]);

  const handleSelectPrincipalDx = (code) => {
    setPrincipalDx(code);
    setDxSearchQuery('');
    setShowDxDropdown(false);
  };

  const handleAddSecondaryDx = (code) => {
    if (!secondaryDx.includes(code) && code !== principalDx) {
      setSecondaryDx(prev => [...prev, code]);
    }
    setDxSearchQuery('');
    setShowDxDropdown(false);
  };

  const handleRemoveSecondaryDx = (code) => {
    setSecondaryDx(prev => prev.filter(c => c !== code));
  };

  const handleAddProcedure = (code) => {
    if (!procedures.includes(code)) {
      setProcedures(prev => [...prev, code]);
    }
    setProcSearchQuery('');
    setShowProcDropdown(false);
  };

  const handleRemoveProcedure = (code) => {
    setProcedures(prev => prev.filter(c => c !== code));
  };

  const handleSimulate = () => {
    if (!principalDx.trim()) return;
    const result = simulateClaim(
      { principalDx: principalDx.trim(), secondaryDx, procedures, kelas },
      drgGroups, ccRules, procedureRules
    );
    const scenarios = generateWhatIfScenarios(
      { principalDx: principalDx.trim(), secondaryDx, procedures, kelas },
      drgGroups, ccRules, procedureRules
    );
    setDrgResult(result);
    setWhatIfScenarios(scenarios);
    setHasSimulated(true);
  };

  const handleLoadExample = (example) => {
    setPrincipalDx(example.principalDx);
    setSecondaryDx(example.secondaryDx);
    setProcedures(example.procedures);
    setKelas(example.kelas);
  };

  const handleReset = () => {
    setPrincipalDx('');
    setSecondaryDx([]);
    setProcedures([]);
    setKelas('kelas2');
    setDrgResult(null);
    setWhatIfScenarios([]);
    setHasSimulated(false);
    setDxSearchQuery('');
    setProcSearchQuery('');
  };

  const getClassificationBadge = (code) => {
    const cls = classifyCode(code, ccRules);
    if (cls === 'MCC') return <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">MCC</span>;
    if (cls === 'CC') return <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">CC</span>;
    return null;
  };

  const getSeverityBadge = (level) => {
    const colors = {
      0: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      1: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      3: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };
    return colors[level] || colors[0];
  };

  const getIssueColor = (type) => {
    if (type === 'error') return 'text-red-600 dark:text-red-400';
    if (type === 'warning') return 'text-amber-600 dark:text-amber-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const getIssueBg = (type) => {
    if (type === 'error') return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (type === 'warning') return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
    return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
  };

  const FormSection = () => (
    <div className="w-full max-w-2xl space-y-4">
      {/* Principal Diagnosis */}
      <div>
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
          Diagnosis Primer <span className="text-red-500">*</span>
        </label>
        {principalDx ? (
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-bold">
              {principalDx}
              {getClassificationBadge(principalDx)}
              <button
                onClick={() => setPrincipalDx('')}
                className="ml-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={dxSearchQuery}
              onChange={(e) => {
                setDxSearchQuery(e.target.value);
                setShowDxDropdown(true);
              }}
              onFocus={() => setShowDxDropdown(true)}
              onBlur={() => setTimeout(() => setShowDxDropdown(false), 200)}
              placeholder="Ketik kode atau nama diagnosis (contoh: J18.9, Pneumonia)"
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {showDxDropdown && filteredICD10.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                {filteredICD10.map((item) => (
                  <button
                    key={item.code}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectPrincipalDx(item.code)}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                  >
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded shrink-0">
                      {item.code}
                    </span>
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                      {item.title || item.desc || '—'}
                    </span>
                    {classifyCode(item.code, ccRules) && getClassificationBadge(item.code)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Secondary Diagnoses */}
      <div>
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
          Diagnosis Sekunder (Komorbiditas)
        </label>
        {secondaryDx.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {secondaryDx.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold"
              >
                {code}
                {getClassificationBadge(code)}
                <button
                  onClick={() => handleRemoveSecondaryDx(code)}
                  className="hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Plus className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={dxSearchQuery}
            onChange={(e) => {
              setDxSearchQuery(e.target.value);
              setShowDxDropdown(true);
            }}
            onFocus={() => setShowDxDropdown(true)}
            onBlur={() => setTimeout(() => setShowDxDropdown(false), 200)}
            placeholder="Tambah diagnosis sekunder..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {showDxDropdown && filteredICD10.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
              {filteredICD10.map((item) => (
                <button
                  key={item.code}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAddSecondaryDx(item.code)}
                  disabled={secondaryDx.includes(item.code) || item.code === principalDx}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded shrink-0">
                    {item.code}
                  </span>
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                    {item.title || item.desc || '—'}
                  </span>
                  {secondaryDx.includes(item.code) && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                  {classifyCode(item.code, ccRules) && getClassificationBadge(item.code)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Procedures */}
      <div>
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
          Prosedur / ICD-9-CM
        </label>
        {procedures.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {procedures.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold"
              >
                {code}
                <button
                  onClick={() => handleRemoveProcedure(code)}
                  className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Plus className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={procSearchQuery}
            onChange={(e) => {
              setProcSearchQuery(e.target.value);
              setShowProcDropdown(true);
            }}
            onFocus={() => setShowProcDropdown(true)}
            onBlur={() => setTimeout(() => setShowProcDropdown(false), 200)}
            placeholder="Tambah prosedur (contoh: 96.71, 39.95)..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {showProcDropdown && filteredICD9.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
              {filteredICD9.map((item) => (
                <button
                  key={item.code}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAddProcedure(item.code)}
                  disabled={procedures.includes(item.code)}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded shrink-0">
                    {item.code}
                  </span>
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                    {item.title || item.desc || '—'}
                  </span>
                  {procedures.includes(item.code) && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hospital Class */}
      <div>
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
          Kelas Rumah Sakit
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'kelas1', label: 'Kelas 1', color: 'amber' },
            { value: 'kelas2', label: 'Kelas 2', color: 'purple' },
            { value: 'kelas3', label: 'Kelas 3', color: 'blue' }
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setKelas(opt.value)}
              className={`py-2 rounded-xl text-sm font-bold transition-all ${
                kelas === opt.value
                  ? opt.color === 'amber'
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 ring-2 ring-amber-400 dark:ring-amber-600'
                    : opt.color === 'purple'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-2 ring-purple-400 dark:ring-purple-600'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400 dark:ring-blue-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          onClick={handleSimulate}
          disabled={!principalDx.trim() || rulesLoading}
          className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:cursor-not-allowed"
        >
          {rulesLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Calculator className="w-4 h-4" />
          )}
          Simulasi Klaim
        </button>
        <div className="relative group">
          <button
            className="flex items-center gap-1.5 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <FileText className="w-4 h-4" />
            Contoh Kasus
            <ChevronDown className="w-3 h-3" />
          </button>
          <div className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            {exampleCases.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => handleLoadExample(ex)}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0"
              >
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{ex.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{ex.description}</p>
              </button>
            ))}
          </div>
        </div>
        {hasSimulated && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {!hasSimulated ? (
        <div className="flex flex-col items-center justify-center min-h-[72vh] px-4">
          <div className="flex items-center gap-3 sm:gap-4 mb-2">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 relative z-10 shadow-md">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Simulasi Klaim</h1>
          </div>
          <p className="text-blue-600 dark:text-blue-400 font-extrabold text-[10px] sm:text-xs mt-1 uppercase tracking-widest">BPJS Claim Verification Tool</p>

          <h3 className="text-sm sm:text-base text-slate-600 dark:text-slate-350 mt-6 font-semibold text-center max-w-lg">
            Masukkan diagnosis dan prosedur untuk simulasi pengelompokan DRG dan estimasi pembayaran BPJS
          </h3>

          <div className="w-full max-w-2xl mt-8">
            <FormSection />
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Compact header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 relative z-10 shadow-sm">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Simulasi Klaim</h1>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest">BPJS Claim Verification Tool</p>
            </div>
          </div>

          <FormSection />

          <div className="mt-6 space-y-4">
            {/* DRG Group Result Card */}
            {drgResult && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden mb-4">
                <div className="px-5 pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-blue-600 text-white rounded-full">DRG {drgResult.drg.code}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{drgResult.drg.mdc}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{drgResult.drg.nameID}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{drgResult.drg.mdcName}</p>
                </div>
                <div className="grid grid-cols-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="px-3 py-3 text-center border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Severity</p>
                    <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200">{drgResult.severity.level}</p>
                    <p className="text-[9px] text-slate-400">{drgResult.severity.mccCount} MCC, {drgResult.severity.ccCount} CC</p>
                  </div>
                  <div className="px-3 py-3 text-center border-r border-slate-100 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-950/20">
                    <p className="text-[9px] font-bold text-blue-400 uppercase">Kelas 3</p>
                    <p className="text-sm font-extrabold text-blue-600 dark:text-blue-300">{formatRupiah(drgResult.payment.kelas3)}</p>
                  </div>
                  <div className="px-3 py-3 text-center border-r border-slate-100 dark:border-slate-800 bg-purple-50/50 dark:bg-purple-950/20">
                    <p className="text-[9px] font-bold text-purple-400 uppercase">Kelas 2</p>
                    <p className="text-sm font-extrabold text-purple-600 dark:text-purple-300">{formatRupiah(drgResult.payment.kelas2)}</p>
                  </div>
                  <div className="px-3 py-3 text-center bg-amber-50/50 dark:bg-amber-950/20">
                    <p className="text-[9px] font-bold text-amber-400 uppercase">Kelas 1</p>
                    <p className="text-sm font-extrabold text-amber-600 dark:text-amber-300">{formatRupiah(drgResult.payment.kelas1)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* CC/MCC Detail */}
            {drgResult && drgResult.severity.matchedCC && drgResult.severity.matchedCC.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Komorbiditas & Komplikasi (CC/MCC)</h3>
                  </div>
                </div>
                <div className="px-5 py-3 space-y-2">
                  {drgResult.severity.matchedCC.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-1.5">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-5">{idx + 1}.</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded shrink-0">
                        {item.code}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.description || '—'}</span>
                      <span className={`ml-auto px-2 py-0.5 text-[9px] font-bold rounded-full shrink-0 ${
                        item.type === 'MCC'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Procedure Impact */}
            {drgResult && drgResult.procedureImpact && drgResult.procedureImpact.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-500" />
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Dampak Prosedur</h3>
                  </div>
                </div>
                <div className="px-5 py-3 space-y-3">
                  {drgResult.procedureImpact.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                          {item.code}
                        </span>
                        {item.additionalCost > 0 ? (
                          <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +{formatRupiah(item.additionalCost)}
                          </span>
                        ) : item.additionalCost < 0 ? (
                          <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" />
                            {formatRupiah(item.additionalCost)}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.description || 'Prosedur tercatat'}</p>
                      {item.severityBoost > 0 && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">
                          Severity boost: +{item.severityBoost}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coding Accuracy Report */}
            {drgResult && drgResult.accuracyReport && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Akurasi Koding</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            drgResult.accuracyReport.score >= 80
                              ? 'bg-green-500'
                              : drgResult.accuracyReport.score >= 60
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${drgResult.accuracyReport.score}%` }}
                        />
                      </div>
                      <span className={`text-xs font-extrabold ${
                        drgResult.accuracyReport.score >= 80
                          ? 'text-green-600 dark:text-green-400'
                          : drgResult.accuracyReport.score >= 60
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {drgResult.accuracyReport.score}%
                      </span>
                    </div>
                  </div>
                </div>
                {drgResult.accuracyReport.issues && drgResult.accuracyReport.issues.length > 0 && (
                  <div className="px-5 py-3 space-y-2">
                    {drgResult.accuracyReport.issues.map((issue, idx) => (
                      <div key={idx} className={`flex items-start gap-2 p-2 rounded-lg border ${getIssueBg(issue.type)}`}>
                        {issue.type === 'error' && <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${getIssueColor(issue.type)}`} />}
                        {issue.type === 'warning' && <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${getIssueColor(issue.type)}`} />}
                        {issue.type === 'info' && <Info className={`w-4 h-4 mt-0.5 shrink-0 ${getIssueColor(issue.type)}`} />}
                        <div className="min-w-0">
                          <p className={`text-xs font-bold ${getIssueColor(issue.type)}`}>{issue.message}</p>
                          {issue.recommendation && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Rekomendasi: {issue.recommendation}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* What-If Analysis */}
            {whatIfScenarios.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Analisis What-If</h3>
                  </div>
                </div>
                <div className="px-5 py-3 space-y-3">
                  {whatIfScenarios.map((scenario, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{scenario.description}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {scenario.severityBefore !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-semibold">Severity:</span>
                            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${getSeverityBadge(scenario.severityBefore)}`}>
                              {scenario.severityBefore}
                            </span>
                            <span className="text-[10px] text-slate-400">→</span>
                            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${getSeverityBadge(scenario.severityAfter)}`}>
                              {scenario.severityAfter}
                            </span>
                          </div>
                        )}
                        {scenario.paymentDiff !== undefined && (
                          <div className={`flex items-center gap-1 text-xs font-bold ${
                            scenario.paymentDiff > 0
                              ? 'text-green-600 dark:text-green-400'
                              : scenario.paymentDiff < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {scenario.paymentDiff > 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : scenario.paymentDiff < 0 ? (
                              <TrendingDown className="w-3 h-3" />
                            ) : null}
                            {scenario.paymentDiff > 0 ? '+' : ''}{formatRupiah(scenario.paymentDiff)}
                          </div>
                        )}
                      </div>
                      {scenario.explanation && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 italic">
                          {scenario.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>Disclaimer:</strong> Simulasi ini menggunakan model rules sederhana dan bukan pengganti grouper resmi BPJS.
                Tarif aktual bervariasi menurut regional, special casemix, dan kebijakan BPJS Kesehatan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
