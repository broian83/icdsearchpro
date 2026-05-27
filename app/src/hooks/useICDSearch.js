import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { calculateClinicalScore } from '../utils/scoring';
import { ICD10_UMBRELLA, ICD9_UMBRELLA, ICD10_ALIAS, ICD9_ALIAS } from '../constants/icdConstants';

export const useICDSearch = (debouncedQuery, searchType, filterChapter, aliases) => {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Menerjemahkan alias/umbrella jika diperlukan
  const { searchQuery, activeAlias } = useMemo(() => {
    const cleanQuery = debouncedQuery.trim().toLowerCase();
    if (!cleanQuery) return { searchQuery: '', activeAlias: null };

    const UMBRELLA = searchType === 'icd10' ? ICD10_UMBRELLA : ICD9_UMBRELLA;

    if (UMBRELLA[cleanQuery]) {
      return { 
        searchQuery: UMBRELLA[cleanQuery].target, 
        activeAlias: { key: cleanQuery, value: UMBRELLA[cleanQuery].label }
      };
    }

    // Cek Alias Lokal
    if (searchType === 'icd10' || searchType === 'all') {
      if (ICD10_ALIAS[cleanQuery]) {
        return {
          searchQuery: ICD10_ALIAS[cleanQuery],
          activeAlias: { key: cleanQuery, value: `Merujuk ke kode: ${ICD10_ALIAS[cleanQuery]}` }
        };
      }
    }
    if (searchType === 'icd9' || searchType === 'all') {
      if (ICD9_ALIAS[cleanQuery]) {
        return {
          searchQuery: ICD9_ALIAS[cleanQuery],
          activeAlias: { key: cleanQuery, value: `Merujuk ke prosedur: ${ICD9_ALIAS[cleanQuery]}` }
        };
      }
    }

    if (aliases[cleanQuery]) {
      return { 
        searchQuery: aliases[cleanQuery], 
        activeAlias: { key: cleanQuery, value: aliases[cleanQuery] }
      };
    }

    return { 
      searchQuery: debouncedQuery.replace(/\+/g, ' ').replace(/\s+/g, ' ').trim(), 
      activeAlias: null 
    };
  }, [debouncedQuery, aliases, searchType]);

  useEffect(() => {
    let isMounted = true;
    
    const performSearch = async () => {
      if (!searchQuery) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      setSearchError(null);

      try {
        if (searchType === 'all') {
          // Cari di kedua kategori
          const [res10, res9] = await Promise.all([
            supabase.rpc('search_icd', { search_term: searchQuery, search_category: 'icd10', search_chapter: filterChapter }),
            supabase.rpc('search_icd', { search_term: searchQuery, search_category: 'icd9', search_chapter: filterChapter })
          ]);
          
          if (!isMounted) return;

          let combined = [];
          if (res10.data) {
            combined = combined.concat(res10.data.map(item => ({ item, type: 'icd10', clinicalScore: calculateClinicalScore(item, searchQuery, 'icd10') })));
          }
          if (res9.data) {
            combined = combined.concat(res9.data.map(item => ({ item, type: 'icd9', clinicalScore: calculateClinicalScore(item, searchQuery, 'icd9') })));
          }
          combined.sort((a, b) => a.clinicalScore - b.clinicalScore);
          setSearchResults(combined.slice(0, 60));
        } else {
          // Cari di satu kategori
          const { data, error } = await supabase.rpc('search_icd', { 
            search_term: searchQuery, 
            search_category: searchType,
            search_chapter: filterChapter
          });
          
          if (error) throw error;
          if (!isMounted) return;

          let results = (data || []).map(item => ({ item, type: searchType, clinicalScore: calculateClinicalScore(item, searchQuery, searchType) }));
          
          results.sort((a, b) => a.clinicalScore - b.clinicalScore);
          setSearchResults(results.slice(0, 60));
        }
      } catch (err) {
        console.error("Search error:", err);
        if (isMounted) setSearchError(err.message);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    };

    performSearch();

    return () => { isMounted = false; };
  }, [searchQuery, searchType, filterChapter]);

  return { searchResults, isSearching, searchError, searchQuery, activeAlias };
};
