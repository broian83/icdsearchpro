import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { User, Loader2, Save, CheckCircle2 } from 'lucide-react';

export function ProfileView() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    whatsapp_number: '',
    profession: '',
    institution: '',
    specialization: ''
  });

  useEffect(() => {
    if (user) {
      // Initialize full_name from google auth metadata if available
      setFormData(prev => ({
        ...prev,
        full_name: user.user_metadata?.full_name || ''
      }));
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setFormData({
          full_name: data.full_name || user.user_metadata?.full_name || '',
          whatsapp_number: data.whatsapp_number || '',
          profession: data.profession || '',
          institution: data.institution || '',
          specialization: data.specialization || ''
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: formData.full_name,
        whatsapp_number: formData.whatsapp_number,
        profession: formData.profession,
        institution: formData.institution,
        specialization: formData.specialization,
        updated_at: new Date()
      });

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Gagal menyimpan profil: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#2AA79B]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium text-slate-500 dark:text-slate-400">Memuat data profil...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm border border-purple-200 dark:border-purple-900/50">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Profil Saya</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Lengkapi data diri Anda untuk pengalaman yang lebih baik.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/80 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-200/60 dark:border-slate-805">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border-4 border-slate-50 dark:border-slate-850 flex items-center justify-center shadow-sm">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-slate-400 dark:text-slate-500" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-1">Email Terdaftar</p>
              <p className="text-lg font-medium text-slate-800 dark:text-slate-100">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-[#2AA79B] focus:ring-4 focus:ring-[#2AA79B]/20 transition-all text-slate-800 dark:text-slate-100"
                placeholder="Masukkan nama lengkap Anda"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Nomor WhatsApp</label>
              <input
                type="tel"
                name="whatsapp_number"
                value={formData.whatsapp_number}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-[#2AA79B] focus:ring-4 focus:ring-[#2AA79B]/20 transition-all text-slate-800 dark:text-slate-100"
                placeholder="Contoh: 081234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Pekerjaan / Profesi</label>
              <input
                type="text"
                name="profession"
                value={formData.profession}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-[#2AA79B] focus:ring-4 focus:ring-[#2AA79B]/20 transition-all text-slate-800 dark:text-slate-100"
                placeholder="Contoh: Perekam Medis, Dokter Umum, Perawat"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Institusi / Rumah Sakit</label>
              <input
                type="text"
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-[#2AA79B] focus:ring-4 focus:ring-[#2AA79B]/20 transition-all text-slate-800 dark:text-slate-100"
                placeholder="Nama instansi tempat Anda bekerja"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Spesialisasi / Minat Klinis</label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-[#2AA79B] focus:ring-4 focus:ring-[#2AA79B]/20 transition-all text-slate-850 dark:text-slate-100 font-medium cursor-pointer"
              >
                <option value="" className="dark:bg-slate-900">Pilih Spesialisasi / Minat Klinis...</option>
                <option value="Rekam Medis / PMIK" className="dark:bg-slate-900">Rekam Medis / PMIK</option>
                <option value="Casemix / Koding JKN" className="dark:bg-slate-900">Casemix / Koding JKN</option>
                <option value="Penyakit Dalam" className="dark:bg-slate-900">Penyakit Dalam</option>
                <option value="Bedah" className="dark:bg-slate-900">Bedah</option>
                <option value="Kebidanan & Kandungan (OBGYN)" className="dark:bg-slate-900">Kebidanan & Kandungan (OBGYN)</option>
                <option value="Anak (Pediatri)" className="dark:bg-slate-900">Anak (Pediatri)</option>
                <option value="Kardiovaskular (Jantung)" className="dark:bg-slate-900">Kardiovaskular (Jantung)</option>
                <option value="Neurologi (Saraf)" className="dark:bg-slate-900">Neurologi (Saraf)</option>
                <option value="Onkologi (Kanker)" className="dark:bg-slate-900">Onkologi (Kanker)</option>
                <option value="FKTP / Puskesmas" className="dark:bg-slate-900">FKTP / Puskesmas</option>
                <option value="Lainnya" className="dark:bg-slate-900">Lainnya</option>
              </select>
            </div>

            <div className="pt-4 flex items-center justify-end gap-4">
              {success && (
                <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" /> Tersimpan
                </span>
              )}
              <button
                type="submit"
                disabled={saving}
                className="bg-[#2AA79B] hover:bg-[#208f84] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm focus:ring-4 focus:ring-[#2AA79B]/30 disabled:opacity-70 cursor-pointer"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
