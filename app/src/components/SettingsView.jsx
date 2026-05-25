import React from 'react';
import { Settings, Moon, Globe } from 'lucide-react';

export function SettingsView() {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pengaturan</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola preferensi dan akun Anda.</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 opacity-60">
          <div className="flex items-center gap-3">
            <Moon className="w-5 h-5 text-slate-400" />
            <div>
              <h4 className="font-semibold text-slate-800">Mode Gelap (Dark Mode)</h4>
              <p className="text-xs text-slate-500">Segera hadir di pembaruan selanjutnya</p>
            </div>
          </div>
          <div className="w-10 h-5 bg-slate-200 rounded-full cursor-not-allowed relative">
            <div className="w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] left-[3px]"></div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 opacity-60">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-slate-400" />
            <div>
              <h4 className="font-semibold text-slate-800">Preferensi Bahasa AI</h4>
              <p className="text-xs text-slate-500">Pilih bahasa default untuk asisten (Segera hadir)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
