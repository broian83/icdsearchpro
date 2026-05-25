import React from 'react';
import { X, Lock, LogIn, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AuthModal({ isOpen, onClose, message }) {
  const { loginWithGoogle } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#00B4A4] to-[#D6E400]"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-700 rounded-full transition-colors focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pt-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[#00B4A4]/10 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm relative">
            <Lock className="w-7 h-7 text-[#00B4A4]" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
              <ShieldAlert className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Fitur Terkunci</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
            {message || "Silakan masuk atau buat akun gratis terlebih dahulu untuk mengakses fitur ini."}
          </p>

          <button
            onClick={() => {
              onClose();
              loginWithGoogle();
            }}
            className="w-full bg-[#00B4A4] hover:bg-[#009B8D] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm mb-3"
          >
            <LogIn className="w-5 h-5" /> Login dengan Google
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
