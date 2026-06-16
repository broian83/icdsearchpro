import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { supabase } from '../lib/supabase';
import { calculateClinicalScore } from '../utils/scoring';
import { ICD10_UMBRELLA, ICD9_UMBRELLA, ICD10_ALIAS, ICD9_ALIAS } from '../constants/icdConstants';

const LOCAL_SEARCH_LIMIT = 60;

const localSearch = (query, dataType, chapterFilter, searchType) => {
  if (!dataType || dataType.length === 0) return [];

  const fuse = new Fuse(dataType, {
    keys: [
      { name: 'code', weight: 3 },
      { name: 'title', weight: 2 },
      { name: 'desc', weight: 2 }
    ],
    threshold: 0.5,
    distance: 200,
    includeScore: true,
    limit: 100
  });

  let results = fuse.search(query);

  if (chapterFilter && chapterFilter !== 'all') {
    results = results.filter(r => {
      const firstChar = r.item.code.charAt(0).toUpperCase();
      if (chapterFilter.includes('|')) {
        return chapterFilter.split('|').some(ch => firstChar === ch);
      }
      return firstChar === chapterFilter.toUpperCase();
    });
  }

  return results.map(r => ({
    item: r.item,
    score: 1 / (r.score + 0.01),
    type: searchType === 'all'
      ? (r.item.code.match(/^[V-Z]/) ? 'icd10' : (r.item.code.match(/^\d/) ? 'icd9' : 'icd10'))
      : searchType
  }));
};

export const useICDSearch = (debouncedQuery, searchType, filterChapter, aliases, icd10Data, icd9Data) => {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isUsingLocalSearch, setIsUsingLocalSearch] = useState(false);

  // Translate alias/umbrella terms
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
        // Try Supabase first
        let data;
        if (searchType === 'all') {
          const [res10, res9] = await Promise.all([
            supabase.rpc('search_icd', { search_term: searchQuery, search_category: 'icd10', search_chapter: filterChapter }),
            supabase.rpc('search_icd', { search_term: searchQuery, search_category: 'icd9', search_chapter: filterChapter })
          ]);

          if (res10.error || res9.error) throw new Error('Supabase RPC failed');

          data = [
            ...(res10.data || []).map(i => ({ ...i, type: 'icd10' })),
            ...(res9.data || []).map(i => ({ ...i, type: 'icd9' }))
          ];
        } else {
          const { data: res, error } = await supabase.rpc('search_icd', {
            search_term: searchQuery,
            search_category: searchType,
            search_chapter: filterChapter
          });
          if (error) throw error;
          data = (res || []).map(i => ({ ...i, type: searchType }));
        }

        if (!isMounted) return;

        let results = data.map(item => ({
          item,
          type: item.type || searchType,
          clinicalScore: calculateClinicalScore(item, searchQuery, item.type || searchType)
        }));

        results.sort((a, b) => a.clinicalScore - b.clinicalScore);
        setSearchResults(results.slice(0, LOCAL_SEARCH_LIMIT));
        setIsUsingLocalSearch(false);

      } catch (err) {
        // Fallback to local search
        console.warn('Supabase search failed, using local:', err.message);
        if (!isMounted) return;

        const dataType = searchType === 'icd9' ? icd9Data : icd10Data;
        const localResults = localSearch(searchQuery, dataType, filterChapter, searchType);

        let results = localResults.map(r => ({
          item: r.item,
          type: r.type,
          clinicalScore: calculateClinicalScore(r, searchQuery, r.type)
        }));

        results.sort((a, b) => a.clinicalScore - b.clinicalScore);
        setSearchResults(results.slice(0, LOCAL_SEARCH_LIMIT));
        setIsUsingLocalSearch(true);
        setSearchError(null); // Clear error since local search succeeded
      } finally {
        if (isMounted) setIsSearching(false);
      }
    };

    performSearch();

    return () => { isMounted = false; };
  }, [searchQuery, searchType, filterChapter, icd10Data, icd9Data]);

  return { searchResults, isSearching, searchError, searchQuery, activeAlias, isUsingLocalSearch };
};
