import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getCache, setCache } from '../utils/db';

export const useICDData = (isLoggedIn, user) => {
  const [icd10Data, setIcd10Data] = useState([]);
  const [icd9Data, setIcd9Data] = useState([]);
  const [knowledgeText, setKnowledgeText] = useState('');
  const [daggerAsteriskData, setDaggerAsteriskData] = useState(null);
  const [aliases, setAliases] = useState({});
  const [crossrefData, setCrossrefData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      let hasCache = false;
      try {
        const [c10, c9, cK, cDA, cA] = await Promise.all([
          getCache('icd10'),
          getCache('icd9'),
          getCache('knowledge'),
          getCache('daggerAsterisk'),
          getCache('aliases')
        ]);
        if (c10 && c9 && cK && cA) {
          setIcd10Data(c10);
          setIcd9Data(c9);
          setKnowledgeText(cK);
          if (cDA) setDaggerAsteriskData(cDA);
          setAliases(cA);
          setLoading(false);
          hasCache = true;
        }
      } catch (err) {
        console.warn("Cache retrieval failed:", err);
      }

      try {
        if (!hasCache) setLoading(true);

        const fetchDynamicAliases = async () => {
          if (!isLoggedIn || !user) return {};
          try {
            const { data, error } = await supabase.from('custom_abbreviations').select('abbreviation, target_word, is_global');
            if (error) throw error;
            const custom = {};
            data.forEach(item => {
              if (item.is_global) {
                custom[item.abbreviation.toLowerCase()] = item.target_word;
              }
            });
            return custom;
          } catch (e) {
            console.warn("Failed to fetch aliases from Supabase:", e);
            return {};
          }
        };

        const [res10, res9, resKnowledge, resDA, resAliases, resCrossref, dynamicAliases] = await Promise.all([
          fetch('/icd10.json').then(res => res.json()),
          fetch('/icd9.json').then(res => res.json()),
          fetch('/knowledge.md').then(res => res.text()),
          fetch('/kodedeggerdanasterik.json').then(res => res.json()).catch(() => null),
          fetch('/singkatan.json').then(res => res.json()).catch(() => ({})),
          fetch('/crossref.json').then(res => res.json()).catch(() => ({})),
          fetchDynamicAliases()
        ]);

        setCrossrefData(resCrossref || {});
        const finalAliases = { ...resAliases, ...dynamicAliases };

        if (!hasCache || JSON.stringify(finalAliases) !== JSON.stringify(aliases) || res10.length !== icd10Data.length) {
          setIcd10Data(res10);
          setIcd9Data(res9);
          setKnowledgeText(resKnowledge);
          setDaggerAsteriskData(resDA);
          setAliases(finalAliases);

          setCache('icd10', res10);
          setCache('icd9', res9);
          setCache('knowledge', resKnowledge);
          if (resDA) setCache('daggerAsterisk', resDA);
          setCache('aliases', finalAliases);
        }
        setError(null);
      } catch (err) {
        console.error("Error loading data from network:", err);
        if (!hasCache) {
          setError('Gagal memuat data. Silakan hubungkan perangkat Anda ke internet.');
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isLoggedIn, user]);

  return { icd10Data, icd9Data, knowledgeText, daggerAsteriskData, aliases, crossrefData, loading, error };
};
