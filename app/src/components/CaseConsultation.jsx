import React, { useState, useEffect } from 'react';
import { Send, Loader2, FileText, AlertCircle, RefreshCcw, Clock, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getGroqCaseConsultation } from '../utils/ai';

export function CaseConsultation({ knowledgeText }) {
  const [resume, setResume] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [caseHistory, setCaseHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('icd_case_history')) || [];
    } catch {
      return [];
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume.trim()) return;

    setIsLoading(true);
    setError(null);
    setAiResponse('');

    try {
      const response = await getGroqCaseConsultation(resume, knowledgeText);
      setAiResponse(response);

      setCaseHistory(prev => {
        const newEntry = {
          id: Date.now(),
          date: new Date().toLocaleString(),
          resume: resume,
          response: response
        };
        const newHistory = [newEntry, ...prev].slice(0, 5);
        localStorage.setItem('icd_case_history', JSON.stringify(newHistory));
        return newHistory;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setResume('');
    setAiResponse('');
    setError(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-[#00B4A4]" />
          Konsultasi Kasus Medis
        </h2>
        <p className="text-slate-500 mt-2">
          Masukkan resume medis lengkap pasien (keluhan, riwayat, pemeriksaan, tindakan). AI akan menganalisis dan menyusun draf koding ICD-10 dan ICD-9 sesuai aturan INA-CBG.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="Contoh: Pasien datang pasca KLL menabrak pohon. Terdapat fraktur femur dextra terbuka. Riwayat DM tipe 2 tidak terkontrol. Dilakukan tindakan ORIF..."
            className="w-full min-h-[160px] p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#00B4A4] focus:ring-4 focus:ring-[#00B4A4]/10 outline-none transition-all resize-y text-slate-700"
            disabled={isLoading}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            type="submit"
            disabled={isLoading || !resume.trim()}
            className="w-full sm:flex-1 bg-[#00B4A4] hover:bg-[#009B8D] text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {isLoading ? 'Menganalisis Kasus...' : 'Analisis & Kodingkan'}
          </button>
          
          {(resume || aiResponse) && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-5 h-5" />
              Reset
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {aiResponse && (
        <div className="bg-gradient-to-br from-slate-50 to-white border border-[#00B4A4]/20 p-6 rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <h3 className="font-bold text-lg text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
            Hasil Analisis Koding
            <span className="text-[10px] uppercase tracking-wider bg-[#00B4A4] text-white px-2 py-1 rounded-md">AI Generated</span>
          </h3>
          <div className="prose prose-slate prose-headings:text-[#00B4A4] max-w-none prose-p:leading-relaxed prose-li:my-1">
            <ReactMarkdown
              components={{
                strong: ({node, ...props}) => <span className="font-bold text-slate-900" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 my-3 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-3 space-y-1" {...props} />,
              }}
            >
              {aiResponse}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {caseHistory.length > 0 && !aiResponse && !isLoading && (
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Riwayat Konsultasi (5 Terakhir)
            </h3>
            <button 
              onClick={() => {
                localStorage.removeItem('icd_case_history');
                setCaseHistory([]);
              }}
              className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Hapus Semua
            </button>
          </div>
          <div className="grid gap-3">
            {caseHistory.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setResume(item.resume);
                  setAiResponse(item.response);
                  setError(null);
                }}
                className="text-left p-4 rounded-xl border border-slate-200 hover:border-[#00B4A4] hover:shadow-sm transition-all bg-slate-50 group focus:outline-none"
              >
                <div className="text-xs text-slate-400 mb-1">{item.date}</div>
                <div className="text-sm text-slate-700 line-clamp-2 group-hover:text-[#00B4A4] font-medium">
                  {item.resume}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
