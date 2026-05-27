import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data || {});
    } catch (err) {
      console.error('Error fetching profile context:', err);
    }
  };

  useEffect(() => {
    // Memeriksa session saat aplikasi dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Mendengarkan perubahan state auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);

      if (event === 'SIGNED_IN' && session?.user) {
        // Hanya tampilkan toast jika user memang sedang dalam proses login
        if (localStorage.getItem('icd_logging_in') === '1') {
          const userName = session.user.user_metadata?.full_name || session.user.email;
          showToast(`Selamat datang kembali, ${userName}!`, 'success');
          localStorage.removeItem('icd_logging_in');
        }
      } else if (event === 'SIGNED_OUT') {
        showToast('Anda telah berhasil keluar dari akun.', 'info');
      }
    });

    return () => subscription.unsubscribe();
  }, [showToast]);

  const loginWithGoogle = async () => {
    try {
      localStorage.setItem('icd_logging_in', '1');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      localStorage.removeItem('icd_logging_in');
      console.error('Error logging in with Google:', error.message);
      showToast('Gagal login: ' + error.message, 'error');
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error logging out:', error.message);
      showToast('Gagal keluar: ' + error.message, 'error');
    }
  };

  const value = {
    user,
    profile,
    isLoggedIn: !!user,
    loginWithGoogle,
    logout,
    loading,
    refreshProfile: () => user && fetchProfile(user.id)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

