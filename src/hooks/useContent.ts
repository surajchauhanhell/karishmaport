import { useCallback, useEffect, useState } from 'react';
import { list } from '../services/content';
import { supabase } from '../services/supabase';
import type { TableName, Tables } from '../types';
export function useContent<K extends TableName>(table: K) {
  const [data, setData] = useState<Tables[K][]>([]);
  const [loading, setLoading] = useState(!!supabase);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    let alive = true;
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    list(table)
      .then((v) => {
        if (alive) setData(v);
      })
      .catch(() => {
        if (alive) setError('This collection could not be loaded. Please try again.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [table, version]);
  return { data, loading, error, reload };
}
