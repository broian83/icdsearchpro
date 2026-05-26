import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, FileText, AlertCircle, RefreshCcw, Clock, Trash2, Copy, Check, Mic, MicOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getGroqCaseConsultation } from '../utils/ai';

export function CaseConsultation({ knowledgeText }) {
  const [resume, setResume] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Browser Anda tidak mendukung fitur Dikte Suara. Silakan gunakan Google Chrome, Edge, atau Safari terbaru.");
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
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
           finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) {
          setResume(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#00B4A4]" />
            Konsultasi Kasus Medis
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Masukkan resume medis lengkap pasien (keluhan, riwayat, pemeriksaan, tindakan). AI akan menganalisis dan menyusun draf koding ICD-10 dan ICD-9 sesuai aturan INA-CBG.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Contoh: Pasien datang pasca KLL menabrak pohon. Terdapat fraktur femur dextra terbuka. Riwayat DM tipe 2 tidak terkontrol. Dilakukan tindakan ORIF..."
              className="w-full min-h-[160px] p-4 pb-14 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00B4A4] focus:ring-4 focus:ring-[#00B4A4]/20 focus:shadow-[0_0_20px_rgba(0,180,164,0.15)] outline-none transition-all resize-y text-slate-700 dark:text-slate-200"
              disabled={isLoading}
            />
            
            <button
              type="button"
              onClick={toggleListening}
              className={`absolute bottom-4 right-4 p-2.5 rounded-xl flex items-center gap-2 font-medium text-sm transition-all duration-300 shadow-sm ${
                isListening 
                  ? 'bg-red-500 text-white shadow-red-500/30 animate-pulse hover:bg-red-600' 
                  : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-[#00B4A4] hover:bg-slate-50'
              }`}
              title="Dikte Suara (Voice to Text)"
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" /> Berhenti
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" /> Dikte
                </>
              )}
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              type="submit"
              disabled={isLoading || !resume.trim()}
              className="w-full sm:flex-1 bg-[#00B4A4] hover:bg-[#009B8D] hover:shadow-lg hover:-translate-y-0.5 active:scale-95 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {isLoading ? 'Menganalisis Kasus...' : 'Analisis & Kodingkan'}
            </button>
            
            {(resume || aiResponse) && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
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

        {isLoading && !aiResponse && (
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800 border border-slate-100 dark:border-slate-700/50 p-6 rounded-2xl shadow-sm animate-in fade-in">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse w-1/3 mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse w-full"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse w-5/6"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse w-4/5"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse w-3/4 mt-4"></div>
            </div>
          </div>
        )}

        {aiResponse && (
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-800 border border-[#00B4A4]/20 p-6 rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/50">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Hasil Analisis Koding
                <span className="text-[10px] uppercase tracking-wider bg-[#00B4A4] text-white px-2 py-1 rounded-md">AI Generated</span>
              </h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(aiResponse);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }}
                className="p-2 text-slate-400 hover:text-[#00B4A4] hover:bg-[#00B4A4]/10 rounded-lg transition-colors flex items-center gap-1.5"
                title="Salin Hasil"
              >
                {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                <span className="text-xs font-medium hidden sm:inline">{isCopied ? 'Tersalin!' : 'Salin'}</span>
              </button>
            </div>
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
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
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
                  className="text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#00B4A4] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 bg-white/50 dark:bg-slate-800/50 group focus:outline-none"
                >
                  <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">{item.date}</div>
                  <div className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2 group-hover:text-[#00B4A4] font-medium transition-colors">
                    {item.resume}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
