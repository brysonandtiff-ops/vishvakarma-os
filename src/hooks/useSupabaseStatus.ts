import { useEffect, useState } from 'react';

export function useSupabaseStatus() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    setConnected(Boolean(url && key && url !== 'undefined' && key !== 'undefined'));
  }, []);

  return connected;
}
