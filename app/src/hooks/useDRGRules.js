import { useState, useEffect } from 'react';

/**
 * Hook to load DRG rules data for BPJS claim simulation
 * Loads three JSON files: drg_groups.json, cc_mcc_rules.json, procedure_impact.json
 * 
 * @returns {{ drgGroups: Object|null, ccRules: Object|null, procedureRules: Object|null, loading: boolean, error: string|null }}
 */
export function useDRGRules() {
  const [drgGroups, setDrgGroups] = useState(null);
  const [ccRules, setCcRules] = useState(null);
  const [procedureRules, setProcedureRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRules() {
      try {
        const [drgRes, ccRes, procRes] = await Promise.all([
          fetch('/data/drg_groups.json'),
          fetch('/data/cc_mcc_rules.json'),
          fetch('/data/procedure_impact.json')
        ]);

        if (!drgRes.ok || !ccRes.ok || !procRes.ok) {
          throw new Error('Gagal memuat data DRG rules');
        }

        const [drgData, ccData, procData] = await Promise.all([
          drgRes.json(),
          ccRes.json(),
          procRes.json()
        ]);

        if (!cancelled) {
          setDrgGroups(drgData);
          setCcRules(ccData);
          setProcedureRules(procData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          console.error('Failed to load DRG rules:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRules();

    return () => {
      cancelled = true;
    };
  }, []);

  return { drgGroups, ccRules, procedureRules, loading, error };
}

export default useDRGRules;